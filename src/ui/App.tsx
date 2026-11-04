import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CloseCode, type Room } from '@colyseus/sdk'
import { CHARACTER_OPTIONS, MAX_ROOM_PLAYERS, type CharacterType, type GameMode, type LobbyPlayer } from '../../shared/lobby'
import { getMatchEndSummary, type MatchEndReason } from '../../shared/game'
import { EVENT_CARDS } from '../../shared/cards'
import { scheduleSceneLoad } from './sceneLoading'
import { roomClient } from './roomClient'
import { clearLastRoom, configureRoomReconnection, readLastRoom, recoverRoomAfterRetries, saveLastRoom } from './roomRecovery'
import { finalScoreMetrics, rankFinalScore, scoreCriteria } from './scoreCriteria'
import { getLobbyPlayerEntries } from './lobbySnapshot'
import { canAffordPurchase } from './purchaseActions'
import { adjustAuctionStartingBid, getAuctionStartBlockReason, normalizeAuctionBidInput } from './auctionActions'
import { boardSpaces, formatMoney } from '../game/board'
import { ANIMATION_SPEEDS, AUCTION_MIN_BID_INCREMENT, DEFAULT_ANIMATION_SPEED, MATCH_DURATIONS, PROPERTY_BUILD_LEVELS, PROPERTY_HOTEL_LEVEL, START_BONUS, calculateCompanyRent, calculateRent, canBuildHotel, canBuildLevelAfterFirstLap, canBuildProperty, canSellBuilding, constructionCost, forcedBuybackCost, getWorldCupRentMultiplier, hasLiquidatableAssets, hotelConstructionCost, liquidatablePropertyIds, taxForSpace, type AnimationSpeed, type MatchDuration, type PropertyHolding } from '../../shared/game'
import { PLAYER_COLORS } from './playerPalette'
import { PLAYER_COLOR_NAMES } from '../../shared/playerColors'
import { getCashToastPlacement, getGameSound, getLandingSpecialSound, getPropertyChangeSound, getPropertyVisualChange, formatCashDelta, type GameSound } from './gameFeedback'
import { CashChangeToast } from './CashChangeToast'
import { stepDieValue } from './forcedDice'
import { getOwnedPropertySpaceIds, shouldShowPlayerInspection } from './playerOwnershipHighlight'
import { getDiceDestinationSpaceId } from './arrowGuidance'
import type { GameFeedbackItem } from './feedbackQueue'
import { playGameSound, startGameMusic, stopGameMusic, unlockGameAudio } from './gameAudio'
import { getTurnActivityLabel, isBoardSelectionGuidanceActive, shouldShowTurnCard, shouldSuppressTurnCardForFeedback, shouldSuppressTurnCardForSpaceSelection } from './turnActivity'
import { getBoardSpaceInteraction } from './boardInteraction'
import { CashHudSymbols } from './CashHudSymbols'
import { shouldShowRolledDice } from './dicePresentation'
import { areNumberPairsEqual, areRecordArraysEqual, areRecordMapsEqual } from './snapshotStability'
import { FpsMeter } from './FpsMeterOverlay'
import { createFrameRateAccumulator } from './fpsMeter'
import { readNightMode, saveNightMode } from './nightMode'
import { CARD_REVEAL_SECONDS } from '../../shared/game'
import { canShowLiquidationValues } from './propertyRentLabel'
import { adjustMoneyValue } from './moneyStepper'
import { DEFAULT_GRAPHICS_QUALITY, type GraphicsQuality } from './graphicsQuality'
import { isPlayerEmote, PLAYER_EMOTES, type PlayerEmote } from '../../shared/playerEmotes'
import { getThrowableLabel, getThrowableSymbol, isThrowableObject, THROWABLES, THROW_COOLDOWN_MS, THROW_IMPACT_DURATION_MS, THROW_PROJECTILE_DURATION_MS, type ThrowableObject } from '../../shared/throwables'
import { getRevealKicker } from './revealCopy'
import { shouldOpenAuctionPanel } from './auctionPanelState'
import { HOME_REGION_ROUTE } from './homeRegionRoute'
import { buildRoomInviteUrl, getRoomInviteCode, normalizeRoomCode } from './roomInvite'

type Mode = GameMode
type Screen = 'home' | 'room' | 'game'
type TurnPhase = 'roll' | 'rolling' | 'moving' | 'resolve' | 'purchase' | 'buyback' | 'buyback-upgrade' | 'start-upgrade' | 'company-roll' | 'jail' | 'world-cup' | 'world-tour' | 'card-target' | 'debt' | 'ended'
type SyncedPlayer = LobbyPlayer & { sessionId: string; cash: number; devInfiniteCash: boolean; hasCompletedFirstLap: boolean; nextRentMultiplier: number; isJailed: boolean; jailTurns: number; isBankrupt: boolean; finalCash: number; finalNetWorth: number; tieBreakRoll: number }
type ThrowableEvent = { id: number; fromSessionId: string; toSessionId: string; object: ThrowableObject }
type EarthquakeEvent = { id: number; spaceId: number; houses: number; ownerColor: string }
type CityEffectEvent = { id: number; spaceId: number; effect: 'blackout' | 'protection' | 'world-cup' | 'earthquake' | 'generous' }
const BoardScene = lazy(() => import('./BoardScene'))
const CashHudOverlay = lazy(() => import('./CashHud').then(({ CashHudOverlay }) => ({ default: CashHudOverlay })))

