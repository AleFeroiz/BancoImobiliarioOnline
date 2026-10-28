import { randomInt } from 'node:crypto'
import { CloseCode, Client, Room } from '@colyseus/core'
import type { GameMode } from '../../../shared/lobby.js'
import { isGameMode, normalizePlayerName } from '../../../shared/lobby.js'
import { AUCTION_MIN_INCREMENT, AUCTION_SECONDS, JAIL_FINE, START_BONUS, STARTING_CASH, calculateRent, canBuildProperty, canMortgageProperty, canRedeemMortgage, constructionCost, describeLanding, mortgageRedemptionCost, mortgageValue, movePosition, resolveJailAttempt, taxForSpace } from '../../../shared/game.js'
import { boardSpaces } from '../../../shared/board.js'
import { applyCardCashEffect, EVENT_CARDS } from '../../../shared/cards.js'
import { LobbyPlayerState, LobbyState, PropertyState } from './schema/LobbyState.js'

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 5
const ROOM_CODES_CHANNEL = '$banco-imobiliario-room-codes'

function createRoomCode() {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)]).join('')
}

export class GameRoom extends Room<{ state: LobbyState }> {
  maxClients = 4
  state = new LobbyState()
  private auctionInterval?: ReturnType<typeof setInterval>
  private auctionPassed = new Set<string>()

  async onCreate(options: { mode?: unknown }) {
    const mode: GameMode = isGameMode(options.mode) ? options.mode : 'classic'
    const occupiedCodes = await this.presence.smembers(ROOM_CODES_CHANNEL)
    let roomCode = createRoomCode()
    while (occupiedCodes.includes(roomCode)) roomCode = createRoomCode()

    await this.presence.sadd(ROOM_CODES_CHANNEL, roomCode)
    this.roomId = roomCode
    this.state.roomCode = roomCode
    this.state.mode = mode
    await this.setMatchmaking({ private: true })
  }

  onAuth(_client: Client, options: { name?: unknown }) {
    return normalizePlayerName(options.name) !== null && this.state.status === 'waiting'
  }

  onJoin(client: Client, options: { name: string }) {
    const player = new LobbyPlayerState()
    player.name = normalizePlayerName(options.name) ?? 'Jogador'
    player.isHost = this.state.players.size === 0
    this.state.players.set(client.sessionId, player)
  }

  messages = {
    start: (client: Client) => {
      const player = this.state.players.get(client.sessionId)
      if (!player?.isHost) {
        client.send('room:error', { message: 'Somente a pessoa anfitriã pode iniciar a partida.' })
        return
      }
      if (this.state.status !== 'waiting') return
      if (this.state.players.size < 2) {
        client.send('room:error', { message: 'São necessários pelo menos dois jogadores para iniciar.' })
        return
      }

      this.state.status = 'playing'
      this.state.properties.clear()
      for (const player of this.state.players.values()) {
        player.position = 0
        player.cash = STARTING_CASH
        player.isJailed = false
        player.jailTurns = 0
      }
      this.state.turnPhase = 'roll'
      this.state.activePlayerSessionId = this.state.players.keys().next().value ?? ''
      this.state.turnNumber = 1
      this.state.diceOne = 0
      this.state.diceTwo = 0
      this.state.landingDescription = ''
      this.state.activeCardTitle = ''
      this.state.activeCardDescription = ''
      this.state.pendingPropertyId = 255
      this.state.auctionPropertyId = 255
      this.state.auctionHighestBid = 0
      this.state.auctionHighestBidderSessionId = ''
      this.state.auctionSeconds = 0
      this.broadcast('game:started', { mode: this.state.mode })
    },
    roll: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'roll') return
      if (client.sessionId !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Aguarde a sua vez para lançar os dados.' })
        return
      }
      const player = this.state.players.get(client.sessionId)
      if (!player) return
      if (player.isJailed) {
        client.send('room:error', { message: 'Escolha como sair da prisão antes de rolar os dados.' })
        return
      }

