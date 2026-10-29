import { randomInt } from 'node:crypto'
import { CloseCode, Client, Room } from '@colyseus/core'
import type { GameMode } from '../../../shared/lobby.js'
import { isGameMode, normalizePlayerName } from '../../../shared/lobby.js'
import { AUCTION_DURATION_SECONDS, AUCTION_MIN_BID_INCREMENT, CLASSIC_MATCH_SECONDS, DICE_ANIMATION_DURATION_MS, EXPRESS_PHASE_SECONDS, EXPRESS_ROUNDS, JAIL_FINE, PAWN_STEP_ANIMATION_DURATION_MS, PAWN_TELEPORT_ANIMATION_DURATION_MS, PROPERTY_BUILD_LEVELS, PROPERTY_HOTEL_LEVEL, START_BONUS, STARTING_CASH, TURN_DECISION_SECONDS, TURN_ROLL_SECONDS, buildingSaleValue, calculateNetWorth, calculateRent, canBuildHotel, canBuildProperty, canMortgageProperty, canRedeemMortgage, canSellBuilding, constructionCost, describeLanding, hasLiquidatableAssets, hotelConstructionCost, mortgageRedemptionCost, mortgageValue, movePosition, resolveJailAttempt, taxForSpace } from '../../../shared/game.js'
import { boardSpaces } from '../../../shared/board.js'
import { EVENT_CARDS } from '../../../shared/cards.js'
import { EMPTY_OBJECTIVE_ACTIVITY, EXPRESS_OBJECTIVES, getExpressObjectiveProgress, type ExpressObjectiveId, type ExpressObjectiveUpdate, type ObjectiveActivity } from '../../../shared/objectives.js'
import { LobbyPlayerState, LobbyState, PropertyState } from './schema/LobbyState.js'
import { chooseBotAuctionBid, chooseBotJailAction, shouldBotBuyProperty } from './botStrategy.js'

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 5
const ROOM_CODES_CHANNEL = '$banco-imobiliario-room-codes'
const MAX_SCHEMA_CASH = 2_147_483_647
const RECONNECTION_WINDOW_SECONDS = 24 * 60 * 60
const BOT_TICK_MS = 1_000

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
  private tradeInterval?: ReturnType<typeof setInterval>
  private auctionInterval?: ReturnType<typeof setInterval>
  private matchClockInterval?: ReturnType<typeof setInterval>
  private botControllerInterval?: ReturnType<typeof setInterval>
  private tradeOfferSequence = 0
  private auctionSequence = 0
  private privateObjectives = new Map<string, PrivateObjectiveState>()
  private expressActivity = new Map<string, ObjectiveActivity>()
  private botSequence = 0
  private turnTimerKey = ''
  private presentationTimers = new Set<ReturnType<typeof setTimeout>>()

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
    return normalizePlayerName(options.name) !== null && this.state.status === 'waiting' && this.state.players.size < this.maxClients
  }

  onJoin(client: Client, options: { name: string }) {
    const player = new LobbyPlayerState()
    player.name = normalizePlayerName(options.name) ?? 'Jogador'
    player.isHost = this.state.players.size === 0
    player.isConnected = true
    player.reconnectionExpired = false
    player.isBot = false
    player.isBotControlled = false
    this.state.players.set(client.sessionId, player)
  }

  messages = {
    addBot: (client: Client) => {
      const requester = this.state.players.get(client.sessionId)
      if (this.state.status !== 'waiting' || !requester?.isHost || this.state.players.size >= this.maxClients) {
        client.send('room:error', { message: 'Só a pessoa anfitriã pode adicionar bots enquanto há lugares livres na sala.' })
        return
      }
      this.botSequence += 1
      let sessionId = `bot-${this.botSequence}`
      while (this.state.players.has(sessionId)) {
        this.botSequence += 1
        sessionId = `bot-${this.botSequence}`
      }
      const bot = new LobbyPlayerState()
      bot.name = `Bot ${this.botSequence}`
      bot.isBot = true
      bot.isBotControlled = true
      bot.isConnected = true
      this.state.players.set(sessionId, bot)
    },
    removeBot: (client: Client, payload: { sessionId?: unknown }) => {
      const requester = this.state.players.get(client.sessionId)
      const sessionId = typeof payload?.sessionId === 'string' ? payload.sessionId : ''
      const target = this.state.players.get(sessionId)
      if (this.state.status !== 'waiting' || !requester?.isHost || !target?.isBot) {
        client.send('room:error', { message: 'Só a pessoa anfitriã pode remover um bot antes da partida.' })
        return
      }
      this.state.players.delete(sessionId)
    },
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
      if (Array.from(this.state.players.values()).some((candidate) => !candidate.isBot && !candidate.isConnected)) {
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
      this.state.turnSeconds = TURN_ROLL_SECONDS
      this.turnTimerKey = `${this.state.turnNumber}:${this.state.activePlayerSessionId}:roll`
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
      this.state.debtAmount = 0
      this.state.debtCreditorSessionId = ''
      this.state.debtReason = ''
      this.state.winnerSessionId = ''
      this.clearAuction(false)
      this.startTradeWindow()
      this.startMatchClock()
      this.startBotController()
      this.broadcast('game:started', { mode: this.state.mode })
      if (this.state.mode === 'express') this.dealExpressObjectives()
    },
    roll: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'roll') return
      if (client.sessionId !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Aguarde a sua vez para lançar os dados.' })
        return
      }
      if (this.state.players.get(client.sessionId)?.isJailed) {
        client.send('room:error', { message: 'Escolha como sair da prisão antes de rolar os dados.' })
        return
      }
      this.rollForPlayer(client.sessionId)
    },
    buy: (client: Client, payload: { houses?: unknown } = {}) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'purchase' || client.sessionId !== this.state.activePlayerSessionId) return
      const player = this.state.players.get(client.sessionId)
      const space = boardSpaces[this.state.pendingPropertyId]
      const houses = payload?.houses === undefined ? 0 : payload.houses
      if (!player || !space || space.kind !== 'property' || typeof space.price !== 'number' || typeof houses !== 'number' || !Number.isInteger(houses) || houses < 0 || houses > PROPERTY_BUILD_LEVELS || (houses > 0 && !space.buildable)) {
        client.send('room:error', { message: 'Escolha terreno ou até três casas para um imóvel residencial.' })
        return
      }
      const totalCost = space.price + houses * constructionCost(space.id)
      if (player.cash < totalCost) {
        client.send('room:error', { message: 'Seu saldo não cobre o terreno e as construções selecionadas.' })
        return
      }
      player.cash -= totalCost
      const property = new PropertyState()
      property.ownerSessionId = client.sessionId
      property.houses = houses
      this.state.properties.set(String(space.id), property)
      this.state.pendingPropertyId = 255
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = houses
        ? `${space.name} comprada com ${houses} ${houses === 1 ? 'casa' : 'casas'} por ${totalCost.toLocaleString('pt-BR')}.`
        : `${space.name} comprada por ${space.price.toLocaleString('pt-BR')}.`
      this.refreshExpressObjective(client.sessionId)
      this.finishExpiredPhaseIfReady()
    },
    declinePurchase: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'purchase' || client.sessionId !== this.state.activePlayerSessionId) return
      const space = boardSpaces[this.state.pendingPropertyId]
      this.state.pendingPropertyId = 255
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = space ? `${space.name} continua sem dono. Você escolheu não comprar.` : 'Você escolheu não comprar; a propriedade continua livre.'
      this.finishExpiredPhaseIfReady()
    },
    build: (client: Client, payload: { propertyId?: unknown; targetHouses?: unknown; hotel?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'resolve' || client.sessionId !== this.state.activePlayerSessionId) return
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
      const landedHere = this.state.pendingPropertyId === propertyId && player?.position === propertyId
      if (!player || !property || property.ownerSessionId !== client.sessionId || !landedHere || property.isMortgaged) {
        client.send('room:error', { message: 'Só é possível construir ao cair no próprio terreno, sem hipoteca.' })
        return
      }
      const space = boardSpaces[propertyId]
      if (payload.hotel === true) {
        if (!canBuildHotel(propertyId, client.sessionId, holdings, player.cash)) {
          client.send('room:error', { message: 'O hotel só pode ser comprado ao cair num imóvel com três casas e ter saldo suficiente.' })
          return
        }
        const cost = hotelConstructionCost(propertyId)
        player.cash -= cost
        property.houses = PROPERTY_HOTEL_LEVEL
        this.state.landingDescription = `Hotel construído em ${space.name} por ${cost.toLocaleString('pt-BR')}.`
      } else {
        const targetHouses = payload.targetHouses
        if (typeof targetHouses !== 'number' || !Number.isInteger(targetHouses) || !canBuildProperty(propertyId, client.sessionId, holdings, player.cash, targetHouses)) {
          client.send('room:error', { message: 'Escolha um total de uma a três casas maior que o atual e tenha saldo suficiente.' })
          return
        }
        const cost = (targetHouses - property.houses) * constructionCost(propertyId)
        player.cash -= cost
        property.houses = targetHouses
        this.state.landingDescription = `${targetHouses} ${targetHouses === 1 ? 'casa construída' : 'casas construídas'} em ${space.name} por ${cost.toLocaleString('pt-BR')}.`
      }
      this.state.pendingPropertyId = 255
      this.refreshExpressObjective(client.sessionId)
    },
    sellBuilding: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || !['resolve', 'debt'].includes(this.state.turnPhase) || client.sessionId !== this.state.activePlayerSessionId) return
      if (this.state.turnPhase === 'debt' && (this.state.players.get(client.sessionId)?.cash ?? 0) >= this.state.debtAmount) {
        client.send('room:error', { message: 'Seu saldo já cobre a dívida; liquide bens apenas quando precisar completar o pagamento.' })
        return
      }
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
      if (!player || !property || !canSellBuilding(propertyId, client.sessionId, holdings)) {
        client.send('room:error', { message: 'Escolha uma construção própria que ainda possa ser vendida.' })
        return
      }
      const previousLevel = property.houses
      const amount = buildingSaleValue(propertyId, previousLevel)
      property.houses -= 1
      player.cash += amount
      this.state.landingDescription = `${previousLevel === PROPERTY_HOTEL_LEVEL ? 'Hotel vendido; três casas permaneceram' : `Construção vendida (nível ${property.houses})`} em ${boardSpaces[propertyId].name}. Você recebeu ${amount.toLocaleString('pt-BR')}.`
      this.refreshExpressObjective(client.sessionId)
    },
    mortgage: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'debt' || client.sessionId !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Hipotecas só podem ser usadas para completar o pagamento de uma dívida.' })
        return
      }
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
      if (!player || player.cash >= this.state.debtAmount) {
        client.send('room:error', { message: 'Seu saldo já cobre a dívida; não é possível hipotecar neste momento.' })
        return
      }
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
      this.state.diceSequence += 1
      this.state.diceOne = dice[0]
      this.state.diceTwo = dice[1]
      player.isJailed = result.isJailed
      player.jailTurns = result.jailTurns
      player.cash = result.cash
      this.state.pawnMoveMode = 'walk'
      this.state.turnPhase = 'rolling'
      if (!result.move) {
        this.schedulePresentation(DICE_ANIMATION_DURATION_MS, () => {
          if (this.state.turnPhase !== 'rolling' || this.state.activePlayerSessionId !== client.sessionId) return
          this.state.turnPhase = 'resolve'
          this.state.landingDescription = `Sem duplas: tentativa ${result.jailTurns} de 3. Sua vez termina na prisão.`
          this.finishExpiredPhaseIfReady()
        })
        return
      }
      const releaseText = result.outcome === 'doubles'
        ? 'Duplas! Você saiu da prisão.'
        : `Após três tentativas, saiu da prisão e pagou ${result.finePaid.toLocaleString('pt-BR')}.`
      const startPosition = player.position
      this.state.activeCardTitle = ''
      this.state.activeCardDescription = ''
      this.schedulePresentation(DICE_ANIMATION_DURATION_MS, () => {
        if (this.state.turnPhase !== 'rolling' || this.state.activePlayerSessionId !== client.sessionId) return
        this.movePlayer(client.sessionId, player, dice[0] + dice[1])
        this.startPawnMovement(client.sessionId, player, startPosition, releaseText)
      })
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
      if (this.state.auctionId > 0) {
        client.send('room:error', { message: 'Aguarde o leilão atual terminar antes de propor uma troca.' })
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
    auctionStart: (client: Client, payload: { propertyId?: unknown; startingBid?: unknown }) => {
      if (this.state.status !== 'playing' || client.sessionId !== this.state.activePlayerSessionId || !['roll', 'resolve', 'jail'].includes(this.state.turnPhase)) {
        client.send('room:error', { message: 'Leilões voluntários só podem começar durante seu turno, fora de compras e dívidas.' })
        return
      }
      if (this.state.auctionId > 0 || this.state.tradeOfferId > 0) {
        client.send('room:error', { message: 'Finalize a negociação atual antes de abrir um leilão.' })
        return
      }
      const seller = this.state.players.get(client.sessionId)
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const startingBid = payload?.startingBid
      const property = this.state.properties.get(String(propertyId))
      const space = boardSpaces[propertyId]
      if (!seller || seller.isBankrupt || !seller.isConnected || !property || property.ownerSessionId !== client.sessionId) {
        client.send('room:error', { message: 'Você só pode leiloar um imóvel próprio enquanto estiver ativo.' })
        return
      }
      if (typeof startingBid !== 'number' || !Number.isSafeInteger(startingBid)
        || startingBid < AUCTION_MIN_BID_INCREMENT || startingBid > MAX_SCHEMA_CASH
        || seller.cash + startingBid > MAX_SCHEMA_CASH) {
        client.send('room:error', { message: 'Defina um lance inicial de pelo menos R$ 10.000 e dentro do limite de saldo.' })
        return
      }
      if (!space || space.kind !== 'property' || !this.canTradeTitle(propertyId, client.sessionId)) {
        client.send('room:error', { message: 'Venda as construções do grupo antes de leiloar esse imóvel.' })
        return
      }
      this.auctionSequence = (this.auctionSequence % MAX_SCHEMA_CASH) + 1
      this.state.auctionId = this.auctionSequence
      this.state.auctionPropertyId = propertyId
      this.state.auctionSellerSessionId = client.sessionId
      this.state.auctionStartingBid = startingBid
      this.state.auctionHighestBid = 0
      this.state.auctionHighestBidderSessionId = ''
      this.state.auctionSeconds = AUCTION_DURATION_SECONDS
      this.startAuctionClock()
    },
    auctionBid: (client: Client, payload: { auctionId?: unknown; amount?: unknown }) => {
      const amount = payload?.amount
      const auctionId = payload?.auctionId
      const bidder = this.state.players.get(client.sessionId)
      const seller = this.state.players.get(this.state.auctionSellerSessionId)
      if (this.state.status !== 'playing' || auctionId !== this.state.auctionId || this.state.auctionSeconds <= 0
        || client.sessionId === this.state.auctionSellerSessionId || !bidder || bidder.isBankrupt || (!bidder.isConnected && !bidder.isBotControlled)) {
        client.send('room:error', { message: 'Este leilão não está disponível para você.' })
        return
      }
      if (['purchase', 'debt'].includes(this.state.turnPhase)) {
        client.send('room:error', { message: 'Aguarde a resolução da compra ou dívida para dar um lance.' })
        return
      }
      const minimumBid = this.state.auctionHighestBid > 0
        ? this.state.auctionHighestBid + AUCTION_MIN_BID_INCREMENT
        : this.state.auctionStartingBid
      if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < minimumBid || amount > MAX_SCHEMA_CASH) {
        client.send('room:error', { message: `O próximo lance deve ser de pelo menos ${minimumBid.toLocaleString('pt-BR')}.` })
        return
      }
      if (!seller || seller.isBankrupt || seller.cash + amount > MAX_SCHEMA_CASH) {
        client.send('room:error', { message: 'O vendedor não pode receber esse valor no momento.' })
        return
      }
      const isCurrentBidder = this.state.auctionHighestBidderSessionId === client.sessionId
      const additionalCash = isCurrentBidder ? amount - this.state.auctionHighestBid : amount
      if (bidder.cash < additionalCash) {
        client.send('room:error', { message: 'Seu saldo disponível não cobre esse lance.' })
        return
      }
      if (this.state.auctionHighestBid > 0 && !isCurrentBidder) {
        const previousBidder = this.state.players.get(this.state.auctionHighestBidderSessionId)
        if (previousBidder) previousBidder.cash = Math.min(MAX_SCHEMA_CASH, previousBidder.cash + this.state.auctionHighestBid)
      }
      bidder.cash -= additionalCash
      this.state.auctionHighestBid = amount
      this.state.auctionHighestBidderSessionId = client.sessionId
    },
    auctionCancel: (client: Client, payload: { auctionId?: unknown }) => {
      if (payload?.auctionId !== this.state.auctionId || client.sessionId !== this.state.auctionSellerSessionId) {
        client.send('room:error', { message: 'Só quem iniciou o leilão pode cancelá-lo.' })
        return
      }
      if (this.state.auctionHighestBid > 0) {
        client.send('room:error', { message: 'O leilão não pode ser cancelado depois do primeiro lance.' })
        return
      }
      this.clearAuction(true)
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
      this.updateTurnClock()
      if (this.state.mode === 'classic') {
        if (this.state.matchSeconds > 0) this.state.matchSeconds -= 1
        if (this.state.matchSeconds === 0) {
          this.state.matchEnding = true
          if (['roll', 'resolve', 'jail'].includes(this.state.turnPhase)) this.finishMatch()
        }
        return
      }

      const activePlayer = this.state.players.get(this.state.activePlayerSessionId)
      if (this.state.phaseSeconds > 0) this.state.phaseSeconds -= 1
      if (this.state.phaseSeconds === 0) this.expireExpressPhase()
    }, 1000)
  }

  private stopMatchClock() {
    if (this.matchClockInterval) clearInterval(this.matchClockInterval)
    this.matchClockInterval = undefined
  }

  private updateTurnClock() {
    const phase = this.state.turnPhase
    const key = `${this.state.turnNumber}:${this.state.activePlayerSessionId}:${phase}`
    if (key !== this.turnTimerKey) {
      this.turnTimerKey = key
      this.state.turnSeconds = phase === 'roll'
        ? TURN_ROLL_SECONDS
        : ['purchase', 'resolve', 'jail', 'debt'].includes(phase) ? TURN_DECISION_SECONDS : 0
      return
    }
    if (this.state.turnSeconds === 0 || !['roll', 'purchase', 'resolve', 'jail', 'debt'].includes(phase)) return
    this.state.turnSeconds -= 1
    if (this.state.turnSeconds > 0) return

    const sessionId = this.state.activePlayerSessionId
    const player = this.state.players.get(sessionId)
    if (!player) return
    const client = { sessionId, send: () => undefined } as unknown as Client
    if (phase === 'roll') this.rollForPlayer(sessionId)
    else if (phase === 'purchase') this.messages.declinePurchase(client)
    else if (phase === 'resolve') this.messages.finishTurn(client)
    else if (phase === 'jail') this.messages.jailRoll(client)
    else {
      this.autoResolveDebt(sessionId)
      if (this.state.turnPhase === 'debt' && this.state.activePlayerSessionId === sessionId) this.state.turnSeconds = TURN_DECISION_SECONDS
    }
  }

  private autoResolveDebt(sessionId: string) {
    const player = this.state.players.get(sessionId)
    if (!player || this.state.turnPhase !== 'debt' || sessionId !== this.state.activePlayerSessionId) return
    const client = { sessionId, send: () => undefined } as unknown as Client
    if (player.cash >= this.state.debtAmount) {
      this.messages.payDebt(client)
      return
    }
    const holdings = this.getHoldings()
    const owned = [...holdings.entries()].filter(([, holding]) => holding.ownerSessionId === sessionId)
    const building = owned.find(([propertyId, holding]) => holding.houses > 0 && canSellBuilding(propertyId, sessionId, holdings))
    if (building) {
      this.messages.sellBuilding(client, { propertyId: building[0] })
      return
    }
    const mortgageable = owned.find(([propertyId]) => canMortgageProperty(propertyId, sessionId, holdings))
    if (mortgageable) this.messages.mortgage(client, { propertyId: mortgageable[0] })
    else this.messages.declareBankruptcy(client)
  }

  private rollForPlayer(sessionId: string) {
    const player = this.state.players.get(sessionId)
    if (this.state.status !== 'playing' || this.state.turnPhase !== 'roll' || sessionId !== this.state.activePlayerSessionId || !player || player.isJailed) return
    const diceOne = randomInt(1, 7)
    const diceTwo = randomInt(1, 7)
    const startPosition = player.position
    this.state.diceSequence += 1
    this.state.diceOne = diceOne
    this.state.diceTwo = diceTwo
    this.state.pawnMoveMode = 'walk'
    this.state.turnPhase = 'rolling'
    this.state.activeCardTitle = ''
    this.state.activeCardDescription = ''
    this.schedulePresentation(DICE_ANIMATION_DURATION_MS, () => {
      if (this.state.turnPhase !== 'rolling' || this.state.activePlayerSessionId !== sessionId) return
      this.movePlayer(sessionId, player, diceOne + diceTwo)
      this.startPawnMovement(sessionId, player, startPosition)
    })
  }

  private expireExpressPhase() {
    if (this.state.status !== 'playing' || this.state.mode !== 'express') return
    if (['rolling', 'moving', 'debt'].includes(this.state.turnPhase)) return
    if (this.state.turnPhase === 'purchase') {
      const space = boardSpaces[this.state.pendingPropertyId]
      this.state.pendingPropertyId = 255
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = `${space?.name ?? 'A propriedade'} permaneceu livre; a compra expirou.`
      this.advanceTurn()
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
    } else if (this.state.mode === 'express' && this.state.phaseSeconds === 0) {
      this.expireExpressPhase()
    }
  }

  private stopClocks() {
    this.stopMatchClock()
    this.stopTradeWindow()
    this.clearAuction(true)
    this.stopBotController()
    for (const timer of this.presentationTimers) clearTimeout(timer)
    this.presentationTimers.clear()
  }

  private startBotController() {
    this.stopBotController()
    this.botControllerInterval = setInterval(() => this.processBotStep(), BOT_TICK_MS)
    this.botControllerInterval.unref?.()
  }

  private stopBotController() {
    if (this.botControllerInterval) clearInterval(this.botControllerInterval)
    this.botControllerInterval = undefined
  }

  /** Runs one authoritative action for a bot-controlled player. Public to support deterministic server-side self-play tests. */
  processBotStep() {
    if (this.state.status !== 'playing') return
    if (this.state.turnPhase === 'rolling' || this.state.turnPhase === 'moving') return
    const fakeClient = (sessionId: string) => ({ sessionId, send: () => undefined }) as unknown as Client

    if (this.state.tradeOfferId > 0) {
      const sender = this.state.players.get(this.state.tradeOfferFromSessionId)
      const recipient = this.state.players.get(this.state.tradeOfferToSessionId)
      if (sender?.isBotControlled && !sender.isBot) {
        this.messages.tradeCancel(fakeClient(this.state.tradeOfferFromSessionId), { offerId: this.state.tradeOfferId })
        return
      }
      if (recipient?.isBot || recipient?.isBotControlled) {
        this.messages.tradeReject(fakeClient(this.state.tradeOfferToSessionId), { offerId: this.state.tradeOfferId })
        return
      }
    }

    if (this.state.auctionId > 0) {
      const propertyId = this.state.auctionPropertyId
      const space = boardSpaces[propertyId]
      for (const [sessionId, player] of this.state.players.entries()) {
        if ((!player.isBot && !player.isBotControlled) || player.isBankrupt || sessionId === this.state.auctionSellerSessionId || sessionId === this.state.auctionHighestBidderSessionId) continue
        const completesGroup = space?.kind === 'property' && boardSpaces
          .filter((candidate) => candidate.kind === 'property' && candidate.color === space.color)
          .every((candidate) => candidate.id === propertyId || this.state.properties.get(String(candidate.id))?.ownerSessionId === sessionId)
        const amount = space?.kind === 'property' ? chooseBotAuctionBid({
          price: space.price ?? 0,
          mortgageValue: mortgageValue(propertyId),
          isBuildable: Boolean(space.buildable),
          completesGroup,
          startingBid: this.state.auctionStartingBid,
          highestBid: this.state.auctionHighestBid,
          cash: player.cash,
        }) : null
        if (amount !== null) {
          this.messages.auctionBid(fakeClient(sessionId), { auctionId: this.state.auctionId, amount })
          return
        }
      }
    }

    const sessionId = this.state.activePlayerSessionId
    const player = this.state.players.get(sessionId)
    if (!player || player.isBankrupt || (!player.isBot && !player.isBotControlled)) return
    const client = fakeClient(sessionId)

    if (this.state.turnPhase === 'roll') {
      this.messages.roll(client)
    } else if (this.state.turnPhase === 'purchase') {
      const space = boardSpaces[this.state.pendingPropertyId]
      const groupSpaces = space?.kind === 'property' ? boardSpaces.filter((candidate) => candidate.kind === 'property' && candidate.color === space.color) : []
      const completesGroup = groupSpaces.length > 0 && groupSpaces.every((candidate) => candidate.id === this.state.pendingPropertyId || this.state.properties.get(String(candidate.id))?.ownerSessionId === sessionId)
      if (space?.kind === 'property' && shouldBotBuyProperty(space.price ?? 0, player.cash, completesGroup, this.state.mode as GameMode)) {
        const reserve = completesGroup ? 50_000 : this.state.mode === 'express' ? 75_000 : 150_000
        const houses = space.buildable
          ? [PROPERTY_BUILD_LEVELS, PROPERTY_BUILD_LEVELS - 1, PROPERTY_BUILD_LEVELS - 2, 0].find((count) => player.cash - (space.price ?? 0) - count * constructionCost(space.id) >= reserve) ?? 0
          : 0
        this.messages.buy(client, { houses })
      } else this.messages.declinePurchase(client)
    } else if (this.state.turnPhase === 'jail') {
      const choice = chooseBotJailAction(player.cash, player.jailTurns)
      this.messages[choice === 'pay' ? 'jailPay' : 'jailRoll'](client)
    } else if (this.state.turnPhase === 'debt') {
      if (player.cash >= this.state.debtAmount) {
        this.messages.payDebt(client)
        return
      }
      const holdings = this.getHoldings()
      const owned = [...holdings.entries()].filter(([, holding]) => holding.ownerSessionId === sessionId)
      const building = owned.find(([propertyId, holding]) => holding.houses > 0 && canSellBuilding(propertyId, sessionId, holdings))
      if (building) this.messages.sellBuilding(client, { propertyId: building[0] })
      else {
        const mortgageable = owned.find(([propertyId]) => canMortgageProperty(propertyId, sessionId, holdings))
        if (mortgageable) this.messages.mortgage(client, { propertyId: mortgageable[0] })
        else this.messages.declareBankruptcy(client)
      }
    } else if (this.state.turnPhase === 'resolve') {
      const holdings = this.getHoldings()
      const redeemable = [...holdings.entries()].find(([propertyId, holding]) => holding.ownerSessionId === sessionId && holding.isMortgaged && canRedeemMortgage(propertyId, sessionId, holdings, player.cash - 150_000))
      if (redeemable) this.messages.redeemMortgage(client, { propertyId: redeemable[0] })
      else {
        const propertyId = this.state.pendingPropertyId
        const space = boardSpaces[propertyId]
        const holding = holdings.get(propertyId)
        if (space?.kind === 'property' && holding?.ownerSessionId === sessionId && player.position === propertyId && !holding.isMortgaged) {
          if (holding.houses === PROPERTY_BUILD_LEVELS && canBuildHotel(propertyId, sessionId, holdings, player.cash - 150_000)) {
            this.messages.build(client, { propertyId, hotel: true })
            return
          }
          const targetHouses = [PROPERTY_BUILD_LEVELS, PROPERTY_BUILD_LEVELS - 1, PROPERTY_BUILD_LEVELS - 2]
            .find((target) => target > holding.houses && canBuildProperty(propertyId, sessionId, holdings, player.cash - 150_000, target))
          if (targetHouses !== undefined) {
            this.messages.build(client, { propertyId, targetHouses })
            return
          }
        }
        this.messages.finishTurn(client)
      }
    }
  }

  private finishMatch(forcedWinnerSessionId?: string) {
    if (this.state.status === 'ended') return
    this.clearAuction(true)
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

  private startAuctionClock() {
    this.stopAuctionClock()
    this.auctionInterval = setInterval(() => {
      if (this.state.status !== 'playing' || this.state.auctionId === 0) {
        this.stopAuctionClock()
        return
      }
      if (this.state.auctionSeconds > 1) {
        this.state.auctionSeconds -= 1
        return
      }
      this.finishAuction()
    }, 1000)
  }

  private stopAuctionClock() {
    if (this.auctionInterval) clearInterval(this.auctionInterval)
    this.auctionInterval = undefined
  }

  private clearAuction(refundHighestBid: boolean) {
    this.stopAuctionClock()
    if (refundHighestBid && this.state.auctionHighestBid > 0) {
      const bidder = this.state.players.get(this.state.auctionHighestBidderSessionId)
      if (bidder) bidder.cash = Math.min(MAX_SCHEMA_CASH, bidder.cash + this.state.auctionHighestBid)
    }
    this.state.auctionId = 0
    this.state.auctionPropertyId = 255
    this.state.auctionSellerSessionId = ''
    this.state.auctionStartingBid = 0
    this.state.auctionHighestBid = 0
    this.state.auctionHighestBidderSessionId = ''
    this.state.auctionSeconds = 0
  }

  private finishAuction() {
    const propertyId = this.state.auctionPropertyId
    const sellerSessionId = this.state.auctionSellerSessionId
    const bidderSessionId = this.state.auctionHighestBidderSessionId
    const bid = this.state.auctionHighestBid
    const seller = this.state.players.get(sellerSessionId)
    const bidder = this.state.players.get(bidderSessionId)
    const property = this.state.properties.get(String(propertyId))
    if (bid > 0 && seller && bidder && !seller.isBankrupt && !bidder.isBankrupt
      && property?.ownerSessionId === sellerSessionId && seller.cash + bid <= MAX_SCHEMA_CASH) {
      property.ownerSessionId = bidderSessionId
      seller.cash += bid
      this.clearAuction(false)
      this.state.landingDescription = `${bidder.name} venceu o leilão de ${boardSpaces[propertyId].name} por ${bid.toLocaleString('pt-BR')}.`
      this.refreshExpressObjective(sellerSessionId)
      this.refreshExpressObjective(bidderSessionId)
      return
    }
    this.clearAuction(true)
    this.state.landingDescription = bid > 0
      ? 'O leilão foi encerrado sem transferência; o lance reservado foi devolvido.'
      : 'O leilão terminou sem lances; o imóvel continua com o dono.'
  }

  private advanceTurn() {
    this.state.pendingPropertyId = 255
    this.state.pawnMoveMode = 'walk'
    const roomPlayerIds = Array.from(this.state.players.entries()).map(([sessionId]) => sessionId)
    this.stopTradeWindow()
    const solventPlayers = roomPlayerIds.filter((sessionId) => !this.state.players.get(sessionId)?.isBankrupt)
    if (solventPlayers.length <= 1) {
      this.finishMatch(solventPlayers[0])
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
    this.state.turnSeconds = this.state.turnPhase === 'jail' ? TURN_DECISION_SECONDS : TURN_ROLL_SECONDS
    this.turnTimerKey = `${this.state.turnNumber}:${this.state.activePlayerSessionId}:${this.state.turnPhase}`
    this.state.diceOne = 0
    this.state.diceTwo = 0
    this.state.landingDescription = nextPlayer?.isJailed ? 'Você está preso. Pague a fiança ou tente tirar duplas.' : ''
    this.state.activeCardTitle = ''
    this.state.activeCardDescription = ''
    this.startTradeWindow()
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
    this.clearAuction(true)
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

  private sendToJail(sessionId: string, player: LobbyPlayerState, description: string) {
    player.position = 10
    player.isJailed = true
    player.jailTurns = 0
    this.state.pendingPropertyId = 255
    this.state.turnPhase = 'moving'
    this.state.pawnMoveMode = 'teleport'
    this.state.landingDescription = description
    this.schedulePresentation(PAWN_TELEPORT_ANIMATION_DURATION_MS, () => {
      if (this.state.turnPhase !== 'moving' || this.state.activePlayerSessionId !== sessionId) return
      this.state.pawnMoveMode = 'walk'
      this.state.turnPhase = 'resolve'
      this.finishExpiredPhaseIfReady()
    })
  }

  private resolveSpace(sessionId: string, player: LobbyPlayerState, drawEvent = true, descriptionPrefix = '') {
    const space = boardSpaces[player.position]
    this.state.pendingPropertyId = 255
    this.state.turnPhase = 'resolve'
    this.state.landingDescription = `${descriptionPrefix ? `${descriptionPrefix} ` : ''}${describeLanding(player.position)}`
    if (space.kind === 'property') {
      const property = this.state.properties.get(String(space.id))
      if (!property?.ownerSessionId) {
        this.state.pendingPropertyId = space.id
        this.state.turnPhase = 'purchase'
      } else if (property.ownerSessionId === sessionId && space.buildable && !property.isMortgaged) {
        this.state.pendingPropertyId = space.id
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
      this.sendToJail(sessionId, player, 'Vá para a prisão: sua peça foi enviada à casa de visita e sua vez termina.')
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
        const startPosition = player.position
        this.movePlayer(sessionId, player, card.effect.spaces)
        this.startPawnMovement(sessionId, player, startPosition, card.description, false)
      } else {
        this.sendToJail(sessionId, player, `${card.description} Sua peça foi enviada à casa de visita.`)
      }
    }
  }

  private schedulePresentation(delayMs: number, action: () => void) {
    const timer = setTimeout(() => {
      this.presentationTimers.delete(timer)
      if (this.state.status === 'playing') action()
    }, delayMs)
    timer.unref?.()
    this.presentationTimers.add(timer)
  }

  private startPawnMovement(sessionId: string, player: LobbyPlayerState, startPosition: number, descriptionPrefix = '', drawEvent = true) {
    const steps = (player.position - startPosition + boardSpaces.length) % boardSpaces.length
    this.state.pawnMoveMode = 'walk'
    this.state.turnPhase = 'moving'
    this.schedulePresentation(Math.max(1, steps) * PAWN_STEP_ANIMATION_DURATION_MS, () => {
      if (this.state.turnPhase !== 'moving' || this.state.activePlayerSessionId !== sessionId) return
      this.resolveSpace(sessionId, player, drawEvent, descriptionPrefix)
      this.finishExpiredPhaseIfReady()
    })
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId)
    if (this.state.status === 'playing' && player) {
      player.isConnected = false
      if (!player.isBot) player.isBotControlled = true
      player.reconnectionExpired = true
      return
    }
    this.privateObjectives.delete(client.sessionId)
    this.expressActivity.delete(client.sessionId)
    if (this.state.status === 'playing') this.stopClocks()
    this.state.players.delete(client.sessionId)
    if (this.state.status === 'playing') this.state.status = 'waiting'
    if (![...this.state.players.values()].some((player) => player.isHost)) {
      const nextHost = [...this.state.players.values()].find((candidate) => candidate.isConnected && !candidate.isBot)
      if (nextHost) nextHost.isHost = true
    }
  }

  onDrop(client: Client, _code: CloseCode) {
    const player = this.state.players.get(client.sessionId)
    if (player) {
      player.isConnected = false
      player.reconnectionExpired = false
      player.isBotControlled = this.state.status === 'playing' && !player.isBot
    }
    this.allowReconnection(client, RECONNECTION_WINDOW_SECONDS).catch(() => {})
  }

  onReconnect(client: Client) {
    const player = this.state.players.get(client.sessionId)
    if (player) {
      player.isConnected = true
      player.reconnectionExpired = false
      player.isBotControlled = false
    }
  }

  async onDispose() {
    this.stopClocks()
    await this.presence.srem(ROOM_CODES_CHANNEL, this.roomId)
  }
}
