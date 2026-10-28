import { randomInt } from 'node:crypto'
import { CloseCode, Client, Room } from '@colyseus/core'
import type { GameMode } from '../../../shared/lobby.js'
import { isGameMode, normalizePlayerName } from '../../../shared/lobby.js'
import { AUCTION_MIN_INCREMENT, AUCTION_SECONDS, START_BONUS, STARTING_CASH, calculateRent, canBuildProperty, constructionCost, describeLanding, movePosition, taxForSpace } from '../../../shared/game.js'
import { boardSpaces } from '../../../shared/board.js'
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
      }
      this.state.turnPhase = 'roll'
      this.state.activePlayerSessionId = this.state.players.keys().next().value ?? ''
      this.state.turnNumber = 1
      this.state.diceOne = 0
      this.state.diceTwo = 0
      this.state.landingDescription = ''
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

      const diceOne = randomInt(1, 7)
      const diceTwo = randomInt(1, 7)
      const previousPosition = player.position
      player.position = movePosition(player.position, [diceOne, diceTwo])
      if (player.position < previousPosition) player.cash += START_BONUS
      this.state.diceOne = diceOne
      this.state.diceTwo = diceTwo
      this.state.landingDescription = describeLanding(player.position)
      const space = boardSpaces[player.position]
      this.state.turnPhase = 'resolve'
      if (space.kind === 'property') {
        const property = this.state.properties.get(String(space.id))
        if (!property?.ownerSessionId) {
          this.state.pendingPropertyId = space.id
          this.state.turnPhase = 'purchase'
        } else if (property.ownerSessionId !== client.sessionId) {
          const owner = this.state.players.get(property.ownerSessionId)
          const ownership = new Map(Array.from(this.state.properties.entries()).map(([id, item]) => [Number(id), item.ownerSessionId]))
          const rent = calculateRent(space.id, ownership, property.houses)
          if (owner) {
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
      }
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
      this.state.turnNumber += 1
      this.state.turnPhase = 'roll'
      this.state.diceOne = 0
      this.state.diceTwo = 0
      this.state.landingDescription = ''
    },
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
