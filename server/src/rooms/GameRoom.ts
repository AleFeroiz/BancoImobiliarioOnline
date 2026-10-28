import { randomInt } from 'node:crypto'
import { CloseCode, Client, Room } from '@colyseus/core'
import type { GameMode } from '../../../shared/lobby.js'
import { isGameMode, normalizePlayerName } from '../../../shared/lobby.js'
import { AUCTION_MIN_INCREMENT, AUCTION_SECONDS, CLASSIC_MATCH_SECONDS, EXPRESS_PHASE_SECONDS, EXPRESS_ROUNDS, JAIL_FINE, START_BONUS, STARTING_CASH, buildingSaleValue, calculateNetWorth, calculateRent, canBuildProperty, canMortgageProperty, canRedeemMortgage, canSellBuilding, constructionCost, describeLanding, hasLiquidatableAssets, mortgageRedemptionCost, mortgageValue, movePosition, resolveJailAttempt, taxForSpace } from '../../../shared/game.js'
import { boardSpaces } from '../../../shared/board.js'
import { EVENT_CARDS } from '../../../shared/cards.js'
import { EMPTY_OBJECTIVE_ACTIVITY, EXPRESS_OBJECTIVES, getExpressObjectiveProgress, type ExpressObjectiveId, type ExpressObjectiveUpdate, type ObjectiveActivity } from '../../../shared/objectives.js'
import { LobbyPlayerState, LobbyState, PropertyState } from './schema/LobbyState.js'

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 5
const ROOM_CODES_CHANNEL = '$banco-imobiliario-room-codes'
const MAX_SCHEMA_CASH = 2_147_483_647

type PrivateObjectiveState = { id: ExpressObjectiveId; progress: number; completed: boolean }

function parseTradePropertyIds(value: unknown): number[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > boardSpaces.length) return null
  const ids = value as unknown[]
  if (ids.some((id) => typeof id !== 'number' || !Number.isSafeInteger(id) || id < 0 || id >= boardSpaces.length)) return null
  const normalized = ids as number[]
  if (new Set(normalized).size !== normalized.length) return null
  if (normalized.some((id) => boardSpaces[id].kind !== 'property')) return null
  return normalized
}

function createRoomCode() {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)]).join('')
}

export class GameRoom extends Room<{ state: LobbyState }> {
  maxClients = 4
  state = new LobbyState()
  private auctionInterval?: ReturnType<typeof setInterval>
  private auctionPassed = new Set<string>()
  private tradeInterval?: ReturnType<typeof setInterval>
  private matchClockInterval?: ReturnType<typeof setInterval>
  private tradeOfferSequence = 0
  private privateObjectives = new Map<string, PrivateObjectiveState>()
  private expressActivity = new Map<string, ObjectiveActivity>()
  private expiredReconnections = new Set<string>()

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
    player.isConnected = true
    player.reconnectionExpired = false
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
      if (Array.from(this.state.players.values()).some((candidate) => !candidate.isConnected)) {
        client.send('room:error', { message: 'Aguarde a reconexão de todas as pessoas antes de iniciar.' })
        return
      }

