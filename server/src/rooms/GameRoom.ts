import { randomInt } from 'node:crypto'
import { CloseCode, Client, Room } from '@colyseus/core'
import { MAX_ROOM_PLAYERS, type GameMode } from '../../../shared/lobby.js'
import { isCharacterType, isGameMode, normalizePlayerName } from '../../../shared/lobby.js'
import { AUCTION_ACCEPT_SECONDS, AUCTION_BID_SECONDS, AUCTION_MIN_BID_INCREMENT, CLASSIC_MATCH_SECONDS, DEFAULT_ANIMATION_SPEED, DICE_ANIMATION_DURATION_MS, MATCH_DURATIONS, PAWN_STEP_ANIMATION_DURATION_MS, PAWN_TELEPORT_ANIMATION_DURATION_MS, PROPERTY_BUILD_LEVELS, PROPERTY_HOTEL_LEVEL, START_BONUS, TURN_ROLL_SECONDS, applyRentMultiplier, areDiceDoubles, bankReturnValue, buildingSaleValue, calculateCompanyRent, calculateNetWorth, calculateRent, canBuildHotel, canBuildLevelAfterFirstLap, canBuildProperty, canReturnPropertyToBank, canSellBuilding, chooseFestivalCityIds, constructionCost, describeLanding, divideBalances, forcedBuybackCost, getAnimationDuration, getMonopolyWinReason, getWorldCupRentMultiplier, hasLiquidatableAssets, hotelConstructionCost, isAnimationSpeed, isMatchDuration, movePosition, taxForSpace, type MatchEndReason } from '../../../shared/game.js'
import { boardSpaces } from '../../../shared/board.js'
import { CARD_REVEAL_SECONDS, CARD_TARGET_SECONDS } from '../../../shared/game.js'
import { PLAYER_COLORS, isPlayerColor } from '../../../shared/playerColors.js'
import { isPlayerEmote } from '../../../shared/playerEmotes.js'
import { isThrowableObject, THROW_COOLDOWN_MS } from '../../../shared/throwables.js'
import { EVENT_CARDS } from '../../../shared/cards.js'
import { LobbyPlayerState, LobbyState, PropertyState } from './schema/LobbyState.js'
import { chooseBotAuctionBid, shouldBotBuyback, shouldBotBuyProperty } from './botStrategy.js'

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 5
const ROOM_CODES_CHANNEL = '$banco-imobiliario-room-codes'
const MAX_SCHEMA_CASH = 2_147_483_647
const RECONNECTION_WINDOW_SECONDS = 24 * 60 * 60
const BOT_TICK_MS = 1_000

function createRoomCode() {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)]).join('')
}

