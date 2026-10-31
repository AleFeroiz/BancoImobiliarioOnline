import { randomInt } from 'node:crypto'
import { CloseCode, Client, Room } from '@colyseus/core'
import type { GameMode } from '../../../shared/lobby.js'
import { isCharacterType, isGameMode, normalizePlayerName } from '../../../shared/lobby.js'
import { AUCTION_DURATION_SECONDS, AUCTION_MIN_BID_INCREMENT, CLASSIC_MATCH_SECONDS, DEFAULT_ANIMATION_SPEED, DICE_ANIMATION_DURATION_MS, JAIL_TURNS, MATCH_DURATIONS, PAWN_STEP_ANIMATION_DURATION_MS, PAWN_TELEPORT_ANIMATION_DURATION_MS, PROPERTY_BUILD_LEVELS, PROPERTY_HOTEL_LEVEL, START_BONUS, STARTING_CASH, TURN_DECISION_SECONDS, TURN_ROLL_SECONDS, areDiceDoubles, bankReturnValue, buildingSaleValue, calculateCompanyRent, calculateNetWorth, calculateRent, canBuildHotel, canBuildProperty, canReturnPropertyToBank, canSellBuilding, constructionCost, describeLanding, forcedBuybackCost, getAnimationDuration, hasLiquidatableAssets, hasWinningMonopoly, hotelConstructionCost, isAnimationSpeed, isMatchDuration, movePosition, taxForSpace } from '../../../shared/game.js'
import { boardSpaces } from '../../../shared/board.js'
import { PLAYER_COLORS, isPlayerColor } from '../../../shared/playerColors.js'
import { isPlayerEmote } from '../../../shared/playerEmotes.js'
import { EVENT_CARDS } from '../../../shared/cards.js'
import { LobbyPlayerState, LobbyState, PropertyState } from './schema/LobbyState.js'
import { chooseBotAuctionBid, shouldBotBuyProperty } from './botStrategy.js'

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 5
const ROOM_CODES_CHANNEL = '$banco-imobiliario-room-codes'
const MAX_SCHEMA_CASH = 2_147_483_647
const RECONNECTION_WINDOW_SECONDS = 24 * 60 * 60
const BOT_TICK_MS = 1_000

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
  private matchClockInterval?: ReturnType<typeof setInterval>
  private botControllerInterval?: ReturnType<typeof setInterval>
  private tradeOfferSequence = 0
  private auctionSequence = 0
  private botSequence = 0
  private turnTimerKey = ''
  private presentationTimers = new Set<ReturnType<typeof setTimeout>>()
  private pendingCardPayments: { sessionId: string; amount: number; reason: string }[] = []
  private pendingCardPaymentActorSessionId = ''
  private cardTargetRevealPending = false
  private consecutiveDoubles = 0
  private lastRollWasDouble = false

  async onCreate(options: { mode?: unknown; matchDuration?: unknown }) {
    const mode: GameMode = isGameMode(options.mode) ? options.mode : 'classic'
    const occupiedCodes = await this.presence.smembers(ROOM_CODES_CHANNEL)
    let roomCode = createRoomCode()
    while (occupiedCodes.includes(roomCode)) roomCode = createRoomCode()

    await this.presence.sadd(ROOM_CODES_CHANNEL, roomCode)
    this.roomId = roomCode
    this.state.roomCode = roomCode
    this.state.mode = mode
    this.state.matchDuration = isMatchDuration(options.matchDuration) ? options.matchDuration : CLASSIC_MATCH_SECONDS
    this.state.animationSpeed = DEFAULT_ANIMATION_SPEED
    this.state.presentationSpeed = DEFAULT_ANIMATION_SPEED
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
    player.color = this.getAvailablePlayerColor()
    this.state.players.set(client.sessionId, player)
  }

  messages = {
    emote: (client: Client, payload: { emote?: unknown }) => {
      const player = this.state.players.get(client.sessionId)
      if (this.state.status !== 'playing' || !player || player.isBot || player.isBankrupt || !isPlayerEmote(payload?.emote)) {
        client.send('room:error', { message: 'Esse emote não está disponível agora.' })
        return
      }
      this.broadcast('game:emote', { sessionId: client.sessionId, emote: payload.emote })
    },
    setCharacter: (client: Client, payload: { characterType?: unknown }) => {
      const player = this.state.players.get(client.sessionId)
      if (this.state.status !== 'waiting' || !player || player.isBot || !isCharacterType(payload?.characterType)) {
        client.send('room:error', { message: 'Escolha uma ficha válida enquanto a sala ainda está no lobby.' })
        return
      }
      player.characterType = payload.characterType
    },
    setPlayerColor: (client: Client, payload: { color?: unknown }) => {
      const player = this.state.players.get(client.sessionId)
      if (this.state.status !== 'waiting' || !player || player.isBot || !isPlayerColor(payload?.color)) {
        client.send('room:error', { message: 'Escolha uma cor disponível enquanto a sala ainda está no lobby.' })
        return
      }
      if (Array.from(this.state.players.entries()).some(([sessionId, other]) => sessionId !== client.sessionId && other.color === payload.color)) {
        client.send('room:error', { message: 'Essa cor já foi escolhida por outra pessoa.' })
        return
      }
      player.color = payload.color
    },
    setMatchDuration: (client: Client, payload: { duration?: unknown }) => {
      const requester = this.state.players.get(client.sessionId)
      if (this.state.status !== 'waiting' || !requester?.isHost || !isMatchDuration(payload?.duration)) {
        client.send('room:error', { message: 'Só a pessoa anfitriã pode escolher 15, 30 ou 60 minutos no lobby.' })
        return
      }
      this.state.matchDuration = payload.duration
    },
    setAnimationSpeed: (client: Client, payload: { speed?: unknown }) => {
      const requester = this.state.players.get(client.sessionId)
      if (!requester?.isHost) {
        client.send('room:error', { message: 'Só a pessoa anfitriã pode alterar a velocidade das animações.' })
        return
      }
      if (this.state.status !== 'playing' || !isAnimationSpeed(payload?.speed)) {
        client.send('room:error', { message: 'Escolha 0,5x, 1x ou 2x durante a partida.' })
        return
      }
      this.state.animationSpeed = payload.speed
    },
    setDevToolsEnabled: (client: Client, payload: { enabled?: unknown }) => {
      const requester = this.state.players.get(client.sessionId)
      if (this.state.status !== 'waiting' || !requester?.isHost || typeof payload?.enabled !== 'boolean') {
        client.send('room:error', { message: 'Só a pessoa anfitriã pode alterar o modo DEV enquanto a sala está no lobby.' })
        return
      }
      this.state.devToolsEnabled = payload.enabled
    },
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
      bot.color = this.getAvailablePlayerColor()
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
      this.state.presentationSpeed = this.state.animationSpeed
      this.state.properties.clear()
      for (const player of this.state.players.values()) {
        player.position = 0
        player.cash = STARTING_CASH
        player.devInfiniteCash = false
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
      this.state.matchSeconds = this.state.matchDuration
      this.state.matchEnding = false
      this.state.diceOne = 0
      this.state.diceTwo = 0
      this.state.landingDescription = ''
      this.state.activeCardTitle = ''
      this.state.activeCardDescription = ''
      this.state.activeCardId = ''
      this.state.pendingPropertyId = 255
      this.state.debtAmount = 0
      this.state.debtCreditorSessionId = ''
      this.state.debtReason = ''
      this.state.winnerSessionId = ''
      this.consecutiveDoubles = 0
      this.lastRollWasDouble = false
      this.clearAuction(false)
      this.startMatchClock()
      this.startBotController()
      this.broadcast('game:started', { mode: this.state.mode })
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
    devRoll: (client: Client, payload: { diceOne?: unknown; diceTwo?: unknown } = {}) => {
      const requester = this.state.players.get(client.sessionId)
      const diceOne = payload?.diceOne
      const diceTwo = payload?.diceTwo
      const activePlayer = this.state.players.get(this.state.activePlayerSessionId)
      if (!requester?.isHost || !this.state.devToolsEnabled) {
        client.send('room:error', { message: 'A rolagem DEV está desativada ou disponível apenas para a pessoa anfitriã.' })
        return
      }
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'roll' || !activePlayer || activePlayer.isJailed) {
        client.send('room:error', { message: 'Só é possível forçar os dados durante uma etapa válida de rolagem.' })
        return
      }
      if (typeof diceOne !== 'number' || !Number.isInteger(diceOne) || diceOne < 1 || diceOne > 6 || typeof diceTwo !== 'number' || !Number.isInteger(diceTwo) || diceTwo < 1 || diceTwo > 6) {
        client.send('room:error', { message: 'Escolha um valor inteiro entre 1 e 6 para cada dado.' })
        return
      }
      this.rollForPlayer(this.state.activePlayerSessionId, [diceOne, diceTwo])
    },
    devTeleport: (client: Client, payload: { spaceId?: unknown } = {}) => {
      const requester = this.state.players.get(client.sessionId)
      const player = this.state.players.get(this.state.activePlayerSessionId)
      const spaceId = payload?.spaceId
      if (!requester?.isHost || !this.state.devToolsEnabled) {
        client.send('room:error', { message: 'O teleporte DEV está desativado ou disponível apenas para a pessoa anfitriã.' })
        return
      }
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'roll' || !player) {
        client.send('room:error', { message: 'Só é possível teleportar durante a etapa de rolagem.' })
        return
      }
      if (typeof spaceId !== 'number' || !Number.isInteger(spaceId) || spaceId < 0 || spaceId >= boardSpaces.length) {
        client.send('room:error', { message: 'Escolha uma casa válida do tabuleiro.' })
        return
      }
      player.position = spaceId
      player.isJailed = false
      player.jailTurns = 0
      this.consecutiveDoubles = 0
      this.lastRollWasDouble = false
      this.state.pawnMoveMode = 'teleport'
      this.state.turnPhase = 'moving'
      this.state.landingDescription = `Teleporte DEV para ${boardSpaces[spaceId].name}.`
      this.state.pendingPropertyId = 255
      this.state.activeCardTitle = ''
      this.state.activeCardDescription = ''
      this.state.activeCardId = ''
      this.state.presentationSpeed = this.state.animationSpeed
      const sessionId = this.state.activePlayerSessionId
      this.schedulePresentation(getAnimationDuration(PAWN_TELEPORT_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
        if (this.state.turnPhase !== 'moving' || this.state.activePlayerSessionId !== sessionId || player.position !== spaceId) return
        this.state.pawnMoveMode = 'walk'
        this.resolveSpace(sessionId, player, true, `Teleporte DEV para ${boardSpaces[spaceId].name}.`)
        this.finishExpiredPhaseIfReady()
      })
    },
    devSetCash: (client: Client, payload: { sessionId?: unknown; cash?: unknown; infinite?: unknown } = {}) => {
      const requester = this.state.players.get(client.sessionId)
      const target = typeof payload?.sessionId === 'string' ? this.state.players.get(payload.sessionId) : undefined
      if (!requester?.isHost || !this.state.devToolsEnabled || this.state.status !== 'playing') {
        client.send('room:error', { message: 'O ajuste de dinheiro DEV está desativado ou disponível apenas para a anfitriã durante a partida.' })
        return
      }
      if (!target || target.isBankrupt || typeof payload?.cash !== 'number' || !Number.isSafeInteger(payload.cash) || payload.cash < 0 || payload.cash > MAX_SCHEMA_CASH || typeof payload?.infinite !== 'boolean') {
        client.send('room:error', { message: 'Escolha um participante ativo e um saldo inteiro válido.' })
        return
      }
      target.cash = payload.cash
      target.devInfiniteCash = payload.infinite
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
      if (!this.canSpend(player, totalCost)) {
        client.send('room:error', { message: 'Seu saldo não cobre o terreno e as construções selecionadas.' })
        return
      }
      this.state.presentationSpeed = this.state.animationSpeed
      this.spendCash(player, totalCost)
      const property = new PropertyState()
      property.ownerSessionId = client.sessionId
      property.houses = houses
      this.state.properties.set(String(space.id), property)
      this.state.pendingPropertyId = 255
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = houses
        ? `${space.name} comprada com ${houses} ${houses === 1 ? 'casa' : 'casas'} por ${totalCost.toLocaleString('pt-BR')}.`
        : `${space.name} comprada por ${space.price.toLocaleString('pt-BR')}.`
      this.checkMonopolyVictory(client.sessionId)
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
    buyback: (client: Client, payload: { accept?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'buyback' || client.sessionId !== this.state.activePlayerSessionId || typeof payload?.accept !== 'boolean') return
      const buyer = this.state.players.get(client.sessionId)
      const propertyId = this.state.pendingPropertyId
      const property = this.state.properties.get(String(propertyId))
      const space = boardSpaces[propertyId]
      if (!buyer || !property || !space || space.kind !== 'property' || !property.ownerSessionId || property.ownerSessionId === client.sessionId) return
      const owner = this.state.players.get(property.ownerSessionId)
      if (payload.accept && property.houses === PROPERTY_HOTEL_LEVEL) {
        client.send('room:error', { message: 'Propriedades com hotel não podem ser recompradas.' })
        return
      }
      if (payload.accept) {
        const price = forcedBuybackCost(propertyId, property.houses)
        if (!this.canSpend(buyer, price)) {
          client.send('room:error', { message: `A recompra custa ${price.toLocaleString('pt-BR')}; seu saldo é insuficiente.` })
          return
        }
        if (owner && owner.cash + price > MAX_SCHEMA_CASH) {
          client.send('room:error', { message: 'O saldo do antigo proprietário não comporta o valor integral da recompra.' })
          return
        }
        this.spendCash(buyer, price)
        if (owner && !owner.isBankrupt) this.creditCash(owner, price)
        property.ownerSessionId = client.sessionId
        this.state.landingDescription += ` ${space.name} recomprada por ${price.toLocaleString('pt-BR')}; o valor integral da recompra foi pago ao antigo proprietário.`
        this.checkMonopolyVictory(client.sessionId)
      } else {
        this.state.landingDescription += ' Você escolheu continuar sem recomprar; o aluguel já foi pago.'
      }
      this.state.pendingPropertyId = 255
      const debtOpened = (this.state as LobbyState).turnPhase === 'debt'
      if (!debtOpened) this.state.turnPhase = 'resolve'
      this.finishExpiredPhaseIfReady()
    },
    build: (client: Client, payload: { propertyId?: unknown; targetHouses?: unknown; hotel?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'resolve' || client.sessionId !== this.state.activePlayerSessionId) return
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
      const landedHere = this.state.pendingPropertyId === propertyId && player?.position === propertyId
      if (!player || !property || property.ownerSessionId !== client.sessionId || !landedHere) {
        client.send('room:error', { message: 'Só é possível construir ao cair no próprio terreno.' })
        return
      }
      const space = boardSpaces[propertyId]
      if (payload.hotel === true) {
        if (!canBuildHotel(propertyId, client.sessionId, holdings, this.availableCash(player))) {
          client.send('room:error', { message: 'O hotel só pode ser comprado ao cair num imóvel com três casas e ter saldo suficiente.' })
          return
        }
        this.state.presentationSpeed = this.state.animationSpeed
        const cost = hotelConstructionCost(propertyId)
        this.spendCash(player, cost)
        property.houses = PROPERTY_HOTEL_LEVEL
        this.state.landingDescription = `Hotel construído em ${space.name} por ${cost.toLocaleString('pt-BR')}.`
      } else {
        const targetHouses = payload.targetHouses
        if (typeof targetHouses !== 'number' || !Number.isInteger(targetHouses) || !canBuildProperty(propertyId, client.sessionId, holdings, this.availableCash(player), targetHouses)) {
          client.send('room:error', { message: 'Escolha um total de uma a três casas maior que o atual e tenha saldo suficiente.' })
          return
        }
        this.state.presentationSpeed = this.state.animationSpeed
        const cost = (targetHouses - property.houses) * constructionCost(propertyId)
        this.spendCash(player, cost)
        property.houses = targetHouses
        this.state.landingDescription = `${targetHouses} ${targetHouses === 1 ? 'casa construída' : 'casas construídas'} em ${space.name} por ${cost.toLocaleString('pt-BR')}.`
      }
      this.state.pendingPropertyId = 255
    },
    sellBuilding: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || !['resolve', 'debt'].includes(this.state.turnPhase) || client.sessionId !== this.state.activePlayerSessionId) return
      if (this.state.turnPhase === 'debt' && this.state.players.get(client.sessionId) && this.canSpend(this.state.players.get(client.sessionId)!, this.state.debtAmount)) {
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
      this.state.presentationSpeed = this.state.animationSpeed
      const amount = buildingSaleValue(propertyId, previousLevel)
      property.houses -= 1
      this.creditCash(player, amount)
      this.state.landingDescription = `${previousLevel === PROPERTY_HOTEL_LEVEL ? 'Hotel vendido; três casas permaneceram' : `Construção vendida (nível ${property.houses})`} em ${boardSpaces[propertyId].name}. Você recebeu ${amount.toLocaleString('pt-BR')}.`
    },
    returnPropertyToBank: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'debt' || client.sessionId !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Só é possível devolver um imóvel ao banco para completar uma dívida.' })
        return
      }
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(client.sessionId)
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
      if (!player || this.canSpend(player, this.state.debtAmount)) {
        client.send('room:error', { message: 'Seu saldo já cobre a dívida; não é possível devolver imóveis agora.' })
        return
      }
      if (!player || !property || !canReturnPropertyToBank(propertyId, client.sessionId, holdings)) {
        client.send('room:error', { message: 'Esse imóvel não pode ser devolvido ao banco. Venda as construções do grupo e tente novamente.' })
        return
      }
      const amount = bankReturnValue(propertyId)
      this.state.presentationSpeed = this.state.animationSpeed
      property.ownerSessionId = ''
      property.houses = 0
      property.blackoutTurns = 0
      property.protectionTurns = 0
      this.creditCash(player, amount)
      this.state.landingDescription = `${boardSpaces[propertyId].name} devolvida ao banco. Você recebeu ${amount.toLocaleString('pt-BR')}; o imóvel voltou a ficar livre.`
    },
    payDebt: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'debt' || client.sessionId !== this.state.activePlayerSessionId) return
      const debtor = this.state.players.get(client.sessionId)
      if (!debtor || !this.canSpend(debtor, this.state.debtAmount)) return
      const amount = this.state.debtAmount
      const creditorSessionId = this.state.debtCreditorSessionId
      const creditor = this.state.players.get(creditorSessionId)
      this.spendCash(debtor, amount)
      if (creditor && !creditor.isBankrupt) this.creditCash(creditor, amount)
      const reason = this.state.debtReason
      this.clearDebt()
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = `Dívida paga (${reason}): ${amount.toLocaleString('pt-BR')}.`
      if (this.pendingCardPaymentActorSessionId) {
        this.resumeCardPayments()
        return
      }
      if (reason === 'Aluguel' || reason === 'Aluguel da companhia') {
        if (!this.offerBuybackAfterRent(client.sessionId, this.state.pendingPropertyId)) this.state.pendingPropertyId = 255
      }
      this.finishExpiredPhaseIfReady()
    },
    declareBankruptcy: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'debt' || client.sessionId !== this.state.activePlayerSessionId) return
      const debtor = this.state.players.get(client.sessionId)
      if (!debtor || this.canSpend(debtor, this.state.debtAmount) || hasLiquidatableAssets(client.sessionId, this.getHoldings())) {
        client.send('room:error', { message: 'Quite a dívida ou liquide todos os bens possíveis antes de declarar falência.' })
        return
      }
      const creditorId = this.state.debtCreditorSessionId
      const creditor = this.state.players.get(creditorId)
      if (creditor && !creditor.isBankrupt) this.creditCash(creditor, debtor.cash)
      for (const property of this.state.properties.values()) {
        if (property.ownerSessionId !== client.sessionId) continue
        if (creditor && !creditor.isBankrupt) {
          property.ownerSessionId = creditorId
        } else {
          property.ownerSessionId = ''
          property.houses = 0
          property.blackoutTurns = 0
          property.protectionTurns = 0
        }
      }
      if (creditor && !creditor.isBankrupt) {
        this.checkMonopolyVictory(creditorId)
      }
      debtor.cash = 0
      debtor.isBankrupt = true
      debtor.isJailed = false
      if (this.state.tradeOfferFromSessionId === client.sessionId || this.state.tradeOfferToSessionId === client.sessionId) this.clearTradeOffer()
      const name = debtor.name
      this.clearDebt()
      const survivors = Array.from(this.state.players.entries()).filter(([, player]) => !player.isBankrupt)
      if (survivors.length <= 1) {
        this.finishMatch(survivors[0]?.[0])
        this.state.landingDescription = survivors.length ? `${name} faliu. ${survivors[0][1].name} venceu a partida.` : `${name} faliu. A partida terminou sem vencedor.`
        return
      }
      this.state.landingDescription = `${name} declarou falência. Seus bens foram transferidos ao credor ou ao banco.`
      if (this.pendingCardPaymentActorSessionId) {
        this.resumeCardPayments()
        return
      }
      this.advanceTurn()
    },
    jailRoll: (client: Client) => {
      const player = this.state.players.get(client.sessionId)
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'jail' || client.sessionId !== this.state.activePlayerSessionId || !player?.isJailed) {
        client.send('room:error', { message: 'Só é possível tentar duplas na sua vez, enquanto estiver preso.' })
        return
      }
      const diceOne = randomInt(1, 7)
      const diceTwo = randomInt(1, 7)
      if (areDiceDoubles([diceOne, diceTwo])) {
        player.isJailed = false
        player.jailTurns = 0
        this.state.turnPhase = 'roll'
        this.state.turnSeconds = TURN_ROLL_SECONDS
        this.turnTimerKey = `${this.state.turnNumber}:${client.sessionId}:roll`
        this.state.landingDescription = `Duplas (${diceOne} e ${diceTwo})! Você saiu da prisão e avançará ${diceOne + diceTwo} casas.`
        this.rollForPlayer(client.sessionId, [diceOne, diceTwo], false)
        return
      }
      this.state.diceSequence += 1
      this.state.diceOne = diceOne
      this.state.diceTwo = diceTwo
      this.state.turnPhase = 'rolling'
      this.state.presentationSpeed = this.state.animationSpeed
      this.state.landingDescription = `Não saiu duplas (${diceOne} e ${diceTwo}). Você continua preso.`
      this.schedulePresentation(getAnimationDuration(DICE_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
        if (this.state.turnPhase !== 'rolling' || this.state.activePlayerSessionId !== client.sessionId) return
        player.jailTurns = Math.max(0, player.jailTurns - 1)
        if (player.jailTurns === 0) player.isJailed = false
        this.advanceTurn()
      })
    },
    jailPay: (client: Client) => {
      const player = this.state.players.get(client.sessionId)
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'jail' || client.sessionId !== this.state.activePlayerSessionId || !player?.isJailed) {
        client.send('room:error', { message: 'Só é possível pagar para sair na sua vez, enquanto estiver preso.' })
        return
      }
      if (!this.canSpend(player, 200_000)) {
        client.send('room:error', { message: 'Você precisa ter R$ 200.000 para pagar e sair da prisão.' })
        return
      }
      this.spendCash(player, 200_000)
      player.isJailed = false
      player.jailTurns = 0
      this.state.turnPhase = 'roll'
      this.state.turnSeconds = TURN_ROLL_SECONDS
      this.turnTimerKey = `${this.state.turnNumber}:${client.sessionId}:roll`
      this.state.diceOne = 0
      this.state.diceTwo = 0
      this.state.landingDescription = 'Você pagou R$ 200.000 para sair da prisão. Lance os dados para continuar.'
    },
    tradeOffer: (client: Client, payload: {
      toSessionId?: unknown
      cashOffered?: unknown
      cashRequested?: unknown
      propertiesOffered?: unknown
      propertiesRequested?: unknown
    }) => {
      if (!this.isTradeAvailable()) {
        client.send('room:error', { message: 'Só é possível negociar durante uma partida ativa.' })
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
      if (!this.isTradeAvailable() || offerId !== this.state.tradeOfferId || client.sessionId !== this.state.tradeOfferToSessionId) {
        client.send('room:error', { message: 'Essa oferta não está mais disponível para você.' })
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
        || !this.canSpend(sender, cashFromSender) || !this.canSpend(recipient, cashFromRecipient)
        || this.cashAfterTransfer(sender, cashFromSender, cashFromRecipient) > MAX_SCHEMA_CASH
        || this.cashAfterTransfer(recipient, cashFromRecipient, cashFromSender) > MAX_SCHEMA_CASH
        || !validTitles(offeredIds, senderSessionId) || !validTitles(requestedIds, recipientSessionId)) {
        client.send('room:error', { message: 'A oferta mudou e não pode mais ser concluída. Confira saldos e imóveis.' })
        return
      }
      sender.cash = this.cashAfterTransfer(sender, cashFromSender, cashFromRecipient)
      recipient.cash = this.cashAfterTransfer(recipient, cashFromRecipient, cashFromSender)
      for (const id of offeredIds) this.state.properties.get(String(id))!.ownerSessionId = recipientSessionId
      for (const id of requestedIds) this.state.properties.get(String(id))!.ownerSessionId = senderSessionId
      this.state.landingDescription = `${recipient.name} aceitou a troca proposta por ${sender.name}.`
      if (this.checkMonopolyVictory(senderSessionId) || this.checkMonopolyVictory(recipientSessionId)) return
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
      if (!this.canSpend(bidder, additionalCash)) {
        client.send('room:error', { message: 'Seu saldo disponível não cobre esse lance.' })
        return
      }
      if (this.state.auctionHighestBid > 0 && !isCurrentBidder) {
        const previousBidder = this.state.players.get(this.state.auctionHighestBidderSessionId)
        if (previousBidder && !previousBidder.devInfiniteCash) this.creditCash(previousBidder, this.state.auctionHighestBid)
      }
      this.spendCash(bidder, additionalCash)
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
      if (this.state.status !== 'playing' || !['resolve', 'jail'].includes(this.state.turnPhase)) return
      if (client.sessionId !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Somente a pessoa da vez pode concluir a jogada.' })
        return
      }
      if (this.state.turnPhase === 'jail') {
        const player = this.state.players.get(client.sessionId)
        if (!player?.isJailed) return
        player.jailTurns = Math.max(0, player.jailTurns - 1)
        if (player.jailTurns === 0) player.isJailed = false
      }
      if (this.state.mode === 'classic' && this.state.matchEnding) this.finishMatch()
      else if (this.lastRollWasDouble && !this.state.players.get(client.sessionId)?.isJailed) {
        this.lastRollWasDouble = false
        this.state.turnPhase = 'roll'
        this.state.turnSeconds = TURN_ROLL_SECONDS
        this.turnTimerKey = `${this.state.turnNumber}:${client.sessionId}:roll`
        this.state.diceOne = 0
        this.state.diceTwo = 0
        this.state.landingDescription += ' Você tirou duplas e pode lançar novamente.'
      }
      else this.advanceTurn()
    },
    dismissCardReveal: (client: Client) => {
      if (this.state.status !== 'playing'
        || this.state.turnPhase !== 'card-target'
        || client.sessionId !== this.state.activePlayerSessionId
        || !this.cardTargetRevealPending) return
      this.cardTargetRevealPending = false
      this.state.turnSeconds = TURN_DECISION_SECONDS
      this.turnTimerKey = `${this.state.turnNumber}:${client.sessionId}:card-target`
    },
    chooseWorldCup: (client: Client, payload: { propertyId?: unknown }) => {
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const space = boardSpaces[propertyId]
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'world-cup' || client.sessionId !== this.state.activePlayerSessionId) return
      if (!space || space.kind !== 'property' || this.state.properties.get(String(propertyId))?.ownerSessionId !== client.sessionId) {
        client.send('room:error', { message: 'Escolha uma propriedade sua para sediar a Copa do Mundo.' })
        return
      }
      this.state.worldCupSpaceId = propertyId
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = `${space.name} será sede da Copa do Mundo. O aluguel agora vale três vezes o valor normal.`
      this.finishExpiredPhaseIfReady()
    },
    chooseWorldTour: (client: Client, payload: { spaceId?: unknown }) => {
      const spaceId = typeof payload?.spaceId === 'number' ? payload.spaceId : -1
      const space = boardSpaces[spaceId]
      const player = this.state.players.get(client.sessionId)
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'world-tour' || client.sessionId !== this.state.activePlayerSessionId || !player) return
      const holding = this.state.properties.get(String(spaceId))
      const isAllowedProperty = space?.kind === 'property' && (!holding?.ownerSessionId || holding.ownerSessionId === client.sessionId)
      const isAllowedSpecial = space && space.kind !== 'property' && space.id !== player.position
      if (!space || space.id === 30 || (!isAllowedProperty && !isAllowedSpecial)) {
        client.send('room:error', { message: 'Escolha uma propriedade sua, livre ou uma casa especial diferente desta.' })
        return
      }
      player.position = spaceId
      this.state.pawnMoveMode = 'teleport'
      this.state.turnPhase = 'moving'
      this.state.landingDescription = `Volta ao Brasil: sua peça viajou para ${space.name}, sem bônus por passagem pela Partida.`
      this.state.presentationSpeed = this.state.animationSpeed
      this.schedulePresentation(getAnimationDuration(PAWN_TELEPORT_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
        if (this.state.turnPhase !== 'moving' || this.state.activePlayerSessionId !== client.sessionId || player.position !== spaceId) return
        this.state.pawnMoveMode = 'walk'
        this.resolveSpace(client.sessionId, player, true, `Volta ao Brasil: chegada em ${space.name}, sem bônus por passagem pela Partida.`)
        this.finishExpiredPhaseIfReady()
      })
    },
    resolveCardTarget: (client: Client, payload: { propertyId?: unknown; targetSessionId?: unknown; secondSessionId?: unknown }) => {
      const actorId = client.sessionId
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'card-target' || actorId !== this.state.activePlayerSessionId) return
      const actor = this.state.players.get(actorId)
      const card = EVENT_CARDS.find((candidate) => candidate.id === this.state.activeCardId)
      if (!actor || !card) return
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const targetId = typeof payload?.targetSessionId === 'string' ? payload.targetSessionId : ''
      const target = this.state.players.get(targetId)
      const property = this.state.properties.get(String(propertyId))
      const space = boardSpaces[propertyId]
      const validTarget = Boolean(target && targetId !== actorId && !target.isBankrupt)
      const validSwapTarget = Boolean(target && !target.isBankrupt)
      const cardBlocked = Boolean(property && property.protectionTurns > 0)
      const invalid = (message: string) => client.send('room:error', { message })

      if (card.effect.kind === 'generous') {
        if (space?.kind !== 'property' || !property || property.ownerSessionId !== actorId || !validTarget || cardBlocked) {
          invalid('Escolha um imóvel seu sem proteção e outra pessoa que ainda esteja na partida.')
          return
        }
        property.ownerSessionId = targetId
        this.state.landingDescription = `${actor.name} deu ${boardSpaces[propertyId].name} a ${target!.name}.`
        if (this.checkMonopolyVictory(targetId)) return
      } else if (card.effect.kind === 'blackout') {
        if (space?.kind !== 'property' || !property || property.ownerSessionId !== targetId || !validTarget || property.houses === PROPERTY_HOTEL_LEVEL || cardBlocked) {
          invalid('Escolha um imóvel sem hotel e sem proteção que pertença a outra pessoa.')
          return
        }
        property.blackoutTurns = 3
        this.state.landingDescription = `${boardSpaces[propertyId].name} ficará sem aluguel nos próximos três turnos de ${target!.name}.`
      } else if (card.effect.kind === 'earthquake') {
        if (space?.kind !== 'property' || !property || property.ownerSessionId !== targetId || !validTarget || property.houses === PROPERTY_HOTEL_LEVEL || cardBlocked) {
          invalid('Escolha um imóvel sem hotel e sem proteção que pertença a outra pessoa.')
          return
        }
        property.ownerSessionId = ''
        property.houses = 0
        property.blackoutTurns = 0
        property.protectionTurns = 0
        this.state.landingDescription = `${boardSpaces[propertyId].name} foi destruída pelo terremoto e voltou ao banco.`
      } else if (card.effect.kind === 'thief') {
        if (!validTarget) {
          invalid('Escolha outra pessoa que ainda esteja na partida.')
          return
        }
        this.state.landingDescription = `${actor.name} roubou R$ ${card.effect.amount.toLocaleString('pt-BR')} de ${target!.name}.`
        this.beginCardPayments(actorId, [{ sessionId: targetId, amount: card.effect.amount, reason: 'Roubo' }])
        return
      } else if (card.effect.kind === 'protection') {
        if (space?.kind !== 'property' || !property || property.ownerSessionId !== actorId) {
          invalid('Escolha um imóvel seu.')
          return
        }
        property.protectionTurns = Math.max(property.protectionTurns, 4)
        this.state.landingDescription = `${boardSpaces[propertyId].name} está protegida contra cartas pelos próximos três turnos do dono.`
      } else if (card.effect.kind === 'swap') {
        const secondId = typeof payload?.secondSessionId === 'string' ? payload.secondSessionId : ''
        const second = this.state.players.get(secondId)
        if (!validSwapTarget || !second || secondId === targetId || second.isBankrupt) {
          invalid('Escolha duas pessoas diferentes que ainda estejam na partida. Você pode escolher a si mesmo.')
          return
        }
        const targetPosition = target!.position
        target!.position = second.position
        second.position = targetPosition
        this.state.pawnMoveMode = 'teleport'
        this.state.landingDescription = `${target!.name} e ${second.name} trocaram de lugar sem resolver as casas de chegada.`
      } else {
        invalid('Esta carta não exige escolha de alvo.')
        return
      }
      this.state.turnPhase = 'resolve'
      this.cardTargetRevealPending = false
      this.state.turnSeconds = TURN_DECISION_SECONDS
      this.turnTimerKey = `${this.state.turnNumber}:${actorId}:resolve`
      this.finishExpiredPhaseIfReady()
    },
  }

  private getHoldings() {
    return new Map(Array.from(this.state.properties.entries()).map(([id, item]) => [Number(id), {
      ownerSessionId: item.ownerSessionId,
      houses: item.houses,
      blackoutTurns: item.blackoutTurns,
      protectionTurns: item.protectionTurns,
    }]))
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

  private isTradeAvailable() {
    return this.state.status === 'playing'
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

  private startMatchClock() {
    this.stopMatchClock()
    this.matchClockInterval = setInterval(() => {
      if (this.state.status !== 'playing') return this.stopMatchClock()
      this.updateTurnClock()
      if (this.state.matchSeconds > 0) this.state.matchSeconds -= 1
      if (this.state.matchSeconds === 0) {
        this.state.matchEnding = true
        if (['roll', 'resolve', 'jail'].includes(this.state.turnPhase)) this.finishMatch()
      }
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
      : ['purchase', 'buyback', 'resolve', 'jail', 'world-cup', 'world-tour', 'card-target', 'debt'].includes(phase) ? TURN_DECISION_SECONDS : 0
      return
    }
    if (phase === 'card-target' && this.cardTargetRevealPending) {
      if (this.state.turnSeconds > 1) this.state.turnSeconds -= 1
      else {
        this.cardTargetRevealPending = false
        this.state.turnSeconds = TURN_DECISION_SECONDS
      }
      return
    }
    if (this.state.turnSeconds === 0 || !['roll', 'purchase', 'buyback', 'resolve', 'jail', 'world-cup', 'world-tour', 'card-target', 'debt'].includes(phase)) return
    this.state.turnSeconds -= 1
    if (this.state.turnSeconds > 0) return

    const sessionId = this.state.activePlayerSessionId
    const player = this.state.players.get(sessionId)
    if (!player) return
    const client = { sessionId, send: () => undefined } as unknown as Client
    if (phase === 'roll') this.rollForPlayer(sessionId)
    else if (phase === 'purchase') this.messages.declinePurchase(client)
    else if (phase === 'buyback') this.messages.buyback(client, { accept: false })
    else if (phase === 'resolve') this.messages.finishTurn(client)
    else if (phase === 'jail') this.messages.finishTurn(client)
    else if (phase === 'world-cup') this.chooseDefaultWorldCup(client, sessionId)
    else if (phase === 'world-tour') this.messages.chooseWorldTour(client, { spaceId: this.getWorldTourDefaultDestination(sessionId) })
    else if (phase === 'card-target') {
      this.cardTargetRevealPending = false
      this.state.turnPhase = 'resolve'
      this.state.turnSeconds = TURN_DECISION_SECONDS
      this.turnTimerKey = `${this.state.turnNumber}:${sessionId}:resolve`
      this.state.landingDescription += ' Não houve escolha de alvo; a carta foi descartada.'
      this.finishExpiredPhaseIfReady()
    }
    else {
      this.autoResolveDebt(sessionId)
      if (this.state.turnPhase === 'debt' && this.state.activePlayerSessionId === sessionId) this.state.turnSeconds = TURN_DECISION_SECONDS
    }
  }

  private autoResolveDebt(sessionId: string) {
    const player = this.state.players.get(sessionId)
    if (!player || this.state.turnPhase !== 'debt' || sessionId !== this.state.activePlayerSessionId) return
    const client = { sessionId, send: () => undefined } as unknown as Client
    if (this.canSpend(player, this.state.debtAmount)) {
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
    const returnable = owned.find(([propertyId]) => canReturnPropertyToBank(propertyId, sessionId, holdings))
    if (returnable) this.messages.returnPropertyToBank(client, { propertyId: returnable[0] })
    else this.messages.declareBankruptcy(client)
  }

  private rollForPlayer(sessionId: string, forcedDice?: [number, number], countForExtraRoll = true) {
    const player = this.state.players.get(sessionId)
    if (this.state.status !== 'playing' || this.state.turnPhase !== 'roll' || sessionId !== this.state.activePlayerSessionId || !player || player.isJailed) return
    const diceOne = forcedDice?.[0] ?? randomInt(1, 7)
    const diceTwo = forcedDice?.[1] ?? randomInt(1, 7)
    const rolledDoubles = countForExtraRoll && areDiceDoubles([diceOne, diceTwo])
    this.consecutiveDoubles = rolledDoubles ? this.consecutiveDoubles + 1 : 0
    this.lastRollWasDouble = rolledDoubles && this.consecutiveDoubles < 3
    const startPosition = player.position
    this.state.diceSequence += 1
    this.state.diceOne = diceOne
    this.state.diceTwo = diceTwo
    this.state.pawnMoveMode = 'walk'
    this.state.turnPhase = 'rolling'
    this.state.presentationSpeed = this.state.animationSpeed
    this.state.activeCardTitle = ''
    this.state.activeCardDescription = ''
    this.state.activeCardId = ''
    if (rolledDoubles && this.consecutiveDoubles === 3) {
      this.state.landingDescription = `${player.name} tirou duplas três vezes seguidas e vai direto para a Prisão sem avançar.`
      this.schedulePresentation(getAnimationDuration(DICE_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
        if (this.state.turnPhase !== 'rolling' || this.state.activePlayerSessionId !== sessionId) return
        this.sendToJail(sessionId, player, `${player.name} tirou duplas três vezes seguidas e foi direto para a Prisão.`)
      })
      return
    }
    this.schedulePresentation(getAnimationDuration(DICE_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
      if (this.state.turnPhase !== 'rolling' || this.state.activePlayerSessionId !== sessionId) return
      this.movePlayer(sessionId, player, diceOne + diceTwo)
      this.startPawnMovement(sessionId, player, startPosition)
    })
  }

  private finishExpiredPhaseIfReady() {
    if (this.state.status !== 'playing') return
    if (this.state.mode === 'classic' && this.state.matchEnding && this.state.turnPhase === 'resolve') {
      this.finishMatch()
    }
  }

  private stopClocks() {
    this.stopMatchClock()
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
          bankReturnValue: bankReturnValue(propertyId),
          isBuildable: Boolean(space.buildable),
          completesGroup,
          startingBid: this.state.auctionStartingBid,
          highestBid: this.state.auctionHighestBid,
          cash: this.availableCash(player),
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
    const botCash = this.availableCash(player)

    if (this.state.turnPhase === 'card-target') {
      this.autoResolveCardTarget(client, sessionId)
    } else if (this.state.turnPhase === 'roll') {
      this.messages.roll(client)
    } else if (this.state.turnPhase === 'purchase') {
      const space = boardSpaces[this.state.pendingPropertyId]
      const groupSpaces = space?.kind === 'property' ? boardSpaces.filter((candidate) => candidate.kind === 'property' && candidate.color === space.color) : []
      const completesGroup = groupSpaces.length > 0 && groupSpaces.every((candidate) => candidate.id === this.state.pendingPropertyId || this.state.properties.get(String(candidate.id))?.ownerSessionId === sessionId)
      if (space?.kind === 'property' && shouldBotBuyProperty(space.price ?? 0, botCash, completesGroup, this.state.mode as GameMode)) {
        const reserve = completesGroup ? 50_000 : 150_000
        const houses = space.buildable
          ? [PROPERTY_BUILD_LEVELS, PROPERTY_BUILD_LEVELS - 1, PROPERTY_BUILD_LEVELS - 2, 0].find((count) => botCash - (space.price ?? 0) - count * constructionCost(space.id) >= reserve) ?? 0
          : 0
        this.messages.buy(client, { houses })
      } else this.messages.declinePurchase(client)
    } else if (this.state.turnPhase === 'jail') {
      this.messages.finishTurn(client)
    } else if (this.state.turnPhase === 'world-cup') {
      this.chooseDefaultWorldCup(client, sessionId)
    } else if (this.state.turnPhase === 'world-tour') {
      this.messages.chooseWorldTour(client, { spaceId: this.getWorldTourDefaultDestination(sessionId) })
    } else if (this.state.turnPhase === 'debt') {
      if (this.canSpend(player, this.state.debtAmount)) {
        this.messages.payDebt(client)
        return
      }
      const holdings = this.getHoldings()
      const owned = [...holdings.entries()].filter(([, holding]) => holding.ownerSessionId === sessionId)
      const building = owned.find(([propertyId, holding]) => holding.houses > 0 && canSellBuilding(propertyId, sessionId, holdings))
      if (building) this.messages.sellBuilding(client, { propertyId: building[0] })
      else {
        const returnable = owned.find(([propertyId]) => canReturnPropertyToBank(propertyId, sessionId, holdings))
        if (returnable) this.messages.returnPropertyToBank(client, { propertyId: returnable[0] })
        else this.messages.declareBankruptcy(client)
      }
    } else if (this.state.turnPhase === 'resolve') {
      const holdings = this.getHoldings()
      const propertyId = this.state.pendingPropertyId
      const space = boardSpaces[propertyId]
      const holding = holdings.get(propertyId)
      if (space?.kind === 'property' && holding?.ownerSessionId === sessionId && player.position === propertyId) {
          if (holding.houses === PROPERTY_BUILD_LEVELS && canBuildHotel(propertyId, sessionId, holdings, botCash - 150_000)) {
            this.messages.build(client, { propertyId, hotel: true })
            return
          }
          const targetHouses = [PROPERTY_BUILD_LEVELS, PROPERTY_BUILD_LEVELS - 1, PROPERTY_BUILD_LEVELS - 2]
            .find((target) => target > holding.houses && canBuildProperty(propertyId, sessionId, holdings, botCash - 150_000, target))
          if (targetHouses !== undefined) {
            this.messages.build(client, { propertyId, targetHouses })
            return
          }
        }
        this.messages.finishTurn(client)
    }
  }

  private finishMatch(forcedWinnerSessionId?: string) {
    if (this.state.status === 'ended') return
    this.clearAuction(true)
    this.clearTradeOffer()
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
        : 'Partida encerrada.'
    const tieBreak = winner?.player.tieBreakRoll ? ` Desempate nos dados: ${winner.player.tieBreakRoll}.` : ''
    this.state.landingDescription = winner
      ? `${endingReason} ${winner.player.name} venceu por patrimônio de ${winner.player.finalNetWorth.toLocaleString('pt-BR')}; dinheiro disponível: ${winner.player.finalCash.toLocaleString('pt-BR')}.${tieBreak}`
      : 'A partida terminou sem jogadores solventes.'
  }

  private checkMonopolyVictory(sessionId: string) {
    if (this.state.status !== 'playing' || !this.state.players.has(sessionId)) return false
    const ownership = new Map(Array.from(this.state.properties.entries()).map(([id, property]) => [Number(id), property.ownerSessionId]))
    if (!hasWinningMonopoly(ownership, sessionId)) return false
    const winner = this.state.players.get(sessionId)
    this.finishMatch(sessionId)
    this.state.landingDescription = `${winner?.name ?? 'Jogador'} venceu ao completar um monopólio.`
    return true
  }

  private getAvailablePlayerColor() {
    const assigned = new Set(Array.from(this.state.players.values()).map((player) => player.color))
    return PLAYER_COLORS.find((color) => !assigned.has(color)) ?? PLAYER_COLORS[0]
  }

  private compareScores(first: { player: LobbyPlayerState; netWorth: number }, second: { player: LobbyPlayerState; netWorth: number }) {
    return second.netWorth - first.netWorth
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
      if (bidder && !bidder.devInfiniteCash) this.creditCash(bidder, this.state.auctionHighestBid)
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
      this.creditCash(seller, bid)
      this.clearAuction(false)
      this.state.landingDescription = `${bidder.name} venceu o leilão de ${boardSpaces[propertyId].name} por ${bid.toLocaleString('pt-BR')}.`
      this.checkMonopolyVictory(bidderSessionId)
      return
    }
    this.clearAuction(true)
    this.state.landingDescription = bid > 0
      ? 'O leilão foi encerrado sem transferência; o lance reservado foi devolvido.'
      : 'O leilão terminou sem lances; o imóvel continua com o dono.'
  }

  private advanceTurn() {
    this.consecutiveDoubles = 0
    this.lastRollWasDouble = false
    const endingSessionId = this.state.activePlayerSessionId
    for (const property of this.state.properties.values()) {
      if (property.ownerSessionId !== endingSessionId) continue
      property.blackoutTurns = Math.max(0, property.blackoutTurns - 1)
      property.protectionTurns = Math.max(0, property.protectionTurns - 1)
    }
    this.state.pendingPropertyId = 255
    this.state.pawnMoveMode = 'walk'
    const roomPlayerIds = Array.from(this.state.players.entries()).map(([sessionId]) => sessionId)
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
    this.state.activePlayerSessionId = roomPlayerIds[nextIndex]
    const nextPlayer = this.state.players.get(this.state.activePlayerSessionId)
    this.state.turnNumber += 1
    this.state.turnPhase = nextPlayer?.isJailed ? 'jail' : 'roll'
    this.state.turnSeconds = this.state.turnPhase === 'jail' ? TURN_DECISION_SECONDS : TURN_ROLL_SECONDS
    this.turnTimerKey = `${this.state.turnNumber}:${this.state.activePlayerSessionId}:${this.state.turnPhase}`
    this.state.diceOne = 0
    this.state.diceTwo = 0
    this.state.landingDescription = nextPlayer?.isJailed ? `Você está preso. Este é um dos seus ${nextPlayer.jailTurns} turnos de prisão.` : ''
    this.state.activeCardTitle = ''
    this.state.activeCardDescription = ''
    this.state.activeCardId = ''
    this.state.activeCardId = ''
  }

  private beginCardPayments(actorSessionId: string, payments: { sessionId: string; amount: number; reason: string }[]) {
    this.pendingCardPaymentActorSessionId = actorSessionId
    this.pendingCardPayments = payments.filter(({ sessionId }) => sessionId !== actorSessionId)
    this.resumeCardPayments()
  }

  private resumeCardPayments() {
    const actorSessionId = this.pendingCardPaymentActorSessionId
    const actor = this.state.players.get(actorSessionId)
    if (!actor || actor.isBankrupt || this.state.status !== 'playing') {
      this.pendingCardPaymentActorSessionId = ''
      this.pendingCardPayments = []
      return
    }
    while (this.pendingCardPayments.length) {
      const payment = this.pendingCardPayments.shift()!
      const debtor = this.state.players.get(payment.sessionId)
      if (!debtor || debtor.isBankrupt) continue
      if (this.canSpend(debtor, payment.amount)) {
        this.spendCash(debtor, payment.amount)
        this.creditCash(actor, payment.amount)
        continue
      }
      this.state.activePlayerSessionId = payment.sessionId
      this.state.turnPhase = 'debt'
      this.state.turnSeconds = TURN_DECISION_SECONDS
      this.turnTimerKey = `${this.state.turnNumber}:${payment.sessionId}:debt`
      this.state.debtAmount = payment.amount
      this.state.debtCreditorSessionId = actorSessionId
      this.state.debtReason = payment.reason
      this.state.landingDescription += ` ${debtor.name} deve ${payment.amount.toLocaleString('pt-BR')} por uma carta. Venda construções ou devolva imóveis ao banco para pagar.`
      return
    }
    this.pendingCardPaymentActorSessionId = ''
    this.state.activePlayerSessionId = actorSessionId
    this.state.turnPhase = 'resolve'
    this.state.turnSeconds = TURN_DECISION_SECONDS
    this.turnTimerKey = `${this.state.turnNumber}:${actorSessionId}:resolve`
    this.finishExpiredPhaseIfReady()
  }

  private autoResolveCardTarget(client: Client, sessionId: string) {
    const card = EVENT_CARDS.find((candidate) => candidate.id === this.state.activeCardId)
    if (!card) return
    const players = Array.from(this.state.players.entries()).filter(([, player]) => !player.isBankrupt)
    const properties = Array.from(this.state.properties.entries()).map(([id, property]) => [Number(id), property] as const)
    if (card.effect.kind === 'generous') {
      const property = properties.find(([, holding]) => holding.ownerSessionId === sessionId && holding.protectionTurns === 0)
      const recipient = players.find(([id]) => id !== sessionId)
      if (property && recipient) this.messages.resolveCardTarget(client, { propertyId: property[0], targetSessionId: recipient[0] })
    } else if (card.effect.kind === 'blackout' || card.effect.kind === 'earthquake') {
      const property = properties.find(([id, holding]) => holding.ownerSessionId !== '' && holding.ownerSessionId !== sessionId && holding.houses !== PROPERTY_HOTEL_LEVEL && holding.protectionTurns === 0)
      if (property) this.messages.resolveCardTarget(client, { propertyId: property[0], targetSessionId: property[1].ownerSessionId })
    } else if (card.effect.kind === 'thief') {
      const target = players.find(([id]) => id !== sessionId)
      if (target) this.messages.resolveCardTarget(client, { targetSessionId: target[0] })
    } else if (card.effect.kind === 'protection') {
      const property = properties.find(([, holding]) => holding.ownerSessionId === sessionId)
      if (property) this.messages.resolveCardTarget(client, { propertyId: property[0] })
    } else if (card.effect.kind === 'swap') {
      const first = players[0]
      const second = players.find(([id]) => id !== first?.[0])
      if (first && second) this.messages.resolveCardTarget(client, { targetSessionId: first[0], secondSessionId: second[0] })
    }
    if (this.state.turnPhase === 'card-target') {
      this.state.turnPhase = 'resolve'
      this.state.landingDescription += ' Não havia alvo válido; a carta foi descartada.'
    }
  }

  private resolveEventCard(sessionId: string, player: LobbyPlayerState) {
    const card = this.drawEventCard()
    this.state.activeCardTitle = card.title
    this.state.activeCardDescription = card.description
    this.state.activeCardId = card.id
    this.state.landingDescription = card.description

    if (['generous', 'blackout', 'earthquake', 'thief', 'protection', 'swap'].includes(card.effect.kind)) {
      this.state.turnPhase = 'card-target'
      this.cardTargetRevealPending = !player.isBot && !player.isBotControlled && player.isConnected
      this.state.turnSeconds = TURN_DECISION_SECONDS
      this.turnTimerKey = `${this.state.turnNumber}:${sessionId}:card-target`
      return
    }
    if (card.effect.kind === 'birthday') {
      const amount = card.effect.amount
      const payments = Array.from(this.state.players.entries())
        .filter(([id, other]) => id !== sessionId && !other.isBankrupt)
        .map(([id]) => ({ sessionId: id, amount, reason: 'Aniversário' }))
      this.beginCardPayments(sessionId, payments)
    } else if (card.effect.kind === 'jail') {
      this.sendToJail(sessionId, player, `${card.description} Sua peça foi enviada à prisão por três turnos.`)
    } else if (card.effect.kind === 'world-tour') {
      const distance = (30 - player.position + boardSpaces.length) % boardSpaces.length
      if (distance > 0) this.movePlayer(sessionId, player, distance)
      this.startCardTeleport(sessionId, player, 30, 'Carta Volta ao Brasil: chegada ao canto. Escolha seu destino.')
    } else if (card.effect.kind === 'world-cup') {
      const distance = (20 - player.position + boardSpaces.length) % boardSpaces.length
      if (distance > 0) this.movePlayer(sessionId, player, distance)
      this.startCardTeleport(sessionId, player, 20, 'Carta Sede da Copa: chegada ao canto.')
    } else if (card.effect.kind === 'world-cup-city') {
      const venueId = this.state.worldCupSpaceId
      if (venueId === 255 || boardSpaces[venueId]?.kind !== 'property') {
        this.state.landingDescription = `${card.description} Não há uma cidade-sede ativa; nada acontece.`
        return
      }
      const distance = (venueId - player.position + boardSpaces.length) % boardSpaces.length
      if (distance > 0) this.movePlayer(sessionId, player, distance)
      this.startCardTeleport(sessionId, player, venueId, `Carta Cidade-sede: chegada a ${boardSpaces[venueId].name}.`)
    } else if (card.effect.kind === 'start') {
      player.position = 0
      this.creditCash(player, START_BONUS)
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = `${card.description} Você recebeu R$ ${START_BONUS.toLocaleString('pt-BR')}.`
    }
  }

  private drawEventCard() {
    return EVENT_CARDS[randomInt(EVENT_CARDS.length)]
  }

  private startCardTeleport(sessionId: string, player: LobbyPlayerState, destinationId: number, description: string) {
    player.position = destinationId
    this.state.pawnMoveMode = 'teleport'
    this.state.turnPhase = 'moving'
    this.state.landingDescription = description
    this.state.presentationSpeed = this.state.animationSpeed
    this.schedulePresentation(getAnimationDuration(PAWN_TELEPORT_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
      if (this.state.turnPhase !== 'moving' || this.state.activePlayerSessionId !== sessionId || player.position !== destinationId) return
      this.state.pawnMoveMode = 'walk'
      this.resolveSpace(sessionId, player, false, description)
      this.finishExpiredPhaseIfReady()
    })
  }

  private availableCash(player: LobbyPlayerState) {
    return player.devInfiniteCash ? MAX_SCHEMA_CASH : player.cash
  }

  private canSpend(player: LobbyPlayerState, amount: number) {
    return player.devInfiniteCash || player.cash >= amount
  }

  private spendCash(player: LobbyPlayerState, amount: number) {
    if (!player.devInfiniteCash) player.cash -= amount
  }

  private cashAfterTransfer(player: LobbyPlayerState, amountPaid: number, amountReceived: number) {
    return player.cash - (player.devInfiniteCash ? 0 : amountPaid) + amountReceived
  }

  private creditCash(player: LobbyPlayerState, amount: number) {
    player.cash = Math.min(MAX_SCHEMA_CASH, player.cash + amount)
  }

  private collectPayment(debtorSessionId: string, debtor: LobbyPlayerState, amount: number, creditorSessionId: string, reason: string) {
    if (this.canSpend(debtor, amount)) {
      this.spendCash(debtor, amount)
      const creditor = this.state.players.get(creditorSessionId)
      if (creditor && !creditor.isBankrupt) this.creditCash(creditor, amount)
      this.state.landingDescription += ` ${reason}: ${amount.toLocaleString('pt-BR')} pagos${creditor ? ` a ${creditor.name}` : ' ao banco'}.`
      return
    }
    this.state.debtAmount = amount
    this.state.debtCreditorSessionId = creditorSessionId
    this.state.debtReason = reason
    this.state.turnPhase = 'debt'
    this.clearAuction(true)
    const creditor = this.state.players.get(creditorSessionId)
    this.state.landingDescription += ` Dívida de ${amount.toLocaleString('pt-BR')} ${creditor ? `com ${creditor.name}` : 'com o banco'}. Venda construções ou devolva imóveis ao banco para pagar.`
  }

  private offerBuybackAfterRent(sessionId: string, propertyId: number) {
    const buyer = this.state.players.get(sessionId)
    const property = this.state.properties.get(String(propertyId))
    const space = boardSpaces[propertyId]
    const owner = property?.ownerSessionId ? this.state.players.get(property.ownerSessionId) : undefined
    if (!buyer || !property || !space || space.kind !== 'property' || !owner || owner.isBankrupt || property.ownerSessionId === sessionId || property.houses === PROPERTY_HOTEL_LEVEL) return false

    const price = forcedBuybackCost(propertyId, property.houses)
    if (!this.canSpend(buyer, price) || owner.cash + price > MAX_SCHEMA_CASH) return false

    this.state.pendingPropertyId = propertyId
    this.state.turnPhase = 'buyback'
    this.state.turnSeconds = TURN_DECISION_SECONDS
    this.turnTimerKey = `${this.state.turnNumber}:${sessionId}:buyback`
    this.state.landingDescription += ` Aluguel quitado. Você ainda pode recomprar ${space.name} por ${price.toLocaleString('pt-BR')} (1,5× o investimento).`
    return true
  }

  private movePlayer(sessionId: string, player: LobbyPlayerState, spaces: number) {
    const previousPosition = player.position
    player.position = movePosition(player.position, [spaces, 0])
    if (player.position < previousPosition) {
      this.creditCash(player, START_BONUS)
    }
  }

  private getWorldCupDefaultPropertyId(sessionId: string) {
    return boardSpaces
      .filter((space) => space.kind === 'property' && this.state.properties.get(String(space.id))?.ownerSessionId === sessionId)
      .sort((first, second) => (second.price ?? 0) - (first.price ?? 0))[0]?.id ?? -1
  }

  private chooseDefaultWorldCup(client: Client, sessionId: string) {
    const propertyId = this.getWorldCupDefaultPropertyId(sessionId)
    if (propertyId < 0) {
      this.state.turnPhase = 'resolve'
      this.state.landingDescription += ' Você não possui propriedades para sediar a Copa; não há uma sede disponível.'
      this.finishExpiredPhaseIfReady()
      return
    }
    this.messages.chooseWorldCup(client, { propertyId })
  }

  private getWorldTourDefaultDestination(sessionId: string) {
    const player = this.state.players.get(sessionId)
    const eligible = boardSpaces.filter((space) => {
      if (space.id === 30 || space.id === player?.position) return false
      if (space.kind !== 'property') return true
      const ownerSessionId = this.state.properties.get(String(space.id))?.ownerSessionId
      return !ownerSessionId || ownerSessionId === sessionId
    })
    return eligible
      .filter((space) => space.kind === 'property')
      .sort((first, second) => (second.price ?? 0) - (first.price ?? 0))[0]?.id
      ?? eligible.find((space) => space.kind !== 'property')?.id
      ?? 0
  }

  private sendToJail(sessionId: string, player: LobbyPlayerState, description: string) {
    player.position = 10
    player.isJailed = true
    player.jailTurns = JAIL_TURNS
    this.state.pendingPropertyId = 255
    this.state.turnPhase = 'moving'
    this.state.pawnMoveMode = 'teleport'
    this.state.landingDescription = description
    this.state.presentationSpeed = this.state.animationSpeed
    this.schedulePresentation(getAnimationDuration(PAWN_TELEPORT_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
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
    if (!drawEvent) {
      this.state.activeCardTitle = ''
      this.state.activeCardDescription = ''
      this.state.activeCardId = ''
    }
    if (space.kind === 'property') {
      const property = this.state.properties.get(String(space.id))
      if (!property?.ownerSessionId) {
        this.state.pendingPropertyId = space.id
        this.state.turnPhase = 'purchase'
      } else if (property.ownerSessionId === sessionId && space.buildable) {
        this.state.pendingPropertyId = space.id
      } else if (property.ownerSessionId !== this.state.activePlayerSessionId) {
        const owner = this.state.players.get(property.ownerSessionId)
        const ownership = new Map(Array.from(this.state.properties.entries()).map(([id, item]) => [Number(id), item.ownerSessionId]))
        const rent = calculateRent(space.id, ownership, property.houses, this.state.worldCupSpaceId)
        if (owner && property.blackoutTurns > 0 && property.houses !== PROPERTY_HOTEL_LEVEL) {
          this.state.landingDescription += ` ${space.name} está em apagão; não há aluguel por ${property.blackoutTurns} turno(s) do dono.`
        } else if (owner) {
          const amount = space.company
            ? calculateCompanyRent(ownership, property.ownerSessionId) * (space.id === this.state.worldCupSpaceId ? 3 : 1)
            : rent
          const reason = space.company ? 'Aluguel da companhia' : 'Aluguel'
          if (property.houses !== PROPERTY_HOTEL_LEVEL) this.state.pendingPropertyId = space.id
          this.collectPayment(sessionId, player, amount, property.ownerSessionId, reason)
          const debtOpened = (this.state as LobbyState).turnPhase === 'debt'
          if (!debtOpened && property.houses !== PROPERTY_HOTEL_LEVEL) {
            if (!this.offerBuybackAfterRent(sessionId, space.id)) this.state.pendingPropertyId = 255
          } else if (!debtOpened) {
            this.state.pendingPropertyId = 255
          }
        }
      }
    } else if (space.kind === 'tax') {
      const ownedProperties = Array.from(this.state.properties.values()).filter((property) => property.ownerSessionId === sessionId).length
      const tax = taxForSpace(space.id, ownedProperties)
      this.collectPayment(sessionId, player, tax, '', 'Taxa')
    } else if (space.kind === 'prison') {
      player.isJailed = true
      player.jailTurns = JAIL_TURNS
      this.state.landingDescription = `${describeLanding(space.id)} Você perderá os próximos três turnos.`
    } else if (space.kind === 'world-cup') {
      this.state.landingDescription = describeLanding(space.id)
      if (this.getWorldCupDefaultPropertyId(sessionId) < 0) {
        this.state.turnPhase = 'resolve'
        this.state.landingDescription += ' Você não possui propriedades para sediar a Copa; não há uma sede disponível.'
      } else {
        this.state.turnPhase = 'world-cup'
        this.state.landingDescription += ' Escolha uma propriedade sua para sediar o evento.'
      }
    } else if (space.kind === 'world-tour') {
      this.creditCash(player, START_BONUS)
      this.state.turnPhase = 'world-tour'
      this.state.landingDescription = `${describeLanding(space.id)} Você recebeu R$ ${START_BONUS.toLocaleString('pt-BR')}. Escolha sua próxima casa.`
    } else if (space.kind === 'event' && drawEvent) {
      this.resolveEventCard(sessionId, player)
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
    this.state.presentationSpeed = this.state.animationSpeed
    this.schedulePresentation(Math.max(1, steps) * getAnimationDuration(PAWN_STEP_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
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