      this.state.status = 'playing'
      this.privateObjectives.clear()
      this.expressActivity.clear()
      this.state.properties.clear()
      for (const player of this.state.players.values()) {
        player.position = 0
        player.cash = STARTING_CASH
        player.isJailed = false
        player.jailTurns = 0
        player.isBankrupt = false
        player.finalCash = 0
        player.finalNetWorth = 0
        player.tieBreakRoll = 0
      }
      this.state.turnPhase = 'roll'
      this.state.activePlayerSessionId = this.state.players.keys().next().value ?? ''
      this.state.turnNumber = 1
      this.state.matchSeconds = this.state.mode === 'classic' ? CLASSIC_MATCH_SECONDS : 0
      this.state.matchEnding = false
      this.state.expressRound = this.state.mode === 'express' ? 1 : 0
      this.state.phaseSeconds = this.state.mode === 'express' ? EXPRESS_PHASE_SECONDS : 0
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
      this.state.debtAmount = 0
      this.state.debtCreditorSessionId = ''
      this.state.debtReason = ''
      this.state.winnerSessionId = ''
      this.startTradeWindow()
      this.startMatchClock()
      this.broadcast('game:started', { mode: this.state.mode })
      if (this.state.mode === 'express') this.dealExpressObjectives()
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
      this.movePlayer(client.sessionId, player, diceOne + diceTwo)
      this.state.activeCardTitle = ''
      this.state.activeCardDescription = ''
      this.resolveSpace(client.sessionId, player)
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
      this.refreshExpressObjective(client.sessionId)
      this.finishExpiredPhaseIfReady()
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
        this.getHoldings(),
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
      this.refreshExpressObjective(client.sessionId)
    },
    sellBuilding: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || !['resolve', 'debt'].includes(this.state.turnPhase) || client.sessionId !== this.state.activePlayerSessionId) return
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
      if (!player || !property || !canSellBuilding(propertyId, client.sessionId, holdings)) {
        client.send('room:error', { message: 'Venda construções do grupo em ordem equilibrada.' })
        return
      }
      const amount = buildingSaleValue(propertyId)
      property.houses -= 1
      player.cash += amount
      this.state.landingDescription = `${property.houses === 4 ? 'Hotel devolvido a quatro casas' : `Construção vendida (nível ${property.houses})`} em ${boardSpaces[propertyId].name}. Você recebeu ${amount.toLocaleString('pt-BR')}.`
      this.refreshExpressObjective(client.sessionId)
    },
    mortgage: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || !['resolve', 'debt'].includes(this.state.turnPhase) || client.sessionId !== this.state.activePlayerSessionId) return
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
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
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'resolve' || client.sessionId !== this.state.activePlayerSessionId) return
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
      if (!player || !property || !canRedeemMortgage(propertyId, client.sessionId, holdings, player.cash)) {
        client.send('room:error', { message: 'Você precisa ser dono da propriedade hipotecada e ter saldo para pagar o resgate.' })
        return
      }
      const amount = mortgageRedemptionCost(propertyId)
      property.isMortgaged = false
      player.cash -= amount
      this.state.landingDescription = `Hipoteca de ${boardSpaces[propertyId].name} resgatada por ${amount.toLocaleString('pt-BR')}. O aluguel volta a valer.`
    },
    payDebt: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'debt' || client.sessionId !== this.state.activePlayerSessionId) return
      const debtor = this.state.players.get(client.sessionId)
      if (!debtor || debtor.cash < this.state.debtAmount) return
      const amount = this.state.debtAmount
      const creditorSessionId = this.state.debtCreditorSessionId
      const creditor = this.state.players.get(creditorSessionId)
      debtor.cash -= amount
      if (creditor && !creditor.isBankrupt) creditor.cash += amount
      const reason = this.state.debtReason
      this.clearDebt()
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = `Dívida paga (${reason}): ${amount.toLocaleString('pt-BR')}.`
      if (reason === 'Aluguel') {
        this.recordExpressActivity(client.sessionId, 'rentPaid')
        if (creditor && !creditor.isBankrupt) this.recordExpressActivity(creditorSessionId, 'rentReceived')
      }
      this.finishExpiredPhaseIfReady()
    },
    declareBankruptcy: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'debt' || client.sessionId !== this.state.activePlayerSessionId) return
      const debtor = this.state.players.get(client.sessionId)
      if (!debtor || debtor.cash >= this.state.debtAmount || hasLiquidatableAssets(client.sessionId, this.getHoldings())) {
        client.send('room:error', { message: 'Quite a dívida ou liquide todos os bens possíveis antes de declarar falência.' })
        return
      }
      const creditorId = this.state.debtCreditorSessionId
      const creditor = this.state.players.get(creditorId)
      if (creditor && !creditor.isBankrupt) creditor.cash += debtor.cash
      for (const property of this.state.properties.values()) {
        if (property.ownerSessionId !== client.sessionId) continue
        if (creditor && !creditor.isBankrupt) {
          property.ownerSessionId = creditorId
        } else {
          property.ownerSessionId = ''
          property.houses = 0
          property.isMortgaged = false
        }
      }
      if (creditor && !creditor.isBankrupt) this.refreshExpressObjective(creditorId)
      debtor.cash = 0
      debtor.isBankrupt = true
      debtor.isJailed = false
      const name = debtor.name
      this.clearDebt()
      const survivors = Array.from(this.state.players.entries()).filter(([, player]) => !player.isBankrupt)
      if (survivors.length <= 1) {
        this.finishMatch(survivors[0]?.[0])
        this.state.landingDescription = survivors.length ? `${name} faliu. ${survivors[0][1].name} venceu a partida.` : `${name} faliu. A partida terminou sem vencedor.`
        return
      }
      this.state.landingDescription = `${name} declarou falência. Seus bens foram transferidos ao credor ou ao banco.`
      this.advanceTurn()
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
        this.finishExpiredPhaseIfReady()
        return
      }
      const releaseText = result.outcome === 'doubles'
        ? 'Duplas! Você saiu da prisão.'
        : `Após três tentativas, saiu da prisão e pagou ${result.finePaid.toLocaleString('pt-BR')}.`
      this.movePlayer(client.sessionId, player, dice[0] + dice[1])
      this.state.activeCardTitle = ''
      this.state.activeCardDescription = ''
      this.resolveSpace(client.sessionId, player)
      this.state.landingDescription = `${releaseText} ${this.state.landingDescription}`
      this.finishExpiredPhaseIfReady()
    },
    jailPay: (client: Client) => {
      const player = this.state.players.get(client.sessionId)
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'jail' || client.sessionId !== this.state.activePlayerSessionId || !player?.isJailed) return
      if (player.cash < JAIL_FINE) {
        client.send('room:error', { message: `A fiança custa ${JAIL_FINE.toLocaleString('pt-BR')}. Tente tirar duplas.` })
        return
      }
      player.cash -= JAIL_FINE
      player.isJailed = false
      player.jailTurns = 0
      this.state.turnPhase = 'roll'
      this.state.landingDescription = `Fiança paga: ${JAIL_FINE.toLocaleString('pt-BR')}. Role os dados para avançar.`
    },
    bid: (client: Client, payload: { amount?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'auction') return
      const player = this.state.players.get(client.sessionId)
      const amount = typeof payload?.amount === 'number' ? Math.floor(payload.amount) : 0
      const minimum = this.state.auctionHighestBid === 0 ? AUCTION_MIN_INCREMENT : this.state.auctionHighestBid + AUCTION_MIN_INCREMENT
      if (!player || player.isBankrupt || player.cash < amount || amount < minimum || !Number.isSafeInteger(amount)) {
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
      if (!this.state.players.has(client.sessionId) || this.state.players.get(client.sessionId)?.isBankrupt) return
      if (client.sessionId === this.state.auctionHighestBidderSessionId) return
      this.auctionPassed.add(client.sessionId)
      const allOtherPlayersPassed = Array.from(this.state.players.keys())
        .filter((sessionId) => sessionId !== this.state.auctionHighestBidderSessionId && !this.state.players.get(sessionId)?.isBankrupt)
        .every((sessionId) => this.auctionPassed.has(sessionId))
      if (allOtherPlayersPassed) this.finishAuction()
    },
    tradeOffer: (client: Client, payload: {
      toSessionId?: unknown
      cashOffered?: unknown
      cashRequested?: unknown
      propertiesOffered?: unknown
      propertiesRequested?: unknown
    }) => {
      if (!this.isTradeWindowOpen() || client.sessionId !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'A negociação só pode ser iniciada pela pessoa da vez durante a janela aberta.' })
        return
      }
      if (this.state.tradeOfferId > 0) {
        client.send('room:error', { message: 'Já existe uma oferta de troca aguardando resposta.' })
        return
      }
      const sender = this.state.players.get(client.sessionId)
      const targetId = typeof payload?.toSessionId === 'string' ? payload.toSessionId : ''
      const target = this.state.players.get(targetId)
      const cashOffered = payload?.cashOffered
      const cashRequested = payload?.cashRequested
      const propertiesOffered = parseTradePropertyIds(payload?.propertiesOffered)
      const propertiesRequested = parseTradePropertyIds(payload?.propertiesRequested)
      if (!sender || sender.isBankrupt || !target || targetId === client.sessionId || target.isBankrupt) {
        client.send('room:error', { message: 'Escolha outra pessoa ativa da sala para negociar.' })
        return
      }
      if (typeof cashOffered !== 'number' || !Number.isSafeInteger(cashOffered) || cashOffered < 0 || cashOffered > MAX_SCHEMA_CASH
        || typeof cashRequested !== 'number' || !Number.isSafeInteger(cashRequested) || cashRequested < 0 || cashRequested > MAX_SCHEMA_CASH
        || !propertiesOffered || !propertiesRequested) {
        client.send('room:error', { message: 'A oferta contém valores ou imóveis inválidos.' })
        return
      }
      if (cashOffered + cashRequested === 0 && propertiesOffered.length === 0 && propertiesRequested.length === 0) {
        client.send('room:error', { message: 'Inclua dinheiro ou pelo menos um imóvel na proposta.' })
        return
      }
      if (cashOffered > sender.cash || cashRequested > target.cash) {
        client.send('room:error', { message: 'Uma das pessoas não tem saldo suficiente para essa proposta.' })
        return
      }
      const validateTitles = (ids: number[], ownerSessionId: string) => ids.every((id) => {
        return this.canTradeTitle(id, ownerSessionId)
      })
      if (!validateTitles(propertiesOffered, client.sessionId) || !validateTitles(propertiesRequested, targetId)) {
        client.send('room:error', { message: 'Só é possível trocar imóveis próprios e sem casas ou hotéis. Venda as construções primeiro.' })
        return
      }
      this.tradeOfferSequence = (this.tradeOfferSequence % MAX_SCHEMA_CASH) + 1
      this.state.tradeOfferId = this.tradeOfferSequence
      this.state.tradeOfferFromSessionId = client.sessionId
      this.state.tradeOfferToSessionId = targetId
      this.state.tradeOfferCashOffered = cashOffered
      this.state.tradeOfferCashRequested = cashRequested
      this.state.tradeOfferPropertiesOffered = propertiesOffered.join(',')
      this.state.tradeOfferPropertiesRequested = propertiesRequested.join(',')
      this.state.landingDescription = `${sender.name} enviou uma proposta de troca para ${target.name}.`
    },
    tradeAccept: (client: Client, payload: { offerId?: unknown }) => {
      const offerId = payload?.offerId
      if (!this.isTradeWindowOpen() || offerId !== this.state.tradeOfferId || client.sessionId !== this.state.tradeOfferToSessionId) {
        client.send('room:error', { message: 'Essa oferta não está mais disponível para você.' })
        return
      }
      if (this.state.activePlayerSessionId !== this.state.tradeOfferFromSessionId) {
        client.send('room:error', { message: 'A vez mudou; a proposta expirou.' })
        this.clearTradeOffer()
        return
      }
      const senderSessionId = this.state.tradeOfferFromSessionId
      const recipientSessionId = this.state.tradeOfferToSessionId
      const sender = this.state.players.get(senderSessionId)
      const recipient = this.state.players.get(recipientSessionId)
      const offeredIds = this.state.tradeOfferPropertiesOffered ? this.state.tradeOfferPropertiesOffered.split(',').map(Number) : []
      const requestedIds = this.state.tradeOfferPropertiesRequested ? this.state.tradeOfferPropertiesRequested.split(',').map(Number) : []
      const validTitles = (ids: number[], ownerSessionId: string) => ids.every((id) => {
        return this.canTradeTitle(id, ownerSessionId)
      })
      const cashFromSender = this.state.tradeOfferCashOffered
      const cashFromRecipient = this.state.tradeOfferCashRequested
      if (!sender || !recipient || sender.isBankrupt || recipient.isBankrupt
        || sender.cash < cashFromSender || recipient.cash < cashFromRecipient
        || sender.cash - cashFromSender + cashFromRecipient > MAX_SCHEMA_CASH
        || recipient.cash - cashFromRecipient + cashFromSender > MAX_SCHEMA_CASH
        || !validTitles(offeredIds, senderSessionId) || !validTitles(requestedIds, recipientSessionId)) {
        client.send('room:error', { message: 'A oferta mudou e não pode mais ser concluída. Confira saldos e imóveis.' })
        return
      }
      sender.cash = sender.cash - cashFromSender + cashFromRecipient
      recipient.cash = recipient.cash - cashFromRecipient + cashFromSender
      for (const id of offeredIds) this.state.properties.get(String(id))!.ownerSessionId = recipientSessionId
      for (const id of requestedIds) this.state.properties.get(String(id))!.ownerSessionId = senderSessionId
      this.state.landingDescription = `${recipient.name} aceitou a troca proposta por ${sender.name}. As hipotecas permanecem vinculadas aos respectivos imóveis.`
      this.refreshExpressObjective(senderSessionId)
      this.refreshExpressObjective(recipientSessionId)
      this.clearTradeOffer()
    },
    tradeReject: (client: Client, payload: { offerId?: unknown }) => {
      if (payload?.offerId !== this.state.tradeOfferId || client.sessionId !== this.state.tradeOfferToSessionId) {
        client.send('room:error', { message: 'Só a pessoa destinatária pode recusar essa oferta.' })
        return
      }
      const sender = this.state.players.get(this.state.tradeOfferFromSessionId)
      const recipient = this.state.players.get(client.sessionId)
      this.clearTradeOffer()
      this.state.landingDescription = `${recipient?.name ?? 'A pessoa destinatária'} recusou a proposta${sender ? ` de ${sender.name}` : ''}.`
    },
    tradeCancel: (client: Client, payload: { offerId?: unknown }) => {
      if (payload?.offerId !== this.state.tradeOfferId || client.sessionId !== this.state.tradeOfferFromSessionId) {
        client.send('room:error', { message: 'Só quem enviou a oferta pode cancelá-la.' })
        return
      }
      this.clearTradeOffer()
      this.state.landingDescription = 'A proposta de troca foi cancelada.'
    },
    finishTurn: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'resolve') return
      if (client.sessionId !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Somente a pessoa da vez pode concluir a jogada.' })
        return
      }
      if (this.state.mode === 'classic' && this.state.matchEnding) this.finishMatch()
      else this.advanceTurn()
    },
  }

  private getHoldings() {
    return new Map(Array.from(this.state.properties.entries()).map(([id, item]) => [Number(id), {
      ownerSessionId: item.ownerSessionId,
      houses: item.houses,
      isMortgaged: item.isMortgaged,
    }]))
  }

  private dealExpressObjectives() {
    const playerIds = Array.from(this.state.players.keys())
    const shuffled = [...EXPRESS_OBJECTIVES]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(index + 1)
      ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!]
    }
    playerIds.forEach((sessionId, index) => {
      const objective = shuffled[index]
      if (!objective) return
      this.privateObjectives.set(sessionId, { id: objective.id, progress: 0, completed: false })
      this.expressActivity.set(sessionId, { ...EMPTY_OBJECTIVE_ACTIVITY })
      this.sendExpressObjective(sessionId, objective, 0, false, 0)
    })
  }

  private refreshExpressObjective(sessionId: string) {
    if (this.state.mode !== 'express' || this.state.status !== 'playing') return
    const state = this.privateObjectives.get(sessionId)
    const player = this.state.players.get(sessionId)
    const objective = EXPRESS_OBJECTIVES.find((candidate) => candidate.id === state?.id)
    if (!state || !player || !objective || player.isBankrupt) return

    const currentProgress = Math.min(objective.target, getExpressObjectiveProgress(
      objective.id,
      sessionId,
      this.getHoldings(),
      this.expressActivity.get(sessionId) ?? EMPTY_OBJECTIVE_ACTIVITY,
    ))
    const progress = state.completed ? objective.target : currentProgress
    const newlyCompleted = !state.completed && progress >= objective.target
    let rewardAwarded = 0
    if (newlyCompleted) {
      state.completed = true
      rewardAwarded = Math.min(objective.reward, MAX_SCHEMA_CASH - player.cash)
      player.cash += rewardAwarded
    }
    if (progress === state.progress && !newlyCompleted) return
    state.progress = progress
    this.sendExpressObjective(sessionId, objective, progress, state.completed, rewardAwarded)
  }

  private sendExpressObjective(
    sessionId: string,
    objective: (typeof EXPRESS_OBJECTIVES)[number],
    progress: number,
    completed: boolean,
    rewardAwarded: number,
  ) {
    const client = this.clients.find((candidate) => candidate.sessionId === sessionId)
    if (!client) return
    const update: ExpressObjectiveUpdate = { ...objective, progress, completed, rewardAwarded }
    client.send('game:objective', update)
  }

  private recordExpressActivity(sessionId: string, activity: keyof ObjectiveActivity) {
    if (this.state.mode !== 'express' || this.state.status !== 'playing') return
    const playerActivity = this.expressActivity.get(sessionId)
    if (!playerActivity) return
    playerActivity[activity] += 1
    this.refreshExpressObjective(sessionId)
  }

  private clearDebt() {
    this.state.debtAmount = 0
    this.state.debtCreditorSessionId = ''
    this.state.debtReason = ''
  }

  private canTradeTitle(propertyId: number, ownerSessionId: string) {
    const space = boardSpaces[propertyId]
    const title = this.state.properties.get(String(propertyId))
    if (!space || space.kind !== 'property' || title?.ownerSessionId !== ownerSessionId) return false
    return !boardSpaces.some((groupSpace) => {
      if (groupSpace.kind !== 'property' || groupSpace.color !== space.color) return false
      return (this.state.properties.get(String(groupSpace.id))?.houses ?? 0) > 0
    })
  }

  private isTradeWindowOpen() {
    return this.state.status === 'playing'
      && this.state.tradeSeconds > 0
      && Boolean(this.state.activePlayerSessionId)
      && !this.state.players.get(this.state.activePlayerSessionId)?.isBankrupt
  }

  private clearTradeOffer() {
    this.state.tradeOfferId = 0
    this.state.tradeOfferFromSessionId = ''
    this.state.tradeOfferToSessionId = ''
    this.state.tradeOfferCashOffered = 0
    this.state.tradeOfferCashRequested = 0
    this.state.tradeOfferPropertiesOffered = ''
    this.state.tradeOfferPropertiesRequested = ''
  }

  private stopTradeWindow() {
    if (this.tradeInterval) clearInterval(this.tradeInterval)
    this.tradeInterval = undefined
    this.state.tradeSeconds = 0
    this.clearTradeOffer()
  }

  private startMatchClock() {
    this.stopMatchClock()
    this.matchClockInterval = setInterval(() => {
      if (this.state.status !== 'playing') return this.stopMatchClock()
      if (this.state.mode === 'classic') {
        if (this.state.matchSeconds > 0) this.state.matchSeconds -= 1
        if (this.state.matchSeconds === 0) {
          this.state.matchEnding = true
          if (['roll', 'resolve', 'jail'].includes(this.state.turnPhase)) this.finishMatch()
        }
        return
      }

      const activePlayer = this.state.players.get(this.state.activePlayerSessionId)
      if (activePlayer && !activePlayer.isConnected && !this.expiredReconnections.has(this.state.activePlayerSessionId)) return

      if (this.state.phaseSeconds > 0) this.state.phaseSeconds -= 1
      if (this.state.phaseSeconds === 0) this.expireExpressPhase()
    }, 1000)
  }

  private stopMatchClock() {
    if (this.matchClockInterval) clearInterval(this.matchClockInterval)
    this.matchClockInterval = undefined
  }

  private expireExpressPhase() {
    if (this.state.status !== 'playing' || this.state.mode !== 'express') return
    if (this.state.turnPhase === 'purchase') {
      this.startAuction(this.state.pendingPropertyId)
      return
    }
    if (this.state.turnPhase === 'auction') {
      return
    }
    if (this.state.turnPhase === 'debt') return
    const player = this.state.players.get(this.state.activePlayerSessionId)
    this.state.landingDescription = `${player?.name ?? 'A pessoa da vez'} encerrou a fase de 40 segundos.`
    this.advanceTurn()
  }

  private finishExpiredPhaseIfReady() {
    if (this.state.status !== 'playing') return
    if (this.state.mode === 'classic' && this.state.matchEnding && this.state.turnPhase === 'resolve') {
      this.finishMatch()
    } else if (this.state.mode === 'express' && this.state.phaseSeconds === 0 && this.state.turnPhase === 'resolve') {
      this.advanceTurn()
    }
  }

  private stopClocks() {
    this.stopMatchClock()
    this.stopTradeWindow()
  }

  private finishMatch(forcedWinnerSessionId?: string) {
    if (this.state.status === 'ended') return
    const activePlayers = Array.from(this.state.players.entries()).filter(([, player]) => !player.isBankrupt)
    const holdings = this.getHoldings()
    const ranked = activePlayers.map(([sessionId, player]) => ({
      sessionId,
      player,
      netWorth: calculateNetWorth(sessionId, player.cash, holdings),
    }))
    for (const [sessionId, player] of this.state.players.entries()) {
      player.finalCash = player.cash
      player.finalNetWorth = Math.min(MAX_SCHEMA_CASH, calculateNetWorth(sessionId, player.cash, holdings))
      player.tieBreakRoll = 0
    }

    let winner = ranked.find(({ sessionId }) => sessionId === forcedWinnerSessionId)
    if (!winner && ranked.length > 0) {
      ranked.sort((first, second) => this.compareScores(first, second))
      let tied = ranked.filter((candidate) => this.compareScores(candidate, ranked[0]) === 0)
      while (tied.length > 1) {
        for (const candidate of tied) candidate.player.tieBreakRoll = randomInt(1, 7) + randomInt(1, 7)
        const highestRoll = Math.max(...tied.map((candidate) => candidate.player.tieBreakRoll))
        tied = tied.filter((candidate) => candidate.player.tieBreakRoll === highestRoll)
        if (tied.length > 1) {
          // Equal dice are rare; the server resolves the remaining dead heat uniformly.
          const selected = tied[randomInt(tied.length)]
          tied = [selected]
        }
      }
      winner = tied[0]
    }

    this.state.status = 'ended'
    this.state.turnPhase = 'ended'
    this.state.winnerSessionId = winner?.sessionId ?? ''
    this.stopClocks()
    const endingReason = forcedWinnerSessionId
      ? 'Partida encerrada após falência.'
      : this.state.matchEnding
        ? 'Tempo esgotado.'
        : this.state.mode === 'express'
          ? `Fim da rodada ${EXPRESS_ROUNDS}.`
          : 'Partida encerrada.'
    const tieBreak = winner?.player.tieBreakRoll ? ` Desempate nos dados: ${winner.player.tieBreakRoll}.` : ''
    this.state.landingDescription = winner
      ? this.state.mode === 'classic'
        ? `${endingReason} ${winner.player.name} venceu por patrimônio de ${winner.player.finalNetWorth.toLocaleString('pt-BR')}; dinheiro disponível: ${winner.player.finalCash.toLocaleString('pt-BR')}.${tieBreak}`
        : `${endingReason} ${winner.player.name} venceu com saldo de ${winner.player.finalCash.toLocaleString('pt-BR')}; patrimônio de ${winner.player.finalNetWorth.toLocaleString('pt-BR')}.${tieBreak}`
      : 'A partida terminou sem jogadores solventes.'
  }

  private compareScores(first: { player: LobbyPlayerState; netWorth: number }, second: { player: LobbyPlayerState; netWorth: number }) {
    if (this.state.mode === 'express' && first.player.cash !== second.player.cash) return second.player.cash - first.player.cash
    return second.netWorth - first.netWorth
  }

  private startTradeWindow() {
    this.stopTradeWindow()
    this.state.tradeSeconds = this.state.mode === 'express' ? 40 : 45
    this.tradeInterval = setInterval(() => {
      if (this.state.status !== 'playing') {
        this.stopTradeWindow()
        return
      }
      if (this.state.tradeSeconds <= 1) {
        this.stopTradeWindow()
        return
      }
      this.state.tradeSeconds -= 1
    }, 1000)
  }

  private advanceTurn() {
    const roomPlayerIds = Array.from(this.state.players.entries()).map(([sessionId]) => sessionId)
    this.stopTradeWindow()
    const solventPlayers = roomPlayerIds.filter((sessionId) => !this.state.players.get(sessionId)?.isBankrupt)
    if (solventPlayers.length <= 1) {
      this.finishMatch(solventPlayers[0])
      return
    }
    if (!roomPlayerIds.some((sessionId) => {
      const player = this.state.players.get(sessionId)
      return player && !player.isBankrupt && player.isConnected
    })) {
      this.state.landingDescription = 'Aguardando a reconexão de uma pessoa para continuar a partida.'
      return
    }
    const activeIndex = roomPlayerIds.indexOf(this.state.activePlayerSessionId)
    const startIndex = activeIndex >= 0 ? activeIndex : roomPlayerIds.length - 1
    let nextIndex = -1
    for (let step = 1; step <= roomPlayerIds.length; step += 1) {
      const candidateIndex = (startIndex + step) % roomPlayerIds.length
      if (!this.state.players.get(roomPlayerIds[candidateIndex])?.isBankrupt) {
        nextIndex = candidateIndex
        break
      }
    }
    if (nextIndex < 0) {
      this.finishMatch()
      return
    }
    if (this.state.mode === 'express' && nextIndex <= activeIndex && activeIndex >= 0) {
      this.state.expressRound += 1
      if (this.state.expressRound > EXPRESS_ROUNDS) {
        this.state.expressRound = EXPRESS_ROUNDS
        this.finishMatch()
        return
      }
    }
    this.state.activePlayerSessionId = roomPlayerIds[nextIndex]
    const nextPlayer = this.state.players.get(this.state.activePlayerSessionId)
    this.state.turnNumber += 1
    this.state.phaseSeconds = this.state.mode === 'express' ? EXPRESS_PHASE_SECONDS : 0
    this.state.turnPhase = nextPlayer?.isJailed ? 'jail' : 'roll'
    this.state.diceOne = 0
    this.state.diceTwo = 0
    this.state.landingDescription = nextPlayer?.isJailed ? 'Você está preso. Pague a fiança ou tente tirar duplas.' : ''
    this.state.activeCardTitle = ''
    this.state.activeCardDescription = ''
    this.startTradeWindow()
    if (nextPlayer && !nextPlayer.isConnected && this.expiredReconnections.has(this.state.activePlayerSessionId)) {
      const skippedName = nextPlayer.name
      this.advanceTurn()
      if (this.state.status === 'playing') {
        this.state.landingDescription = `A vez de ${skippedName} foi pulada porque a conexão expirou.`
      }
    }
  }

  private collectPayment(debtorSessionId: string, debtor: LobbyPlayerState, amount: number, creditorSessionId: string, reason: string) {
    if (amount <= debtor.cash) {
      debtor.cash -= amount
      const creditor = this.state.players.get(creditorSessionId)
      if (creditor && !creditor.isBankrupt) creditor.cash += amount
      if (reason === 'Aluguel') {
        this.recordExpressActivity(debtorSessionId, 'rentPaid')
        if (creditor && !creditor.isBankrupt) this.recordExpressActivity(creditorSessionId, 'rentReceived')
      }
      this.state.landingDescription += ` ${reason}: ${amount.toLocaleString('pt-BR')} pagos${creditor ? ` a ${creditor.name}` : ' ao banco'}.`
      return
    }
    this.state.debtAmount = amount
    this.state.debtCreditorSessionId = creditorSessionId
    this.state.debtReason = reason
    this.state.turnPhase = 'debt'
    const creditor = this.state.players.get(creditorSessionId)
    this.state.landingDescription += ` Dívida de ${amount.toLocaleString('pt-BR')} ${creditor ? `com ${creditor.name}` : 'com o banco'}. Venda construções ou hipoteque imóveis para pagar.`
  }

  private movePlayer(sessionId: string, player: LobbyPlayerState, spaces: number) {
    const previousPosition = player.position
    player.position = movePosition(player.position, [spaces, 0])
    if (player.position < previousPosition) {
      player.cash += START_BONUS
      this.recordExpressActivity(sessionId, 'startCrossings')
    }
  }

  private sendToJail(player: LobbyPlayerState) {
    player.position = 10
    player.isJailed = true
    player.jailTurns = 0
    this.state.pendingPropertyId = 255
    this.state.turnPhase = 'resolve'
  }

  private resolveSpace(sessionId: string, player: LobbyPlayerState, drawEvent = true) {
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
          this.collectPayment(sessionId, player, rent, property.ownerSessionId, 'Aluguel')
        }
      }
    } else if (space.kind === 'tax') {
      const tax = taxForSpace(space.id)
      this.collectPayment(sessionId, player, tax, '', 'Taxa')
    } else if (space.kind === 'go-to-prison') {
      this.sendToJail(player)
      this.state.landingDescription = 'Vá para a prisão: sua peça foi enviada à casa de visita e sua vez termina.'
    } else if (space.kind === 'event' && drawEvent) {
      this.recordExpressActivity(sessionId, 'eventCardsDrawn')
      const card = EVENT_CARDS[randomInt(EVENT_CARDS.length)]
      this.state.activeCardTitle = card.title
      this.state.activeCardDescription = card.description
      this.state.landingDescription = card.description
      if (card.effect.kind === 'cash') {
        if (card.effect.amount < 0) this.collectPayment(sessionId, player, Math.abs(card.effect.amount), '', 'Carta')
        else player.cash += card.effect.amount
      } else if (card.effect.kind === 'move') {
        this.movePlayer(sessionId, player, card.effect.spaces)
        this.resolveSpace(sessionId, player, false)
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
      this.refreshExpressObjective(this.state.auctionHighestBidderSessionId)
    } else if (space) {
      this.state.landingDescription = `O leilão de ${space.name} terminou sem lances.`
    }
    this.state.turnPhase = 'resolve'
    this.state.auctionPropertyId = 255
    this.state.auctionHighestBid = 0
    this.state.auctionHighestBidderSessionId = ''
    this.state.auctionSeconds = 0
    this.auctionPassed.clear()
    this.finishExpiredPhaseIfReady()
  }

  private clearAuctionTimer() {
    if (this.auctionInterval) clearInterval(this.auctionInterval)
    this.auctionInterval = undefined
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId)
    if (this.state.status === 'playing' && player && !player.isConnected) {
      this.expiredReconnections.add(client.sessionId)
      player.reconnectionExpired = true
      if (this.state.activePlayerSessionId === client.sessionId) {
        if (this.state.turnPhase === 'debt') {
          this.state.landingDescription = `${player.name} desconectou durante uma dívida. A partida aguarda a regra de retorno para esta situação.`
          return
        }
        let skipDescription: string
        if (this.state.turnPhase === 'purchase') {
          this.state.pendingPropertyId = 255
          this.state.turnPhase = 'resolve'
          skipDescription = `${player.name} desconectou antes de decidir a compra; a propriedade fica livre.`
        } else if (this.state.turnPhase === 'auction') {
          this.clearAuctionTimer()
          this.state.auctionPropertyId = 255
          this.state.auctionHighestBid = 0
          this.state.auctionHighestBidderSessionId = ''
          this.state.auctionSeconds = 0
          this.auctionPassed.clear()
          this.state.turnPhase = 'resolve'
          skipDescription = `${player.name} desconectou durante o leilão; ele foi encerrado sem venda.`
        } else {
          skipDescription = `${player.name} desconectou; sua vez foi pulada.`
        }
        this.advanceTurn()
        if (this.state.status === 'playing') this.state.landingDescription = skipDescription
      }
      return
    }
    this.privateObjectives.delete(client.sessionId)
    this.expressActivity.delete(client.sessionId)
    if (this.state.status === 'playing') this.stopClocks()
    this.state.players.delete(client.sessionId)
    if (this.state.status === 'playing') this.state.status = 'waiting'
    if (![...this.state.players.values()].some((player) => player.isHost)) {
      const nextHost = this.state.players.values().next().value
      if (nextHost) nextHost.isHost = true
    }
  }

  onDrop(client: Client, _code: CloseCode) {
    const player = this.state.players.get(client.sessionId)
    if (player) {
      player.isConnected = false
      player.reconnectionExpired = false
    }
    this.allowReconnection(client, 60).catch(() => {})
  }

  onReconnect(client: Client) {
    const player = this.state.players.get(client.sessionId)
    if (player) {
      player.isConnected = true
      player.reconnectionExpired = false
    }
    this.expiredReconnections.delete(client.sessionId)
  }

  async onDispose() {
    this.clearAuctionTimer()
    this.stopClocks()
    await this.presence.srem(ROOM_CODES_CHANNEL, this.roomId)
  }
}