      const diceOne = randomInt(1, 7)
      const diceTwo = randomInt(1, 7)
      this.state.diceOne = diceOne
      this.state.diceTwo = diceTwo
      this.movePlayer(player, diceOne + diceTwo)
      this.state.activeCardTitle = ''
      this.state.activeCardDescription = ''
      this.resolveSpace(player)
    },
    buy: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'purchase' || client.sessionId !== this.state.activePlayerSessionId) return
      const player = this.state.players.get(client.sessionId)
      const space = boardSpaces[this.state.pendingPropertyId]
      if (!player || !space || typeof space.price !== 'number' || player.cash < space.price) {
        client.send('room:error', { message: 'Saldo insuficiente para comprar esta propriedade.' })
        return
      }
      player.cash -= space.price
      const property = new PropertyState()
      property.ownerSessionId = client.sessionId
      this.state.properties.set(String(space.id), property)
      this.state.pendingPropertyId = 255
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = `${space.name} comprada por ${space.price.toLocaleString('pt-BR')}.`
    },
    declinePurchase: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'purchase' || client.sessionId !== this.state.activePlayerSessionId) return
      this.startAuction(this.state.pendingPropertyId)
    },
    build: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'resolve' || client.sessionId !== this.state.activePlayerSessionId) return
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      if (!player || !property || !canBuildProperty(
        propertyId,
        client.sessionId,
        new Map(Array.from(this.state.properties.entries()).map(([id, item]) => [Number(id), { ownerSessionId: item.ownerSessionId, houses: item.houses }])),
        player.cash,
      )) {
        client.send('room:error', { message: 'Para construir, complete o grupo, respeite a distribuição equilibrada e tenha saldo.' })
        return
      }
      const cost = constructionCost(propertyId)
      const space = boardSpaces[propertyId]
      player.cash -= cost
      property.houses += 1
      this.state.landingDescription = property.houses === 5
        ? `Hotel construído em ${space.name} por ${cost.toLocaleString('pt-BR')}.`
        : `Casa ${property.houses}/4 construída em ${space.name} por ${cost.toLocaleString('pt-BR')}.`
    },
    mortgage: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || client.sessionId !== this.state.activePlayerSessionId) return
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      const holdings = new Map(Array.from(this.state.properties.entries()).map(([id, item]) => [Number(id), {
        ownerSessionId: item.ownerSessionId,
        houses: item.houses,
        isMortgaged: item.isMortgaged,
      }]))
      if (!player || !property || !canMortgageProperty(propertyId, client.sessionId, holdings)) {
        client.send('room:error', { message: 'Essa propriedade não pode ser hipotecada. Venda as construções do grupo e tente novamente.' })
        return
      }
      const amount = mortgageValue(propertyId)
      property.isMortgaged = true
      player.cash += amount
      this.state.landingDescription = `${boardSpaces[propertyId].name} hipotecada. Você recebeu ${amount.toLocaleString('pt-BR')}; ela não gera aluguel até o resgate.`
    },
    redeemMortgage: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || client.sessionId !== this.state.activePlayerSessionId) return
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      const holdings = new Map(Array.from(this.state.properties.entries()).map(([id, item]) => [Number(id), {
        ownerSessionId: item.ownerSessionId,
        houses: item.houses,
        isMortgaged: item.isMortgaged,
      }]))
      if (!player || !property || !canRedeemMortgage(propertyId, client.sessionId, holdings, player.cash)) {
        client.send('room:error', { message: 'Você precisa ser dono da propriedade hipotecada e ter saldo para pagar o resgate.' })
        return
      }
      const amount = mortgageRedemptionCost(propertyId)
      property.isMortgaged = false
      player.cash -= amount
      this.state.landingDescription = `Hipoteca de ${boardSpaces[propertyId].name} resgatada por ${amount.toLocaleString('pt-BR')}. O aluguel volta a valer.`
    },
    jailRoll: (client: Client) => {
      const player = this.state.players.get(client.sessionId)
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'jail' || client.sessionId !== this.state.activePlayerSessionId || !player?.isJailed) return
      const dice: [number, number] = [randomInt(1, 7), randomInt(1, 7)]
      const result = resolveJailAttempt(dice, player.jailTurns, player.cash)
      this.state.diceOne = dice[0]
      this.state.diceTwo = dice[1]
      player.isJailed = result.isJailed
      player.jailTurns = result.jailTurns
      player.cash = result.cash
      if (!result.move) {
        this.state.turnPhase = 'resolve'
        this.state.landingDescription = `Sem duplas: tentativa ${result.jailTurns} de 3. Sua vez termina na prisão.`
        return
      }
      const releaseText = result.outcome === 'doubles'
        ? 'Duplas! Você saiu da prisão.'
        : `Após três tentativas, saiu da prisão e pagou ${result.finePaid.toLocaleString('pt-BR')}.`
      this.movePlayer(player, dice[0] + dice[1])
      this.state.activeCardTitle = ''
      this.state.activeCardDescription = ''
      this.resolveSpace(player)
      this.state.landingDescription = `${releaseText} ${this.state.landingDescription}`
    },
    jailPay: (client: Client) => {
      const player = this.state.players.get(client.sessionId)
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'jail' || client.sessionId !== this.state.activePlayerSessionId || !player?.isJailed) return
      const finePaid = Math.min(player.cash, JAIL_FINE)
      player.cash -= finePaid
      player.isJailed = false
      player.jailTurns = 0
      this.state.turnPhase = 'roll'
      this.state.landingDescription = `Fiança paga: ${finePaid.toLocaleString('pt-BR')}. Role os dados para avançar.`
    },
    bid: (client: Client, payload: { amount?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'auction') return
      const player = this.state.players.get(client.sessionId)
      const amount = typeof payload?.amount === 'number' ? Math.floor(payload.amount) : 0
      const minimum = this.state.auctionHighestBid === 0 ? AUCTION_MIN_INCREMENT : this.state.auctionHighestBid + AUCTION_MIN_INCREMENT
      if (!player || player.cash < amount || amount < minimum || !Number.isSafeInteger(amount)) {
        client.send('room:error', { message: `O lance mínimo é ${minimum.toLocaleString('pt-BR')} e precisa caber no seu saldo.` })
        return
      }
      this.state.auctionHighestBid = amount
      this.state.auctionHighestBidderSessionId = client.sessionId
      this.auctionPassed.delete(client.sessionId)
      this.state.landingDescription = `${player.name} ofereceu ${amount.toLocaleString('pt-BR')} no leilão.`
    },
    auctionPass: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'auction') return
      if (!this.state.players.has(client.sessionId)) return
      if (client.sessionId === this.state.auctionHighestBidderSessionId) return
      this.auctionPassed.add(client.sessionId)
      const allOtherPlayersPassed = Array.from(this.state.players.keys())
        .filter((sessionId) => sessionId !== this.state.auctionHighestBidderSessionId)
        .every((sessionId) => this.auctionPassed.has(sessionId))
      if (allOtherPlayersPassed) this.finishAuction()
    },
    finishTurn: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'resolve') return
      if (client.sessionId !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Somente a pessoa da vez pode concluir a jogada.' })
        return
      }
      const playerIds = Array.from(this.state.players.keys())
      if (playerIds.length < 2) return
      const activeIndex = playerIds.indexOf(this.state.activePlayerSessionId)
      this.state.activePlayerSessionId = playerIds[(activeIndex + 1) % playerIds.length]
      const nextPlayer = this.state.players.get(this.state.activePlayerSessionId)
      this.state.turnNumber += 1
      this.state.turnPhase = nextPlayer?.isJailed ? 'jail' : 'roll'
      this.state.diceOne = 0
      this.state.diceTwo = 0
      this.state.landingDescription = nextPlayer?.isJailed ? 'Você está preso. Pague a fiança ou tente tirar duplas.' : ''
      this.state.activeCardTitle = ''
      this.state.activeCardDescription = ''
    },
  }

  private movePlayer(player: LobbyPlayerState, spaces: number) {
    const previousPosition = player.position
    player.position = movePosition(player.position, [spaces, 0])
    if (player.position < previousPosition) player.cash += START_BONUS
  }

  private sendToJail(player: LobbyPlayerState) {
    player.position = 10
    player.isJailed = true
    player.jailTurns = 0
    this.state.pendingPropertyId = 255
    this.state.turnPhase = 'resolve'
  }

  private resolveSpace(player: LobbyPlayerState, drawEvent = true) {
    const space = boardSpaces[player.position]
    this.state.pendingPropertyId = 255
    this.state.turnPhase = 'resolve'
    this.state.landingDescription = describeLanding(player.position)
    if (space.kind === 'property') {
      const property = this.state.properties.get(String(space.id))
      if (!property?.ownerSessionId) {
        this.state.pendingPropertyId = space.id
        this.state.turnPhase = 'purchase'
      } else if (property.ownerSessionId !== this.state.activePlayerSessionId) {
        const owner = this.state.players.get(property.ownerSessionId)
        const ownership = new Map(Array.from(this.state.properties.entries()).map(([id, item]) => [Number(id), item.ownerSessionId]))
        const rent = calculateRent(space.id, ownership, property.houses, property.isMortgaged)
        if (owner && property.isMortgaged) {
          this.state.landingDescription += ` ${space.name} está hipotecada; não há aluguel.`
        } else if (owner) {
          const amountPaid = Math.min(player.cash, rent)
          player.cash -= amountPaid
          owner.cash += amountPaid
          this.state.landingDescription += ` Aluguel de ${amountPaid.toLocaleString('pt-BR')} pago a ${owner.name}.`
        }
      }
    } else if (space.kind === 'tax') {
      const tax = taxForSpace(space.id)
      const amountPaid = Math.min(player.cash, tax)
      player.cash -= amountPaid
      this.state.landingDescription += ` Taxa de ${amountPaid.toLocaleString('pt-BR')} paga ao banco.`
    } else if (space.kind === 'go-to-prison') {
      this.sendToJail(player)
      this.state.landingDescription = 'Vá para a prisão: sua peça foi enviada à casa de visita e sua vez termina.'
    } else if (space.kind === 'event' && drawEvent) {
      const card = EVENT_CARDS[randomInt(EVENT_CARDS.length)]
      this.state.activeCardTitle = card.title
      this.state.activeCardDescription = card.description
      this.state.landingDescription = card.description
      if (card.effect.kind === 'cash') {
        player.cash = applyCardCashEffect(player.cash, card.effect.amount)
      } else if (card.effect.kind === 'move') {
        this.movePlayer(player, card.effect.spaces)
        this.resolveSpace(player, false)
        this.state.landingDescription = `${card.description} ${this.state.landingDescription}`
      } else {
        this.sendToJail(player)
        this.state.landingDescription = `${card.description} Sua peça foi enviada à casa de visita.`
      }
    }
  }

  private startAuction(propertyId: number) {
    this.clearAuctionTimer()
    this.state.turnPhase = 'auction'
    this.state.auctionPropertyId = propertyId
    this.state.pendingPropertyId = 255
    this.state.auctionHighestBid = 0
    this.state.auctionHighestBidderSessionId = ''
    this.state.auctionSeconds = AUCTION_SECONDS
    this.auctionPassed.clear()
    this.state.landingDescription = 'Leilão aberto. Lance ou passe; o maior lance leva a propriedade.'
    this.auctionInterval = setInterval(() => {
      if (this.state.turnPhase !== 'auction') return this.clearAuctionTimer()
      this.state.auctionSeconds = Math.max(0, this.state.auctionSeconds - 1)
      if (this.state.auctionSeconds === 0) this.finishAuction()
    }, 1000)
  }

  private finishAuction() {
    this.clearAuctionTimer()
    const propertyId = this.state.auctionPropertyId
    const bidder = this.state.players.get(this.state.auctionHighestBidderSessionId)
    const amount = this.state.auctionHighestBid
    const space = boardSpaces[propertyId]
    if (bidder && space && bidder.cash >= amount && amount > 0) {
      bidder.cash -= amount
      const property = new PropertyState()
      property.ownerSessionId = this.state.auctionHighestBidderSessionId
      this.state.properties.set(String(propertyId), property)
      this.state.landingDescription = `${space.name} arrematada por ${bidder.name} por ${amount.toLocaleString('pt-BR')}.`
    } else if (space) {
      this.state.landingDescription = `O leilão de ${space.name} terminou sem lances.`
    }
    this.state.turnPhase = 'resolve'
    this.state.auctionPropertyId = 255
    this.state.auctionHighestBid = 0
    this.state.auctionHighestBidderSessionId = ''
    this.state.auctionSeconds = 0
    this.auctionPassed.clear()
  }

  private clearAuctionTimer() {
    if (this.auctionInterval) clearInterval(this.auctionInterval)
    this.auctionInterval = undefined
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId)
    if (this.state.status === 'playing') this.state.status = 'waiting'
    if (![...this.state.players.values()].some((player) => player.isHost)) {
      const nextHost = this.state.players.values().next().value
      if (nextHost) nextHost.isHost = true
    }
  }

  onDrop(client: Client, _code: CloseCode) {
    this.allowReconnection(client, 60).catch(() => {})
  }

  async onDispose() {
    this.clearAuctionTimer()
    await this.presence.srem(ROOM_CODES_CHANNEL, this.roomId)
  }
}