export class GameRoom extends Room<{ state: LobbyState }> {
  // Keep transport capacity for reconnecting sockets while the game still has six seats.
  maxClients = MAX_ROOM_PLAYERS * 4
  state = new LobbyState()
  private auctionInterval?: ReturnType<typeof setInterval>
  private matchClockInterval?: ReturnType<typeof setInterval>
  private turnClockInterval?: ReturnType<typeof setInterval>
  private botControllerInterval?: ReturnType<typeof setInterval>
  private reconnectRetentionTimer?: ReturnType<typeof setTimeout>
  private auctionSequence = 0
  private botSequence = 0
  private throwSequence = 0
  private throwCooldowns = new Map<string, number>()
  private reconnectedSessionIds = new Map<string, string>()
  private droppedControllerSessionIds = new Map<string, string>()
  private supersededClientSessionIds = new Set<string>()
  private lastActivity = new Map<string, number>()
  private watchdogTicks = 0
  private turnTimerKey = ''
  private presentationTimers = new Set<ReturnType<typeof setTimeout>>()
  private pendingCardPayments: { sessionId: string; amount: number; reason: string }[] = []
  private pendingCardPaymentActorSessionId = ''
  private cardTargetRevealPending = false
  private devNextEventCardId = ''
  private consecutiveDoubles = 0
  private lastRollWasDouble = false
  private autoFinishKey = ''
  private pendingCompanyRent: { sessionId: string; ownerSessionId: string; spaceId: number; rentPerPip: number } | null = null

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
    const name = normalizePlayerName(options.name)
    if (!name) return false
    if (this.state.status === 'waiting') {
      const returning = Array.from(this.state.players.values()).filter((player) => !player.isBot && !player.isConnected && player.name === name)
      return returning.length === 1 || this.state.players.size < MAX_ROOM_PLAYERS
    }
    if (this.state.status !== 'playing') return false
    return Array.from(this.state.players.values()).filter((player) => !player.isBot && !player.isConnected && player.name === name).length === 1
  }

  onJoin(client: Client, options: { name: string }) {
    const name = normalizePlayerName(options.name) ?? 'Jogador'
    if (this.state.status === 'waiting') {
      const matches = Array.from(this.state.players.entries()).filter(([, candidate]) => !candidate.isBot && !candidate.isConnected && candidate.name === name)
      if (matches.length === 1) {
        const [sessionId, returningPlayer] = matches[0]!
        const previousControllerId = this.droppedControllerSessionIds.get(sessionId)
        if (previousControllerId) this.supersededClientSessionIds.add(previousControllerId)
        this.droppedControllerSessionIds.delete(sessionId)
        this.reconnectedSessionIds.set(client.sessionId, sessionId)
        returningPlayer.isConnected = true
        returningPlayer.reconnectionExpired = false
        returningPlayer.controllerSessionId = client.sessionId
        return
      }
    }
    if (this.state.status === 'playing') {
      const matches = Array.from(this.state.players.entries()).filter(([, candidate]) => !candidate.isBot && !candidate.isConnected && candidate.name === name)
      if (matches.length !== 1) return
      const [sessionId, returningPlayer] = matches[0]!
      const previousControllerId = this.droppedControllerSessionIds.get(sessionId)
      if (previousControllerId) this.supersededClientSessionIds.add(previousControllerId)
      this.droppedControllerSessionIds.delete(sessionId)
      this.reconnectedSessionIds.set(client.sessionId, sessionId)
      this.clearReconnectRetention()
      this.autoDispose = true
      returningPlayer.isConnected = true
      returningPlayer.reconnectionExpired = false
      returningPlayer.isInactive = false
      this.lastActivity.set(sessionId, Date.now())
      returningPlayer.isBotControlled = false
      returningPlayer.controllerSessionId = client.sessionId
      return
    }
    const player = new LobbyPlayerState()
    player.name = name
    player.isHost = this.state.players.size === 0
    player.isConnected = true
    player.reconnectionExpired = false
    player.isBot = false
    player.isBotControlled = false
    player.controllerSessionId = client.sessionId
    player.color = this.getAvailablePlayerColor()
    this.state.players.set(this.getPlayerSessionId(client), player)
  }

  messages = {
    setMatchOption: (client: Client, payload: { key?: unknown; value?: unknown }) => {
      const player = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'waiting' || !player?.isHost || player.controllerSessionId !== client.sessionId) return
      const options = {
        cupInitialMultiplier: [1, 1.5, 2, 2.5, 3, 4, 5], festivalMultiplier: [1, 1.5, 2, 2.5, 3, 4, 5],
        festivalCount: [0, 1, 2, 3, 4, 5, 6], startingCash: [500000, 1000000, 1500000, 2000000, 3000000, 5000000],
        jailTurnLimit: [1, 2, 3, 4, 5], decisionSeconds: [10, 15, 20, 30, 45, 60],
      } as const
      const key = payload?.key
      const value = payload?.value
      if (typeof key !== 'string' || !Object.hasOwn(options, key) || typeof value !== 'number' || !(options[key as keyof typeof options] as readonly number[]).includes(value)) return
      this.state[key as keyof typeof options] = value
    },
    activity: (client: Client) => {
      const id = this.getPlayerSessionId(client)
      const player = this.state.players.get(id)
      if (this.state.status !== 'playing' || !player || player.isBot || !player.isConnected || player.controllerSessionId !== client.sessionId) return
      this.lastActivity.set(id, Date.now())
      if (player.isInactive) { player.isInactive = false; player.isBotControlled = false }
    },
    emote: (client: Client, payload: { emote?: unknown }) => {
      const player = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'playing' || !player || player.isBot || player.isBankrupt || !isPlayerEmote(payload?.emote)) {
        client.send('room:error', { message: 'Esse emote não está disponível agora.' })
        return
      }
      this.broadcast('game:emote', { sessionId: this.getPlayerSessionId(client), emote: payload.emote })
    },
    throwObject: (client: Client, payload: { targetSessionId?: unknown; object?: unknown }) => {
      const thrower = this.state.players.get(this.getPlayerSessionId(client))
      const targetSessionId = payload?.targetSessionId
      const target = typeof targetSessionId === 'string' ? this.state.players.get(targetSessionId) : undefined
      if (this.state.status !== 'playing' || !thrower || thrower.isBot || thrower.isBankrupt || !target || targetSessionId === this.getPlayerSessionId(client) || target.isBankrupt || !isThrowableObject(payload?.object)) {
        client.send('room:error', { message: 'Esse lançamento não está disponível para esse participante.' })
        return
      }

      const cooldownKey = `${this.getPlayerSessionId(client)}:${targetSessionId}`
      const now = Date.now()
      const lastThrowAt = this.throwCooldowns.get(cooldownKey) ?? 0
      if (now - lastThrowAt < THROW_COOLDOWN_MS) {
        client.send('room:error', { message: 'Aguarde o fim do intervalo antes de lançar outro objeto nesse participante.' })
        return
      }

      this.throwCooldowns.set(cooldownKey, now)
      this.broadcast('game:throw', {
        id: ++this.throwSequence,
        fromSessionId: this.getPlayerSessionId(client),
        toSessionId: targetSessionId,
        object: payload.object,
      })
    },
    setCharacter: (client: Client, payload: { characterType?: unknown }) => {
      const player = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'waiting' || !player || player.isBot || !isCharacterType(payload?.characterType)) {
        client.send('room:error', { message: 'Escolha uma ficha válida enquanto a sala ainda está no lobby.' })
        return
      }
      player.characterType = payload.characterType
    },
    setPlayerColor: (client: Client, payload: { color?: unknown }) => {
      const player = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'waiting' || !player || player.isBot || !isPlayerColor(payload?.color)) {
        client.send('room:error', { message: 'Escolha uma cor disponível enquanto a sala ainda está no lobby.' })
        return
      }
      if (Array.from(this.state.players.entries()).some(([sessionId, other]) => sessionId !== this.getPlayerSessionId(client) && other.color === payload.color)) {
        client.send('room:error', { message: 'Essa cor já foi escolhida por outra pessoa.' })
        return
      }
      player.color = payload.color
    },
    setReady: (client: Client, payload: { ready?: unknown }) => {
      const player = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'waiting' || !player || player.isBot || typeof payload?.ready !== 'boolean') {
        client.send('room:error', { message: 'Só participantes no lobby podem alterar o estado de prontidão.' })
        return
      }
      player.isReady = payload.ready
    },
    setMatchDuration: (client: Client, payload: { duration?: unknown }) => {
      const requester = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'waiting' || !requester?.isHost || !isMatchDuration(payload?.duration)) {
        client.send('room:error', { message: 'Só a pessoa anfitriã pode escolher a duração da partida no lobby.' })
        return
      }
      this.state.matchDuration = payload.duration
    },
    setAnimationSpeed: (client: Client, payload: { speed?: unknown }) => {
      const requester = this.state.players.get(this.getPlayerSessionId(client))
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
      const requester = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'waiting' || !requester?.isHost || typeof payload?.enabled !== 'boolean') {
        client.send('room:error', { message: 'Só a pessoa anfitriã pode alterar o modo DEV enquanto a sala está no lobby.' })
        return
      }
      this.state.devToolsEnabled = payload.enabled
    },
    addBot: (client: Client) => {
      const requester = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'waiting' || !requester?.isHost || this.state.players.size >= MAX_ROOM_PLAYERS) {
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
      bot.isReady = true
      bot.isConnected = true
      bot.color = this.getAvailablePlayerColor()
      this.state.players.set(sessionId, bot)
    },
    removeBot: (client: Client, payload: { sessionId?: unknown }) => {
      const requester = this.state.players.get(this.getPlayerSessionId(client))
      const sessionId = typeof payload?.sessionId === 'string' ? payload.sessionId : ''
      const target = this.state.players.get(sessionId)
      if (this.state.status !== 'waiting' || !requester?.isHost || !target?.isBot) {
        client.send('room:error', { message: 'Só a pessoa anfitriã pode remover um bot antes da partida.' })
        return
      }
      this.state.players.delete(sessionId)
    },
    start: (client: Client) => {
      const player = this.state.players.get(this.getPlayerSessionId(client))
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
      if (Array.from(this.state.players.values()).some((candidate) => !candidate.isBot && !candidate.isReady)) {
        client.send('room:error', { message: 'Aguarde todas as pessoas confirmarem que estão prontas.' })
        return
      }

      this.autoDispose = false
      this.state.status = 'playing'
      this.state.presentationSpeed = this.state.animationSpeed
      this.state.properties.clear()
      this.state.festivalSpaceIds = chooseFestivalCityIds(() => randomInt(1_000_000) / 1_000_000, this.state.festivalCount).join(',')
      for (const player of this.state.players.values()) {
        player.position = 0
        player.hasCompletedFirstLap = false
        player.cash = this.state.startingCash
        player.nextRentMultiplier = 1
        player.devInfiniteCash = false
        player.isJailed = false
        player.jailTurns = 0
        player.isBankrupt = false
        player.finalCash = 0
        player.finalNetWorth = 0
        player.tieBreakRoll = 0
      }
      this.state.turnPhase = 'roll'
      const order = this.shuffleTurnOrder(Array.from(this.state.players.keys()))
      this.state.turnOrder = order.join(',')
      this.state.activePlayerSessionId = order[0] ?? ''
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
      this.state.matchEndReason = ''
      this.consecutiveDoubles = 0
      this.lastRollWasDouble = false
      this.clearAuction(false)
      this.startMatchClock()
      this.startBotController()
      this.broadcast('game:started', { mode: this.state.mode })
    },
    roll: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'roll') return
      if (this.getPlayerSessionId(client) !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Aguarde a sua vez para lançar os dados.' })
        return
      }
      if (this.state.players.get(this.getPlayerSessionId(client))?.isJailed) {
        client.send('room:error', { message: 'Escolha como sair da prisão antes de rolar os dados.' })
        return
      }
      this.rollForPlayer(this.getPlayerSessionId(client))
    },
    rollCompany: (client: Client) => {
      const pending = this.pendingCompanyRent
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'company-roll' || !pending || this.getPlayerSessionId(client) !== pending.sessionId || this.state.activePlayerSessionId !== pending.sessionId) return
      this.pendingCompanyRent = null
      const die = randomInt(1, 7)
      this.state.diceSequence += 1
      this.state.diceOne = die
      this.state.diceTwo = 0
      this.state.turnPhase = 'rolling'
      this.state.presentationSpeed = this.state.animationSpeed
      this.schedulePresentation(getAnimationDuration(DICE_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
        if (this.state.turnPhase !== 'rolling' || this.state.activePlayerSessionId !== pending.sessionId) return
        const player = this.state.players.get(pending.sessionId)
        if (!player) return
        const cupMultiplier = pending.spaceId === this.state.worldCupSpaceId ? getWorldCupRentMultiplier(this.state.worldCupHostCount, this.state.cupInitialMultiplier) : 1
        const amount = applyRentMultiplier(Math.floor(pending.rentPerPip * die * cupMultiplier), player.nextRentMultiplier)
        player.nextRentMultiplier = 1
        this.state.turnPhase = 'resolve'
        this.state.landingDescription = `${boardSpaces[pending.spaceId].name}: D6 ${die}, aluguel ${amount.toLocaleString('pt-BR')}.`
        this.collectPayment(pending.sessionId, player, amount, pending.ownerSessionId, 'Aluguel da companhia')
        if (this.state.turnPhase !== 'debt' && !(this.state.properties.get(String(pending.spaceId))?.ownerSessionId === pending.ownerSessionId && this.offerBuybackAfterRent(pending.sessionId, pending.spaceId))) this.state.pendingPropertyId = 255
        this.finishExpiredPhaseIfReady()
      })
    },
    devRoll: (client: Client, payload: { diceOne?: unknown; diceTwo?: unknown } = {}) => {
      const requester = this.state.players.get(this.getPlayerSessionId(client))
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
    devSetNextEventCard: (client: Client, payload: { cardId?: unknown } = {}) => {
      const requester = this.state.players.get(this.getPlayerSessionId(client))
      if (!requester?.isHost || !this.state.devToolsEnabled) {
        client.send('room:error', { message: 'A preparação de cartas está desativada ou disponível apenas para a pessoa anfitriã.' })
        return
      }
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'roll') {
        client.send('room:error', { message: 'Só é possível preparar uma carta durante a etapa de rolagem.' })
        return
      }
      const card = EVENT_CARDS.find((candidate) => candidate.id === payload?.cardId)
      if (!card) {
        client.send('room:error', { message: 'Escolha uma carta Sorte ou Revés válida.' })
        return
      }
      this.devNextEventCardId = card.id
      client.send('game:dev-card-armed', { cardId: card.id })
    },
    devTeleport: (client: Client, payload: { spaceId?: unknown } = {}) => {
      const requester = this.state.players.get(this.getPlayerSessionId(client))
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
      const requester = this.state.players.get(this.getPlayerSessionId(client))
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
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'purchase' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId) return
      const player = this.state.players.get(this.getPlayerSessionId(client))
      const space = boardSpaces[this.state.pendingPropertyId]
      const houses = payload?.houses === undefined ? 0 : payload.houses
      if (!player || !space || space.kind !== 'property' || typeof space.price !== 'number' || typeof houses !== 'number' || !Number.isInteger(houses) || houses < 0 || houses > PROPERTY_BUILD_LEVELS || (houses > 0 && !space.buildable)) {
        client.send('room:error', { message: 'Escolha terreno ou até três casas para um imóvel residencial.' })
        return
      }
      if (!canBuildLevelAfterFirstLap(player.hasCompletedFirstLap, houses)) {
        client.send('room:error', { message: 'A terceira casa fica indisponível até você completar uma volta pela Partida.' })
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
      property.ownerSessionId = this.getPlayerSessionId(client)
      property.houses = houses
      this.state.properties.set(String(space.id), property)
      this.state.pendingPropertyId = 255
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = houses
        ? `${space.name} comprada com ${houses} ${houses === 1 ? 'casa' : 'casas'} por ${totalCost.toLocaleString('pt-BR')}.`
        : `${space.name} comprada por ${space.price.toLocaleString('pt-BR')}.`
      this.checkMonopolyVictory(this.getPlayerSessionId(client))
      this.finishExpiredPhaseIfReady()
    },
    declinePurchase: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'purchase' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId) return
      const space = boardSpaces[this.state.pendingPropertyId]
      this.state.pendingPropertyId = 255
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = space ? `${space.name} continua sem dono. Você escolheu não comprar.` : 'Você escolheu não comprar; a propriedade continua livre.'
      this.finishExpiredPhaseIfReady()
    },
    buyback: (client: Client, payload: { accept?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'buyback' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId || typeof payload?.accept !== 'boolean') return
      const buyer = this.state.players.get(this.getPlayerSessionId(client))
      const propertyId = this.state.pendingPropertyId
      const property = this.state.properties.get(String(propertyId))
      const space = boardSpaces[propertyId]
      if (!buyer || !property || !space || space.kind !== 'property' || !property.ownerSessionId || property.ownerSessionId === this.getPlayerSessionId(client)) return
      const owner = this.state.players.get(property.ownerSessionId)
      if (payload.accept && (property.houses === PROPERTY_HOTEL_LEVEL || space.company)) {
        client.send('room:error', { message: 'Hotéis e companhias não podem ser recomprados.' })
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
        property.ownerSessionId = this.getPlayerSessionId(client)
        this.state.landingDescription += ` ${space.name} recomprada por ${price.toLocaleString('pt-BR')}; o valor integral da recompra foi pago ao antigo proprietário.`
        if (this.checkMonopolyVictory(this.getPlayerSessionId(client))) return
        this.state.pendingPropertyId = propertyId
        if (space.buildable && this.canImproveOwnedProperty(this.getPlayerSessionId(client), propertyId)) {
          this.state.turnPhase = 'buyback-upgrade'
          this.state.turnSeconds = this.state.decisionSeconds
          this.turnTimerKey = `${this.state.turnNumber}:${this.getPlayerSessionId(client)}:buyback-upgrade`
          return
        }
      } else {
        this.state.landingDescription += ' Você escolheu continuar sem recomprar; o aluguel já foi pago.'
      }
      this.state.pendingPropertyId = payload.accept ? propertyId : 255
      const debtOpened = (this.state as LobbyState).turnPhase === 'debt'
      if (!debtOpened) this.state.turnPhase = 'resolve'
      this.finishExpiredPhaseIfReady()
    },
    startUpgrade: (client: Client, payload: { accept?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'start-upgrade' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId || typeof payload?.accept !== 'boolean') return
      const player = this.state.players.get(this.getPlayerSessionId(client))
      const propertyId = this.state.pendingPropertyId
      const property = this.state.properties.get(String(propertyId))
      const space = boardSpaces[propertyId]
      if (!player || !property || !space?.buildable || property.ownerSessionId !== this.getPlayerSessionId(client) || property.houses >= PROPERTY_HOTEL_LEVEL) return
      if (payload.accept) {
        if (!canBuildLevelAfterFirstLap(player.hasCompletedFirstLap, property.houses + 1)) {
          client.send('room:error', { message: 'A terceira casa fica indisponível até você completar uma volta pela Partida.' })
          return
        }
        const cost = property.houses === PROPERTY_BUILD_LEVELS ? hotelConstructionCost(propertyId) : constructionCost(propertyId)
        if (!this.canSpend(player, cost)) {
          client.send('room:error', { message: `A melhoria custa ${cost.toLocaleString('pt-BR')}; seu saldo é insuficiente.` })
          return
        }
        this.spendCash(player, cost)
        property.houses = property.houses === PROPERTY_BUILD_LEVELS ? PROPERTY_HOTEL_LEVEL : property.houses + 1
        this.state.landingDescription = `Você parou exatamente na Partida e melhorou ${space.name} por ${cost.toLocaleString('pt-BR')}.`
      } else {
        this.state.landingDescription = `Você parou exatamente na Partida e recusou a melhoria paga de ${space.name}.`
      }
      this.state.pendingPropertyId = 255
      this.state.turnPhase = 'resolve'
      this.finishExpiredPhaseIfReady()
    },
    build: (client: Client, payload: { propertyId?: unknown; targetHouses?: unknown; hotel?: unknown }) => {
      if (this.state.status !== 'playing' || !['resolve', 'buyback-upgrade'].includes(this.state.turnPhase) || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId) return
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(this.getPlayerSessionId(client))
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
      const landedHere = this.state.pendingPropertyId === propertyId && player?.position === propertyId
      if (!player || !property || property.ownerSessionId !== this.getPlayerSessionId(client) || !landedHere) {
        client.send('room:error', { message: 'Só é possível construir ao cair no próprio terreno.' })
        return
      }
      const targetLevel = payload.hotel === true ? PROPERTY_HOTEL_LEVEL : payload.targetHouses
      if (typeof targetLevel === 'number' && !canBuildLevelAfterFirstLap(player.hasCompletedFirstLap, targetLevel)) {
        client.send('room:error', { message: 'A terceira casa e o hotel ficam indisponíveis até você completar uma volta pela Partida.' })
        return
      }
      const space = boardSpaces[propertyId]
      if (payload.hotel === true) {
        if (!canBuildHotel(propertyId, this.getPlayerSessionId(client), holdings, this.availableCash(player))) {
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
        if (typeof targetHouses !== 'number' || !Number.isInteger(targetHouses) || !canBuildProperty(propertyId, this.getPlayerSessionId(client), holdings, this.availableCash(player), targetHouses)) {
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
      this.state.turnPhase = 'resolve'
      this.finishExpiredPhaseIfReady()
    },
    sellBuilding: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || !['resolve', 'debt'].includes(this.state.turnPhase) || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId) return
      if (this.state.turnPhase === 'debt' && this.state.players.get(this.getPlayerSessionId(client)) && this.canSpend(this.state.players.get(this.getPlayerSessionId(client))!, this.state.debtAmount)) {
        client.send('room:error', { message: 'Seu saldo já cobre a dívida; liquide bens apenas quando precisar completar o pagamento.' })
        return
      }
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(this.getPlayerSessionId(client))
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
      if (!player || !property || !canSellBuilding(propertyId, this.getPlayerSessionId(client), holdings)) {
        client.send('room:error', { message: 'Escolha uma construção própria que ainda possa ser vendida.' })
        return
      }
      const previousLevel = property.houses
      this.state.presentationSpeed = this.state.animationSpeed
      const amount = buildingSaleValue(propertyId, previousLevel)
      property.houses -= 1
      this.creditCash(player, amount)
      this.state.landingDescription = `${previousLevel === PROPERTY_HOTEL_LEVEL ? 'Hotel vendido; três casas permaneceram' : `Construção vendida (nível ${property.houses})`} em ${boardSpaces[propertyId].name}. Você recebeu ${amount.toLocaleString('pt-BR')}.`
      if (this.state.turnPhase === 'debt' && this.canSpend(player, this.state.debtAmount)) this.messages.payDebt(client)
    },
    returnPropertyToBank: (client: Client, payload: { propertyId?: unknown }) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'debt' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Só é possível devolver um imóvel ao banco para completar uma dívida.' })
        return
      }
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const player = this.state.players.get(this.getPlayerSessionId(client))
      const property = this.state.properties.get(String(propertyId))
      const holdings = this.getHoldings()
      if (!player || this.canSpend(player, this.state.debtAmount)) {
        client.send('room:error', { message: 'Seu saldo já cobre a dívida; não é possível devolver imóveis agora.' })
        return
      }
      if (!player || !property || !canReturnPropertyToBank(propertyId, this.getPlayerSessionId(client), holdings)) {
        client.send('room:error', { message: 'Esse imóvel não pode ser devolvido ao banco. Venda as construções do grupo e tente novamente.' })
        return
      }
      const amount = bankReturnValue(propertyId)
      this.state.presentationSpeed = this.state.animationSpeed
      this.returnTitleToBank(propertyId, property)
      this.creditCash(player, amount)
      this.state.landingDescription = `${boardSpaces[propertyId].name} devolvida ao banco. Você recebeu ${amount.toLocaleString('pt-BR')}; o imóvel voltou a ficar livre.`
      if (this.canSpend(player, this.state.debtAmount)) this.messages.payDebt(client)
    },
    payDebt: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'debt' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId) return
      const debtor = this.state.players.get(this.getPlayerSessionId(client))
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
        if (!this.offerBuybackAfterRent(this.getPlayerSessionId(client), this.state.pendingPropertyId)) this.state.pendingPropertyId = 255
      }
      this.finishExpiredPhaseIfReady()
    },
    declareBankruptcy: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'debt' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId) return
      const debtor = this.state.players.get(this.getPlayerSessionId(client))
      if (!debtor || this.canSpend(debtor, this.state.debtAmount) || hasLiquidatableAssets(this.getPlayerSessionId(client), this.getHoldings())) {
        client.send('room:error', { message: 'Quite a dívida ou liquide todos os bens possíveis antes de declarar falência.' })
        return
      }
      const creditorId = this.state.debtCreditorSessionId
      const creditor = this.state.players.get(creditorId)
      if (creditor && !creditor.isBankrupt) this.creditCash(creditor, debtor.cash)
      for (const [propertyId, property] of this.state.properties.entries()) {
        if (property.ownerSessionId !== this.getPlayerSessionId(client)) continue
        if (creditor && !creditor.isBankrupt) {
          property.ownerSessionId = creditorId
        } else {
          this.returnTitleToBank(Number(propertyId), property)
        }
      }
      if (creditor && !creditor.isBankrupt) {
        this.checkMonopolyVictory(creditorId)
      }
      debtor.cash = 0
      debtor.isBankrupt = true
      debtor.isJailed = false
      const name = debtor.name
      this.clearDebt()
      const survivors = Array.from(this.state.players.entries()).filter(([, player]) => !player.isBankrupt)
      if (survivors.length <= 1) {
        this.finishMatch(survivors.length ? 'bankruptcy' : 'no-solvent-players', survivors[0]?.[0])
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
      const player = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'jail' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId || !player?.isJailed) {
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
        this.turnTimerKey = `${this.state.turnNumber}:${this.getPlayerSessionId(client)}:roll`
        this.state.landingDescription = `Duplas (${diceOne} e ${diceTwo})! Você saiu da prisão e avançará ${diceOne + diceTwo} casas.`
        this.rollForPlayer(this.getPlayerSessionId(client), [diceOne, diceTwo], false)
        return
      }
      this.state.diceSequence += 1
      this.state.diceOne = diceOne
      this.state.diceTwo = diceTwo
      this.state.turnPhase = 'rolling'
      this.state.presentationSpeed = this.state.animationSpeed
      this.state.landingDescription = `Não saiu duplas (${diceOne} e ${diceTwo}). Você continua preso.`
      this.schedulePresentation(getAnimationDuration(DICE_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
        if (this.state.turnPhase !== 'rolling' || this.state.activePlayerSessionId !== this.getPlayerSessionId(client)) return
        player.jailTurns = Math.max(0, player.jailTurns - 1)
        if (player.jailTurns === 0) player.isJailed = false
        this.advanceTurn()
      })
    },
    jailPay: (client: Client) => {
      const player = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'jail' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId || !player?.isJailed) {
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
      this.turnTimerKey = `${this.state.turnNumber}:${this.getPlayerSessionId(client)}:roll`
      this.state.diceOne = 0
      this.state.diceTwo = 0
      this.state.landingDescription = 'Você pagou R$ 200.000 para sair da prisão. Lance os dados para continuar.'
    },
    auctionStart: (client: Client, payload: { propertyId?: unknown; startingBid?: unknown }) => {
      if (this.state.status !== 'playing') {
        client.send('room:error', { message: 'Leilões só podem acontecer durante a partida.' })
        return
      }
      if (this.state.auctionId > 0) {
        client.send('room:error', { message: 'Já existe um leilão em andamento.' })
        return
      }
      const seller = this.state.players.get(this.getPlayerSessionId(client))
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const startingBid = payload?.startingBid
      const property = this.state.properties.get(String(propertyId))
      const space = boardSpaces[propertyId]
      if (!seller || seller.isBankrupt || !property || property.ownerSessionId !== this.getPlayerSessionId(client)) {
        client.send('room:error', { message: 'Você só pode anunciar um imóvel próprio.' })
        return
      }
      if (typeof startingBid !== 'number' || !Number.isSafeInteger(startingBid)
        || startingBid < AUCTION_MIN_BID_INCREMENT || startingBid > MAX_SCHEMA_CASH) {
        client.send('room:error', { message: 'Defina um lance inicial de pelo menos R$ 10.000 e dentro do limite permitido.' })
        return
      }
      if (!space || space.kind !== 'property') {
        client.send('room:error', { message: 'Escolha uma propriedade para leiloar.' })
        return
      }
      this.auctionSequence = (this.auctionSequence % MAX_SCHEMA_CASH) + 1
      this.state.auctionId = this.auctionSequence
      this.state.auctionPropertyId = propertyId
      this.state.auctionSellerSessionId = this.getPlayerSessionId(client)
      this.state.auctionStartingBid = startingBid
      this.state.auctionHighestBid = 0
      this.state.auctionHighestBidderSessionId = ''
      this.state.auctionPhase = 'interest'
      this.state.auctionSeconds = AUCTION_ACCEPT_SECONDS
      this.startAuctionClock()
    },
    auctionAccept: (client: Client, payload: { auctionId?: unknown }) => {
      const sessionId = this.getPlayerSessionId(client)
      const player = this.state.players.get(sessionId)
      if (this.state.status !== 'playing' || payload?.auctionId !== this.state.auctionId
        || this.state.auctionPhase !== 'interest' || sessionId === this.state.auctionSellerSessionId
        || !player || player.isBankrupt || (!player.isConnected && !player.isBotControlled)) {
        client.send('room:error', { message: 'Este leilão não está aceitando participantes.' })
        return
      }
      this.state.auctionPhase = 'bidding'
      this.state.auctionSeconds = AUCTION_BID_SECONDS
      this.state.landingDescription = `${player.name} aceitou participar do leilão de ${boardSpaces[this.state.auctionPropertyId].name}. Os lances estão abertos por 10 segundos.`
    },
    auctionBid: (client: Client, payload: { auctionId?: unknown; amount?: unknown }) => {
      const amount = payload?.amount
      const auctionId = payload?.auctionId
      const bidder = this.state.players.get(this.getPlayerSessionId(client))
      const seller = this.state.players.get(this.state.auctionSellerSessionId)
      if (this.state.status !== 'playing' || auctionId !== this.state.auctionId || this.state.auctionPhase !== 'bidding' || this.state.auctionSeconds <= 0
        || this.getPlayerSessionId(client) === this.state.auctionSellerSessionId || !bidder || bidder.isBankrupt || (!bidder.isConnected && !bidder.isBotControlled)) {
        client.send('room:error', { message: 'Este leilão não está disponível para você.' })
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
      const isCurrentBidder = this.state.auctionHighestBidderSessionId === this.getPlayerSessionId(client)
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
      this.state.auctionHighestBidderSessionId = this.getPlayerSessionId(client)
      this.state.auctionSeconds = AUCTION_BID_SECONDS
    },
    auctionCancel: (client: Client, payload: { auctionId?: unknown }) => {
      if (payload?.auctionId !== this.state.auctionId || this.getPlayerSessionId(client) !== this.state.auctionSellerSessionId) {
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
      if (this.state.status !== 'playing' || !['resolve', 'jail', 'buyback-upgrade'].includes(this.state.turnPhase)) return
      if (this.getPlayerSessionId(client) !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Somente a pessoa da vez pode concluir a jogada.' })
        return
      }
      if (this.state.turnPhase === 'jail') {
        const player = this.state.players.get(this.getPlayerSessionId(client))
        if (!player?.isJailed) return
        player.jailTurns = Math.max(0, player.jailTurns - 1)
        if (player.jailTurns === 0) player.isJailed = false
      }
      if (this.state.mode === 'classic' && this.state.matchEnding) this.finishMatch('timeout')
      else if (this.lastRollWasDouble && !this.state.players.get(this.getPlayerSessionId(client))?.isJailed) {
        this.lastRollWasDouble = false
        this.state.turnPhase = 'roll'
        this.state.turnSeconds = TURN_ROLL_SECONDS
        this.turnTimerKey = `${this.state.turnNumber}:${this.getPlayerSessionId(client)}:roll`
        this.state.diceOne = 0
        this.state.diceTwo = 0
        this.state.landingDescription += ' Você tirou duplas e pode lançar novamente.'
      }
      else this.advanceTurn()
    },
    dismissCardReveal: (client: Client) => {
      if (this.state.status !== 'playing'
        || this.state.turnPhase !== 'card-target'
        || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId
        || !this.cardTargetRevealPending) return
      this.cardTargetRevealPending = false
      if (!this.hasCardTargetOptions(this.getPlayerSessionId(client))) {
        this.autoResolveCardTarget(client, this.getPlayerSessionId(client))
        return
      }
      this.state.turnSeconds = CARD_TARGET_SECONDS
      this.turnTimerKey = `${this.state.turnNumber}:${this.getPlayerSessionId(client)}:card-target`
    },
    chooseWorldCup: (client: Client, payload: { propertyId?: unknown }) => {
      const propertyId = typeof payload?.propertyId === 'number' ? payload.propertyId : -1
      const space = boardSpaces[propertyId]
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'world-cup' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId) return
      if (!space || space.kind !== 'property' || this.state.properties.get(String(propertyId))?.ownerSessionId !== this.getPlayerSessionId(client)) {
        client.send('room:error', { message: 'Escolha uma propriedade sua para sediar a Copa do Mundo.' })
        return
      }
      this.state.worldCupSpaceId = propertyId
      this.state.worldCupHostCount += 1
      this.broadcast('game:city-effect', { id: ++this.throwSequence, spaceId: propertyId, effect: 'world-cup' })
      this.state.turnPhase = 'resolve'
      this.state.landingDescription = `${space.name} será sede da Copa do Mundo. O aluguel agora vale ${getWorldCupRentMultiplier(this.state.worldCupHostCount, this.state.cupInitialMultiplier).toLocaleString('pt-BR')}× o valor normal.`
      this.finishExpiredPhaseIfReady()
    },
    chooseWorldTour: (client: Client, payload: { spaceId?: unknown }) => {
      const spaceId = typeof payload?.spaceId === 'number' ? payload.spaceId : -1
      const space = boardSpaces[spaceId]
      const player = this.state.players.get(this.getPlayerSessionId(client))
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'world-tour' || this.getPlayerSessionId(client) !== this.state.activePlayerSessionId || !player) return
      const holding = this.state.properties.get(String(spaceId))
      const isAllowedProperty = space?.kind === 'property' && (!holding?.ownerSessionId || holding.ownerSessionId === this.getPlayerSessionId(client))
      const isAllowedSpecial = space && space.kind !== 'property' && space.id !== player.position
      if (!space || space.id === 30 || (!isAllowedProperty && !isAllowedSpecial)) {
        client.send('room:error', { message: 'Escolha uma propriedade sua, livre ou uma casa especial diferente desta.' })
        return
      }
      const startPosition = player.position
      const distance = (spaceId - startPosition + boardSpaces.length) % boardSpaces.length
      const passesStart = distance > 0 && startPosition + distance >= boardSpaces.length
      const travelDescription = `Volta ao Brasil: sua peça viajou para ${space.name}.${passesStart ? ` Passou pela Partida e recebeu R$ ${START_BONUS.toLocaleString('pt-BR')}.` : ''}`
      player.position = spaceId
      this.state.landingDescription = travelDescription
      if (passesStart) {
        this.creditCash(player, START_BONUS)
        this.advanceOwnedEffectsOnLap(this.getPlayerSessionId(client))
      }
      this.startPawnMovement(this.getPlayerSessionId(client), player, startPosition, travelDescription)
    },
    resolveCardTarget: (client: Client, payload: { propertyId?: unknown; targetSessionId?: unknown; secondSessionId?: unknown }) => {
      const actorId = this.getPlayerSessionId(client)
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
        if (space?.kind !== 'property' || space.company || !property || property.ownerSessionId !== actorId || !validTarget || cardBlocked) {
          invalid('Escolha um imóvel seu sem proteção e outra pessoa que ainda esteja na partida.')
          return
        }
        property.ownerSessionId = targetId
        this.broadcast('game:city-effect', { id: ++this.throwSequence, spaceId: propertyId, effect: 'generous' })
        this.state.landingDescription = `${actor.name} deu ${boardSpaces[propertyId].name} a ${target!.name}.`
        if (this.checkMonopolyVictory(targetId)) return
      } else if (card.effect.kind === 'blackout') {
        if (space?.kind !== 'property' || space.company || !property || property.ownerSessionId !== targetId || !validTarget || property.houses === PROPERTY_HOTEL_LEVEL || cardBlocked) {
          invalid('Escolha um imóvel sem hotel e sem proteção que pertença a outra pessoa.')
          return
        }
        property.blackoutTurns = 3
        this.broadcast('game:city-effect', { id: ++this.throwSequence, spaceId: propertyId, effect: 'blackout' })
        this.state.landingDescription = `${boardSpaces[propertyId].name} ficará sem aluguel até ${target!.name} completar três voltas no tabuleiro.`
      } else if (card.effect.kind === 'earthquake') {
        if (space?.kind !== 'property' || space.company || !property || property.ownerSessionId !== targetId || !validTarget || property.houses === PROPERTY_HOTEL_LEVEL || cardBlocked) {
          invalid('Escolha um imóvel sem hotel e sem proteção que pertença a outra pessoa.')
          return
        }
        const earthquakeId = ++this.throwSequence
        this.broadcast('game:earthquake', { id: earthquakeId, spaceId: propertyId, houses: property.houses, ownerColor: this.state.players.get(property.ownerSessionId)?.color ?? '#536c7d' })
        this.broadcast('game:city-effect', { id: earthquakeId, spaceId: propertyId, effect: 'earthquake' })
        this.returnTitleToBank(propertyId, property)
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
        if (space?.kind !== 'property' || space.company || !property || property.ownerSessionId !== actorId) {
          invalid('Escolha um imóvel seu.')
          return
        }
        property.protectionTurns = Math.max(property.protectionTurns, 3)
        this.broadcast('game:city-effect', { id: ++this.throwSequence, spaceId: propertyId, effect: 'protection' })
        this.state.landingDescription = `${boardSpaces[propertyId].name} está protegida contra cartas até o dono completar três voltas no tabuleiro.`
      } else if (card.effect.kind === 'communism') {
        const secondId = typeof payload?.secondSessionId === 'string' ? payload.secondSessionId : ''
        const second = this.state.players.get(secondId)
        if (!validSwapTarget || !second || secondId === targetId || second.isBankrupt) {
          invalid('Escolha duas pessoas diferentes que ainda estejam na partida. Você pode escolher a si mesmo.')
          return
        }
        const [firstBalance, secondBalance] = divideBalances(target!.cash, second.cash)
        target!.cash = firstBalance
        second.cash = secondBalance
        this.state.landingDescription = `${target!.name} e ${second.name} dividiram seus saldos igualmente: R$ ${firstBalance.toLocaleString('pt-BR')} e R$ ${secondBalance.toLocaleString('pt-BR')}.`
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
        this.state.turnPhase = 'moving'
        this.state.presentationSpeed = this.state.animationSpeed
        this.schedulePresentation(getAnimationDuration(PAWN_TELEPORT_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
          if (this.state.turnPhase !== 'moving' || this.state.activePlayerSessionId !== actorId) return
          this.state.pawnMoveMode = 'walk'
          this.state.turnPhase = 'resolve'
          this.state.turnSeconds = this.state.decisionSeconds
          this.turnTimerKey = `${this.state.turnNumber}:${actorId}:resolve`
          this.finishExpiredPhaseIfReady()
        })
        this.cardTargetRevealPending = false
        return
      } else {
        invalid('Esta carta não exige escolha de alvo.')
        return
      }
      this.state.turnPhase = 'resolve'
      this.cardTargetRevealPending = false
      this.state.turnSeconds = this.state.decisionSeconds
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

  private getFestivalSpaceIds() {
    return new Set(this.state.festivalSpaceIds ? this.state.festivalSpaceIds.split(',').map(Number).filter(Number.isInteger) : [])
  }

  private clearDebt() {
    this.state.debtAmount = 0
    this.state.debtCreditorSessionId = ''
    this.state.debtReason = ''
  }

  private returnTitleToBank(propertyId: number, property: PropertyState) {
    if (this.state.auctionId > 0 && this.state.auctionPropertyId === propertyId) this.clearAuction(true)
    property.ownerSessionId = ''
    property.houses = 0
    property.blackoutTurns = 0
    property.protectionTurns = 0
    if (this.state.worldCupSpaceId === propertyId) this.state.worldCupSpaceId = 255
  }

  private startMatchClock() {
    this.stopMatchClock()
    this.stopTurnClock()
    this.lastActivity.clear()
    for (const [id, player] of this.state.players) if (!player.isBot && player.isConnected) this.lastActivity.set(id, Date.now())
    this.watchdogTicks = 0
    this.turnClockInterval = setInterval(() => {
      if (this.state.status !== 'playing') return this.stopTurnClock()
      const now = Date.now()
      for (const [id, player] of this.state.players) {
        if (!player.isBot && player.isConnected && !player.isInactive && now - (this.lastActivity.get(id) ?? now) >= 30_000) {
          player.isInactive = true
          player.isBotControlled = true
        }
      }
      this.updateTurnClock()
      if (++this.watchdogTicks >= 15) { this.watchdogTicks = 0; this.recoverExpiredTurn() }
    }, 1000)
    if (this.state.matchDuration === 0) {
      this.state.matchSeconds = 0
      this.state.matchEnding = false
      return
    }
    this.matchClockInterval = setInterval(() => {
      if (this.state.status !== 'playing') return this.stopMatchClock()
      if (this.state.matchSeconds > 0) this.state.matchSeconds -= 1
      if (this.state.matchSeconds === 0) {
        this.state.matchEnding = true
        if (['roll', 'resolve', 'jail'].includes(this.state.turnPhase)) this.finishMatch('timeout')
      }
    }, 1000)
  }

  private stopMatchClock() {
    if (this.matchClockInterval) clearInterval(this.matchClockInterval)
    this.matchClockInterval = undefined
  }

  private stopTurnClock() {
    if (this.turnClockInterval) clearInterval(this.turnClockInterval)
    this.turnClockInterval = undefined
  }

  private recoverExpiredTurn() {
    if (this.state.status !== 'playing' || this.state.turnSeconds !== 0) return
    const phase = this.state.turnPhase
    const key = `${this.state.turnNumber}:${this.state.activePlayerSessionId}:${phase}`
    if (key !== this.turnTimerKey || !['roll', 'purchase', 'buyback', 'buyback-upgrade', 'company-roll', 'start-upgrade', 'resolve', 'jail', 'world-cup', 'world-tour', 'card-target', 'debt'].includes(phase)) return
    this.state.turnSeconds = 1
    this.updateTurnClock()
  }

  private updateTurnClock() {
    const phase = this.state.turnPhase
    const key = `${this.state.turnNumber}:${this.state.activePlayerSessionId}:${phase}`
    if (key !== this.turnTimerKey) {
      this.turnTimerKey = key
      this.state.turnSeconds = phase === 'roll'
        ? TURN_ROLL_SECONDS
      : phase === 'card-target' ? (this.cardTargetRevealPending ? CARD_REVEAL_SECONDS : CARD_TARGET_SECONDS)
      : ['purchase', 'buyback', 'buyback-upgrade', 'company-roll', 'start-upgrade', 'resolve', 'jail', 'world-cup', 'world-tour', 'debt'].includes(phase) ? this.state.decisionSeconds : 0
      return
    }
    if (phase === 'card-target' && this.cardTargetRevealPending) {
      if (this.state.turnSeconds > 1) this.state.turnSeconds -= 1
      else {
        this.cardTargetRevealPending = false
        if (!this.hasCardTargetOptions(this.state.activePlayerSessionId)) {
          const client = { sessionId: this.state.activePlayerSessionId, send: () => undefined } as unknown as Client
          this.autoResolveCardTarget(client, this.state.activePlayerSessionId)
          return
        }
        this.state.turnSeconds = CARD_TARGET_SECONDS
      }
      return
    }
    if (this.state.turnSeconds === 0 || !['roll', 'purchase', 'buyback', 'buyback-upgrade', 'company-roll', 'start-upgrade', 'resolve', 'jail', 'world-cup', 'world-tour', 'card-target', 'debt'].includes(phase)) return
    this.state.turnSeconds -= 1
    if (this.state.turnSeconds > 0) return

    const sessionId = this.state.activePlayerSessionId
    const player = this.state.players.get(sessionId)
    if (!player) return
    const client = { sessionId, send: () => undefined } as unknown as Client
    if (phase === 'roll') this.rollForPlayer(sessionId)
    else if (phase === 'company-roll') this.messages.rollCompany(client)
    else if (phase === 'purchase') this.messages.declinePurchase(client)
    else if (phase === 'buyback') this.messages.buyback(client, { accept: false })
    else if (phase === 'buyback-upgrade') this.messages.finishTurn(client)
    else if (phase === 'start-upgrade') this.messages.startUpgrade(client, { accept: false })
    else if (phase === 'resolve') this.messages.finishTurn(client)
    else if (phase === 'jail') this.messages.finishTurn(client)
    else if (phase === 'world-cup') this.chooseDefaultWorldCup(client, sessionId, this.state.activeCardId !== '')
    else if (phase === 'world-tour') this.messages.chooseWorldTour(client, { spaceId: this.getWorldTourDefaultDestination(sessionId, true) })
    else if (phase === 'card-target') {
      this.cardTargetRevealPending = false
      this.autoResolveCardTarget(client, sessionId)
    }
    else {
      this.autoResolveDebt(sessionId)
      if (this.state.turnPhase === 'debt' && this.state.activePlayerSessionId === sessionId) this.state.turnSeconds = this.state.decisionSeconds
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
    this.state.landingDescription = this.lastRollWasDouble ? 'TIROU DUPLAS! Você joga novamente após resolver esta casa.' : ''
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
      this.finishMatch('timeout')
      return
    }
    if (this.state.turnPhase !== 'resolve') return
    const sessionId = this.state.activePlayerSessionId
    const player = this.state.players.get(sessionId)
    if (!player) return
    if (this.canImproveOwnedProperty(sessionId, this.state.pendingPropertyId)) return
    const key = `${this.state.turnNumber}:${sessionId}:${this.state.diceSequence}:${this.state.landingDescription}`
    if (key === this.autoFinishKey) return
    this.autoFinishKey = key
    this.schedulePresentation(1_100, () => {
      if (this.state.turnPhase === 'resolve' && this.state.activePlayerSessionId === sessionId) this.messages.finishTurn({ sessionId, send: () => undefined } as unknown as Client)
    })
  }

  private canImproveOwnedProperty(sessionId: string, propertyId: number) {
    const player = this.state.players.get(sessionId)
    const property = this.state.properties.get(String(propertyId))
    if (!player || !property || property.ownerSessionId !== sessionId || player.position !== propertyId || !boardSpaces[propertyId]?.buildable) return false
    const holdings = this.getHoldings()
    return property.houses === PROPERTY_BUILD_LEVELS
      ? player.hasCompletedFirstLap && canBuildHotel(propertyId, sessionId, holdings, this.availableCash(player))
      : [1, 2, 3].some((level) => level > property.houses && canBuildLevelAfterFirstLap(player.hasCompletedFirstLap, level) && canBuildProperty(propertyId, sessionId, holdings, this.availableCash(player), level))
  }

  private stopClocks() {
    this.stopMatchClock()
    this.stopTurnClock()
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
          if (this.state.auctionPhase === 'interest') {
            this.messages.auctionAccept(fakeClient(sessionId), { auctionId: this.state.auctionId })
            return
          }
          if (this.state.auctionPhase === 'bidding') {
            this.messages.auctionBid(fakeClient(sessionId), { auctionId: this.state.auctionId, amount })
            return
          }
        }
      }
    }

    const sessionId = this.state.activePlayerSessionId
    const player = this.state.players.get(sessionId)
    if (!player || player.isBankrupt || (!player.isBot && !player.isBotControlled)) return
    const client = fakeClient(sessionId)
    const botCash = this.availableCash(player)

    if (this.state.turnPhase === 'company-roll') {
      this.messages.rollCompany(client)
      return
    }
    if (this.state.turnPhase === 'card-target') {
      this.autoResolveCardTarget(client, sessionId)
    } else if (this.state.turnPhase === 'roll') {
      this.messages.roll(client)
    } else if (this.state.turnPhase === 'buyback') {
      const propertyId = this.state.pendingPropertyId
      const property = this.state.properties.get(String(propertyId))
      const space = boardSpaces[propertyId]
      const completesGroup = Boolean(space?.kind === 'property' && boardSpaces
        .filter((candidate) => candidate.kind === 'property' && candidate.color === space.color)
        .every((candidate) => candidate.id === propertyId || this.state.properties.get(String(candidate.id))?.ownerSessionId === sessionId))
      const price = property ? forcedBuybackCost(propertyId, property.houses) : Number.POSITIVE_INFINITY
      this.messages.buyback(client, { accept: Boolean(property && shouldBotBuyback(price, botCash, completesGroup)) })
    } else if (this.state.turnPhase === 'buyback-upgrade') {
      const propertyId = this.state.pendingPropertyId
      const property = this.state.properties.get(String(propertyId))
      const level = property?.houses === PROPERTY_BUILD_LEVELS ? PROPERTY_HOTEL_LEVEL : (property?.houses ?? 0) + 1
      const cost = level === PROPERTY_HOTEL_LEVEL ? hotelConstructionCost(propertyId) : constructionCost(propertyId)
      if (property && this.canImproveOwnedProperty(sessionId, propertyId) && botCash - cost >= 150_000) {
        this.messages.build(client, { propertyId, ...(level === PROPERTY_HOTEL_LEVEL ? { hotel: true } : { targetHouses: level }) })
      } else this.messages.finishTurn(client)
    } else if (this.state.turnPhase === 'purchase') {
      const space = boardSpaces[this.state.pendingPropertyId]
      const groupSpaces = space?.kind === 'property' ? boardSpaces.filter((candidate) => candidate.kind === 'property' && candidate.color === space.color) : []
      const completesGroup = groupSpaces.length > 0 && groupSpaces.every((candidate) => candidate.id === this.state.pendingPropertyId || this.state.properties.get(String(candidate.id))?.ownerSessionId === sessionId)
      if (space?.kind === 'property' && shouldBotBuyProperty(space.price ?? 0, botCash, completesGroup, this.state.mode as GameMode)) {
        const reserve = completesGroup ? 50_000 : 150_000
        const maxHouses = player.hasCompletedFirstLap ? PROPERTY_BUILD_LEVELS : PROPERTY_BUILD_LEVELS - 1
        const houses = space.buildable
          ? [maxHouses, maxHouses - 1, maxHouses - 2, 0].filter((count) => count >= 0).find((count) => botCash - (space.price ?? 0) - count * constructionCost(space.id) >= reserve) ?? 0
          : 0
        this.messages.buy(client, { houses })
      } else this.messages.declinePurchase(client)
    } else if (this.state.turnPhase === 'start-upgrade') {
      const property = this.state.properties.get(String(this.state.pendingPropertyId))
      const cost = property?.houses === PROPERTY_BUILD_LEVELS ? hotelConstructionCost(this.state.pendingPropertyId) : constructionCost(this.state.pendingPropertyId)
      if (property && property.ownerSessionId === sessionId && property.houses < PROPERTY_HOTEL_LEVEL && this.canSpend(player, cost + 150_000)) this.messages.startUpgrade(client, { accept: true })
      else this.messages.startUpgrade(client, { accept: false })
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

  private finishMatch(reason: MatchEndReason, forcedWinnerSessionId?: string) {
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
    this.state.matchEndReason = reason
    this.stopClocks()
    if (this.reconnectRetentionTimer) {
      this.clearReconnectRetention()
      this.autoDispose = true
      if (![...this.state.players.values()].some((player) => player.isConnected && !player.isBot)) this.disconnect()
    }
    const endingReason = reason === 'timeout' ? 'Tempo esgotado.' : reason === 'bankruptcy' ? 'Partida encerrada após falência.' : reason === 'no-solvent-players' ? 'Partida encerrada sem jogadores solventes.' : 'Partida encerrada por monopólio.'
    const tieBreak = winner?.player.tieBreakRoll ? ` Desempate nos dados: ${winner.player.tieBreakRoll}.` : ''
    this.state.landingDescription = winner
      ? `${endingReason} ${winner.player.name} venceu por patrimônio de ${winner.player.finalNetWorth.toLocaleString('pt-BR')}; dinheiro disponível: ${winner.player.finalCash.toLocaleString('pt-BR')}.${tieBreak}`
      : 'A partida terminou sem jogadores solventes.'
  }

  private checkMonopolyVictory(sessionId: string) {
    if (this.state.status !== 'playing' || !this.state.players.has(sessionId)) return false
    const ownership = new Map(Array.from(this.state.properties.entries()).map(([id, property]) => [Number(id), property.ownerSessionId]))
    const reason = getMonopolyWinReason(ownership, sessionId)
    if (!reason) return false
    const winner = this.state.players.get(sessionId)
    this.finishMatch(reason, sessionId)
    this.state.landingDescription = `${winner?.name ?? 'Jogador'} venceu: ${reason === 'monopoly-line' ? 'Monopólio em Linha' : reason === 'double-regional-monopoly' ? 'Monopólio Duplo Regional' : 'quatro companhias'}.`
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
      if (this.state.auctionPhase === 'interest') {
        this.clearAuction(false)
        this.state.landingDescription = 'O leilão foi cancelado: ninguém aceitou participar em 10 segundos.'
      } else if (this.state.auctionPhase === 'bidding' && this.state.auctionHighestBid === 0) {
        this.clearAuction(false)
        this.state.landingDescription = 'O leilão terminou sem lances; o imóvel continua com o dono.'
      } else {
        this.finishAuction()
      }
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
    this.state.auctionPhase = ''
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

  private shuffleTurnOrder(ids: string[]) {
    const order = [...ids]
    for (let i = order.length - 1; i > 0; i--) { const j = randomInt(i + 1); [order[i], order[j]] = [order[j]!, order[i]!] }
    return order
  }

  private advanceTurn() {
    this.consecutiveDoubles = 0
    this.lastRollWasDouble = false
    this.state.pendingPropertyId = 255
    this.state.pawnMoveMode = 'walk'
    const roomPlayerIds = this.state.turnOrder ? this.state.turnOrder.split(',') : Array.from(this.state.players.keys())
    const solventPlayers = roomPlayerIds.filter((sessionId) => !this.state.players.get(sessionId)?.isBankrupt)
    if (solventPlayers.length <= 1) {
      this.finishMatch(solventPlayers.length ? 'bankruptcy' : 'no-solvent-players', solventPlayers[0])
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
      this.finishMatch('no-solvent-players')
      return
    }
    this.state.activePlayerSessionId = roomPlayerIds[nextIndex]
    const nextPlayer = this.state.players.get(this.state.activePlayerSessionId)
    this.state.turnNumber += 1
    this.state.turnPhase = nextPlayer?.isJailed ? 'jail' : 'roll'
    this.state.turnSeconds = this.state.turnPhase === 'jail' ? this.state.decisionSeconds : TURN_ROLL_SECONDS
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
      const paid = Math.min(payment.amount, Math.max(0, debtor.cash))
      if (paid > 0) {
        this.spendCash(debtor, paid)
        this.creditCash(actor, paid)
      }
      if (paid < payment.amount) this.state.landingDescription += ` ${debtor.name} tinha ${paid.toLocaleString('pt-BR')} disponível e pagou somente esse valor.`
    }
    this.pendingCardPaymentActorSessionId = ''
    this.state.activePlayerSessionId = actorSessionId
    this.state.turnPhase = 'resolve'
    this.state.turnSeconds = this.state.decisionSeconds
    this.turnTimerKey = `${this.state.turnNumber}:${actorSessionId}:resolve`
    this.finishExpiredPhaseIfReady()
  }

  private hasCardTargetOptions(sessionId: string) {
    const kind = EVENT_CARDS.find((card) => card.id === this.state.activeCardId)?.effect.kind
    const players = Array.from(this.state.players.entries()).filter(([, player]) => !player.isBankrupt)
    const holdings = Array.from(this.state.properties.entries()).map(([id, holding]) => ({ id: Number(id), holding }))
    if (kind === 'swap' || kind === 'communism') return players.length >= 2
    if (kind === 'thief') return players.some(([id]) => id !== sessionId)
    if (kind === 'generous') return players.some(([id]) => id !== sessionId) && holdings.some(({ id, holding }) => boardSpaces[id]?.buildable && holding.ownerSessionId === sessionId && holding.protectionTurns === 0)
    if (kind === 'protection') return holdings.some(({ id, holding }) => boardSpaces[id]?.buildable && holding.ownerSessionId === sessionId && holding.protectionTurns === 0)
    if (kind === 'blackout' || kind === 'earthquake') return holdings.some(({ id, holding }) => boardSpaces[id]?.buildable && holding.ownerSessionId !== '' && holding.ownerSessionId !== sessionId && holding.houses !== PROPERTY_HOTEL_LEVEL && holding.protectionTurns === 0)
    return false
  }

  private autoResolveCardTarget(client: Client, sessionId: string) {
    const card = EVENT_CARDS.find((candidate) => candidate.id === this.state.activeCardId)
    if (!card) return
    const players = Array.from(this.state.players.entries()).filter(([, player]) => !player.isBankrupt)
    const properties = Array.from(this.state.properties.entries()).map(([id, property]) => [Number(id), property] as const)
    const pick = <T,>(options: readonly T[]) => options.length ? options[randomInt(options.length)] : undefined
    if (card.effect.kind === 'generous') {
      const property = pick(properties.filter(([id, holding]) => boardSpaces[id]?.buildable && holding.ownerSessionId === sessionId && holding.protectionTurns === 0))
      const recipient = pick(players.filter(([id]) => id !== sessionId))
      if (property && recipient) this.messages.resolveCardTarget(client, { propertyId: property[0], targetSessionId: recipient[0] })
    } else if (card.effect.kind === 'blackout' || card.effect.kind === 'earthquake') {
      const property = pick(properties.filter(([id, holding]) => boardSpaces[id]?.buildable && holding.ownerSessionId !== '' && holding.ownerSessionId !== sessionId && holding.houses !== PROPERTY_HOTEL_LEVEL && holding.protectionTurns === 0))
      if (property) this.messages.resolveCardTarget(client, { propertyId: property[0], targetSessionId: property[1].ownerSessionId })
    } else if (card.effect.kind === 'thief') {
      const target = pick(players.filter(([id]) => id !== sessionId))
      if (target) this.messages.resolveCardTarget(client, { targetSessionId: target[0] })
    } else if (card.effect.kind === 'protection') {
      const property = pick(properties.filter(([id, holding]) => boardSpaces[id]?.buildable && holding.ownerSessionId === sessionId && holding.protectionTurns === 0))
      if (property) this.messages.resolveCardTarget(client, { propertyId: property[0] })
    } else if (card.effect.kind === 'swap' || card.effect.kind === 'communism') {
      const pair = pick(players.flatMap((first, index) => players.slice(index + 1).map((second) => [first, second] as const)))
      const first = pair?.[0]
      const second = pair?.[1]
      if (first && second) this.messages.resolveCardTarget(client, { targetSessionId: first[0], secondSessionId: second[0] })
    }
    if (this.state.turnPhase === 'card-target') {
      this.state.turnPhase = 'resolve'
      this.state.turnSeconds = this.state.decisionSeconds
      this.turnTimerKey = `${this.state.turnNumber}:${sessionId}:resolve`
      this.state.landingDescription = 'Não existe alvo disponível.'
      this.finishExpiredPhaseIfReady()
    }
  }

  private resolveEventCard(sessionId: string, player: LobbyPlayerState) {
    const card = this.drawEventCard()
    this.state.activeCardTitle = card.title
    this.state.activeCardDescription = card.description
    this.state.activeCardId = card.id
    this.state.activeCardUserName = player.name
    this.state.landingDescription = card.description

    if (['generous', 'blackout', 'earthquake', 'thief', 'protection', 'swap', 'communism'].includes(card.effect.kind)) {
      this.state.turnPhase = 'card-target'
      this.cardTargetRevealPending = !player.isBot && !player.isBotControlled && player.isConnected
      this.state.turnSeconds = this.cardTargetRevealPending ? CARD_REVEAL_SECONDS : CARD_TARGET_SECONDS
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
      this.sendToJail(sessionId, player, `${card.description} Sua peça foi enviada à prisão por ${this.state.jailTurnLimit} turno(s).`)
    } else if (card.effect.kind === 'world-tour') {
      this.startCardTeleport(sessionId, player, 30, 'Carta Volta ao Brasil: chegada ao canto. Escolha seu destino.')
    } else if (card.effect.kind === 'world-cup') {
      this.startCardTeleport(sessionId, player, 20, 'Carta Sede da Copa: chegada ao canto.')
    } else if (card.effect.kind === 'world-cup-city') {
      const venueId = this.state.worldCupSpaceId
      if (venueId === 255 || boardSpaces[venueId]?.kind !== 'property') {
        this.state.landingDescription = `${card.description} Não há uma cidade-sede ativa; nada acontece.`
        return
      }
      this.startCardTeleport(sessionId, player, venueId, `Carta Cidade-sede: chegada a ${boardSpaces[venueId].name}.`)
    } else if (card.effect.kind === 'start') {
      this.startCardTeleport(sessionId, player, 0, card.description)
    } else if (card.effect.kind === 'double-next-rent') {
      player.nextRentMultiplier *= 2
    } else if (card.effect.kind === 'half-next-rent') {
      player.nextRentMultiplier *= 0.5
    }
  }

  private drawEventCard() {
    const forcedCard = this.state.devToolsEnabled ? EVENT_CARDS.find((card) => card.id === this.devNextEventCardId) : undefined
    this.devNextEventCardId = ''
    if (forcedCard) {
      this.broadcast('game:dev-card-used', { cardId: forcedCard.id })
      return forcedCard
    }
    return EVENT_CARDS[randomInt(EVENT_CARDS.length)]
  }

  private startCardTeleport(sessionId: string, player: LobbyPlayerState, destinationId: number, description: string) {
    const startPosition = player.position
    const distance = (destinationId - startPosition + boardSpaces.length) % boardSpaces.length
    const passesStart = distance > 0 && startPosition + distance >= boardSpaces.length
    player.position = destinationId
    this.state.pawnMoveMode = 'teleport'
    this.state.turnPhase = 'moving'
    const travelDescription = passesStart ? `${description} Você passou pela Partida e recebeu R$ ${START_BONUS.toLocaleString('pt-BR')}.` : description
    this.state.landingDescription = travelDescription
    if (passesStart) {
      this.creditCash(player, START_BONUS)
    }
    this.state.presentationSpeed = this.state.animationSpeed
    this.schedulePresentation(getAnimationDuration(PAWN_TELEPORT_ANIMATION_DURATION_MS, this.state.presentationSpeed), () => {
      if (this.state.turnPhase !== 'moving' || this.state.activePlayerSessionId !== sessionId || player.position !== destinationId) return
      this.state.pawnMoveMode = 'walk'
      this.resolveSpace(sessionId, player, false, travelDescription)
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
    if (!buyer || !property || !space || space.kind !== 'property' || space.company || !owner || owner.isBankrupt || property.ownerSessionId === sessionId || property.houses === PROPERTY_HOTEL_LEVEL) return false

    const price = forcedBuybackCost(propertyId, property.houses)
    if (!this.canSpend(buyer, price) || owner.cash + price > MAX_SCHEMA_CASH) return false

    this.state.pendingPropertyId = propertyId
    this.state.turnPhase = 'buyback'
    this.state.turnSeconds = this.state.decisionSeconds
    this.turnTimerKey = `${this.state.turnNumber}:${sessionId}:buyback`
    this.state.landingDescription += ` Aluguel quitado. Você ainda pode recomprar ${space.name} por ${price.toLocaleString('pt-BR')} (2× o investimento).`
    return true
  }

  private movePlayer(sessionId: string, player: LobbyPlayerState, spaces: number) {
    const previousPosition = player.position
    player.position = movePosition(player.position, [spaces, 0])
    if (player.position < previousPosition) {
      player.hasCompletedFirstLap = true
      this.creditCash(player, START_BONUS)
      this.advanceOwnedEffectsOnLap(sessionId)
    }
  }

  private advanceOwnedEffectsOnLap(sessionId: string) {
    for (const property of this.state.properties.values()) {
      if (property.ownerSessionId !== sessionId) continue
      property.blackoutTurns = Math.max(0, property.blackoutTurns - 1)
      property.protectionTurns = Math.max(0, property.protectionTurns - 1)
    }
  }

  private getWorldCupDefaultPropertyId(sessionId: string) {
    return boardSpaces
      .filter((space) => space.kind === 'property' && this.state.properties.get(String(space.id))?.ownerSessionId === sessionId)
      .sort((first, second) => (second.price ?? 0) - (first.price ?? 0))[0]?.id ?? -1
  }

  private chooseDefaultWorldCup(client: Client, sessionId: string, random = false) {
    const propertyId = random
      ? (() => {
          const options = boardSpaces.filter((space) => space.kind === 'property' && this.state.properties.get(String(space.id))?.ownerSessionId === sessionId)
          return options.length ? options[randomInt(options.length)]!.id : -1
        })()
      : this.getWorldCupDefaultPropertyId(sessionId)
    if (propertyId < 0) {
      this.state.turnPhase = 'resolve'
      this.state.landingDescription += ' Você não possui propriedades para sediar a Copa; não há uma sede disponível.'
      this.finishExpiredPhaseIfReady()
      return
    }
    this.messages.chooseWorldCup(client, { propertyId })
  }

  private getWorldTourDefaultDestination(sessionId: string, random = false) {
    const player = this.state.players.get(sessionId)
    const eligible = boardSpaces.filter((space) => {
      if (space.id === 30 || space.id === player?.position) return false
      if (space.kind !== 'property') return true
      const ownerSessionId = this.state.properties.get(String(space.id))?.ownerSessionId
      return !ownerSessionId || ownerSessionId === sessionId
    })
    if (random) return eligible.length ? eligible[randomInt(eligible.length)]!.id : 0
    return eligible
      .filter((space) => space.kind === 'property')
      .sort((first, second) => (second.price ?? 0) - (first.price ?? 0))[0]?.id
      ?? eligible.find((space) => space.kind !== 'property')?.id
      ?? 0
  }

  private sendToJail(sessionId: string, player: LobbyPlayerState, description: string) {
    player.position = 10
    player.isJailed = true
    player.jailTurns = this.state.jailTurnLimit
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
        const rent = calculateRent(space.id, ownership, property.houses, this.state.worldCupSpaceId, this.getFestivalSpaceIds(), getWorldCupRentMultiplier(this.state.worldCupHostCount, this.state.cupInitialMultiplier), this.state.festivalMultiplier)
        if (owner && property.blackoutTurns > 0 && property.houses !== PROPERTY_HOTEL_LEVEL) {
          this.state.landingDescription += ` ${space.name} está em apagão; não há aluguel por mais ${property.blackoutTurns} volta(s) do dono.`
        } else if (owner && space.company) {
          this.pendingCompanyRent = { sessionId, ownerSessionId: property.ownerSessionId, spaceId: space.id, rentPerPip: calculateCompanyRent(ownership, property.ownerSessionId, 1) }
          this.state.turnPhase = 'company-roll'
          this.state.diceOne = 0
          this.state.diceTwo = 0
          this.state.landingDescription = `Gire o D6 para calcular o aluguel de ${space.name}.`
          return
        } else if (owner) {
          const amount = applyRentMultiplier(rent, player.nextRentMultiplier)
          player.nextRentMultiplier = 1
          const reason = 'Aluguel'
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
    } else if (space.kind === 'start' && player.position === 0) {
      const holdings = this.getHoldings()
      const eligible = [...holdings.entries()].filter(([propertyId, holding]) => {
        const city = boardSpaces[propertyId]
        return holding.ownerSessionId === sessionId && city?.buildable && holding.houses < PROPERTY_HOTEL_LEVEL
      })
      if (eligible.length) {
        const [propertyId] = eligible[randomInt(eligible.length)]!
        this.state.pendingPropertyId = propertyId
        this.state.turnPhase = 'start-upgrade'
        this.state.turnSeconds = this.state.decisionSeconds
        this.turnTimerKey = `${this.state.turnNumber}:${sessionId}:start-upgrade`
        this.state.landingDescription += ` Você parou exatamente na Partida. Pode pagar para melhorar uma cidade sua aleatória: ${boardSpaces[propertyId]!.name}.`
      } else {
        this.state.landingDescription += ' Você parou exatamente na Partida, mas não tem cidade disponível para melhorar.'
      }
    } else if (space.kind === 'tax') {
      const ownedProperties = Array.from(this.state.properties.values()).filter((property) => property.ownerSessionId === sessionId).length
      const tax = taxForSpace(space.id, ownedProperties)
      this.collectPayment(sessionId, player, tax, '', 'Taxa')
    } else if (space.kind === 'prison') {
      player.isJailed = true
      player.jailTurns = this.state.jailTurnLimit
      this.state.landingDescription = `${describeLanding(space.id)} Você perderá os próximos ${this.state.jailTurnLimit} turno(s).`
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
      this.state.turnPhase = 'world-tour'
      this.state.landingDescription = `${describeLanding(space.id)} Escolha sua próxima casa.`
    } else if (space.kind === 'event' && drawEvent) {
      this.resolveEventCard(sessionId, player)
    }
    this.finishExpiredPhaseIfReady()
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
    if (this.supersededClientSessionIds.delete(client.sessionId)) {
      this.reconnectedSessionIds.delete(client.sessionId)
      return
    }
    const sessionId = this.getPlayerSessionId(client)
    const player = this.state.players.get(sessionId)
    if (player?.controllerSessionId && player.controllerSessionId !== client.sessionId) {
      this.reconnectedSessionIds.delete(client.sessionId)
      return
    }
    if (this.state.status === 'playing' && player) {
      player.isConnected = false
      if (!player.isBot) player.isBotControlled = true
      player.controllerSessionId = ''
      player.reconnectionExpired = true
      this.reconnectedSessionIds.delete(client.sessionId)
      if (![...this.state.players.values()].some((candidate) => candidate.isConnected && !candidate.isBot)) this.retainRoomForReconnect()
      return
    }
    this.reconnectedSessionIds.delete(client.sessionId)
    if (this.state.status === 'playing') this.stopClocks()
    this.droppedControllerSessionIds.delete(sessionId)
    this.state.players.delete(sessionId)
    if (this.state.status === 'playing') this.state.status = 'waiting'
    if (![...this.state.players.values()].some((player) => player.isHost)) {
      const nextHost = [...this.state.players.values()].find((candidate) => candidate.isConnected && !candidate.isBot)
      if (nextHost) nextHost.isHost = true
    }
  }

  onDrop(client: Client, _code: CloseCode) {
    if (this.supersededClientSessionIds.has(client.sessionId)) return
    const player = this.state.players.get(this.getPlayerSessionId(client))
    if (player?.controllerSessionId && player.controllerSessionId !== client.sessionId) return
    if (player) {
      this.droppedControllerSessionIds.set(this.getPlayerSessionId(client), client.sessionId)
      player.isConnected = false
      player.reconnectionExpired = false
      player.isBotControlled = this.state.status === 'playing' && !player.isBot
      player.controllerSessionId = ''
    }
    if (this.state.status === 'playing' && ![...this.state.players.values()].some((candidate) => candidate.isConnected && !candidate.isBot)) this.retainRoomForReconnect()
    this.allowReconnection(client, RECONNECTION_WINDOW_SECONDS).catch(() => {})
  }

  onReconnect(client: Client) {
    if (this.supersededClientSessionIds.has(client.sessionId)) return
    const player = this.state.players.get(this.getPlayerSessionId(client))
    if (player?.controllerSessionId && player.controllerSessionId !== client.sessionId) return
    if (player) {
      this.droppedControllerSessionIds.delete(this.getPlayerSessionId(client))
      player.isConnected = true
      player.reconnectionExpired = false
      player.isInactive = false
      this.lastActivity.set(this.getPlayerSessionId(client), Date.now())
      player.isBotControlled = false
      player.controllerSessionId = client.sessionId
      this.clearReconnectRetention()
      this.autoDispose = true
    }
  }

  private retainRoomForReconnect() {
    this.autoDispose = false
    this.clearReconnectRetention()
    this.reconnectRetentionTimer = setTimeout(() => {
      this.reconnectRetentionTimer = undefined
      if (this.state.status === 'playing' && ![...this.state.players.values()].some((player) => player.isConnected && !player.isBot)) this.disconnect()
      else this.autoDispose = true
    }, RECONNECTION_WINDOW_SECONDS * 1000)
    this.reconnectRetentionTimer.unref?.()
  }

  private clearReconnectRetention() {
    if (!this.reconnectRetentionTimer) return
    clearTimeout(this.reconnectRetentionTimer)
    this.reconnectRetentionTimer = undefined
  }

  private getPlayerSessionId(client: Client) {
    if (this.supersededClientSessionIds.has(client.sessionId)) return ''
    return this.reconnectedSessionIds.get(client.sessionId) ?? client.sessionId
  }

  async onDispose() {
    this.clearReconnectRetention()
    this.stopClocks()
    await this.presence.srem(ROOM_CODES_CHANNEL, this.roomId)
  }
}