function parseSpaceIdList(value: string) {
  return value ? value.split(',').map(Number).filter(Number.isInteger) : []
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = Math.max(0, seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

const modeDetails: Record<Mode, { title: string; duration: string; detail: string }> = {
  classic: { title: 'BANTEC', duration: '30 min', detail: `Partida por patrimônio • 2 a ${MAX_ROOM_PLAYERS} jogadores` },
}

function durationLabel(seconds: number) {
  return seconds === 0 ? 'Sem tempo' : seconds === 3600 ? '1 hora' : `${seconds / 60} min`
}

function getLocalStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function MoneyStepper({ label, value, minimum = 0, maximum, step = 10_000, onChange }: { label: string; value: number; minimum?: number; maximum: number; step?: number; onChange: (value: number) => void }) {
  const upperBound = Math.max(minimum, maximum)
  const displayedValue = Math.max(minimum, Math.min(upperBound, Number.isFinite(value) ? value : minimum))
  const isBelowMinimum = value < minimum
  return <div className="money-value-field">
    <span className="money-label">{label}</span>
    <div className="auction-bid-stepper money-stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`Diminuir ${label.toLocaleLowerCase('pt-BR')}`} disabled={displayedValue <= minimum} onClick={() => onChange(adjustMoneyValue(displayedValue, -1, step, minimum, upperBound))}>−</button>
      <output aria-live="polite">{formatMoney(displayedValue)}</output>
      <button type="button" aria-label={`Aumentar ${label.toLocaleLowerCase('pt-BR')}`} disabled={displayedValue >= upperBound} onClick={() => onChange(isBelowMinimum ? minimum : adjustMoneyValue(displayedValue, 1, step, minimum, upperBound))}>+</button>
    </div>
  </div>
}

function CharacterIcon({ characterType }: { characterType: CharacterType }) {
  const extraSymbols: Partial<Record<CharacterType, string>> = { highHeel: '👠', train: '🚂', topHat: '🎩', piggyBank: '🐷', ship: '🚢', rubberDuck: '🦆', dog: '🐕', cat: '🐈', cow: '🐄', penguin: '🐧' }
  if (extraSymbols[characterType]) return <span className="character-option-emoji" aria-hidden="true">{extraSymbols[characterType]}</span>
  return <svg className="character-option-icon" viewBox="0 0 48 36" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    {characterType === 'pawn' && <><circle cx="24" cy="7" r="4" /><path d="M21 13h6l2 8 6 7H13l6-7 2-8Z" /><path d="M16 32h16" /></>}
    {characterType === 'car' && <><path d="m8 22 3-8h24l5 8 2 2v7H6v-7l2-2Z" /><path d="m14 14 3-6h14l4 6" /><circle cx="14" cy="30" r="3" /><circle cx="34" cy="30" r="3" /></>}
    {characterType === 'motorcycle' && <><circle cx="12" cy="27" r="6" /><circle cx="36" cy="27" r="6" /><path d="m12 27 9-10 7 10h8l-7-13h-6l-4 6m-1-3h-5m17-3 5 1 2 5" /><path d="m21 17 4-3" /></>}
    {characterType === 'airplane' && <><path d="m24 3 4 12 15 9-1 4-14-5 1 8-5-3-5 3 1-8-14 5-1-4 15-9 4-12Z" /></>}
  </svg>
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [sceneReady, setSceneReady] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [nightMode, setNightMode] = useState(() => readNightMode(getLocalStorage()))
  const [fpsMeterEnabled, setFpsMeterEnabled] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [feedbackQueue, setFeedbackQueue] = useState<GameFeedbackItem[]>([])

  useEffect(() => {
    saveNightMode(getLocalStorage(), nightMode)
  }, [nightMode])
  const [diceRollSequence, setDiceRollSequence] = useState(0)
  const [diceForPawnMovement, setDiceForPawnMovement] = useState(false)
  const [presentationStage, setPresentationStage] = useState<'idle' | 'dice' | 'pawn'>('idle')
  const [pawnMoveMode, setPawnMoveMode] = useState<'walk' | 'teleport'>('walk')
  const [pendingPurchaseHouses, setPendingPurchaseHouses] = useState(0)
  const [targetBuildHouses, setTargetBuildHouses] = useState(1)
  const [landingPulseSpaceId, setLandingPulseSpaceId] = useState(-1)
  const [landingPulseSequence, setLandingPulseSequence] = useState(0)
  const [name, setName] = useState(() => readLastRoom(getLocalStorage())?.name ?? '')
  const [inviteRoomCode] = useState(() => getRoomInviteCode(typeof window === 'undefined' ? '' : window.location.search))
  const isRoomInvite = Boolean(inviteRoomCode)
  const [roomCode, setRoomCode] = useState(() => inviteRoomCode ?? readLastRoom(getLocalStorage())?.roomCode ?? '')
  const [roomInviteUrl, setRoomInviteUrl] = useState('')
  const [roomInviteCopied, setRoomInviteCopied] = useState(false)
  const [mode, setMode] = useState<Mode>('classic')
  const [matchDuration, setMatchDuration] = useState<MatchDuration>(1800)
  const [error, setError] = useState('')
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [activePlayerSessionId, setActivePlayerSessionId] = useState('')
  const [turnNumber, setTurnNumber] = useState(0)
  const [turnSeconds, setTurnSeconds] = useState(0)
  const [matchSeconds, setMatchSeconds] = useState(0)
  const [matchEnding, setMatchEnding] = useState(false)
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('roll')
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(DEFAULT_ANIMATION_SPEED)
  const [presentationSpeed, setPresentationSpeed] = useState<AnimationSpeed>(DEFAULT_ANIMATION_SPEED)
  const [devModeEnabled, setDevModeEnabled] = useState(false)
  const [forcedDice, setForcedDice] = useState<[number, number]>([3, 4])
  const [devEventCardId, setDevEventCardId] = useState('blackout')
  const [devArmedEventCardId, setDevArmedEventCardId] = useState('')
  const [devDestinationId, setDevDestinationId] = useState('0')
  const [devCashTargetSessionId, setDevCashTargetSessionId] = useState('')
  const [devCashAmount, setDevCashAmount] = useState(String(START_BONUS * 10))
  const [dice, setDice] = useState<[number, number]>([0, 0])
  const [landingDescription, setLandingDescription] = useState('')
  const [activeCardTitle, setActiveCardTitle] = useState('')
  const [activeCardDescription, setActiveCardDescription] = useState('')
  const [activeCardId, setActiveCardId] = useState('')
  const [activeCardUserName, setActiveCardUserName] = useState('')
  const [dismissedRevealKey, setDismissedRevealKey] = useState('')
  const [revealSnapshot, setRevealSnapshot] = useState<{ key: string; kind: 'event' | 'world-cup' | 'world-tour'; cardId: string; title: string; description: string; noTarget: boolean } | null>(null)
  const [pendingPropertyId, setPendingPropertyId] = useState(255)
  const [worldCupSpaceId, setWorldCupSpaceId] = useState(255)
  const [worldCupHostCount, setWorldCupHostCount] = useState(0)
  const worldCupMultiplier = getWorldCupRentMultiplier(worldCupHostCount)
  const [festivalSpaceIds, setFestivalSpaceIds] = useState<number[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null)
  const [selectedCardPropertyId, setSelectedCardPropertyId] = useState<number | null>(null)
  const [debtAmount, setDebtAmount] = useState(0)
  const [debtReason, setDebtReason] = useState('')
  const [debtCreditorSessionId, setDebtCreditorSessionId] = useState('')
  const [winnerSessionId, setWinnerSessionId] = useState('')
  const [matchEndReason, setMatchEndReason] = useState<MatchEndReason | ''>('')
  const [showPropertyPanel, setShowPropertyPanel] = useState(false)
  const [portfolioBoardSelection, setPortfolioBoardSelection] = useState(false)
  const [selectedPlayerSessionId, setSelectedPlayerSessionId] = useState('')
  const [showAuctionPanel, setShowAuctionPanel] = useState(false)
  const previousAuctionIdRef = useRef(0)
  const [showHelp, setShowHelp] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [cameraMode, setCameraMode] = useState<'board' | 'player'>('board')
  const [showEmotePicker, setShowEmotePicker] = useState(false)
  const [throwPickerTargetSessionId, setThrowPickerTargetSessionId] = useState('')
  const [throwCooldowns, setThrowCooldowns] = useState<Record<string, number>>({})
  const [throwCooldownNow, setThrowCooldownNow] = useState(Date.now())
  const [thrownObjects, setThrownObjects] = useState<ThrowableEvent[]>([])
  const [earthquakeEvents, setEarthquakeEvents] = useState<EarthquakeEvent[]>([])
  const [cityEffectEvents, setCityEffectEvents] = useState<CityEffectEvent[]>([])
  const [doublesAnnouncementVisible, setDoublesAnnouncementVisible] = useState(false)
  const [throwImpacts, setThrowImpacts] = useState<ThrowableEvent[]>([])
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(DEFAULT_GRAPHICS_QUALITY)
  const [playerEmotes, setPlayerEmotes] = useState<Record<string, { emote: PlayerEmote; sequence: number }>>({})
  const [auctionSeconds, setAuctionSeconds] = useState(0)
  const [auctionId, setAuctionId] = useState(0)
  const [auctionPropertyId, setAuctionPropertyId] = useState(255)
  const [auctionSellerSessionId, setAuctionSellerSessionId] = useState('')
  const [auctionStartingBid, setAuctionStartingBid] = useState(0)
  const [auctionHighestBid, setAuctionHighestBid] = useState(0)
  const [auctionHighestBidderSessionId, setAuctionHighestBidderSessionId] = useState('')
  const [auctionPhase, setAuctionPhase] = useState('')
  const [auctionBidAmount, setAuctionBidAmount] = useState('10000')
  const [auctionStartingBids, setAuctionStartingBids] = useState<Record<number, string>>({})
  const [room, setRoom] = useState<Room | null>(null)
  const [firstSwapTargetId, setFirstSwapTargetId] = useState('')
  const [roomPlayers, setRoomPlayers] = useState<SyncedPlayer[]>([])
  const localSessionId = roomPlayers.find((player) => player.controllerSessionId === room?.sessionId)?.sessionId ?? room?.sessionId ?? ''
  const [roomProperties, setRoomProperties] = useState<Map<string, PropertyHolding>>(new Map())
  const [isHost, setIsHost] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const activeRoom = useRef<Room | null>(null)
  const recoveringRoom = useRef<Room | null>(null)
  const autoReconnectAttempted = useRef(false)
  const fpsSamples = useRef(createFrameRateAccumulator())
  const previousFeedbackSnapshot = useRef<{ description: string; diceSequence: number; turnPhase: TurnPhase; players: Map<string, { cash: number; position: number }>; properties: Map<string, PropertyHolding> } | null>(null)
  const pendingLandingSound = useRef<GameSound | null>(null)
  const emoteSequence = useRef(0)
  const emoteTimeouts = useRef(new Map<string, number>())
  const throwTimeouts = useRef(new Map<number, number>())
  const impactTimeouts = useRef(new Map<number, number>())
  const earthquakeTimeouts = useRef(new Map<number, number>())
  useEffect(() => {
    if (autoReconnectAttempted.current || inviteRoomCode) return
    autoReconnectAttempted.current = true
    const lastRoom = readLastRoom(getLocalStorage())
    if (!lastRoom) return
    setIsConnecting(true)
    setIsReconnecting(true)
    void recoverRoomAfterRetries(
      () => lastRoom.reconnectionToken ? roomClient.reconnect(lastRoom.reconnectionToken) : Promise.reject(new Error('No saved token')),
      () => roomClient.joinById(lastRoom.roomCode, { name: lastRoom.name }),
    ).then(({ room: recovered }) => {
      if (recovered) {
        setName(lastRoom.name)
        connectToRoom(recovered, lastRoom.name)
      } else {
        setError('Não foi possível retomar a última sala. Confira o código e o nome ou entre em outra sala.')
      }
    }).finally(() => {
      setIsConnecting(false)
      setIsReconnecting(false)
    })
  }, [inviteRoomCode])
  useEffect(() => {
    setSelectedCardPropertyId(null)
    setFirstSwapTargetId('')
  }, [activeCardId])
  useEffect(() => {
    if (turnPhase === 'debt') {
      setShowPropertyPanel(false)
      setPortfolioBoardSelection(false)
    }
  }, [turnPhase])
  const soundEnabledRef = useRef(soundEnabled)
  soundEnabledRef.current = soundEnabled
  const activePlayer = roomPlayers.find((player) => player.sessionId === activePlayerSessionId)
  const activeSpace = boardSpaces[activePlayer?.position ?? 0]
  const isMyTurn = localSessionId === activePlayerSessionId
  const destinationSpaceId = getDiceDestinationSpaceId(turnPhase, activePlayer?.position ?? -1, dice, landingDescription) ?? -1
  const isPresentationAnimating = turnPhase === 'rolling' || turnPhase === 'moving'
  const turnActivityLabel = getTurnActivityLabel(turnPhase)
  const showTurnCard = shouldShowTurnCard(isMyTurn, turnPhase, Boolean(activeCardTitle), isPresentationAnimating)
  const feedbackPending = feedbackQueue.length > 0
  const animationSpeedControl = isHost && turnPhase !== 'ended' ? <div className="animation-speed-control" role="group" aria-label="Velocidade das animações da sala" title="Vale nas próximas animações"><span>RITMO</span><div>{ANIMATION_SPEEDS.map((speed) => <button key={speed} type="button" aria-pressed={animationSpeed === speed} onClick={() => room?.send('setAnimationSpeed', { speed })}>{speed.toLocaleString('pt-BR')}×</button>)}</div></div> : null
  const playerTokens = roomPlayers.length > 0
    ? roomPlayers.flatMap((player, seatIndex) => player.isBankrupt ? [] : [{ id: player.sessionId, position: player.position, color: player.color ?? PLAYER_COLORS[seatIndex] ?? PLAYER_COLORS[0], seatIndex, cash: player.cash, characterType: player.characterType, activity: player.sessionId === activePlayerSessionId && !isMyTurn ? turnActivityLabel : '', emote: playerEmotes[player.sessionId] }])
    : [0, 3, 6, 9].map((position, seatIndex) => ({ id: `preview-${seatIndex}`, position, color: PLAYER_COLORS[seatIndex] ?? PLAYER_COLORS[0], seatIndex, cash: 1_500_000, characterType: 'pawn' as CharacterType }))
  const auctionSeller = roomPlayers.find((player) => player.sessionId === auctionSellerSessionId)
  const auctionHighBidder = roomPlayers.find((player) => player.sessionId === auctionHighestBidderSessionId)
  const auctionMinimumBid = auctionHighestBid > 0 ? auctionHighestBid + AUCTION_MIN_BID_INCREMENT : auctionStartingBid
  const isAuctionSeller = auctionSellerSessionId === localSessionId
  const holdingsById = new Map(Array.from(roomProperties.entries()).map(([id, holding]) => [Number(id), holding]))
  const localPlayer = roomPlayers.find((player) => player.sessionId === localSessionId)
  const devCashTarget = roomPlayers.find((player) => player.sessionId === devCashTargetSessionId) ?? activePlayer ?? localPlayer
  const availableCash = (player: SyncedPlayer | undefined) => player?.devInfiniteCash ? 2_147_483_647 : player?.cash ?? 0
  const auctionBidMaximum = availableCash(localPlayer) + (auctionHighestBidderSessionId === localSessionId ? auctionHighestBid : 0)
  const pendingPurchaseSpace = boardSpaces[pendingPropertyId]
  const pendingBuybackHolding = holdingsById.get(pendingPropertyId)
  const pendingBuybackPrice = pendingBuybackHolding ? forcedBuybackCost(pendingPropertyId, pendingBuybackHolding.houses) : 0
  const worldTourChoices = boardSpaces.filter((space) => space.id !== 30 && (space.kind !== 'property' || !holdingsById.get(space.id)?.ownerSessionId || holdingsById.get(space.id)?.ownerSessionId === localSessionId))
  const pendingPurchaseHousesCost = pendingPurchaseSpace?.buildable ? pendingPurchaseHouses * constructionCost(pendingPurchaseSpace.id) : 0
  const pendingPurchasePrice = (pendingPurchaseSpace?.price ?? 0) + pendingPurchaseHousesCost
  const worldCupChoices = boardSpaces.filter((space) => space.kind === 'property' && roomProperties.get(String(space.id))?.ownerSessionId === activePlayerSessionId)
  const canAffordPendingPurchase = canAffordPurchase(availableCash(localPlayer), pendingPurchasePrice)
  const myProperties = Array.from(roomProperties.entries())
    .filter(([_, holding]) => holding.ownerSessionId === localSessionId)
    .map(([id, holding]) => ({ spaceId: Number(id), holding, space: boardSpaces[Number(id)] }))
    .filter((entry) => entry.space)
    .sort((first, second) => first.spaceId - second.spaceId)
  const propertyTargetCard = ['generous', 'blackout', 'earthquake', 'protection'].includes(activeCardId)
  const cardPropertyChoices = Array.from(roomProperties.entries())
    .filter(([id, holding]) => {
      if (!holding.ownerSessionId || (holding.protectionTurns ?? 0) > 0 || !boardSpaces[Number(id)]?.buildable) return false
      if (activeCardId === 'generous' || activeCardId === 'protection') return holding.ownerSessionId === localSessionId
      return holding.ownerSessionId !== localSessionId && holding.houses !== PROPERTY_HOTEL_LEVEL
    })
    .map(([id]) => Number(id))
  const debtPropertyChoices = liquidatablePropertyIds(localSessionId ?? '', holdingsById)
  const boardChoicePhase = turnPhase === 'world-cup' && isMyTurn
    ? 'world-cup'
    : turnPhase === 'world-tour' && isMyTurn
      ? 'world-tour'
      : turnPhase === 'card-target' && isMyTurn && propertyTargetCard && (activeCardId !== 'generous' || selectedCardPropertyId === null)
        ? 'card-property'
        : turnPhase === 'debt' && isMyTurn
          ? 'debt-property'
          : portfolioBoardSelection && turnPhase !== 'debt'
            ? 'manage-property'
            : null
  const boardChoiceSpaceIds = boardChoicePhase === 'world-cup'
    ? worldCupChoices.map((space) => space.id)
    : boardChoicePhase === 'world-tour'
      ? worldTourChoices.map((space) => space.id)
      : boardChoicePhase === 'card-property'
        ? cardPropertyChoices
        : boardChoicePhase === 'debt-property'
          ? debtPropertyChoices
          : boardChoicePhase === 'manage-property'
            ? myProperties.map(({ spaceId }) => spaceId)
              : []
  const selectedPlayerPropertySpaceIds = getOwnedPropertySpaceIds(selectedPlayerSessionId, Array.from(roomProperties.entries()).map(([id, holding]) => ({
    spaceId: Number(id),
    ownerSessionId: holding.ownerSessionId,
    isProperty: boardSpaces[Number(id)]?.kind === 'property',
  })))
  const playerHighlightMode = shouldShowPlayerInspection(selectedPlayerSessionId, turnPhase, Boolean(boardChoicePhase))
  const inspectedPlayer = playerHighlightMode ? roomPlayers.find((player) => player.sessionId === selectedPlayerSessionId) : undefined
  const highlightedSpaceIds = boardChoicePhase
    ? boardChoiceSpaceIds
    : turnPhase === 'purchase'
      ? [pendingPropertyId, ...(selectedSpaceId === null ? [] : [selectedSpaceId])]
      : turnPhase === 'card-target' && activeCardId === 'generous' && selectedCardPropertyId !== null
        ? [selectedCardPropertyId]
        : playerHighlightMode
          ? selectedPlayerPropertySpaceIds
          : selectedSpaceId === null ? [] : [selectedSpaceId]
  useEffect(() => {
    if (boardChoicePhase) {
      setSelectedSpaceId(null)
      setSelectedPlayerSessionId('')
    }
  }, [boardChoicePhase])
  const landedHolding = activePlayer && activeSpace.kind === 'property' ? holdingsById.get(activeSpace.id) : undefined
  const ownPropertyLanding = ['resolve', 'buyback-upgrade'].includes(turnPhase) && activeSpace.kind === 'property' && Boolean(activeSpace.buildable) && pendingPropertyId === activeSpace.id && landedHolding?.ownerSessionId === activePlayerSessionId && Boolean(activePlayer && landedHolding && (landedHolding.houses === PROPERTY_BUILD_LEVELS
    ? activePlayer.hasCompletedFirstLap && canBuildHotel(activeSpace.id, activePlayerSessionId, holdingsById, availableCash(activePlayer))
    : [1, 2, 3].some((level) => level > landedHolding.houses && canBuildLevelAfterFirstLap(activePlayer.hasCompletedFirstLap, level) && canBuildProperty(activeSpace.id, activePlayerSessionId, holdingsById, availableCash(activePlayer), level))))
  const canBuildSelected = activePlayer && ownPropertyLanding ? canBuildLevelAfterFirstLap(Boolean(activePlayer.hasCompletedFirstLap), targetBuildHouses) && canBuildProperty(activeSpace.id, activePlayerSessionId, holdingsById, availableCash(activePlayer), targetBuildHouses) : false
  const canBuildHotelHere = activePlayer && ownPropertyLanding ? Boolean(activePlayer.hasCompletedFirstLap) && canBuildHotel(activeSpace.id, activePlayerSessionId, holdingsById, availableCash(activePlayer)) : false
  const festivalSet = new Set(festivalSpaceIds)
  const purchaseRentOwnership = new Map(Array.from(roomProperties.entries()).map(([id, holding]) => [Number(id), holding.ownerSessionId]))
  if (pendingPurchaseSpace?.kind === 'property') purchaseRentOwnership.set(pendingPurchaseSpace.id, '__preview__')
  const pendingPurchaseRent = pendingPurchaseSpace?.kind === 'property'
    ? pendingPurchaseSpace.company ? calculateCompanyRent(purchaseRentOwnership, '__preview__') : calculateRent(pendingPurchaseSpace.id, purchaseRentOwnership, pendingPurchaseHouses, worldCupSpaceId, festivalSet, worldCupMultiplier)
    : 0
  const revealKind: 'event' | 'world-cup' | 'world-tour' | null = activeCardTitle && ['resolve', 'card-target', 'moving', 'debt', 'world-cup', 'world-tour'].includes(turnPhase)
    ? 'event'
    : turnPhase === 'world-cup'
      ? 'world-cup'
      : turnPhase === 'world-tour'
        ? 'world-tour'
        : null
  const revealKey = revealKind ? `${turnNumber}:${activePlayerSessionId}:${revealKind}:${activeCardTitle}` : ''
  const cardHasNoTarget = turnPhase === 'card-target' && (propertyTargetCard && cardPropertyChoices.length === 0 || activeCardId === 'thief' && !roomPlayers.some((candidate) => candidate.sessionId !== localSessionId && !candidate.isBankrupt) || (activeCardId === 'swap' || activeCardId === 'communism') && roomPlayers.filter((candidate) => !candidate.isBankrupt).length < 2)
  const visibleReveal = revealKind ? { key: revealKey, kind: revealKind, cardId: activeCardId, title: activeCardTitle, description: activeCardDescription, noTarget: cardHasNoTarget || (revealSnapshot?.key === revealKey && revealSnapshot.noTarget) } : revealSnapshot
  const showTransientReveal = Boolean(visibleReveal && visibleReveal.key !== dismissedRevealKey)
  useEffect(() => {
    if (revealKind && revealKey) setRevealSnapshot({ key: revealKey, kind: revealKind, cardId: activeCardId, title: activeCardTitle, description: activeCardDescription, noTarget: cardHasNoTarget })
  }, [revealKey])
  const selectingPlayer = isMyTurn && turnPhase === 'card-target' && !showTransientReveal && (activeCardId === 'thief' || activeCardId === 'swap' || activeCardId === 'communism' || activeCardId === 'generous' && selectedCardPropertyId !== null)
  const companyDieResultVisible = dice[0] > 0 && dice[1] === 0 && ['resolve', 'debt', 'buyback'].includes(turnPhase)
  const showDice = shouldShowRolledDice(turnPhase, diceForPawnMovement) || companyDieResultVisible
  const boardSelectionGuidanceActive = isBoardSelectionGuidanceActive(Boolean(boardChoicePhase && boardChoiceSpaceIds.length > 0), showTransientReveal)
  const modalVisible = !isPresentationAnimating && (showAuctionPanel && turnPhase !== 'debt' || (!boardSelectionGuidanceActive && showPropertyPanel) || showTransientReveal || (!boardSelectionGuidanceActive && isMyTurn && (turnPhase === 'purchase' || turnPhase === 'buyback' || turnPhase === 'start-upgrade' || turnPhase === 'card-target' || ownPropertyLanding || turnPhase === 'ended')))
  const propertyBuildings = Array.from(roomProperties.entries()).map(([id, holding]) => ({
    spaceId: Number(id),
    ownerSessionId: holding.ownerSessionId,
    houses: holding.houses,
    blackoutTurns: holding.blackoutTurns ?? 0,
    protectionTurns: holding.protectionTurns ?? 0,
    ownerColor: roomPlayers.find((player) => player.sessionId === holding.ownerSessionId)?.color ?? PLAYER_COLORS[Math.max(0, roomPlayers.findIndex((player) => player.sessionId === holding.ownerSessionId))] ?? PLAYER_COLORS[0],
  }))
  const selectedSpace = selectedSpaceId === null ? undefined : boardSpaces[selectedSpaceId]
  const selectedHolding = selectedSpaceId === null ? undefined : roomProperties.get(String(selectedSpaceId))
  const selectedOwner = selectedHolding?.ownerSessionId
    ? roomPlayers.find((player) => player.sessionId === selectedHolding.ownerSessionId)
    : undefined
  const rentOwnership = new Map(Array.from(roomProperties.entries()).map(([id, holding]) => [Number(id), holding.ownerSessionId]))
  if (selectedSpace?.kind === 'property' && !selectedHolding?.ownerSessionId) rentOwnership.set(selectedSpace.id, '__preview__')
  const selectedRent = selectedSpace?.kind === 'property'
    ? selectedSpace.company ? calculateCompanyRent(rentOwnership, selectedHolding?.ownerSessionId || '__preview__') * (selectedSpace.id === worldCupSpaceId ? worldCupMultiplier : 1) : selectedHolding?.blackoutTurns && selectedHolding.houses !== PROPERTY_HOTEL_LEVEL ? 0 : calculateRent(selectedSpace.id, rentOwnership, selectedHolding?.houses ?? 0, worldCupSpaceId, festivalSet, worldCupMultiplier)
    : 0
  const selectedAuctionStartingBid = selectedSpace ? Number(auctionStartingBids[selectedSpace.id] ?? selectedSpace.price ?? 0) : 0
  const auctionStartBlockReason = selectedSpace?.kind === 'property' && selectedOwner?.sessionId === localSessionId
    ? getAuctionStartBlockReason(selectedAuctionStartingBid, auctionId > 0)
    : null
  function showGameFeedback(message: string, sound: GameSound, player?: { name: string; color: string }) {
    void message
    void player
    if (soundEnabledRef.current) playGameSound(sound)
  }

  function choosePlayerCard(player: SyncedPlayer) {
    if (selectingPlayer) {
      if (player.isBankrupt || (activeCardId !== 'swap' && activeCardId !== 'communism' && player.sessionId === localSessionId)) return
      if (activeCardId === 'swap' || activeCardId === 'communism') {
        if (!firstSwapTargetId) setFirstSwapTargetId(player.sessionId)
        else if (firstSwapTargetId === player.sessionId) setFirstSwapTargetId('')
        else room?.send('resolveCardTarget', { targetSessionId: firstSwapTargetId, secondSessionId: player.sessionId })
      } else room?.send('resolveCardTarget', { targetSessionId: player.sessionId, ...(activeCardId === 'generous' ? { propertyId: selectedCardPropertyId } : {}) })
      return
    }
    setSelectedPlayerSessionId((current) => current === player.sessionId ? '' : player.sessionId)
    setShowPropertyPanel(false)
    setPortfolioBoardSelection(false)
    setShowAuctionPanel(false)
    setSelectedSpaceId(null)
    setError('')
  }

  function stepAuctionBid(propertyId: number, direction: -1 | 1) {
    setAuctionStartingBids((current) => {
      const currentValue = current[propertyId] ?? String(boardSpaces[propertyId]?.price ?? AUCTION_MIN_BID_INCREMENT)
      return { ...current, [propertyId]: adjustAuctionStartingBid(currentValue, direction, AUCTION_MIN_BID_INCREMENT) }
    })
  }


  useEffect(() => {
    if (!showTransientReveal || !visibleReveal) return
    const timeout = window.setTimeout(() => {
      setDismissedRevealKey(visibleReveal.key)
      if (visibleReveal.kind === 'event' && isMyTurn && turnPhase === 'card-target') room?.send('dismissCardReveal')
    }, CARD_REVEAL_SECONDS * 1000)
    return () => window.clearTimeout(timeout)
  }, [visibleReveal?.key, showTransientReveal])

  useEffect(() => {
    if (sceneReady || screen === 'game') {
      setSceneReady(true)
      return
    }

    return scheduleSceneLoad(() => setSceneReady(true))
  }, [sceneReady, screen])

  useEffect(() => {
    if (!showHelp) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowHelp(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showHelp])

  useEffect(() => {
    setPendingPurchaseHouses(0)
  }, [pendingPropertyId])

  useEffect(() => {
    if (turnPhase === 'world-cup' || turnPhase === 'world-tour') {
      setShowPropertyPanel(false)
      setShowAuctionPanel(false)
    }
    if (turnPhase === 'debt') {
      setShowPropertyPanel(false)
      setShowAuctionPanel(false)
    }
  }, [turnPhase])

  useEffect(() => {
    if (turnPhase !== 'ended') return
    setPresentationStage('idle')
    setFeedbackQueue([])
    setShowPropertyPanel(false)
    setPortfolioBoardSelection(false)
    setSelectedPlayerSessionId('')
    setShowAuctionPanel(false)
    setShowHelp(false)
    setShowOptions(false)
    setShowEmotePicker(false)
    setSelectedSpaceId(null)
  }, [turnPhase])

  useEffect(() => {
    if (!landedHolding || landedHolding.houses >= PROPERTY_BUILD_LEVELS) return
    const nextAffordable = [1, 2, 3].find((level) => level > landedHolding.houses && canBuildLevelAfterFirstLap(Boolean(localPlayer?.hasCompletedFirstLap), level) && availableCash(localPlayer) >= (level - landedHolding.houses) * constructionCost(activeSpace.id))
    setTargetBuildHouses(nextAffordable ?? landedHolding.houses + 1)
  }, [activeSpace.id, landedHolding?.houses, localPlayer?.cash, localPlayer?.hasCompletedFirstLap])

  useEffect(() => {
    if (!showOptions) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowOptions(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showOptions])

  useEffect(() => () => {
    emoteTimeouts.current.forEach((timer) => window.clearTimeout(timer))
    emoteTimeouts.current.clear()
    throwTimeouts.current.forEach((timer) => window.clearTimeout(timer))
    throwTimeouts.current.clear()
    impactTimeouts.current.forEach((timer) => window.clearTimeout(timer))
    impactTimeouts.current.clear()
    earthquakeTimeouts.current.forEach((timer) => window.clearTimeout(timer))
    earthquakeTimeouts.current.clear()
  }, [])

  useEffect(() => {
    if (!Object.keys(throwCooldowns).length) return
    const interval = window.setInterval(() => setThrowCooldownNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [throwCooldowns])

  useEffect(() => {
    if (!room) return

    const updateLobby = (state: unknown) => {
      const playerEntries = getLobbyPlayerEntries<Omit<SyncedPlayer, 'sessionId'>>(state)
      if (!playerEntries) return

      const snapshot = state as {
        players: Map<string, Omit<SyncedPlayer, 'sessionId'>>
        roomCode: string
        mode: Mode
        matchDuration: MatchDuration
        status: 'waiting' | 'playing' | 'ended'
        animationSpeed: AnimationSpeed
        devToolsEnabled: boolean
        presentationSpeed: AnimationSpeed
        activePlayerSessionId: string
        properties: Map<string, PropertyHolding>
        turnNumber: number
        turnSeconds: number
        matchSeconds: number
        matchEnding: boolean
        turnPhase: TurnPhase
        diceOne: number
        diceTwo: number
        diceSequence: number
        pawnMoveMode: string
        landingDescription: string
        activeCardTitle: string
        activeCardDescription: string
        activeCardId: string
        activeCardUserName: string
        pendingPropertyId: number
        festivalSpaceIds: string
        worldCupSpaceId: number
        worldCupHostCount: number
        debtAmount: number
        debtReason: string
        debtCreditorSessionId: string
        winnerSessionId: string
        matchEndReason: MatchEndReason | ''
        auctionId: number
        auctionPropertyId: number
        auctionSellerSessionId: string
        auctionStartingBid: number
        auctionHighestBid: number
        auctionHighestBidderSessionId: string
        auctionPhase: string
        auctionSeconds: number
      }
      const nextPlayers = playerEntries.map(([sessionId, player]) => ({ ...player, sessionId }))
      const previous = previousFeedbackSnapshot.current
      const nextPlayerFacts = new Map(nextPlayers.map((player) => [player.sessionId, { cash: player.cash, position: player.position }]))
      const nextPropertyFacts = new Map(snapshot.properties.entries())
      if (previous) {
        const propertyChange = Array.from(nextPropertyFacts.entries())
          .map(([id, holding]) => getPropertyVisualChange(previous.properties.get(id), holding))
          .find((change) => change !== null) ?? null
        const propertySound = propertyChange ? getPropertyChangeSound(propertyChange) : null
        const movedPlayer = nextPlayers.find((player) => previous.players.get(player.sessionId)?.position !== undefined && previous.players.get(player.sessionId)?.position !== player.position)
        if (movedPlayer) {
          pendingLandingSound.current = getLandingSpecialSound(movedPlayer.position)
          setLandingPulseSpaceId(movedPlayer.position)
          setLandingPulseSequence((sequence) => sequence + 1)
        }
        if (previous.turnPhase === 'moving' && snapshot.turnPhase !== 'moving') {
          if (soundEnabled && pendingLandingSound.current) playGameSound(pendingLandingSound.current)
          pendingLandingSound.current = null
        }
        const buildingChanged = Array.from(nextPropertyFacts.entries()).find(([id, holding]) => holding.houses !== (previous.properties.get(id)?.houses ?? 0))
        if (buildingChanged) {
          setLandingPulseSpaceId(Number(buildingChanged[0]))
          setLandingPulseSequence((sequence) => sequence + 1)
        }
        const didRoll = snapshot.diceSequence > previous.diceSequence
        if (didRoll) {
          setDiceRollSequence((sequence) => sequence + 1)
          setDiceForPawnMovement(true)
          const active = snapshot.players.get(snapshot.activePlayerSessionId)
          if (snapshot.diceOne === snapshot.diceTwo && !active?.isJailed && !snapshot.landingDescription.includes('três vezes seguidas')) {
            setDoublesAnnouncementVisible(true)
            window.setTimeout(() => setDoublesAnnouncementVisible(false), 2200)
          }
        } else if (!['rolling', 'moving'].includes(snapshot.turnPhase)) {
          setDiceForPawnMovement(false)
        }
        if (reducedMotion) setPresentationStage('idle')
        else if (snapshot.turnPhase === 'rolling') setPresentationStage('dice')
        else if (snapshot.turnPhase === 'moving') setPresentationStage('pawn')
        else setPresentationStage('idle')
        if (snapshot.landingDescription && snapshot.landingDescription !== previous.description) {
          const localCashDelta = (nextPlayerFacts.get(localSessionId)?.cash ?? 0) - (previous.players.get(localSessionId)?.cash ?? 0)
          const delta = formatCashDelta(localCashDelta)
          const cashSound = localCashDelta > 0 ? 'money-in' : localCashDelta < 0 ? 'money-out' : null
          const cashChanged = nextPlayers.some((player) => player.cash !== previous.players.get(player.sessionId)?.cash)
          const actor = nextPlayers.find((player) => player.sessionId === snapshot.activePlayerSessionId)
          const actorSeat = nextPlayers.findIndex((player) => player.sessionId === snapshot.activePlayerSessionId)
          const actorColor = actor?.color ?? PLAYER_COLORS[actorSeat] ?? PLAYER_COLORS[0]
          showGameFeedback(`${snapshot.landingDescription}${delta ? ` · ${delta}` : ''}`, cashSound ?? propertySound ?? (cashChanged ? 'none' : getGameSound(snapshot.landingDescription)), actor ? { name: actor.name, color: actorColor } : undefined)
          if (cashSound && propertySound === 'construction' && soundEnabled) playGameSound('construction')
        } else if (nextPlayers.some((player) => player.sessionId === localSessionId && player.cash !== previous.players.get(player.sessionId)?.cash)) {
          const localCashDelta = (nextPlayerFacts.get(localSessionId)?.cash ?? 0) - (previous.players.get(localSessionId)?.cash ?? 0)
          if (soundEnabled && localCashDelta !== 0) playGameSound(localCashDelta > 0 ? 'money-in' : 'money-out')
        } else if (propertySound && soundEnabled) {
          playGameSound(propertySound)
        } else if (didRoll && soundEnabled) {
          playGameSound('dice')
        }
      }
      previousFeedbackSnapshot.current = { description: snapshot.landingDescription, diceSequence: snapshot.diceSequence, turnPhase: snapshot.turnPhase, players: nextPlayerFacts, properties: nextPropertyFacts }
      setRoomPlayers((current) => areRecordArraysEqual(current, nextPlayers) ? current : nextPlayers)
      const nextProperties = new Map(snapshot.properties.entries())
      setRoomProperties((current) => areRecordMapsEqual(current, nextProperties) ? current : nextProperties)
      setRoomCode(snapshot.roomCode)
      setMode(snapshot.mode)
      setMatchDuration(snapshot.matchDuration)
      setAnimationSpeed(snapshot.animationSpeed)
      setDevModeEnabled(snapshot.devToolsEnabled)
      setPresentationSpeed(snapshot.presentationSpeed)
      const ownPlayer = Array.from(snapshot.players.entries()).find(([, player]) => player.controllerSessionId === room.sessionId)?.[1]
      setIsHost(ownPlayer?.isHost ?? snapshot.players.get(localSessionId)?.isHost ?? false)
      setActivePlayerSessionId(snapshot.activePlayerSessionId)
      setDevCashTargetSessionId((current) => snapshot.players.has(current) ? current : snapshot.activePlayerSessionId)
      setTurnNumber(snapshot.turnNumber)
      setTurnSeconds(snapshot.turnSeconds)
      setMatchSeconds(snapshot.matchSeconds)
      setMatchEnding(snapshot.matchEnding)
      setTurnPhase(snapshot.turnPhase)
      setPawnMoveMode(snapshot.pawnMoveMode === 'teleport' ? 'teleport' : 'walk')
      setDice((current) => {
        const next = [snapshot.diceOne, snapshot.diceTwo] as [number, number]
        return areNumberPairsEqual(current, next) ? current : next
      })
      setLandingDescription(snapshot.landingDescription)
      setActiveCardTitle(snapshot.activeCardTitle)
      setActiveCardDescription(snapshot.activeCardDescription)
      setActiveCardId(snapshot.activeCardId)
      setActiveCardUserName(snapshot.activeCardUserName)
      setPendingPropertyId(snapshot.pendingPropertyId)
      setFestivalSpaceIds(parseSpaceIdList(snapshot.festivalSpaceIds))
      setWorldCupSpaceId(snapshot.worldCupSpaceId)
      setWorldCupHostCount(snapshot.worldCupHostCount)
      setDebtAmount(snapshot.debtAmount)
      setDebtReason(snapshot.debtReason)
      setDebtCreditorSessionId(snapshot.debtCreditorSessionId)
      setWinnerSessionId(snapshot.winnerSessionId)
      setMatchEndReason(snapshot.matchEndReason)
      setAuctionId(snapshot.auctionId)
      setAuctionPropertyId(snapshot.auctionPropertyId)
      setAuctionSellerSessionId(snapshot.auctionSellerSessionId)
      setAuctionStartingBid(snapshot.auctionStartingBid)
      setAuctionHighestBid(snapshot.auctionHighestBid)
      setAuctionHighestBidderSessionId(snapshot.auctionHighestBidderSessionId)
      setAuctionPhase(snapshot.auctionPhase)
      setAuctionSeconds(snapshot.auctionSeconds)
      if (shouldOpenAuctionPanel(previousAuctionIdRef.current, snapshot.auctionId)) {
        setShowAuctionPanel(true)
        setShowPropertyPanel(false)
      }
      previousAuctionIdRef.current = snapshot.auctionId
      if (snapshot.status === 'playing' || snapshot.status === 'ended') setScreen('game')
    }
    const handleRoomError = (payload: { message: string }) => {
      setError(payload.message)
      setDevArmedEventCardId('')
    }
    const removeDevCardArmedMessage = room.onMessage<{ cardId?: unknown }>('game:dev-card-armed', (payload) => {
      if (typeof payload?.cardId === 'string' && EVENT_CARDS.some((card) => card.id === payload.cardId)) setDevArmedEventCardId(payload.cardId)
    })
    const removeDevCardUsedMessage = room.onMessage<{ cardId?: unknown }>('game:dev-card-used', (payload) => {
      if (typeof payload?.cardId === 'string') setDevArmedEventCardId((current) => current === payload.cardId ? '' : current)
    })
    const handleDrop = () => setIsReconnecting(true)
    const handleReconnect = () => {
      setIsReconnecting(false)
      const playerName = readLastRoom(getLocalStorage())?.name ?? name.trim()
      saveLastRoom(getLocalStorage(), { roomCode: room.roomId, name: playerName, reconnectionToken: room.reconnectionToken })
    }
    const handlePlayerEmote = (payload: { sessionId?: unknown; emote?: unknown }) => {
      if (typeof payload?.sessionId !== 'string' || !isPlayerEmote(payload.emote)) return
      const sessionId = payload.sessionId
      const emote = payload.emote
      const sequence = ++emoteSequence.current
      setPlayerEmotes((current) => ({ ...current, [sessionId]: { emote, sequence } }))
      const oldTimer = emoteTimeouts.current.get(sessionId)
      if (oldTimer !== undefined) window.clearTimeout(oldTimer)
      const timer = window.setTimeout(() => {
        setPlayerEmotes((current) => current[sessionId]?.sequence === sequence ? Object.fromEntries(Object.entries(current).filter(([id]) => id !== sessionId)) : current)
        emoteTimeouts.current.delete(sessionId)
      }, 2600)
      emoteTimeouts.current.set(sessionId, timer)
    }
    const removePlayerEmoteMessage = room.onMessage<{ sessionId: string; emote: PlayerEmote }>('game:emote', handlePlayerEmote)
    const handleThrowable = (payload: { id?: unknown; fromSessionId?: unknown; toSessionId?: unknown; object?: unknown }) => {
      if (typeof payload?.id !== 'number' || typeof payload.fromSessionId !== 'string' || typeof payload.toSessionId !== 'string' || !isThrowableObject(payload.object)) return
      const event = { id: payload.id, fromSessionId: payload.fromSessionId, toSessionId: payload.toSessionId, object: payload.object }
      setThrownObjects((current) => [...current.filter((item) => item.id !== event.id), event])
      const projectileTimer = window.setTimeout(() => {
        setThrownObjects((current) => current.filter((item) => item.id !== event.id))
        throwTimeouts.current.delete(event.id)
      }, THROW_PROJECTILE_DURATION_MS)
      throwTimeouts.current.set(event.id, projectileTimer)
      if (event.toSessionId === localSessionId) {
        const impactStartTimer = window.setTimeout(() => {
          setThrowImpacts((current) => [...current.filter((item) => item.id !== event.id), event])
          const impactEndTimer = window.setTimeout(() => {
            setThrowImpacts((current) => current.filter((item) => item.id !== event.id))
            impactTimeouts.current.delete(event.id)
          }, THROW_IMPACT_DURATION_MS)
          impactTimeouts.current.set(event.id, impactEndTimer)
        }, THROW_PROJECTILE_DURATION_MS)
        impactTimeouts.current.set(event.id, impactStartTimer)
      }
    }
    const removeThrowableMessage = room.onMessage<ThrowableEvent>('game:throw', handleThrowable)
    const handleEarthquake = (event: EarthquakeEvent) => {
      if (!Number.isInteger(event?.id) || !Number.isInteger(event?.spaceId)) return
      setEarthquakeEvents((current) => [...current.filter((item) => item.id !== event.id), event])
      if (soundEnabled) playGameSound('earthquake')
      const previousTimer = earthquakeTimeouts.current.get(event.id)
      if (previousTimer !== undefined) window.clearTimeout(previousTimer)
      const timer = window.setTimeout(() => {
        setEarthquakeEvents((current) => current.filter((item) => item.id !== event.id))
        earthquakeTimeouts.current.delete(event.id)
      }, 1600)
      earthquakeTimeouts.current.set(event.id, timer)
    }
    const removeEarthquakeMessage = room.onMessage<EarthquakeEvent>('game:earthquake', handleEarthquake)
    const cityEffectTimeouts = new Map<number, number>()
    const removeCityEffectMessage = room.onMessage<CityEffectEvent>('game:city-effect', (event) => {
      if (!Number.isInteger(event?.id) || !Number.isInteger(event?.spaceId) || !['blackout', 'protection', 'world-cup', 'earthquake', 'generous'].includes(event?.effect)) return
      setCityEffectEvents((current) => [...current.filter((item) => item.id !== event.id), event])
      const oldTimer = cityEffectTimeouts.get(event.id)
      if (oldTimer !== undefined) window.clearTimeout(oldTimer)
      const timer = window.setTimeout(() => {
        setCityEffectEvents((current) => current.filter((item) => item.id !== event.id))
        cityEffectTimeouts.delete(event.id)
      }, event.effect === 'world-cup' ? 4200 : 3200)
      cityEffectTimeouts.set(event.id, timer)
    })
    const handleLeave = async (code: number, reason?: string) => {
      if (activeRoom.current !== room) return
      if (code === CloseCode.FAILED_TO_RECONNECT) {
        if (recoveringRoom.current === room) return
        recoveringRoom.current = room
        setIsReconnecting(true)
        const playerName = readLastRoom(getLocalStorage())?.name ?? room.state.players.get(room.sessionId)?.name ?? name.trim()
        const recovery = await recoverRoomAfterRetries(
          () => roomClient.reconnect(room.reconnectionToken),
          () => roomClient.joinById(room.roomId, { name: playerName }),
        )
        recoveringRoom.current = null
        if (activeRoom.current !== room) {
          if (recovery.room) void recovery.room.leave()
          return
        }
        if (recovery.room) {
          configureRoomReconnection(recovery.room)
          saveLastRoom(getLocalStorage(), { roomCode: recovery.room.roomId, name: playerName, reconnectionToken: recovery.room.reconnectionToken })
          previousFeedbackSnapshot.current = null
          activeRoom.current = recovery.room
          setRoom(recovery.room)
          setRoomCode(recovery.room.roomId)
          setIsReconnecting(false)
          setError('')
          return
        }
      }
      activeRoom.current = null
      setRoom(null)
      setPlayerEmotes({})
      setThrownObjects([])
      setEarthquakeEvents([])
      setCityEffectEvents([])
      cityEffectTimeouts.forEach((timer) => window.clearTimeout(timer))
      cityEffectTimeouts.clear()
      earthquakeTimeouts.current.forEach((timer) => window.clearTimeout(timer))
      earthquakeTimeouts.current.clear()
      setThrowImpacts([])
      setThrowPickerTargetSessionId('')
      setThrowCooldowns({})
      setDevArmedEventCardId('')
      emoteTimeouts.current.forEach((timer) => window.clearTimeout(timer))
      emoteTimeouts.current.clear()
      throwTimeouts.current.forEach((timer) => window.clearTimeout(timer))
      throwTimeouts.current.clear()
      impactTimeouts.current.forEach((timer) => window.clearTimeout(timer))
      impactTimeouts.current.clear()
      setIsReconnecting(false)
      setScreen('home')
      setError(code === CloseCode.FAILED_TO_RECONNECT
        ? 'A conexão caiu e não foi possível recuperar sua sala. Confira sua internet e tente entrar novamente com o mesmo código e nome.'
        : reason || 'A conexão com a sala foi encerrada.')
    }

    room.onStateChange(updateLobby)
    const removeGameStartedMessage = room.onMessage<{ mode?: unknown }>('game:started', () => setScreen('game'))
    room.onMessage('room:error', handleRoomError)
    room.onLeave(handleLeave)
    room.onDrop(handleDrop)
    room.onReconnect(handleReconnect)
    updateLobby(room.state)

    return () => {
      room.onStateChange.remove(updateLobby)
      removeGameStartedMessage()
      room.onLeave.remove(handleLeave)
      room.onDrop.remove(handleDrop)
      room.onReconnect.remove(handleReconnect)
      removePlayerEmoteMessage()
      removeThrowableMessage()
      removeEarthquakeMessage()
      removeCityEffectMessage()
      cityEffectTimeouts.forEach((timer) => window.clearTimeout(timer))
      cityEffectTimeouts.clear()
      removeDevCardArmedMessage()
      removeDevCardUsedMessage()
    }
  }, [room, soundEnabled, reducedMotion, name])

  useEffect(() => {
    if (!soundEnabled) return
    const unlock = () => unlockGameAudio()
    document.addEventListener('pointerdown', unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })
    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [soundEnabled])

  const musicTrack = screen === 'game' ? 'game' : 'home'

  useEffect(() => {
    if (!soundEnabled) return
    unlockGameAudio()
    startGameMusic(musicTrack)
    return stopGameMusic
  }, [musicTrack, soundEnabled])

  useEffect(() => {
    setAuctionBidAmount((current) => normalizeAuctionBidInput(current, auctionMinimumBid))
  }, [auctionId, auctionMinimumBid])

  function connectToRoom(nextRoom: Room, playerName: string) {
    configureRoomReconnection(nextRoom)
    saveLastRoom(getLocalStorage(), { roomCode: nextRoom.roomId, name: playerName, reconnectionToken: nextRoom.reconnectionToken })
    previousFeedbackSnapshot.current = null
    setIsReconnecting(false)
    activeRoom.current = nextRoom
    setRoom(nextRoom)
    setRoomCode(nextRoom.roomId)
    setRoomInviteUrl('')
    setRoomInviteCopied(false)
    setScreen('room')
  }

  async function createRoom() {
    if (!name.trim()) return setError('Escolha um nome para continuar.')
    setIsConnecting(true)
    setError('')
    try {
      const nextRoom = await roomClient.create('game_room', { mode, matchDuration, name: name.trim() })
      connectToRoom(nextRoom, name.trim())
    } catch {
      setError('Não foi possível criar a sala. Confira se o servidor está disponível e tente novamente.')
    } finally {
      setIsConnecting(false)
    }
  }

  async function joinRoom() {
    if (!name.trim()) return setError('Escolha um nome para continuar.')
    const normalizedRoomCode = normalizeRoomCode(roomCode)
    if (!normalizedRoomCode) return setError('Digite um código de sala válido com 5 caracteres.')
    setIsConnecting(true)
    setError('')
    try {
      const nextRoom = await roomClient.joinById(normalizedRoomCode, { name: name.trim() })
      connectToRoom(nextRoom, name.trim())
    } catch {
      setError('Não encontrei essa sala. Confira o código e tente novamente.')
    } finally {
      setIsConnecting(false)
    }
  }

  async function copyRoomInvite() {
    const inviteUrl = buildRoomInviteUrl(window.location.href, roomCode)
    if (!inviteUrl) return setError('Não foi possível gerar um link para esta sala.')

    setRoomInviteUrl(inviteUrl)
    setRoomInviteCopied(false)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(inviteUrl)
      setRoomInviteCopied(true)
      setError('')
    } catch {
      setError('Copie o link de convite exibido abaixo e envie para sua turma.')
    }
  }

  async function leaveRoom() {
    clearLastRoom(getLocalStorage())
    const currentRoom = activeRoom.current
    activeRoom.current = null
    setRoom(null)
    setPlayerEmotes({})
    emoteTimeouts.current.forEach((timer) => window.clearTimeout(timer))
    emoteTimeouts.current.clear()
    setRoomPlayers([])
    setRoomProperties(new Map())
    previousFeedbackSnapshot.current = null
    setFeedbackQueue([])
    setLandingPulseSpaceId(-1)
    setIsHost(false)
    setActivePlayerSessionId('')
    setSelectedPlayerSessionId('')
    setTurnNumber(0)
    setDice([0, 0])
    setLandingDescription('')
    setActiveCardTitle('')
    setActiveCardDescription('')
    setRevealSnapshot(null)
    setDismissedRevealKey('')
    setPendingPropertyId(255)
    setSelectedSpaceId(null)
    setDebtAmount(0)
    setDebtReason('')
    setDebtCreditorSessionId('')
    setWinnerSessionId('')
    setShowPropertyPanel(false)
    setPortfolioBoardSelection(false)
    setIsReconnecting(false)
    setScreen('home')
    if (currentRoom) await currentRoom.leave()
  }

  function startGame() {
    room?.send('start')
  }

  function addBot() {
    room?.send('addBot')
  }

  function selectCharacter(characterType: CharacterType) {
    room?.send('setCharacter', { characterType })
  }

  function selectPlayerColor(color: string) {
    room?.send('setPlayerColor', { color })
  }

  function removeBot(sessionId: string) {
    room?.send('removeBot', { sessionId })
  }

  function handleSelectSpace(spaceId: number) {
    const phase = boardChoicePhase ?? 'inspect'
    const interaction = getBoardSpaceInteraction(phase, isMyTurn, spaceId, highlightedSpaceIds)
    if (interaction.type === 'choose-world-cup') {
      room?.send('chooseWorldCup', { propertyId: interaction.spaceId })
      setSelectedSpaceId(null)
      return
    }
    if (interaction.type === 'choose-world-tour') {
      room?.send('chooseWorldTour', { spaceId: interaction.spaceId })
      setSelectedSpaceId(null)
      return
    }
    if (interaction.type === 'choose-card-property') {
      if (activeCardId === 'generous') {
        setSelectedCardPropertyId(interaction.spaceId)
        return
      }
      const holding = holdingsById.get(interaction.spaceId)
      if (!holding) return
      room?.send('resolveCardTarget', {
        propertyId: interaction.spaceId,
        ...(activeCardId === 'blackout' || activeCardId === 'earthquake' ? { targetSessionId: holding.ownerSessionId } : {}),
      })
      setSelectedCardPropertyId(null)
      return
    }
    if (interaction.type === 'choose-debt-property') {
      const holding = holdingsById.get(interaction.spaceId)
      if (!holding) return
      if (holding.houses > 0 && canSellBuilding(interaction.spaceId, localSessionId ?? '', holdingsById)) {
        room?.send('sellBuilding', { propertyId: interaction.spaceId })
      } else {
        room?.send('returnPropertyToBank', { propertyId: interaction.spaceId })
      }
      return
    }
    if (interaction.type === 'choose-managed-property') {
      setSelectedSpaceId(interaction.spaceId)
      setPortfolioBoardSelection(false)
      setShowPropertyPanel(false)
      return
    }
    if (interaction.type === 'inspect') setSelectedSpaceId(interaction.spaceId)
  }

  function dismissTransientReveal() {
    if (!visibleReveal) return
    setDismissedRevealKey(visibleReveal.key)
    if (visibleReveal.kind === 'event' && isMyTurn && turnPhase === 'card-target') room?.send('dismissCardReveal')
    if (visibleReveal.kind === 'event' && isMyTurn && turnPhase === 'resolve') room?.send('finishTurn')
  }

  return (
    <main className={`app-shell screen-${screen}${screen === 'game' && turnPhase === 'ended' ? ' screen-ended' : ''}${screen === 'game' && isPresentationAnimating ? ' game-presentation-active' : ''}`} data-reduced-motion={reducedMotion} data-night-mode={nightMode ? 'true' : 'false'}>
      <div className="scene-backdrop">
        {sceneReady && (
          <Suspense fallback={<div className="scene-placeholder" aria-hidden="true" />}>
            <BoardScene nightMode={nightMode} players={playerTokens} activePlayerSessionId={turnPhase === 'ended' ? '' : activePlayerSessionId} localPlayerSessionId={localSessionId} cameraMode={cameraMode} destinationSpaceId={destinationSpaceId} propertyBuildings={propertyBuildings} thrownObjects={thrownObjects} earthquakeEvents={earthquakeEvents} cityEffectEvents={cityEffectEvents} worldCupSpaceId={worldCupSpaceId} worldCupMultiplier={worldCupMultiplier} festivalSpaceIds={festivalSpaceIds} highlightedSpaceIds={highlightedSpaceIds} selectionMode={Boolean(boardChoicePhase && !isPresentationAnimating) || playerHighlightMode} showLiquidationValues={canShowLiquidationValues(turnPhase, localSessionId, activePlayerSessionId)} landingPulseSpaceId={landingPulseSpaceId} landingPulseSequence={landingPulseSequence} diceRollSequence={diceRollSequence} renderWakeSequence={turnNumber} dice={dice} diceVisible={showDice} diceResultVisible={companyDieResultVisible || (turnPhase === 'moving' && diceForPawnMovement) || (turnPhase === 'rolling' && dice[0] > 0 && dice[1] === 0)} presentationSpeed={presentationSpeed} reducedMotion={reducedMotion} pawnMovementEnabled={turnPhase === 'moving'} pawnMoveMode={pawnMoveMode} pawnStepSoundEnabled={soundEnabled} graphicsQuality={graphicsQuality} cameraEnabled={screen === 'game' && turnPhase !== 'ended'} fpsMeterEnabled={fpsMeterEnabled} fpsSamples={fpsSamples} onMovementComplete={() => setPresentationStage('idle')} onSelectSpace={handleSelectSpace} />
          </Suspense>
        )}
      </div>
      {screen !== 'game' && <header className="topbar">
        <button className="brand" onClick={() => { if (room) void leaveRoom(); else setScreen('home') }} aria-label="Voltar ao início">
          <span className="brand-mark">B</span><span>BANTEC<span className="brand-light">NO BRASIL</span></span>
        </button>
        <div className="topbar-right"><span className={`connection-dot ${isReconnecting ? 'connection-dot-retrying' : ''}`} /> <span className={isReconnecting ? 'connection-retrying' : ''} role={isReconnecting ? 'status' : undefined} aria-live={isReconnecting ? 'polite' : undefined}>{isReconnecting ? 'RECONECTANDO…' : 'MESA ONLINE'}</span><button type="button" className="icon-button night-mode-toggle" aria-label={nightMode ? 'Ativar modo claro' : 'Ativar modo noturno'} aria-pressed={nightMode} onClick={() => setNightMode((enabled) => !enabled)}>{nightMode ? '☀' : '☾'}</button><button className="icon-button" aria-label="Ajuda" aria-expanded={showHelp} aria-controls="game-help-dialog" onClick={() => setShowHelp((open) => !open)}>?</button></div>
      </header>}

      {screen === 'home' && (
        <section className="home-layout">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> MESA ABERTA, AMIGOS A CAMINHO</span>
            <h1>BANTEC.</h1>
            <div className="home-region-route" aria-label="Percurso pelas cinco regiões do Brasil">
              <div className="region-route-heading"><span>DO NORTE AO SUDESTE</span><span>24 CIDADES · 5 REGIÕES</span></div>
              <ol className="region-route-list">
                {HOME_REGION_ROUTE.map((region) => <li key={region.id} className="region-route-stop" style={{ '--region-color': region.color } as CSSProperties}><span className="region-route-node" /><span>{region.name}</span></li>)}
              </ol>
            </div>
            <p>Reúna a turma, invista nas cidades brasileiras e conquiste o maior patrimônio.</p>
            <div className="mode-switch match-duration-selector" role="group" aria-label="Duração da partida">
              {MATCH_DURATIONS.map((duration) => <button key={duration} type="button" aria-pressed={matchDuration === duration} className={`mode-tab${matchDuration === duration ? ' selected' : ''}`} onClick={() => setMatchDuration(duration)}><span>{durationLabel(duration)}</span><small>{duration === 0 ? 'Sem limite' : duration === 900 ? 'Partida rápida' : duration === 1800 ? 'Clássica' : 'Partida longa'}</small></button>)}
            </div>
            <div className="mode-note"><span className="note-icon">✦</span><span>Complete regiões, monopolize linhas e vença.</span><span className="player-limit">2–{MAX_ROOM_PLAYERS} JOGADORES</span></div>
          </div>

          <section className={`entry-card${isRoomInvite ? ' invite-entry-card' : ''}`} aria-label={isRoomInvite ? `Entrar na sala ${roomCode}` : 'Criar ou entrar em uma sala'}>
            <div className="card-heading"><span className="step-number">01</span><div><h2>{isRoomInvite ? 'Você foi convidado' : 'Entre na mesa'}</h2><p>{isRoomInvite ? `Sala ${roomCode} · Digite seu nome para entrar.` : 'Sem cadastro. Só escolha seu nome.'}</p></div></div>
            <label className="field-label" htmlFor="player-name">SEU NOME</label>
            <input id="player-name" className="text-field" maxLength={18} placeholder="Como seus amigos te chamam?" value={name} autoFocus={isRoomInvite} onKeyDown={(event) => { if (isRoomInvite && event.key === 'Enter') void joinRoom() }} onChange={(event) => { setName(event.target.value); setError('') }} />
            {isRoomInvite ? <button className="primary-button" onClick={() => void joinRoom()} disabled={isConnecting}><span>{isConnecting ? 'Entrando…' : 'Entrar na sala'}</span><span className="button-arrow">↗</span></button> : <>
              <button className="primary-button" onClick={() => void createRoom()} disabled={isConnecting}><span>{isConnecting ? 'Conectando…' : 'Criar uma sala'}</span><span className="button-arrow">↗</span></button>
              <div className="divider"><span />ou entre com um código<span /></div>
              <div className="join-row"><input className="text-field code-field" maxLength={5} placeholder="CÓDIGO" value={roomCode} onChange={(event) => { setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError('') }} aria-label="Código da sala" /><button className="join-button" onClick={() => void joinRoom()} disabled={isConnecting}>Entrar <span>→</span></button></div>
            </>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="privacy-note"><span>◈</span> Salas temporárias. Seu nome aparece para as pessoas da sala.</div>
          </section>
          <div className="home-footer"><span>UMA MESA PARA A SUA TURMA</span><span>40 CASAS <i>·</i> 4 COMPANHIAS</span></div>
        </section>
      )}

      {screen === 'room' && (
        <section className="room-layout">
          <div className="room-card">
            <div className="room-intro">
            <button className="back-link" onClick={() => void leaveRoom()}>← Início</button>
            <span className="eyebrow">SALA PRIVADA</span>
            <h1>Chame sua turma.</h1>
            <p>Envie um link de convite; seus amigos só precisam informar o nome para entrar.</p>
            <div className="room-code-label">CÓDIGO DA SALA</div><button className="room-code" onClick={() => navigator.clipboard?.writeText(roomCode)}>{roomCode}<span>▣</span></button>
            <div className="room-invite-tools"><button type="button" className="room-invite-button" onClick={() => void copyRoomInvite()}>{roomInviteCopied ? '✓ Link copiado' : 'Copiar link de convite'}</button>{roomInviteUrl && <label className="room-invite-link"><span>LINK DE CONVITE</span><input aria-label="Link de convite da sala" readOnly value={roomInviteUrl} onFocus={(event) => event.currentTarget.select()} /></label>}</div>
            </div>
            <div className="room-settings">
            <div className="room-mode"><span className="mode-icon">✦</span><div><strong>BANTEC · {durationLabel(matchDuration)}</strong><small>{matchDuration === 0 ? 'Sem limite para a partida; turnos e decisões continuam cronometrados.' : 'Vence quem completar um monopólio ou tiver o maior patrimônio ao fim do tempo.'}</small></div></div>
            {isHost && <div className="lobby-duration-selector" role="group" aria-label="Duração da partida"><span>DURAÇÃO DA PARTIDA</span>{MATCH_DURATIONS.map((duration) => <button key={duration} type="button" className="lobby-duration-option" aria-pressed={matchDuration === duration} onClick={() => room?.send('setMatchDuration', { duration })}>{durationLabel(duration)}</button>)}</div>}
            <div className={`dev-tools-setting${devModeEnabled ? ' enabled' : ''}`} aria-live="polite"><span><strong>Modo DEV · dados forçados</strong><small>{devModeEnabled ? 'Ativado para esta partida' : 'Desativado para esta partida'}</small></span>{isHost && <button type="button" aria-pressed={devModeEnabled} onClick={() => room?.send('setDevToolsEnabled', { enabled: !devModeEnabled })}>{devModeEnabled ? 'Desativar' : 'Ativar'}</button>}</div>
            </div>
            <div className="room-appearance">
            {roomPlayers.some((player) => player.sessionId === localSessionId) && <div className="player-color-selector" aria-label="Escolha sua cor"><span className="character-selector-label">ESCOLHA SUA COR</span><div className="player-color-options">{PLAYER_COLORS.map((color, index) => { const selectedColor = roomPlayers.find((player) => player.sessionId === localSessionId)?.color; const taken = roomPlayers.some((player) => player.sessionId !== localSessionId && player.color === color); return <button key={color} type="button" aria-label={`Cor ${PLAYER_COLOR_NAMES[index]}`} aria-pressed={selectedColor === color} disabled={taken} className={`player-color-option${selectedColor === color ? ' selected' : ''}`} style={{ '--player-option-color': color } as CSSProperties} onClick={() => selectPlayerColor(color)}><i />{PLAYER_COLOR_NAMES[index]}{taken ? ' · ocupada' : ''}</button> })}</div></div>}
            {roomPlayers.some((player) => player.sessionId === localSessionId) && <div className="character-selector" aria-label="Escolha sua ficha para a partida">
              <span className="character-selector-label">ESCOLHA SUA FICHA</span>
              <div className="character-option-list">{CHARACTER_OPTIONS.map((option) => {
                const selected = roomPlayers.find((player) => player.sessionId === localSessionId)?.characterType === option.id
                return <button key={option.id} type="button" className={`character-option${selected ? ' selected' : ''}`} aria-pressed={selected} onClick={() => selectCharacter(option.id)}>
                  <CharacterIcon characterType={option.id} />
                  <span>{option.label}</span>
                </button>
              })}</div>
            </div>}
            </div>
            <div className="room-roster">
            <div className="seat-list">{roomPlayers.map((player, index) => <div className="seat" key={player.sessionId}><span className={`seat-avatar avatar-${index}`}>{player.name.slice(0, 1).toUpperCase()}</span><span>{player.name}</span>{player.isBot ? <small className="seat-bot">BOT · PRONTO</small> : player.isBotControlled ? <small className="seat-bot">BOT NO CONTROLE</small> : player.isConnected === false ? <small className="seat-reconnecting">{player.reconnectionExpired ? 'OFFLINE' : 'RECONECTANDO'}</small> : player.isReady ? <small className="seat-ready">PRONTO</small> : <small className="seat-not-ready">AGUARDANDO</small>}{isHost && player.isBot && <button className="seat-remove-bot" onClick={() => removeBot(player.sessionId)} aria-label={`Remover ${player.name}`}>×</button>}</div>)}{Array.from({ length: Math.max(0, MAX_ROOM_PLAYERS - roomPlayers.length) }, (_, index) => <div className="seat waiting" key={`waiting-${index}`}><span className="seat-avatar">+</span><span>Aguardando jogador</span></div>)}</div>
            {roomPlayers.some((player) => player.sessionId === localSessionId && !player.isBot) && <button type="button" className={`lobby-ready-button${roomPlayers.find((player) => player.sessionId === localSessionId)?.isReady ? ' is-ready' : ''}`} aria-pressed={Boolean(roomPlayers.find((player) => player.sessionId === localSessionId)?.isReady)} onClick={() => room?.send('setReady', { ready: !roomPlayers.find((player) => player.sessionId === localSessionId)?.isReady })}>{roomPlayers.find((player) => player.sessionId === localSessionId)?.isReady ? '✓ Pronto · cancelar' : 'Estou pronto'}</button>}
            {isHost && roomPlayers.length < MAX_ROOM_PLAYERS && <button className="add-bot-button" onClick={addBot}>＋ Adicionar bot</button>}
            <div className="prototype-note">{roomPlayers.length}/{MAX_ROOM_PLAYERS} lugares ocupados · sala temporária para sua turma.</div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" onClick={startGame} disabled={!isHost || roomPlayers.length < 2 || roomPlayers.some((player) => !player.isBot && player.isConnected === false) || roomPlayers.some((player) => !player.isBot && !player.isReady)}><span>{isHost ? (roomPlayers.length < 2 ? 'Aguardando jogadores ou bots' : roomPlayers.some((player) => !player.isBot && player.isConnected === false) ? 'Aguardando reconexão' : roomPlayers.some((player) => !player.isBot && !player.isReady) ? 'Aguardando todos ficarem prontos' : 'Iniciar partida') : 'Aguardando anfitrião'}</span><span className="button-arrow">↗</span></button>
            </div>
          </div>
        </section>
      )}

      {screen === 'game' && (
        <section className="game-overlay">
          <div className="game-topline"><button className="back-link" onClick={() => setScreen('room')}>← Sala {roomCode}</button><div className="game-status-cluster"><div className={`game-pill ${matchEnding || (matchDuration > 0 && matchSeconds <= 60) ? 'clock-warning' : ''}`}>{modeDetails[mode].title.toUpperCase()} <span>·</span> {matchDuration === 0 ? 'SEM TEMPO' : formatClock(matchSeconds)}</div>{turnPhase !== 'ended' && <div className={`turn-clock-pill ${turnSeconds > 0 && turnSeconds <= 5 ? 'clock-warning' : ''}`} role="timer" aria-label={`Relógio do turno de ${activePlayer?.name ?? 'jogador ativo'}: ${turnSeconds} segundos restantes`}><span aria-hidden="true">◷</span><small>VEZ · {activePlayer?.name ?? '—'}</small><strong>{formatClock(turnSeconds)}</strong></div>}{animationSpeedControl}</div><div className="game-tools">{auctionId > 0 && <button className="portfolio-toggle auction-toggle-active" aria-expanded={showAuctionPanel} onClick={() => { setShowAuctionPanel((open) => !open);  setShowPropertyPanel(false); setError('') }}>{`Leilão · ${auctionPhase === 'interest' ? 'aceite' : 'lances'} · ${auctionSeconds}s`}</button>}</div></div>
          <div className="game-topline-camera-hint" aria-label="Controles da câmera">Arraste para girar · scroll ou pinça para zoom</div>
          {doublesAnnouncementVisible && <div className="doubles-announcement" role="status" aria-live="assertive"><span>✦</span><strong>TIROU DUPLAS!</strong><small>Você joga novamente</small></div>}
          <div className={`player-hud player-count-${roomPlayers.length}`}>{roomPlayers.map((player, index) => {
            const remainingCooldown = Math.max(0, (throwCooldowns[player.sessionId] ?? 0) - throwCooldownNow)
            const canThrowAtPlayer = Boolean(localPlayer && player.sessionId !== localSessionId && !player.isBankrupt && !localPlayer.isBankrupt && turnPhase !== 'ended')
            return <div className={`player-card-slot seat-${index}`} key={player.sessionId}>
              <button type="button" aria-label={selectingPlayer ? `Escolher ${player.name}` : `Destacar títulos de ${player.name}`} aria-pressed={selectingPlayer ? firstSwapTargetId === player.sessionId : selectedPlayerSessionId === player.sessionId} disabled={selectingPlayer && (player.isBankrupt || activeCardId !== 'swap' && activeCardId !== 'communism' && player.sessionId === localSessionId)} className={`player-card seat-${index} ${player.sessionId === activePlayerSessionId ? 'active' : ''} ${selectedPlayerSessionId === player.sessionId ? 'highlighted' : ''} ${player.isBankrupt ? 'bankrupt' : ''} ${player.isConnected === false ? 'disconnected' : ''} ${selectingPlayer ? 'target-choice' : ''} ${selectingPlayer && (player.isBankrupt || activeCardId !== 'swap' && activeCardId !== 'communism' && player.sessionId === localSessionId) ? 'target-unavailable' : ''} ${firstSwapTargetId === player.sessionId ? 'target-selected' : ''}`} style={{ backgroundColor: player.color ?? PLAYER_COLORS[index] ?? PLAYER_COLORS[0] }} onClick={() => choosePlayerCard(player)}><div className="player-card-main"><strong>{player.name}</strong><b>{formatMoney(player.cash)}</b></div>{player.isBotControlled && <span className="player-bot-control-label">BOT NO CONTROLE</span>}<CashChangeToast cash={player.cash} playerName={player.name} placement={getCashToastPlacement(index)} /><span className="player-money-anchor" data-cash-anchor={player.sessionId} aria-hidden="true"><CashHudSymbols cash={player.cash} /></span></button>
            {player.nextRentMultiplier !== 1 && <div className="held-card" data-camera-drag="off"><button type="button" aria-label={`Carta guardada: ${player.nextRentMultiplier > 1 ? 'Aluguel em dobro' : 'Desconto no aluguel'}`} aria-describedby={`held-card-tip-${player.sessionId}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>🃏</button><span id={`held-card-tip-${player.sessionId}`} role="tooltip"><b>{player.nextRentMultiplier > 1 ? 'Aluguel em dobro' : 'Desconto no aluguel'}</b><small>{player.nextRentMultiplier > 1 ? 'Pague 2× no próximo aluguel.' : 'Pague metade no próximo aluguel.'}</small></span></div>}
              {canThrowAtPlayer && <div className={`player-throw-control${index % 2 === 1 ? ' toward-center-left' : ''}`} data-camera-drag="off">
                <button type="button" className="player-throw-button" aria-label={`Lançar objeto em ${player.name}`} aria-expanded={throwPickerTargetSessionId === player.sessionId} disabled={remainingCooldown > 0} title={remainingCooldown > 0 ? `Aguarde ${Math.ceil(remainingCooldown / 1000)}s` : `Lançar objeto em ${player.name}`} onClick={() => { setShowEmotePicker(false); setThrowPickerTargetSessionId((target) => target === player.sessionId ? '' : player.sessionId) }}><span aria-hidden="true">➶</span>{remainingCooldown > 0 && <small>{Math.ceil(remainingCooldown / 1000)}s</small>}</button>
                {throwPickerTargetSessionId === player.sessionId && <div className="throw-picker" role="group" aria-label={`Escolha o objeto para lançar em ${player.name}`}>{THROWABLES.map(({ id, label, symbol }) => <button key={id} type="button" onClick={() => { if (!room) return; const now = Date.now(); room.send('throwObject', { targetSessionId: player.sessionId, object: id }); setThrowCooldownNow(now); setThrowCooldowns((current) => ({ ...current, [player.sessionId]: now + THROW_COOLDOWN_MS })); setThrowPickerTargetSessionId('') }}><span aria-hidden="true">{symbol}</span><small>{label}</small></button>)}</div>}
              </div>}
            </div>
          })}</div>
          {inspectedPlayer && !selectingPlayer && <div className="inspected-player-banner" style={{ '--inspected-color': inspectedPlayer.color } as CSSProperties} role="status"><span className="inspected-player-dot" />{inspectedPlayer.name}<small>PROPRIEDADES EM DESTAQUE</small></div>}
          {selectingPlayer && <div className="player-target-prompt" role="status"><strong>{(activeCardId === 'swap' || activeCardId === 'communism') && firstSwapTargetId ? 'ESCOLHA O SEGUNDO JOGADOR' : 'ESCOLHA O JOGADOR'}</strong><small>Toque em um cartão iluminado · {turnSeconds}s</small></div>}
          {throwImpacts.length > 0 && <div className={`throw-impact-screen impact-${throwImpacts[throwImpacts.length - 1].object}`} role="status" aria-live="polite" aria-label={`Você foi atingido com ${getThrowableLabel(throwImpacts[throwImpacts.length - 1].object)}`}><span key={throwImpacts[throwImpacts.length - 1].id}>{getThrowableSymbol(throwImpacts[throwImpacts.length - 1].object)}</span><small>{getThrowableLabel(throwImpacts[throwImpacts.length - 1].object)}</small></div>}
          {localPlayer && turnPhase !== 'ended' && <div className={`game-quick-actions seat-${roomPlayers.findIndex((player) => player.sessionId === localPlayer.sessionId)}`} aria-label="Ações rápidas" data-camera-drag="off"><button type="button" className="camera-mode-button" onClick={() => setCameraMode((mode) => mode === 'board' ? 'player' : 'board')} aria-label={cameraMode === 'board' ? 'Seguir meu personagem' : 'Orbitar tabuleiro'} aria-pressed={cameraMode === 'player'}><span aria-hidden="true">◎</span><small>{cameraMode === 'board' ? 'Tabuleiro' : 'Seguir'}</small></button><button type="button" onClick={() => setShowOptions(true)} aria-label="Configurações da partida"><span aria-hidden="true">⚙</span><small>Config</small></button><div className="emote-control"><button type="button" onClick={() => setShowEmotePicker((open) => !open)} aria-label="Escolher emote" aria-expanded={showEmotePicker}><span aria-hidden="true">☺</span><small>Emote</small></button>{showEmotePicker && <div className="emote-picker" role="group" aria-label="Escolha um emote">{PLAYER_EMOTES.map(({ id, label, symbol }) => <button key={id} type="button" aria-label={label} title={label} onClick={() => { room?.send('emote', { emote: id }); setShowEmotePicker(false) }}>{symbol}</button>)}</div>}</div><button type="button" onClick={() => setShowHelp((open) => !open)} aria-label="Prévia das regras" aria-expanded={showHelp} aria-controls="game-help-dialog"><span aria-hidden="true">?</span><small>Regras</small></button></div>}
          {modalVisible && !feedbackPending && <div className={`game-modal-backdrop${selectingPlayer ? ' player-target-backdrop' : ''}`} aria-hidden="true" />}
          {selectedSpace && turnPhase !== 'ended' && !boardChoicePhase && !ownPropertyLanding && !(isMyTurn && (turnPhase === 'purchase' || turnPhase === 'world-cup' || turnPhase === 'world-tour')) && !showPropertyPanel && (
            <aside className={`space-inspector${selectedSpace.kind === 'property' ? ' property-inspection-panel' : ''}`} aria-label={`Detalhes de ${selectedSpace.name}`}>
              <button className="panel-close" aria-label="Fechar detalhes" onClick={() => setSelectedSpaceId(null)}>×</button>
              <span className="turn-label">CASA {String(selectedSpace.id + 1).padStart(2, '0')} · {selectedSpace.kind === 'property' ? 'PROPRIEDADE' : 'ESPAÇO ESPECIAL'}</span>
              <h2>{selectedSpace.name}</h2>
              {selectedSpace.kind === 'property' ? (
                <>
                  <div className="space-owner-line"><i style={{ backgroundColor: selectedOwner?.color ?? '#a9b4a0' }} />{selectedOwner ? `Pertence a ${selectedOwner.name}` : 'Terreno livre'}</div>
                  <div className="space-facts"><div><small>PREÇO</small><strong>{formatMoney(selectedSpace.price ?? 0)}</strong></div><div><small>ALUGUEL POR PARADA</small><strong>{formatMoney(selectedRent)}</strong></div></div>
                  <p>{selectedHolding?.houses ? selectedHolding.houses === PROPERTY_HOTEL_LEVEL ? 'Hotel construído' : `${selectedHolding.houses} ${selectedHolding.houses === 1 ? 'casa construída' : 'casas construídas'}` : selectedSpace.buildable ? `Imóvel residencial · construção por ${formatMoney(constructionCost(selectedSpace.id))} cada nível` : 'Companhia nacional · aluguel conforme o número de companhias próprias'}</p>
                  {selectedSpace.buildable && <div className="property-build-levels purchase-level-options inspection-level-options" role="group" aria-label="Níveis de construção e aluguel">
                    {Array.from({ length: PROPERTY_BUILD_LEVELS + 1 }, (_, houses) => {
                      const rent = calculateRent(selectedSpace.id, rentOwnership, houses, worldCupSpaceId, festivalSet, worldCupMultiplier)
                      const isCurrent = Boolean(selectedHolding?.ownerSessionId) && selectedHolding?.houses === houses
                      return <div key={houses} className={`property-level-option purchase-choice inspection-choice${isCurrent ? ' selected' : ''}`} aria-current={isCurrent ? 'true' : undefined}><span>{houses === 0 ? 'Terreno' : houses === 1 ? '1 casa' : `${houses} casas`}</span><span className="property-choice-houses" aria-hidden="true">{houses === 0 ? <i className="property-choice-flag" /> : Array.from({ length: houses }, (_, index) => <i key={index} />)}</span><small>Aluguel · {formatMoney(rent)}</small><b>{formatMoney((selectedSpace.price ?? 0) + houses * constructionCost(selectedSpace.id))}</b></div>
                    })}
                    {selectedHolding?.houses === PROPERTY_HOTEL_LEVEL && <div className="property-level-option purchase-choice inspection-choice selected" aria-current="true"><span>Hotel</span><span className="property-choice-houses" aria-hidden="true">🏨</span><small>Aluguel · {formatMoney(calculateRent(selectedSpace.id, rentOwnership, PROPERTY_HOTEL_LEVEL, worldCupSpaceId, festivalSet, worldCupMultiplier))}</small><b>{formatMoney(hotelConstructionCost(selectedSpace.id))}</b></div>}
                  </div>}
                  {selectedOwner?.sessionId === localSessionId && <div className="inspector-auction-actions"><div className="auction-start-label">LANCE INICIAL<span className="auction-bid-stepper"><button type="button" aria-label="Diminuir lance inicial" disabled={Number(auctionStartingBids[selectedSpace.id] ?? selectedSpace.price ?? AUCTION_MIN_BID_INCREMENT) <= AUCTION_MIN_BID_INCREMENT} onClick={() => stepAuctionBid(selectedSpace.id, -1)}>−</button><output>{formatMoney(selectedAuctionStartingBid)}</output><button type="button" aria-label="Aumentar lance inicial" onClick={() => stepAuctionBid(selectedSpace.id, 1)}>+</button></span></div><button className="asset-action auction-inspector-button" disabled={Boolean(auctionStartBlockReason)} title={auctionStartBlockReason ?? 'Anunciar este imóvel para leilão'} onClick={() => { room?.send('auctionStart', { propertyId: selectedSpace.id, startingBid: selectedAuctionStartingBid }); setShowAuctionPanel(true); setShowPropertyPanel(false); setSelectedSpaceId(null); setError('') }}>Leiloar imóvel</button>{auctionStartBlockReason && <p className="auction-block-hint" role="status">{auctionStartBlockReason}</p>}</div>}
                </>
              ) : <p>{selectedSpace.kind === 'tax' ? `Ao parar aqui, pague ${formatMoney(taxForSpace(selectedSpace.id))} ao banco.` : selectedSpace.kind === 'event' ? 'Ao parar aqui, compre uma carta Sorte ou Revés.' : selectedSpace.kind === 'start' ? `Receba ${formatMoney(START_BONUS)} ao passar. Parar exatamente aqui oferece uma melhoria paga em uma cidade sua aleatória.` : selectedSpace.kind === 'prison' ? 'Ao cair na prisão, você pode aguardar, tentar duplas para sair ou pagar R$ 200.000 e lançar os dados.' : selectedSpace.kind === 'world-cup' ? `Escolha uma propriedade sua para sediar a Copa. A próxima sede terá aluguel ${getWorldCupRentMultiplier(worldCupHostCount + 1).toLocaleString('pt-BR')}× até outra Copa ser escolhida.${worldCupSpaceId !== 255 ? ` Sede atual: ${boardSpaces[worldCupSpaceId]?.name ?? '—'}.` : ''}` : selectedSpace.kind === 'world-tour' ? `Escolha uma propriedade sua, livre ou uma casa especial. Receba ${formatMoney(START_BONUS)} se o trajeto até o destino passar pela Partida.` : 'Casa especial do tabuleiro.'}</p>}
            </aside>
          )}
          {ownPropertyLanding && isMyTurn && !isPresentationAnimating ? (
            <aside className="turn-card property-decision-panel" aria-label={`Construir em ${activeSpace.name}`}>
              <div className="asset-panel-heading"><span className="turn-label">{turnPhase === 'buyback-upgrade' ? 'RECOMPRA CONCLUÍDA · MELHORE AGORA' : 'VOCÊ JÁ POSSUI'} · {formatMoney(localPlayer?.cash ?? 0)}</span></div>
              <h2>{activeSpace.name}</h2>
              <p>{turnPhase === 'buyback-upgrade' ? 'Você recomprou este imóvel. Pode melhorá-lo agora ou concluir a vez.' : 'Você caiu no seu terreno. Escolha até três casas para construir agora. Hotel só fica disponível numa próxima visita, depois das três casas.'}</p>
              <div className={`property-build-levels${(landedHolding?.houses ?? 0) === 3 ? ' hotel-purchase-levels' : ''}`} role="group" aria-label="Nível de construção desejado">
                {[1, 2, 3].filter((level) => level > (landedHolding?.houses ?? 0) && availableCash(localPlayer) >= (level - (landedHolding?.houses ?? 0)) * constructionCost(activeSpace.id)).map((level) => <button key={level} className={`property-level-option ${targetBuildHouses === level ? 'selected' : ''}`} disabled={!canBuildLevelAfterFirstLap(Boolean(localPlayer?.hasCompletedFirstLap), level)} onClick={() => setTargetBuildHouses(level)}><span>{level === 1 ? '1 casa' : `${level} casas`}</span><small>+{formatMoney((level - (landedHolding?.houses ?? 0)) * constructionCost(activeSpace.id))}</small></button>)}
                {(landedHolding?.houses ?? 0) === 3 && <button className="property-level-option purchase-choice hotel-level-option" onClick={() => room?.send('build', { propertyId: activeSpace.id, hotel: true })} disabled={!isMyTurn || !canBuildHotelHere}><span>Hotel</span><span className="property-choice-houses" aria-hidden="true">🏨</span><small>Aluguel · {formatMoney(calculateRent(activeSpace.id, rentOwnership, PROPERTY_HOTEL_LEVEL, worldCupSpaceId, festivalSet, worldCupMultiplier))}</small><b>{formatMoney(hotelConstructionCost(activeSpace.id))}</b></button>}
              </div>
              {!localPlayer?.hasCompletedFirstLap && <p className="purchase-lap-warning" role="status">3ª casa e hotel indisponíveis na primeira volta. Complete uma volta pela Partida para liberar.</p>}
              <div className="space-facts"><div><small>ALUGUEL POR PARADA</small><strong>{activeSpace.company ? formatMoney(calculateCompanyRent(rentOwnership, landedHolding?.ownerSessionId ?? '') * (activeSpace.id === worldCupSpaceId ? worldCupMultiplier : 1)) : landedHolding?.blackoutTurns && landedHolding.houses !== PROPERTY_HOTEL_LEVEL ? formatMoney(0) : formatMoney(calculateRent(activeSpace.id, rentOwnership, landedHolding?.houses ?? 0, worldCupSpaceId, festivalSet, worldCupMultiplier))}</strong></div><div><small>PRÓXIMA CONSTRUÇÃO</small><strong>{landedHolding?.houses === PROPERTY_HOTEL_LEVEL ? 'Hotel' : formatMoney(constructionCost(activeSpace.id))}</strong></div></div>
              <div className="purchase-actions property-decision-actions">{canBuildSelected && <button className="roll-button" onClick={() => room?.send('build', { propertyId: activeSpace.id, targetHouses: targetBuildHouses })}>Construir <span>{formatMoney(Math.max(0, targetBuildHouses - (landedHolding?.houses ?? 0)) * constructionCost(activeSpace.id))}</span></button>}<button className="secondary-action" onClick={() => room?.send('finishTurn')} disabled={!isMyTurn}>Concluir vez</button></div>
              {!canBuildSelected && <p className="purchase-hint" role="status">Seu saldo não cobre uma melhoria disponível neste terreno.</p>}
              {landedHolding?.houses === PROPERTY_HOTEL_LEVEL && <p className="purchase-hint">Este terreno já tem hotel.</p>}
            </aside>
          ) : !feedbackPending && showAuctionPanel && turnPhase !== 'ended' && turnPhase !== 'debt' ? (
            <aside className="turn-card action-panel auction-panel" aria-label="Leilão voluntário de propriedade">
              <div className="asset-panel-heading"><span className="turn-label">{auctionId > 0 ? `LEILÃO · ${auctionSeconds}s` : 'LEILÃO VOLUNTÁRIO'}</span><button className="panel-close" onClick={() => setShowAuctionPanel(false)} aria-label="Fechar leilão">×</button></div>
              {error && <p className="form-error" role="alert">{error}</p>}
              {auctionId > 0 ? (
                <>
                  <h2>{boardSpaces[auctionPropertyId]?.name ?? 'Imóvel em leilão'}</h2>
                  <p>{auctionPhase === 'interest' ? `Leilão anunciado por ${auctionSeller?.name ?? 'um jogador'}. Aceite em até ${auctionSeconds} segundos para abrir os lances.` : `Leilão aberto por ${auctionSeller?.name ?? 'um jogador'}. Cada novo lance reinicia o prazo de 10 segundos.`} O imóvel e todas as suas construções são transferidos juntos.</p>
                  <div className="auction-current-bid"><span>{auctionHighestBid > 0 ? `Maior lance · ${auctionHighBidder?.name ?? 'jogador'}` : 'Primeiro lance mínimo'}</span><strong>{formatMoney(auctionHighestBid || auctionStartingBid)}</strong></div>
                  {isAuctionSeller ? (
                    auctionHighestBid === 0 && <button className="secondary-action panel-full-button" onClick={() => room?.send('auctionCancel', { auctionId })}>Cancelar leilão</button>
                  ) : auctionPhase === 'interest' ? (
                    <button className="roll-button panel-full-button" disabled={!localPlayer || localPlayer.isBankrupt} onClick={() => { room?.send('auctionAccept', { auctionId }); setError('') }}>Aceitar e iniciar lances</button>
                  ) : (
                    <>
                      <MoneyStepper label={`SEU LANCE · MÍNIMO ${formatMoney(auctionMinimumBid)}`} value={Number(auctionBidAmount) || auctionMinimumBid} minimum={auctionMinimumBid} maximum={auctionBidMaximum} step={AUCTION_MIN_BID_INCREMENT} onChange={(value) => setAuctionBidAmount(String(value))} />
                      <button className="roll-button panel-full-button" disabled={Number(auctionBidAmount) < auctionMinimumBid || auctionBidMaximum < Number(auctionBidAmount)} onClick={() => { room?.send('auctionBid', { auctionId, amount: Number(auctionBidAmount) }); setError('') }}>Dar lance</button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <h2>Leilão voluntário</h2>
                  <p>Qualquer jogador pode vender um imóvel próprio, mesmo fora da vez. Abra a carteira para escolher o título e definir o lance inicial. Recusar uma propriedade livre não a coloca em leilão.</p>
                  <button className="roll-button panel-full-button" onClick={() => { setShowAuctionPanel(false); setShowPropertyPanel(true) }}>Abrir minha carteira</button>
                </>
              )}
            </aside>
          ) : !feedbackPending && showPropertyPanel && turnPhase !== 'ended' && turnPhase !== 'debt' && turnPhase !== 'start-upgrade' ? (
            <aside className="turn-card asset-panel" aria-label="Minha carteira de imóveis">
              <div className="asset-panel-heading"><span className="turn-label">CARTEIRA DA PARTIDA</span><div className="asset-panel-heading-actions"><span>{formatMoney(localPlayer?.cash ?? 0)}</span><button className="panel-close" onClick={() => { setShowPropertyPanel(false); setPortfolioBoardSelection(false) }} aria-label="Fechar carteira">×</button></div></div>
              <h2>Meus imóveis</h2>
              <p>Toque num imóvel seu no tabuleiro para abrir as opções. A devolução ao banco fica disponível apenas para quitar uma dívida.</p>
              <button type="button" className={`asset-board-select${portfolioBoardSelection ? ' selected' : ''}`} aria-pressed={portfolioBoardSelection} disabled={!myProperties.length} onClick={() => { setPortfolioBoardSelection((active) => !active); if (!portfolioBoardSelection) setShowPropertyPanel(false) }}>{portfolioBoardSelection ? 'Cancelar seleção' : 'Escolher imóvel no tabuleiro'}</button>
              <div className="asset-list">
                {myProperties.length === 0 ? <span className="asset-empty">Você ainda não tem propriedades.</span> : myProperties.map(({ spaceId, holding, space }) => {
                  const rent = space.company
                    ? calculateCompanyRent(rentOwnership, localSessionId ?? '') * (spaceId === worldCupSpaceId ? worldCupMultiplier : 1)
                    : calculateRent(spaceId, rentOwnership, holding.houses, worldCupSpaceId, festivalSet, worldCupMultiplier)
                  return (
                    <div className="asset-row" key={spaceId}>
                      <div className="asset-info"><strong>{space.name}</strong><small>{holding.houses === PROPERTY_HOTEL_LEVEL ? 'HOTEL' : holding.houses ? `${holding.houses} CASA(S)` : space.buildable ? 'CIDADE' : 'COMPANHIA'}</small><span className="asset-info-meta">Aluguel atual <b>{formatMoney(rent)}</b> <i>·</i> Compra {formatMoney(space.price ?? 0)}</span></div>
                      <div className="asset-row-actions"><small>{spaceId === selectedSpaceId ? 'Selecionado no tabuleiro' : 'Use o botão acima para selecionar'}</small></div>
                    </div>
                  )
                })}
              </div>
              <span className="asset-note">Inicie leilões durante seu turno, fora de compras e dívidas. Os lances ficam reservados durante 20 segundos.</span>
            </aside>
          ) : selectingPlayer || (boardSelectionGuidanceActive && turnPhase !== 'debt') || shouldSuppressTurnCardForFeedback(feedbackPending, turnPhase) || !showTurnCard || shouldSuppressTurnCardForSpaceSelection(Boolean(selectedSpace), turnPhase, ownPropertyLanding, showPropertyPanel && turnPhase !== 'debt', false) ? null : (
            <div className={`turn-card${turnPhase === 'ended' ? ' final-result-card' : ''}${turnPhase === 'purchase' ? ' purchase-panel' : ''}${turnPhase === 'debt' ? ' debt-panel' : ''}${turnPhase === 'world-cup' || turnPhase === 'world-tour' ? ' corner-choice-panel' : ''}`}>
              <span className="turn-label">{turnPhase === 'ended' ? 'PARTIDA ENCERRADA' : turnPhase === 'debt' ? 'DÍVIDA EM ABERTO' : matchEnding ? 'TEMPO ESGOTADO · CONCLUA A JOGADA' : `TURNO ${turnNumber} · ${isMyTurn ? 'SUA VEZ' : `VEZ DE ${activePlayer?.name ?? '…'}`}`}{turnPhase !== 'ended' && turnSeconds > 0 && <b className="turn-countdown" aria-label={`${turnSeconds} segundos restantes`}>{turnSeconds}s</b>}</span>
              <h2>{turnPhase === 'ended' ? (roomPlayers.find((player) => player.sessionId === winnerSessionId)?.name ?? 'Partida encerrada') : presentationStage === 'dice' ? 'Rolando os dados…' : presentationStage === 'pawn' ? 'Peão em movimento…' : turnPhase === 'debt' ? 'Hora de liquidar bens' : activeCardTitle || (turnPhase === 'purchase' ? `Comprar ${pendingPurchaseSpace?.name ?? 'propriedade'}` : turnPhase === 'buyback' ? `Recomprar ${pendingPurchaseSpace?.name ?? 'propriedade'}` : activeSpace.name)}</h2>
              {turnPhase === 'ended' || turnPhase === 'debt' ? null : presentationStage !== 'idle' ? <p role="status" aria-live="polite">A próxima ação aparece quando a etapa atual terminar.</p> : <p>{turnPhase === 'purchase' ? 'Este terreno está livre. Você escolhe se quer comprar; se recusar, ele continua sem dono.' : landingDescription || activeCardDescription || (activeSpace.kind === 'property' ? `Propriedade · ${formatMoney(activeSpace.price ?? 0)}` : 'Aguardando a jogada.')}</p>}
              {presentationStage === 'idle' && turnPhase === 'purchase' && pendingPurchaseSpace?.kind === 'property' && <>
                {pendingPurchaseSpace.buildable && <div className="property-build-levels purchase-level-options" role="group" aria-label="Pacotes de terreno e casas">{Array.from({ length: PROPERTY_BUILD_LEVELS + 1 }, (_, houses) => {
                  const total = (pendingPurchaseSpace.price ?? 0) + houses * constructionCost(pendingPurchaseSpace.id)
                  const rent = calculateRent(pendingPurchaseSpace.id, purchaseRentOwnership, houses, worldCupSpaceId, festivalSet, worldCupMultiplier)
                  const firstLapLocked = !canBuildLevelAfterFirstLap(Boolean(localPlayer?.hasCompletedFirstLap), houses)
                  return <button key={houses} className={`property-level-option purchase-choice ${pendingPurchaseHouses === houses ? 'selected' : ''}`} aria-pressed={pendingPurchaseHouses === houses} disabled={firstLapLocked || !canAffordPurchase(availableCash(localPlayer), total)} onClick={() => setPendingPurchaseHouses(houses)}><span>{houses === 0 ? 'Terreno' : houses === 1 ? '1 casa' : `${houses} casas`}</span><span className="property-choice-houses" aria-hidden="true">{houses === 0 ? <i className="property-choice-flag" /> : Array.from({ length: houses }, (_, index) => <i key={index} />)}</span><small>Aluguel · {formatMoney(rent)}</small><b>{formatMoney(total)}</b></button>
                }).filter((_, houses) => canAffordPurchase(availableCash(localPlayer), (pendingPurchaseSpace.price ?? 0) + houses * constructionCost(pendingPurchaseSpace.id)))}</div>}
                {!localPlayer?.hasCompletedFirstLap && pendingPurchaseSpace.buildable && <p className="purchase-lap-warning" role="status">3ª casa indisponível na primeira volta. Complete uma volta pela Partida para liberar a construção.</p>}
                <div className="purchase-rent-preview"><span>ALUGUEL COM ESTA ESCOLHA</span><strong>{formatMoney(pendingPurchaseRent)} <small>/ parada</small></strong></div>
              </>}
              {presentationStage !== 'idle' && turnPhase !== 'ended' ? (
                <div className="presentation-wait" aria-hidden="true">{presentationStage === 'dice' ? '🎲' : '↗'}</div>
              ) : turnPhase === 'card-target' ? (
                <div className="card-target-actions" aria-label="Escolher alvo da carta">
                  {activeCardId === 'generous' && selectedCardPropertyId === null && <p className="map-choice-hint">Toque numa propriedade sua iluminada no tabuleiro. Depois escolha quem vai recebê-la.</p>}
                  {activeCardId === 'generous' && selectedCardPropertyId !== null && <div className="card-target-list">{roomPlayers.filter((candidate) => candidate.sessionId !== localSessionId && !candidate.isBankrupt).map((candidate) => <button className="card-target-option" key={candidate.sessionId} onClick={() => room?.send('resolveCardTarget', { propertyId: selectedCardPropertyId, targetSessionId: candidate.sessionId })}>Dar {boardSpaces[selectedCardPropertyId]?.name} para {candidate.name}</button>)}</div>}
                  {(activeCardId === 'blackout' || activeCardId === 'earthquake' || activeCardId === 'protection') && <p className="map-choice-hint">Toque em uma propriedade iluminada no tabuleiro para {activeCardId === 'blackout' ? 'apagar por três voltas do dono' : activeCardId === 'earthquake' ? 'destruir' : 'proteger por três voltas do dono'}.</p>}
                  {activeCardId === 'thief' && <div className="card-target-list">{roomPlayers.filter((candidate) => candidate.sessionId !== localSessionId && !candidate.isBankrupt).map((candidate) => <button className="card-target-option" key={candidate.sessionId} onClick={() => room?.send('resolveCardTarget', { targetSessionId: candidate.sessionId })}>Roubar de {candidate.name}</button>)}</div>}
                  {(activeCardId === 'swap' || activeCardId === 'communism') && <div className="card-target-list">{roomPlayers.filter((candidate) => !candidate.isBankrupt).flatMap((first, firstIndex, all) => all.slice(firstIndex + 1).map((second) => <button className="card-target-option" key={`${first.sessionId}-${second.sessionId}`} onClick={() => room?.send('resolveCardTarget', { targetSessionId: first.sessionId, secondSessionId: second.sessionId })}>{activeCardId === 'communism' ? 'Dividir saldo de' : 'Trocar'} {first.name} ↔ {second.name}</button>))}</div>}
                  {cardHasNoTarget && <p>Não existe alvo disponível.</p>}
                </div>
              ) : turnPhase === 'ended' ? (
                <div className="final-result-content">
                  <div className="winner-banner"><span aria-hidden="true">✦</span><strong>{winnerSessionId ? 'VENCEDOR DA PARTIDA' : 'PARTIDA ENCERRADA'}</strong><span aria-hidden="true">✦</span></div>
                  <p className="final-result-reason" role="status">{getMatchEndSummary(matchEndReason)}</p>
                  {winnerSessionId && (() => {
                    const winner = roomPlayers.find((player) => player.sessionId === winnerSessionId)
                    if (!winner) return null
                    const metrics = finalScoreMetrics(mode)
                    const primaryValue = mode === 'classic' ? winner.finalNetWorth : winner.finalCash
                    const secondaryValue = mode === 'classic' ? winner.finalCash : winner.finalNetWorth
                    return <div className="winner-metrics"><div className="winner-primary-metric"><span>{metrics.primaryLabel}</span><strong>{formatMoney(primaryValue)}</strong></div><div><span>{metrics.secondaryLabel}</span><strong>{formatMoney(secondaryValue)}</strong></div></div>
                  })()}
                  <div className="final-score-heading"><strong>CLASSIFICAÇÃO</strong><span>{finalScoreMetrics(mode).primaryLabel}</span></div>
                  <div className="final-score-list">{rankFinalScore(roomPlayers, mode, winnerSessionId).map((player, index) => <div className={player.sessionId === winnerSessionId ? 'final-score winner' : 'final-score'} key={player.sessionId}><span className="final-score-rank">{String(index + 1).padStart(2, '0')}</span><span className="final-score-name">{player.name}{player.tieBreakRoll ? <small>Desempate: {player.tieBreakRoll} nos dados</small> : null}</span><span className="final-score-values"><b>{formatMoney(mode === 'classic' ? player.finalNetWorth : player.finalCash)}</b><small>{formatMoney(mode === 'classic' ? player.finalCash : player.finalNetWorth)} {mode === 'classic' ? 'saldo' : 'patrimônio'}</small></span></div>)}</div>
                  <small className="final-score-criteria">{scoreCriteria(mode)}</small>
                  <button className="roll-button" onClick={() => void leaveRoom()}>Voltar ao início <span>↗</span></button>
                </div>
              ) : turnPhase === 'buyback' ? (
                <div className="purchase-actions"><button className="roll-button" onClick={() => room?.send('buyback', { accept: true })} disabled={!isMyTurn || !pendingBuybackHolding || pendingBuybackHolding.houses === PROPERTY_HOTEL_LEVEL || Boolean(pendingPurchaseSpace?.company) || availableCash(localPlayer) < pendingBuybackPrice}>Recomprar <span>{formatMoney(pendingBuybackPrice)}</span></button><button className="secondary-action" onClick={() => room?.send('buyback', { accept: false })} disabled={!isMyTurn}>Continuar sem recomprar</button></div>
              ) : turnPhase === 'buyback-upgrade' ? (
                <div className="purchase-actions">
                  <p>{pendingBuybackHolding ? `Você recomprou ${boardSpaces[pendingPropertyId]?.name}. Escolha uma melhoria que caiba no seu saldo.` : 'Não há cidade disponível para melhorar.'}</p>
                  {pendingBuybackHolding && <div className="property-build-levels hotel-purchase-levels" role="group" aria-label="Melhorias disponíveis após a recompra">
                    {[1, 2, 3].filter((level) => level > pendingBuybackHolding.houses && canBuildLevelAfterFirstLap(Boolean(localPlayer?.hasCompletedFirstLap), level) && availableCash(localPlayer) >= (level - pendingBuybackHolding.houses) * constructionCost(pendingPropertyId)).map((level) => <button key={level} className="property-level-option purchase-choice" onClick={() => room?.send('build', { propertyId: pendingPropertyId, targetHouses: level })}><span>{level === 1 ? '1 casa' : `${level} casas`}</span><small>Aluguel · {formatMoney(calculateRent(pendingPropertyId, rentOwnership, level, worldCupSpaceId, festivalSet, worldCupMultiplier))}</small><b>{formatMoney((level - pendingBuybackHolding.houses) * constructionCost(pendingPropertyId))}</b></button>)}
                    {pendingBuybackHolding.houses === PROPERTY_BUILD_LEVELS && availableCash(localPlayer) >= hotelConstructionCost(pendingPropertyId) && <button className="property-level-option purchase-choice hotel-level-option" onClick={() => room?.send('build', { propertyId: pendingPropertyId, hotel: true })}><span>Hotel</span><span className="property-choice-houses" aria-hidden="true">🏨</span><small>Aluguel · {formatMoney(calculateRent(pendingPropertyId, rentOwnership, PROPERTY_HOTEL_LEVEL, worldCupSpaceId, festivalSet, worldCupMultiplier))}</small><b>{formatMoney(hotelConstructionCost(pendingPropertyId))}</b></button>}
                  </div>}
                  <button className="secondary-action" onClick={() => room?.send('finishTurn')} disabled={!isMyTurn}>Concluir sem melhorar</button>
                </div>
              ) : turnPhase === 'start-upgrade' ? (
                <div className="purchase-actions">
                  <p>{pendingBuybackHolding ? `Parar exatamente na Partida permite melhorar ${boardSpaces[pendingPropertyId]?.name}. A melhoria é opcional e custa ${formatMoney(pendingBuybackHolding.houses === PROPERTY_BUILD_LEVELS ? hotelConstructionCost(pendingPropertyId) : constructionCost(pendingPropertyId))}.` : 'Não há cidade disponível para melhorar.'}</p>
                  {!localPlayer?.hasCompletedFirstLap && pendingBuybackHolding && pendingBuybackHolding.houses >= 2 && <p className="purchase-lap-warning" role="status">3ª casa e hotel indisponíveis na primeira volta. Complete uma volta pela Partida para liberar.</p>}
                  <button className="roll-button" onClick={() => room?.send('startUpgrade', { accept: true })} disabled={!isMyTurn || !pendingBuybackHolding || !canBuildLevelAfterFirstLap(Boolean(localPlayer?.hasCompletedFirstLap), pendingBuybackHolding.houses + 1) || availableCash(localPlayer) < (pendingBuybackHolding.houses === PROPERTY_BUILD_LEVELS ? hotelConstructionCost(pendingPropertyId) : constructionCost(pendingPropertyId))}>Melhorar <span>{pendingBuybackHolding ? formatMoney(pendingBuybackHolding.houses === PROPERTY_BUILD_LEVELS ? hotelConstructionCost(pendingPropertyId) : constructionCost(pendingPropertyId)) : '—'}</span></button>
                  <button className="secondary-action" onClick={() => room?.send('startUpgrade', { accept: false })} disabled={!isMyTurn}>Recusar melhoria</button>
                </div>
              ) : turnPhase === 'debt' ? (
                <div className="debt-actions"><div className="debt-summary"><div><small>PRECISA PAGAR</small><strong>{formatMoney(debtAmount)}</strong></div><div><small>VOCÊ TEM</small><strong>{formatMoney(availableCash(localPlayer))}</strong></div><div className="debt-shortfall"><small>AINDA FALTA</small><strong>{formatMoney(Math.max(0, debtAmount - availableCash(localPlayer)))}</strong></div></div><p>{debtReason} · credor: {roomPlayers.find((player) => player.sessionId === debtCreditorSessionId)?.name ?? 'banco'}</p>{availableCash(localPlayer) < debtAmount && hasLiquidatableAssets(localSessionId ?? '', holdingsById) && <p className="map-choice-hint">Toque em um imóvel iluminado para liquidá-lo.</p>}{availableCash(localPlayer) >= debtAmount && <button className="roll-button" onClick={() => room?.send('payDebt')} disabled={!isMyTurn}>Pagar cobrança <span>{formatMoney(debtAmount)}</span></button>}{availableCash(localPlayer) < debtAmount && !hasLiquidatableAssets(localSessionId ?? '', holdingsById) && <button className="secondary-action" onClick={() => room?.send('declareBankruptcy')} disabled={!isMyTurn}>Declarar falência</button>}</div>
              ) : turnPhase === 'jail' ? (
                <div className="jail-actions"><p className="jail-hint" role="status">Você ainda precisa cumprir {localPlayer?.jailTurns ?? activePlayer?.jailTurns ?? 0} turno(s) preso. Tente duplas para sair ou pague R$ 200.000.</p><button className="roll-button" onClick={() => room?.send('jailRoll')} disabled={!isMyTurn}>Tentar duplas <span>🎲</span></button><button className="secondary-action" onClick={() => room?.send('jailPay')} disabled={!isMyTurn || availableCash(localPlayer) < 200_000}>Pagar R$ 200.000 e sair</button><button className="secondary-action" onClick={() => room?.send('finishTurn')} disabled={!isMyTurn}>Aguardar este turno preso</button></div>
              ) : turnPhase === 'world-cup' ? (
                <div className="corner-choice-actions"><p className="map-choice-hint">Selecione uma propriedade sua iluminada no tabuleiro para definir a sede. O aluguel terá multiplicador de {getWorldCupRentMultiplier(worldCupHostCount + 1).toLocaleString('pt-BR')}×.</p></div>
              ) : turnPhase === 'world-tour' ? (
                <div className="corner-choice-actions"><p className="map-choice-hint">Clique em uma casa clara no tabuleiro para viajar. Casas de outras pessoas ficam indisponíveis.</p></div>
              ) : (
                <>
                  <div className={`dice-row ${turnPhase === 'resolve' || turnPhase === 'purchase' ? 'dice-row-result-shown' : ''}`}>
                    <span className="die">{dice[0] || '·'}</span><span className="die">{dice[1] || '·'}</span>
                    {turnPhase === 'roll' ? (
                      <button className="roll-button" onClick={() => room?.send('roll')} disabled={!isMyTurn}>Lançar dados <span>↗</span></button>
                    ) : turnPhase === 'purchase' ? (
                      <div className="purchase-actions">
                        {canAffordPendingPurchase && <button className="roll-button" onClick={() => room?.send('buy', { houses: pendingPurchaseHouses })} disabled={!isMyTurn || !canBuildLevelAfterFirstLap(Boolean(localPlayer?.hasCompletedFirstLap), pendingPurchaseHouses)}>Comprar <span>{formatMoney(pendingPurchasePrice)}</span></button>}
                        <button className="secondary-action" onClick={() => room?.send('declinePurchase')} disabled={!isMyTurn}>Não comprar</button>
                      </div>
                    ) : (
                      <button className="roll-button" onClick={() => room?.send('finishTurn')} disabled={!isMyTurn}>Concluir vez <span>↗</span></button>
                    )}
                  </div>
                  {turnPhase === 'purchase' && !canAffordPendingPurchase && <p className="purchase-hint" role="status">Seu saldo não cobre a compra. Você pode deixar o terreno livre.</p>}
                </>
              )}
            </div>
          )}
          {turnPhase !== 'ended' && !feedbackPending && ((['roll', 'company-roll'].includes(turnPhase) && isMyTurn) || (isHost && devModeEnabled)) && <div className={`roll-control${isHost && devModeEnabled && turnPhase === 'roll' ? ' roll-control-dev' : ''}`}>
            {['roll', 'company-roll'].includes(turnPhase) && isMyTurn && <button className="roll-control-button" type="button" onClick={() => room?.send(turnPhase === 'company-roll' ? 'rollCompany' : 'roll')}>{turnPhase === 'company-roll' ? '🎲 Girar D6 do aluguel' : '🎲 GIRAR DADOS'}</button>}
            {isHost && devModeEnabled && turnPhase === 'roll' && <form className="dev-dice-controls" aria-label="Forçar resultado dos dados" onSubmit={(event) => { event.preventDefault(); room?.send('devRoll', { diceOne: forcedDice[0], diceTwo: forcedDice[1] }) }}>
              <span>DEV</span>
              {[0, 1].map((dieIndex) => <div className="dev-die-stepper" key={dieIndex} role="group" aria-label={`Valor do dado ${dieIndex + 1}`}><span>D{dieIndex + 1}</span><button type="button" aria-label={`Diminuir valor do dado ${dieIndex + 1}`} onClick={() => setForcedDice((current) => current.map((value, index) => index === dieIndex ? stepDieValue(value, -1) : value) as [number, number])}>−</button><output aria-live="polite">{forcedDice[dieIndex]}</output><button type="button" aria-label={`Aumentar valor do dado ${dieIndex + 1}`} onClick={() => setForcedDice((current) => current.map((value, index) => index === dieIndex ? stepDieValue(value, 1) : value) as [number, number])}>+</button></div>)}
              <button type="submit">Forçar</button>
            </form>}
            {isHost && devModeEnabled && turnPhase === 'roll' && <form className="dev-teleport-controls" aria-label="Teleporte DEV para uma casa" onSubmit={(event) => { event.preventDefault(); room?.send('devTeleport', { spaceId: Number(devDestinationId) }) }}>
              <label htmlFor="dev-destination">Casa de destino</label>
              <select id="dev-destination" value={devDestinationId} onChange={(event) => setDevDestinationId(event.target.value)}>{boardSpaces.map((space) => <option key={space.id} value={space.id}>{String(space.id).padStart(2, '0')} · {space.name}</option>)}</select>
              <button type="submit">Teleportar</button>
            </form>}
            {isHost && devModeEnabled && turnPhase === 'roll' && <form className="dev-event-card-controls" aria-label="Preparar carta Sorte ou Revés para teste" onSubmit={(event) => { event.preventDefault(); setError(''); room?.send('devSetNextEventCard', { cardId: devEventCardId }) }}>
              <label htmlFor="dev-event-card">Próxima carta</label>
              <select id="dev-event-card" value={devEventCardId} onChange={(event) => setDevEventCardId(event.target.value)}>{EVENT_CARDS.map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}</select>
              <button type="submit">Preparar</button>
              {devArmedEventCardId && <small role="status">{EVENT_CARDS.find((card) => card.id === devArmedEventCardId)?.title} armada para o próximo sorteio</small>}
            </form>}
            {isHost && devModeEnabled && <form className="dev-cash-controls" aria-label="Ajustar dinheiro DEV" onSubmit={(event) => { event.preventDefault(); if (devCashTarget) room?.send('devSetCash', { sessionId: devCashTarget.sessionId, cash: Number(devCashAmount), infinite: devCashTarget.devInfiniteCash }) }}>
              <label htmlFor="dev-cash-player">Saldo do jogador</label>
              <select id="dev-cash-player" value={devCashTarget?.sessionId ?? ''} onChange={(event) => setDevCashTargetSessionId(event.target.value)}>{roomPlayers.filter((player) => !player.isBankrupt).map((player) => <option key={player.sessionId} value={player.sessionId}>{player.name}</option>)}</select>
              <div className="dev-cash-amount"><button type="button" aria-label="Diminuir saldo DEV" disabled={!Number.isSafeInteger(Number(devCashAmount)) || Number(devCashAmount) <= 0} onClick={() => setDevCashAmount(String(adjustMoneyValue(Number(devCashAmount) || 0, -1, 10_000, 0, 2_147_483_647)))}>−</button><input aria-label="Definir saldo em reais" type="number" inputMode="numeric" min="0" max="2147483647" step="10000" value={devCashAmount} onChange={(event) => setDevCashAmount(event.target.value)} /><button type="button" aria-label="Aumentar saldo DEV" disabled={!Number.isSafeInteger(Number(devCashAmount)) || Number(devCashAmount) >= 2_147_483_647} onClick={() => setDevCashAmount(String(adjustMoneyValue(Number(devCashAmount) || 0, 1, 10_000, 0, 2_147_483_647)))}>+</button></div>
              <button type="submit" disabled={!devCashTarget || !Number.isSafeInteger(Number(devCashAmount)) || Number(devCashAmount) < 0 || Number(devCashAmount) > 2147483647}>Definir saldo</button>
              {devCashTarget && <label className="dev-infinite-toggle"><input type="checkbox" checked={devCashTarget.devInfiniteCash} onChange={(event) => room?.send('devSetCash', { sessionId: devCashTarget.sessionId, cash: Number(devCashAmount), infinite: event.target.checked })} /> Dinheiro infinito</label>}
            </form>}
          </div>}
          {isMyTurn && !showTransientReveal && !feedbackPending && turnPhase === 'world-cup' && <div className="map-choice-prompt" role="status">Toque em uma propriedade sua iluminada para escolher a sede</div>}
          {isMyTurn && !showTransientReveal && !feedbackPending && turnPhase === 'world-tour' && <div className="map-choice-prompt" role="status">Toque em uma casa iluminada para escolher o destino</div>}
          {isMyTurn && !showTransientReveal && !feedbackPending && turnPhase === 'card-target' && propertyTargetCard && selectedCardPropertyId === null && cardPropertyChoices.length > 0 && <div className="map-choice-prompt" role="status">Toque em uma propriedade iluminada para escolher o alvo da carta</div>}
          {isMyTurn && !showTransientReveal && !feedbackPending && turnPhase === 'debt' && debtPropertyChoices.length > 0 && <div className="map-choice-prompt" role="status">Toque em uma propriedade iluminada para liquidá-la</div>}
          {portfolioBoardSelection && <div className="map-choice-prompt" role="status">Toque numa propriedade sua iluminada para abrir as opções <button type="button" onClick={() => setPortfolioBoardSelection(false)}>Cancelar</button></div>}
          {showTransientReveal && visibleReveal && <div className="card-reveal-backdrop"><article className="game-event-card" role="dialog" aria-modal="true" aria-label="Carta revelada"><span className="event-card-kicker">{getRevealKicker(visibleReveal.kind)}</span>{visibleReveal.kind === 'event' && EVENT_CARDS.some((card) => card.id === visibleReveal.cardId)
              ? <img className="event-card-art event-card-illustration" src={`${import.meta.env.BASE_URL}assets/event-cards/${visibleReveal.cardId}.webp`} alt="" />
              : <div className="event-card-art" aria-hidden="true">{visibleReveal.kind === 'world-cup' ? '✦' : visibleReveal.kind === 'world-tour' ? '↗' : '◆'}</div>}<h2>{visibleReveal.kind === 'event' ? visibleReveal.title : visibleReveal.kind === 'world-cup' ? 'Escolha a sede' : 'Escolha para onde viajar'}</h2>{visibleReveal.kind === 'event' && <small className="card-user-attribution">{activeCardUserName} usa esta carta</small>}<p>{visibleReveal.kind === 'event' ? visibleReveal.description : visibleReveal.kind === 'world-cup' ? `Toque em uma propriedade sua iluminada no tabuleiro. O aluguel da sede valerá ${getWorldCupRentMultiplier(worldCupHostCount + 1).toLocaleString('pt-BR')}×.` : 'Toque em uma casa iluminada. Propriedades de outras pessoas ficam indisponíveis.'}</p>{visibleReveal.noTarget && <p className="card-no-target">Não existe alvo disponível.</p>}<button type="button" className="card-reveal-ok" onClick={dismissTransientReveal}>OK</button><small>A carta avança automaticamente após {CARD_REVEAL_SECONDS} segundos.</small></article></div>}
          <div className="game-bottom"><span className="game-sync-label">JOGADA SINCRONIZADA · {modeDetails[mode].title.toUpperCase()}</span><button className="leave-button" onClick={() => void leaveRoom()}>Sair da mesa</button></div>
        </section>
      )}
      {screen === 'game' && turnPhase !== 'ended' && showOptions && <div className="game-settings-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) setShowOptions(false) }}>
        <section className="game-settings-screen" role="dialog" aria-modal="true" aria-labelledby="game-settings-title">
          <header className="game-settings-heading"><div><span className="eyebrow">PREFERÊNCIAS LOCAIS</span><h2 id="game-settings-title">Opções da partida</h2><p>A partida continua normalmente enquanto esta tela estiver aberta.</p></div><button className="game-settings-close" type="button" onClick={() => setShowOptions(false)} aria-label="Fechar opções">×</button></header>
          <div className="game-settings-content">
            <section className="game-settings-section"><div className="game-settings-section-heading"><div><h3>Gráficos e desempenho</h3><p>Reduza a resolução para priorizar fluidez em aparelhos mais modestos.</p></div><span>QUALIDADE</span></div><div className="graphics-quality-options" role="group" aria-label="Qualidade gráfica">{([['performance', 'Desempenho', '0,8–1×'], ['balanced', 'Equilibrado', '1–1,4×'], ['high', 'Alta', '1–2×']] as const).map(([quality, label, scale]) => <button type="button" key={quality} className={graphicsQuality === quality ? 'selected' : ''} aria-pressed={graphicsQuality === quality} onClick={() => setGraphicsQuality(quality)}><strong>{label}</strong><small>{scale} de resolução</small></button>)}</div><div className="game-settings-switches"><button type="button" className="game-settings-switch-row" aria-pressed={fpsMeterEnabled} onClick={() => setFpsMeterEnabled((enabled) => !enabled)}><span><strong>Medidor de FPS</strong><small>Mostra quadros por segundo e tempo por quadro.</small></span><i>{fpsMeterEnabled ? 'Ativado' : 'Desativado'}</i></button></div></section>
            <section className="game-settings-section"><div className="game-settings-section-heading"><div><h3>Som, movimento e aparência</h3><p>Ajustes pessoais; não alteram o estado da partida dos outros jogadores.</p></div><span>JOGABILIDADE</span></div><div className="game-settings-switches"><button type="button" className="game-settings-switch-row" aria-pressed={nightMode} onClick={() => setNightMode((enabled) => !enabled)}><span><strong>Modo noturno</strong><small>Escurece o fundo externo sem alterar as cores do tabuleiro.</small></span><i>{nightMode ? 'Ativado' : 'Desativado'}</i></button><button type="button" className="game-settings-switch-row" aria-pressed={soundEnabled} onClick={() => { unlockGameAudio(); setSoundEnabled((enabled) => !enabled) }}><span><strong>Trilha e efeitos sonoros</strong><small>Dados, dinheiro, construções e sons de chegada.</small></span><i>{soundEnabled ? 'Ativado' : 'Desativado'}</i></button><button type="button" className="game-settings-switch-row" aria-pressed={reducedMotion} onClick={() => setReducedMotion((enabled) => !enabled)}><span><strong>Movimento reduzido</strong><small>Reduz animações de dados, peões e interface.</small></span><i>{reducedMotion ? 'Ativado' : 'Desativado'}</i></button></div></section>
          </div>
          <footer className="game-settings-footer"><span>As opções são aplicadas na hora e só afetam sua tela.</span><button type="button" onClick={() => setShowOptions(false)}>Voltar à partida</button></footer>
        </section>
      </div>}
      {screen === 'game' && <Suspense fallback={null}><CashHudOverlay players={roomPlayers.map((player) => ({ id: player.sessionId, cash: player.cash }))} /></Suspense>}
      {screen === 'game' && fpsMeterEnabled && <FpsMeter samples={fpsSamples} />}
      {showHelp && !(screen === 'game' && turnPhase === 'ended') && <div className="help-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHelp(false) }}><section id="game-help-dialog" className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title"><button className="help-close" onClick={() => setShowHelp(false)} aria-label="Fechar ajuda">×</button><span className="eyebrow">GUIA RÁPIDO</span><h2 id="help-title">Como jogar</h2><p>Jogue com amigos na mesma sala. Na sua vez, lance os dados, acompanhe o peão e responda à ação da casa.</p><ul><li><strong>20 segundos:</strong> sem ação, os dados são lançados automaticamente.</li><li><strong>15 segundos:</strong> para decidir. Compra sem resposta é recusada; cobranças e eventos são confirmados automaticamente. Na prisão, você pode aguardar, tentar duplas ou pagar R$ 200.000 para sair.</li><li><strong>Copa do Mundo:</strong> escolha uma propriedade; o aluguel da sede começa em 2× e aumenta 0,25× por nova edição.</li><li><strong>Volta ao Brasil:</strong> escolha uma propriedade sua, livre ou uma casa especial. Receba R$ 300.000 ao passar pela Partida no trajeto; a chegada em outra casa não recebe bônus.</li><li><strong>Comprar:</strong> propriedades livres podem ser compradas pelo preço indicado; recusar mantém o terreno livre. Ao cair numa cidade sem hotel de outra pessoa, você pode recomprá-la por 2× o investimento ou pagar o aluguel.</li><li><strong>Dinheiro:</strong> sons ascendentes indicam entrada; sons descendentes indicam saída. Use o controle de áudio para silenciar.</li><li><strong>Partida:</strong> vence quem completar uma condição de monopólio ou tiver o maior patrimônio ao fim do tempo definido no lobby.</li></ul><button className="roll-button help-ok" onClick={() => setShowHelp(false)}>Entendi</button></section></div>}
    </main>
  )
}

export default App
