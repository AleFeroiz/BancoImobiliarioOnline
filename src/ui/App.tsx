import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import type { Room } from '@colyseus/sdk'
import { CHARACTER_OPTIONS, type CharacterType, type GameMode, type LobbyPlayer } from '../../shared/lobby'
import { scheduleSceneLoad } from './sceneLoading'
import { roomClient } from './roomClient'
import { finalScoreMetrics, rankFinalScore, scoreCriteria } from './scoreCriteria'
import { getLobbyPlayerEntries } from './lobbySnapshot'
import { canAffordPurchase } from './purchaseActions'
import { adjustAuctionStartingBid, normalizeAuctionBidInput } from './auctionActions'
import { boardSpaces, formatMoney } from '../game/board'
import { ANIMATION_SPEEDS, AUCTION_MIN_BID_INCREMENT, DEFAULT_ANIMATION_SPEED, PROPERTY_BUILD_LEVELS, PROPERTY_HOTEL_LEVEL, START_BONUS, buildingSaleValue, calculateRent, canBuildHotel, canBuildProperty, canMortgageProperty, canRedeemMortgage, canSellBuilding, constructionCost, hasLiquidatableAssets, hotelConstructionCost, liquidatablePropertyIds, mortgageRedemptionCost, mortgageValue, taxForSpace, type AnimationSpeed, type PropertyHolding } from '../../shared/game'
import type { ExpressObjectiveUpdate } from '../../shared/objectives'
import { PLAYER_COLORS } from './playerPalette'
import { getCashToastPlacement, getGameSound, getPropertyChangeSound, getPropertyVisualChange, formatCashDelta, type GameSound } from './gameFeedback'
import { CashChangeToast } from './CashChangeToast'
import { stepDieValue } from './forcedDice'
import { getPropertyRentLabel } from './propertyRentLabel'
import { appendGameFeedback, personalizePlayerFeedback, type GameFeedbackItem } from './feedbackQueue'
import { playGameSound, startGameMusic, stopGameMusic, unlockGameAudio } from './gameAudio'
import { getTurnActivityLabel, shouldShowTurnCard, shouldSuppressTurnCardForFeedback, shouldSuppressTurnCardForSpaceSelection } from './turnActivity'
import { getBoardSpaceInteraction } from './boardInteraction'
import { CashHudSymbols } from './CashHudSymbols'
import { shouldShowRolledDice } from './dicePresentation'
import { toggleSelection } from './multiSelect'
import { areNumberPairsEqual, areRecordArraysEqual, areRecordMapsEqual } from './snapshotStability'
import { FpsMeter } from './FpsMeterOverlay'
import { createFrameRateAccumulator } from './fpsMeter'
import { dismissCardRevealOnPointerDown } from './cardRevealInput'
import { adjustMoneyValue } from './moneyStepper'
import { DEFAULT_GRAPHICS_QUALITY, type GraphicsQuality } from './graphicsQuality'

type Mode = GameMode
type Screen = 'home' | 'room' | 'game'
type TurnPhase = 'roll' | 'rolling' | 'station-rent' | 'station-rent-rolling' | 'moving' | 'resolve' | 'purchase' | 'jail' | 'world-cup' | 'world-tour' | 'debt' | 'ended'
type SyncedPlayer = LobbyPlayer & { sessionId: string; cash: number; isJailed: boolean; jailTurns: number; isBankrupt: boolean; finalCash: number; finalNetWorth: number; tieBreakRoll: number }
type TradeOfferView = { id: number; fromSessionId: string; toSessionId: string; cashOffered: number; cashRequested: number; propertiesOffered: number[]; propertiesRequested: number[] }
const BoardScene = lazy(() => import('./BoardScene'))
const CashHudOverlay = lazy(() => import('./CashHud').then(({ CashHudOverlay }) => ({ default: CashHudOverlay })))

function parseTradeIds(value: string) {
  return value ? value.split(',').map(Number).filter(Number.isInteger) : []
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = Math.max(0, seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

const modeDetails: Record<Mode, { title: string; duration: string; detail: string }> = {
  classic: { title: 'Clássico Rápido', duration: '30 min', detail: 'Regras completas • patrimônio no final' },
  express: { title: 'Express', duration: '8–16 min', detail: '6 rodadas • objetivos valem bônus' },
}

function MoneyStepper({ label, value, minimum = 0, maximum, step = 10_000, onChange }: { label: string; value: number; minimum?: number; maximum: number; step?: number; onChange: (value: number) => void }) {
  const upperBound = Math.max(minimum, maximum)
  const displayedValue = Math.max(minimum, Math.min(upperBound, Number.isFinite(value) ? value : minimum))
  const isBelowMinimum = value < minimum
  return <div className="trade-value-field">
    <span className="trade-label">{label}</span>
    <div className="auction-bid-stepper trade-money-stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`Diminuir ${label.toLocaleLowerCase('pt-BR')}`} disabled={displayedValue <= minimum} onClick={() => onChange(adjustMoneyValue(displayedValue, -1, step, minimum, upperBound))}>−</button>
      <output aria-live="polite">{formatMoney(displayedValue)}</output>
      <button type="button" aria-label={`Aumentar ${label.toLocaleLowerCase('pt-BR')}`} disabled={displayedValue >= upperBound} onClick={() => onChange(isBelowMinimum ? minimum : adjustMoneyValue(displayedValue, 1, step, minimum, upperBound))}>+</button>
    </div>
  </div>
}

function CharacterIcon({ characterType }: { characterType: CharacterType }) {
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
  const [fpsMeterEnabled, setFpsMeterEnabled] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [feedbackQueue, setFeedbackQueue] = useState<GameFeedbackItem[]>([])
  const [diceRollSequence, setDiceRollSequence] = useState(0)
  const [diceForPawnMovement, setDiceForPawnMovement] = useState(false)
  const [presentationStage, setPresentationStage] = useState<'idle' | 'dice' | 'pawn'>('idle')
  const [pawnMoveMode, setPawnMoveMode] = useState<'walk' | 'teleport'>('walk')
  const [pendingPurchaseHouses, setPendingPurchaseHouses] = useState(0)
  const [targetBuildHouses, setTargetBuildHouses] = useState(1)
  const [landingPulseSpaceId, setLandingPulseSpaceId] = useState(-1)
  const [landingPulseSequence, setLandingPulseSequence] = useState(0)
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState<Mode>('classic')
  const [error, setError] = useState('')
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [activePlayerSessionId, setActivePlayerSessionId] = useState('')
  const [turnNumber, setTurnNumber] = useState(0)
  const [turnSeconds, setTurnSeconds] = useState(0)
  const [matchSeconds, setMatchSeconds] = useState(0)
  const [matchEnding, setMatchEnding] = useState(false)
  const [expressRound, setExpressRound] = useState(0)
  const [phaseSeconds, setPhaseSeconds] = useState(0)
  const [expressObjective, setExpressObjective] = useState<ExpressObjectiveUpdate | null>(null)
  const [showObjectivePanel, setShowObjectivePanel] = useState(false)
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('roll')
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(DEFAULT_ANIMATION_SPEED)
  const [presentationSpeed, setPresentationSpeed] = useState<AnimationSpeed>(DEFAULT_ANIMATION_SPEED)
  const [devModeEnabled, setDevModeEnabled] = useState(false)
  const [forcedDice, setForcedDice] = useState<[number, number]>([3, 4])
  const [dice, setDice] = useState<[number, number]>([0, 0])
  const [landingDescription, setLandingDescription] = useState('')
  const [activeCardTitle, setActiveCardTitle] = useState('')
  const [activeCardDescription, setActiveCardDescription] = useState('')
  const [dismissedRevealKey, setDismissedRevealKey] = useState('')
  const [pendingPropertyId, setPendingPropertyId] = useState(255)
  const [worldCupSpaceId, setWorldCupSpaceId] = useState(255)
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null)
  const [debtAmount, setDebtAmount] = useState(0)
  const [debtReason, setDebtReason] = useState('')
  const [debtCreditorSessionId, setDebtCreditorSessionId] = useState('')
  const [winnerSessionId, setWinnerSessionId] = useState('')
  const [showPropertyPanel, setShowPropertyPanel] = useState(false)
  const [profilePlayerSessionId, setProfilePlayerSessionId] = useState('')
  const [showTradePanel, setShowTradePanel] = useState(false)
  const [showAuctionPanel, setShowAuctionPanel] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(DEFAULT_GRAPHICS_QUALITY)
  const [auctionSeconds, setAuctionSeconds] = useState(0)
  const [auctionId, setAuctionId] = useState(0)
  const [auctionPropertyId, setAuctionPropertyId] = useState(255)
  const [auctionSellerSessionId, setAuctionSellerSessionId] = useState('')
  const [auctionStartingBid, setAuctionStartingBid] = useState(0)
  const [auctionHighestBid, setAuctionHighestBid] = useState(0)
  const [auctionHighestBidderSessionId, setAuctionHighestBidderSessionId] = useState('')
  const [auctionBidAmount, setAuctionBidAmount] = useState('10000')
  const [auctionStartingBids, setAuctionStartingBids] = useState<Record<number, string>>({})
  const [tradeOffer, setTradeOffer] = useState<TradeOfferView | null>(null)
  const [tradeTargetSessionId, setTradeTargetSessionId] = useState('')
  const [tradeCashOffered, setTradeCashOffered] = useState('0')
  const [tradeCashRequested, setTradeCashRequested] = useState('0')
  const [tradePropertiesOffered, setTradePropertiesOffered] = useState<number[]>([])
  const [tradePropertiesRequested, setTradePropertiesRequested] = useState<number[]>([])
  const [room, setRoom] = useState<Room | null>(null)
  const [roomPlayers, setRoomPlayers] = useState<SyncedPlayer[]>([])
  const [roomProperties, setRoomProperties] = useState<Map<string, PropertyHolding>>(new Map())
  const [isHost, setIsHost] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const activeRoom = useRef<Room | null>(null)
  const fpsSamples = useRef(createFrameRateAccumulator())
  const previousFeedbackSnapshot = useRef<{ description: string; diceSequence: number; players: Map<string, { cash: number; position: number }>; properties: Map<string, PropertyHolding> } | null>(null)
  const previousObjectiveComplete = useRef(false)
  const feedbackSequence = useRef(0)
  const soundEnabledRef = useRef(soundEnabled)
  soundEnabledRef.current = soundEnabled
  const previousTradeOfferId = useRef<number | null>(null)
  const activePlayer = roomPlayers.find((player) => player.sessionId === activePlayerSessionId)
  const activeSpace = boardSpaces[activePlayer?.position ?? 0]
  const isMyTurn = room?.sessionId === activePlayerSessionId
  const isPresentationAnimating = turnPhase === 'rolling' || turnPhase === 'station-rent-rolling' || turnPhase === 'moving'
  const turnActivityLabel = getTurnActivityLabel(turnPhase)
  const showTurnCard = shouldShowTurnCard(isMyTurn, turnPhase) && !isPresentationAnimating && !['roll', 'resolve', 'world-cup', 'world-tour'].includes(turnPhase) && !activeCardTitle
  const feedbackToast = feedbackQueue[0]
  const feedbackPending = feedbackQueue.length > 0
  const animationSpeedControl = isHost && turnPhase !== 'ended' ? <div className="animation-speed-control" role="group" aria-label="Velocidade das animações da sala" title="Vale nas próximas animações"><span>RITMO</span><div>{ANIMATION_SPEEDS.map((speed) => <button key={speed} type="button" aria-pressed={animationSpeed === speed} onClick={() => room?.send('setAnimationSpeed', { speed })}>{speed.toLocaleString('pt-BR')}×</button>)}</div></div> : null
  const playerTokens = roomPlayers.length > 0
    ? roomPlayers.flatMap((player, seatIndex) => player.isBankrupt ? [] : [{ id: player.sessionId, position: player.position, color: PLAYER_COLORS[seatIndex] ?? PLAYER_COLORS[0], seatIndex, cash: player.cash, characterType: player.characterType, activity: player.sessionId === activePlayerSessionId && !isMyTurn ? turnActivityLabel : '' }])
    : [0, 3, 6, 9].map((position, seatIndex) => ({ id: `preview-${seatIndex}`, position, color: PLAYER_COLORS[seatIndex] ?? PLAYER_COLORS[0], seatIndex, cash: 1_500_000, characterType: 'pawn' as CharacterType }))
  const incomingTradeOffer = tradeOffer?.toSessionId === room?.sessionId
  const outgoingTradeOffer = tradeOffer?.fromSessionId === room?.sessionId
  const profilePlayer = roomPlayers.find((player) => player.sessionId === profilePlayerSessionId)
  const auctionSeller = roomPlayers.find((player) => player.sessionId === auctionSellerSessionId)
  const auctionHighBidder = roomPlayers.find((player) => player.sessionId === auctionHighestBidderSessionId)
  const auctionMinimumBid = auctionHighestBid > 0 ? auctionHighestBid + AUCTION_MIN_BID_INCREMENT : auctionStartingBid
  const isAuctionSeller = auctionSellerSessionId === room?.sessionId
  const tradeCounterparty = tradeOffer
    ? roomPlayers.find((player) => player.sessionId === (incomingTradeOffer ? tradeOffer.fromSessionId : tradeOffer.toSessionId))
    : undefined
  const holdingsById = new Map(Array.from(roomProperties.entries()).map(([id, holding]) => [Number(id), holding]))
  const isTradePropertyLocked = (spaceId: number) => {
    const color = boardSpaces[spaceId]?.color
    return boardSpaces.some((space) => space.kind === 'property' && space.color === color && (holdingsById.get(space.id)?.houses ?? 0) > 0)
  }
  const localPlayer = roomPlayers.find((player) => player.sessionId === room?.sessionId)
  const canAuctionNow = Boolean(localPlayer && isMyTurn && !localPlayer.isBankrupt && ['roll', 'resolve', 'jail'].includes(turnPhase) && presentationStage === 'idle' && auctionId === 0 && !tradeOffer)
  const pendingPurchaseSpace = boardSpaces[pendingPropertyId]
  const worldTourChoices = boardSpaces.filter((space) => space.id !== 30 && (space.kind !== 'property' || !holdingsById.get(space.id)?.ownerSessionId || holdingsById.get(space.id)?.ownerSessionId === room?.sessionId))
  const pendingPurchaseHousesCost = pendingPurchaseSpace?.buildable ? pendingPurchaseHouses * constructionCost(pendingPurchaseSpace.id) : 0
  const pendingPurchasePrice = (pendingPurchaseSpace?.price ?? 0) + pendingPurchaseHousesCost
  const worldCupChoices = boardSpaces.filter((space) => space.kind === 'property' && roomProperties.get(String(space.id))?.ownerSessionId === activePlayerSessionId)
  const highlightedSpaceIds = turnPhase === 'purchase'
    ? [pendingPropertyId, ...(selectedSpaceId === null ? [] : [selectedSpaceId])]
    : turnPhase === 'world-cup' && isMyTurn
      ? worldCupChoices.map((space) => space.id)
      : turnPhase === 'world-tour' && isMyTurn
        ? worldTourChoices.map((space) => space.id)
    : turnPhase === 'debt' && showPropertyPanel && isMyTurn
      ? liquidatablePropertyIds(room?.sessionId ?? '', holdingsById)
      : selectedSpaceId === null ? [] : [selectedSpaceId]
  const canAffordPendingPurchase = canAffordPurchase(localPlayer?.cash ?? 0, pendingPurchasePrice)
  const myProperties = Array.from(roomProperties.entries())
    .filter(([_, holding]) => holding.ownerSessionId === room?.sessionId)
    .map(([id, holding]) => ({ spaceId: Number(id), holding, space: boardSpaces[Number(id)] }))
    .filter((entry) => entry.space)
    .sort((first, second) => first.spaceId - second.spaceId)
  const tradeTarget = roomPlayers.find((player) => player.sessionId === tradeTargetSessionId && player.sessionId !== room?.sessionId && !player.isBankrupt)
  const targetProperties = Array.from(roomProperties.entries())
    .filter(([_, holding]) => holding.ownerSessionId === tradeTarget?.sessionId)
    .map(([id, holding]) => ({ spaceId: Number(id), holding, space: boardSpaces[Number(id)] }))
    .filter((entry) => entry.space)
    .sort((first, second) => first.spaceId - second.spaceId)
  const profileProperties = Array.from(roomProperties.entries())
    .filter(([, holding]) => holding.ownerSessionId === profilePlayer?.sessionId)
    .map(([id, holding]) => ({ spaceId: Number(id), holding, space: boardSpaces[Number(id)] }))
    .filter((entry) => entry.space)
    .sort((first, second) => first.spaceId - second.spaceId)
  const landedHolding = activePlayer && activeSpace.kind === 'property' ? holdingsById.get(activeSpace.id) : undefined
  const ownPropertyLanding = turnPhase === 'resolve' && activeSpace.kind === 'property' && pendingPropertyId === activeSpace.id && landedHolding?.ownerSessionId === activePlayerSessionId && !landedHolding.isMortgaged
  const canBuildSelected = activePlayer && ownPropertyLanding ? canBuildProperty(activeSpace.id, activePlayerSessionId, holdingsById, activePlayer.cash, targetBuildHouses) : false
  const canBuildHotelHere = activePlayer && ownPropertyLanding ? canBuildHotel(activeSpace.id, activePlayerSessionId, holdingsById, activePlayer.cash) : false
  const purchaseRentOwnership = new Map(Array.from(roomProperties.entries()).map(([id, holding]) => [Number(id), holding.ownerSessionId]))
  if (pendingPurchaseSpace?.kind === 'property') purchaseRentOwnership.set(pendingPurchaseSpace.id, '__preview__')
  const pendingPurchaseRent = pendingPurchaseSpace?.kind === 'property'
    ? calculateRent(pendingPurchaseSpace.id, purchaseRentOwnership, pendingPurchaseHouses, false, worldCupSpaceId)
    : 0
  const revealKind = activeCardTitle && turnPhase === 'resolve'
    ? 'event'
    : turnPhase === 'world-cup'
      ? 'world-cup'
      : turnPhase === 'world-tour'
        ? 'world-tour'
        : null
  const revealKey = revealKind ? `${turnNumber}:${activePlayerSessionId}:${revealKind}:${activeCardTitle}` : ''
  const showTransientReveal = Boolean(revealKind && revealKey !== dismissedRevealKey)
  const showDice = shouldShowRolledDice(turnPhase, diceForPawnMovement)
  const modalVisible = !isPresentationAnimating && (showAuctionPanel || showPropertyPanel || showObjectivePanel || showTransientReveal || (isMyTurn && (turnPhase === 'purchase' || ownPropertyLanding || turnPhase === 'debt' || turnPhase === 'ended')))
  const propertyBuildings = Array.from(roomProperties.entries()).map(([id, holding]) => ({
    spaceId: Number(id),
    ownerSessionId: holding.ownerSessionId,
    houses: holding.houses,
    isMortgaged: holding.isMortgaged ?? false,
    ownerColor: PLAYER_COLORS[Math.max(0, roomPlayers.findIndex((player) => player.sessionId === holding.ownerSessionId))] ?? PLAYER_COLORS[0],
  }))
  const selectedSpace = selectedSpaceId === null ? undefined : boardSpaces[selectedSpaceId]
  const selectedHolding = selectedSpaceId === null ? undefined : roomProperties.get(String(selectedSpaceId))
  const selectedOwner = selectedHolding?.ownerSessionId
    ? roomPlayers.find((player) => player.sessionId === selectedHolding.ownerSessionId)
    : undefined
  const rentOwnership = new Map(Array.from(roomProperties.entries()).map(([id, holding]) => [Number(id), holding.ownerSessionId]))
  if (selectedSpace?.kind === 'property' && !selectedHolding?.ownerSessionId) rentOwnership.set(selectedSpace.id, '__preview__')
  const selectedRent = selectedSpace?.kind === 'property'
    ? calculateRent(selectedSpace.id, rentOwnership, selectedHolding?.houses ?? 0, selectedHolding?.isMortgaged ?? false, worldCupSpaceId)
    : 0
  function showGameFeedback(message: string, sound: GameSound, player?: { name: string; color: string }) {
    feedbackSequence.current += 1
    const item = { id: feedbackSequence.current, message: player ? personalizePlayerFeedback(message, player.name) : message, sound, playerName: player?.name, playerColor: player?.color }
    setFeedbackQueue((queue) => appendGameFeedback(queue, item))
  }

  function stepAuctionBid(propertyId: number, direction: -1 | 1) {
    setAuctionStartingBids((current) => {
      const currentValue = current[propertyId] ?? String(boardSpaces[propertyId]?.price ?? AUCTION_MIN_BID_INCREMENT)
      return { ...current, [propertyId]: adjustAuctionStartingBid(currentValue, direction, AUCTION_MIN_BID_INCREMENT) }
    })
  }

  useEffect(() => {
    if (!feedbackToast) return
    if (soundEnabledRef.current) playGameSound(feedbackToast.sound)
    const timeout = window.setTimeout(() => setFeedbackQueue((queue) => queue.slice(1)), 2800)
    return () => window.clearTimeout(timeout)
  }, [feedbackToast?.id])

  useEffect(() => {
    if (!showTransientReveal || !revealKey) return
    const timeout = window.setTimeout(() => setDismissedRevealKey(revealKey), 15_000)
    return () => window.clearTimeout(timeout)
  }, [revealKey, showTransientReveal])

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
    const currentId = tradeOffer?.id ?? null
    if (previousTradeOfferId.current !== null && currentId === null) {
      setShowTradePanel(false)
      setTradePropertiesOffered([])
      setTradePropertiesRequested([])
    }
    previousTradeOfferId.current = currentId
  }, [tradeOffer?.id])

  useEffect(() => {
    if (incomingTradeOffer && room?.sessionId) {
      setProfilePlayerSessionId(room.sessionId)
      setShowTradePanel(false)
    }
  }, [incomingTradeOffer, room?.sessionId, tradeOffer?.id])

  useEffect(() => {
    setPendingPurchaseHouses(0)
  }, [pendingPropertyId])

  useEffect(() => {
    if (turnPhase === 'world-cup' || turnPhase === 'world-tour') {
      setShowPropertyPanel(false)
      setShowAuctionPanel(false)
      setShowTradePanel(false)
      setShowObjectivePanel(false)
    }
  }, [turnPhase])

  useEffect(() => {
    if (landedHolding && landedHolding.houses < PROPERTY_BUILD_LEVELS) setTargetBuildHouses(landedHolding.houses + 1)
  }, [activeSpace.id, landedHolding?.houses])

  useEffect(() => {
    if (!room) return

    const updateLobby = (state: unknown) => {
      const playerEntries = getLobbyPlayerEntries<Omit<SyncedPlayer, 'sessionId'>>(state)
      if (!playerEntries) return

      const snapshot = state as {
        players: Map<string, Omit<SyncedPlayer, 'sessionId'>>
        roomCode: string
        mode: Mode
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
        expressRound: number
        phaseSeconds: number
        turnPhase: TurnPhase
        diceOne: number
        diceTwo: number
        diceSequence: number
        pawnMoveMode: string
        landingDescription: string
        activeCardTitle: string
        activeCardDescription: string
        pendingPropertyId: number
        worldCupSpaceId: number
        debtAmount: number
        debtReason: string
        debtCreditorSessionId: string
        winnerSessionId: string
        tradeOfferId: number
        tradeOfferFromSessionId: string
        tradeOfferToSessionId: string
        tradeOfferCashOffered: number
        tradeOfferCashRequested: number
        tradeOfferPropertiesOffered: string
        tradeOfferPropertiesRequested: string
        auctionId: number
        auctionPropertyId: number
        auctionSellerSessionId: string
        auctionStartingBid: number
        auctionHighestBid: number
        auctionHighestBidderSessionId: string
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
          setLandingPulseSpaceId(movedPlayer.position)
          setLandingPulseSequence((sequence) => sequence + 1)
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
        } else if (!['rolling', 'station-rent-rolling', 'moving'].includes(snapshot.turnPhase)) {
          setDiceForPawnMovement(false)
        }
        if (reducedMotion) setPresentationStage('idle')
        else if (snapshot.turnPhase === 'rolling' || snapshot.turnPhase === 'station-rent-rolling') setPresentationStage('dice')
        else if (snapshot.turnPhase === 'moving') setPresentationStage('pawn')
        else setPresentationStage('idle')
        if (snapshot.landingDescription && snapshot.landingDescription !== previous.description) {
          const localCashDelta = (nextPlayerFacts.get(room.sessionId)?.cash ?? 0) - (previous.players.get(room.sessionId)?.cash ?? 0)
          const delta = formatCashDelta(localCashDelta)
          const cashSound = localCashDelta > 0 ? 'money-in' : localCashDelta < 0 ? 'money-out' : null
          const cashChanged = nextPlayers.some((player) => player.cash !== previous.players.get(player.sessionId)?.cash)
          const actor = nextPlayers.find((player) => player.sessionId === snapshot.activePlayerSessionId)
          const actorSeat = nextPlayers.findIndex((player) => player.sessionId === snapshot.activePlayerSessionId)
          const actorColor = PLAYER_COLORS[actorSeat] ?? PLAYER_COLORS[0]
          showGameFeedback(`${snapshot.landingDescription}${delta ? ` · ${delta}` : ''}`, cashSound ?? propertySound ?? (cashChanged ? 'none' : getGameSound(snapshot.landingDescription)), actor ? { name: actor.name, color: actorColor } : undefined)
          if (cashSound && propertySound === 'construction' && soundEnabled) playGameSound('construction')
        } else if (nextPlayers.some((player) => player.sessionId === room.sessionId && player.cash !== previous.players.get(player.sessionId)?.cash)) {
          const localCashDelta = (nextPlayerFacts.get(room.sessionId)?.cash ?? 0) - (previous.players.get(room.sessionId)?.cash ?? 0)
          if (soundEnabled && localCashDelta !== 0) playGameSound(localCashDelta > 0 ? 'money-in' : 'money-out')
        } else if (propertySound && soundEnabled) {
          playGameSound(propertySound)
        } else if (didRoll && soundEnabled) {
          playGameSound('dice')
        }
      }
      previousFeedbackSnapshot.current = { description: snapshot.landingDescription, diceSequence: snapshot.diceSequence, players: nextPlayerFacts, properties: nextPropertyFacts }
      setRoomPlayers((current) => areRecordArraysEqual(current, nextPlayers) ? current : nextPlayers)
      const nextProperties = new Map(snapshot.properties.entries())
      setRoomProperties((current) => areRecordMapsEqual(current, nextProperties) ? current : nextProperties)
      setRoomCode(snapshot.roomCode)
      setMode(snapshot.mode)
      setAnimationSpeed(snapshot.animationSpeed)
      setDevModeEnabled(snapshot.devToolsEnabled)
      setPresentationSpeed(snapshot.presentationSpeed)
      setIsHost(snapshot.players.get(room.sessionId)?.isHost ?? false)
      setActivePlayerSessionId(snapshot.activePlayerSessionId)
      setTurnNumber(snapshot.turnNumber)
      setTurnSeconds(snapshot.turnSeconds)
      setMatchSeconds(snapshot.matchSeconds)
      setMatchEnding(snapshot.matchEnding)
      setExpressRound(snapshot.expressRound)
      setPhaseSeconds(snapshot.phaseSeconds)
      setTurnPhase(snapshot.turnPhase)
      setPawnMoveMode(snapshot.pawnMoveMode === 'teleport' ? 'teleport' : 'walk')
      setDice((current) => {
        const next = [snapshot.diceOne, snapshot.diceTwo] as [number, number]
        return areNumberPairsEqual(current, next) ? current : next
      })
      setLandingDescription(snapshot.landingDescription)
      setActiveCardTitle(snapshot.activeCardTitle)
      setActiveCardDescription(snapshot.activeCardDescription)
      setPendingPropertyId(snapshot.pendingPropertyId)
      setWorldCupSpaceId(snapshot.worldCupSpaceId)
      setDebtAmount(snapshot.debtAmount)
      setDebtReason(snapshot.debtReason)
      setDebtCreditorSessionId(snapshot.debtCreditorSessionId)
      setWinnerSessionId(snapshot.winnerSessionId)
      setTradeOffer(snapshot.tradeOfferId > 0 ? {
        id: snapshot.tradeOfferId,
        fromSessionId: snapshot.tradeOfferFromSessionId,
        toSessionId: snapshot.tradeOfferToSessionId,
        cashOffered: snapshot.tradeOfferCashOffered,
        cashRequested: snapshot.tradeOfferCashRequested,
        propertiesOffered: parseTradeIds(snapshot.tradeOfferPropertiesOffered),
        propertiesRequested: parseTradeIds(snapshot.tradeOfferPropertiesRequested),
      } : null)
      setAuctionId(snapshot.auctionId)
      setAuctionPropertyId(snapshot.auctionPropertyId)
      setAuctionSellerSessionId(snapshot.auctionSellerSessionId)
      setAuctionStartingBid(snapshot.auctionStartingBid)
      setAuctionHighestBid(snapshot.auctionHighestBid)
      setAuctionHighestBidderSessionId(snapshot.auctionHighestBidderSessionId)
      setAuctionSeconds(snapshot.auctionSeconds)
      if (snapshot.status === 'playing' || snapshot.status === 'ended') setScreen('game')
    }
    const handleRoomError = (payload: { message: string }) => setError(payload.message)
    const handleDrop = () => setIsReconnecting(true)
    const handleReconnect = () => setIsReconnecting(false)
    const handleObjective = (update: ExpressObjectiveUpdate) => {
      setExpressObjective(update)
      if (update.completed && !previousObjectiveComplete.current) {
        showGameFeedback(`Objetivo cumprido · +${formatCashDelta(update.rewardAwarded).replace('+', '')}`, 'milestone')
      }
      previousObjectiveComplete.current = update.completed
    }
    const removeObjectiveMessage = room.onMessage<ExpressObjectiveUpdate>('game:objective', handleObjective)
    const handleLeave = (_code: number, reason?: string) => {
      if (activeRoom.current !== room) return
      activeRoom.current = null
      setRoom(null)
      setExpressObjective(null)
      previousObjectiveComplete.current = false
      setShowObjectivePanel(false)
      setIsReconnecting(false)
      setScreen('home')
      setError(reason || 'A conexão com a sala foi encerrada.')
    }

    room.onStateChange(updateLobby)
    room.onMessage('room:error', handleRoomError)
    room.onLeave(handleLeave)
    room.onDrop(handleDrop)
    room.onReconnect(handleReconnect)
    updateLobby(room.state)

    return () => {
      room.onStateChange.remove(updateLobby)
      room.onLeave.remove(handleLeave)
      room.onDrop.remove(handleDrop)
      room.onReconnect.remove(handleReconnect)
      removeObjectiveMessage()
    }
  }, [room, soundEnabled, reducedMotion])

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

  useEffect(() => {
    if (screen !== 'game' || !soundEnabled) return
    unlockGameAudio()
    startGameMusic()
    return stopGameMusic
  }, [screen, soundEnabled])

  useEffect(() => {
    setAuctionBidAmount((current) => normalizeAuctionBidInput(current, auctionMinimumBid))
  }, [auctionId, auctionMinimumBid])

  async function createRoom() {
    if (!name.trim()) return setError('Escolha um nome para continuar.')
    setIsConnecting(true)
    setError('')
    try {
      const nextRoom = await roomClient.create('game_room', { mode, name: name.trim() })
      previousFeedbackSnapshot.current = null
      setExpressObjective(null)
      previousObjectiveComplete.current = false
      setShowObjectivePanel(false)
      setIsReconnecting(false)
      activeRoom.current = nextRoom
      setRoom(nextRoom)
      setRoomCode(nextRoom.roomId)
      setScreen('room')
    } catch {
      setError('Não foi possível criar a sala. Confira se o servidor está disponível e tente novamente.')
    } finally {
      setIsConnecting(false)
    }
  }

  async function joinRoom() {
    if (!name.trim()) return setError('Escolha um nome para continuar.')
    if (roomCode.trim().length !== 5) return setError('Digite um código de sala com 5 caracteres.')
    setIsConnecting(true)
    setError('')
    try {
      const nextRoom = await roomClient.joinById(roomCode.trim().toUpperCase(), { name: name.trim() })
      previousFeedbackSnapshot.current = null
      setExpressObjective(null)
      previousObjectiveComplete.current = false
      setShowObjectivePanel(false)
      setIsReconnecting(false)
      activeRoom.current = nextRoom
      setRoom(nextRoom)
      setRoomCode(nextRoom.roomId)
      setScreen('room')
    } catch {
      setError('Não encontrei essa sala. Confira o código e tente novamente.')
    } finally {
      setIsConnecting(false)
    }
  }

  async function leaveRoom() {
    const currentRoom = activeRoom.current
    activeRoom.current = null
    setRoom(null)
    setRoomPlayers([])
    setRoomProperties(new Map())
    previousFeedbackSnapshot.current = null
    setFeedbackQueue([])
    setLandingPulseSpaceId(-1)
    setExpressObjective(null)
    previousObjectiveComplete.current = false
    setShowObjectivePanel(false)
    setIsHost(false)
    setActivePlayerSessionId('')
    setTurnNumber(0)
    setDice([0, 0])
    setLandingDescription('')
    setActiveCardTitle('')
    setActiveCardDescription('')
    setPendingPropertyId(255)
    setSelectedSpaceId(null)
    setDebtAmount(0)
    setDebtReason('')
    setDebtCreditorSessionId('')
    setWinnerSessionId('')
    setShowPropertyPanel(false)
    setShowTradePanel(false)
    setTradeOffer(null)
    setIsReconnecting(false)
    setTradeTargetSessionId('')
    setTradeCashOffered('0')
    setTradeCashRequested('0')
    setTradePropertiesOffered([])
    setTradePropertiesRequested([])
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

  function removeBot(sessionId: string) {
    room?.send('removeBot', { sessionId })
  }

  function handleSelectSpace(spaceId: number) {
    const phase = isMyTurn && (turnPhase === 'world-cup' || turnPhase === 'world-tour') ? turnPhase : 'inspect'
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
    if (interaction.type === 'inspect') setSelectedSpaceId(interaction.spaceId)
  }

  function dismissTransientReveal() {
    if (!revealKey) return
    setDismissedRevealKey(revealKey)
    if (revealKind === 'event' && isMyTurn && turnPhase === 'resolve') room?.send('finishTurn')
  }

  function handleTransientRevealPointerDown(event: ReactPointerEvent<HTMLElement>) {
    dismissCardRevealOnPointerDown(event, showTransientReveal, dismissTransientReveal)
  }

  return (
    <main className={`app-shell screen-${screen}${screen === 'game' && turnPhase === 'ended' ? ' screen-ended' : ''}${screen === 'game' && isPresentationAnimating ? ' game-presentation-active' : ''}`} data-reduced-motion={reducedMotion} onPointerDownCapture={handleTransientRevealPointerDown}>
      <div className="scene-backdrop">
        {sceneReady && (
          <Suspense fallback={<div className="scene-placeholder" aria-hidden="true" />}>
            <BoardScene players={playerTokens} propertyBuildings={propertyBuildings} worldCupSpaceId={worldCupSpaceId} highlightedSpaceIds={highlightedSpaceIds} selectionMode={(turnPhase === 'world-cup' || turnPhase === 'world-tour') && isMyTurn && !isPresentationAnimating} landingPulseSpaceId={landingPulseSpaceId} landingPulseSequence={landingPulseSequence} diceRollSequence={diceRollSequence} dice={dice} diceVisible={showDice} diceResultVisible={turnPhase === 'moving' && diceForPawnMovement} presentationSpeed={presentationSpeed} reducedMotion={reducedMotion} pawnMovementEnabled={turnPhase === 'moving'} pawnMoveMode={pawnMoveMode} pawnStepSoundEnabled={soundEnabled} graphicsQuality={graphicsQuality} cameraEnabled={screen === 'game' && turnPhase !== 'ended'} fpsMeterEnabled={fpsMeterEnabled} fpsSamples={fpsSamples} onMovementComplete={() => setPresentationStage('idle')} onSelectSpace={handleSelectSpace} />
          </Suspense>
        )}
      </div>
      {screen !== 'game' && <header className="topbar">
        <button className="brand" onClick={() => { if (room) void leaveRoom(); else setScreen('home') }} aria-label="Voltar ao início">
          <span className="brand-mark">B</span><span>BANCO<span className="brand-light">IMOBILIÁRIO</span></span>
        </button>
        <div className="topbar-right"><span className={`connection-dot ${isReconnecting ? 'connection-dot-retrying' : ''}`} /> <span className={isReconnecting ? 'connection-retrying' : ''} role={isReconnecting ? 'status' : undefined} aria-live={isReconnecting ? 'polite' : undefined}>{isReconnecting ? 'RECONECTANDO…' : 'PRÉVIA DE JOGO'}</span><button className="icon-button" aria-label="Ajuda" aria-expanded={showHelp} aria-controls="game-help-dialog" onClick={() => setShowHelp((open) => !open)}>?</button></div>
      </header>}

      {screen === 'home' && (
        <section className="home-layout">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> MESA ABERTA, AMIGOS A CAMINHO</span>
            <h1>Uma cidade.<br /><em>Suas regras.</em></h1>
            <p>Reúna a turma, compre as melhores ruas e descubra quem vai construir o maior império.</p>
            <div className="mode-switch" role="tablist" aria-label="Modo da partida">
              {(Object.keys(modeDetails) as Mode[]).map((option) => (
                <button key={option} role="tab" aria-selected={mode === option} className={mode === option ? 'mode-tab selected' : 'mode-tab'} onClick={() => setMode(option)}>
                  <span>{modeDetails[option].title}</span><small>{modeDetails[option].duration}</small>
                </button>
              ))}
            </div>
            <div className="mode-note"><span className="note-icon">✦</span><span>{modeDetails[mode].detail}</span><span className="player-limit">2–4 JOGADORES</span></div>
          </div>

          <section className="entry-card" aria-label="Criar ou entrar em uma sala">
            <div className="card-heading"><span className="step-number">01</span><div><h2>Entre na mesa</h2><p>Sem cadastro. Só escolha seu nome.</p></div></div>
            <label className="field-label" htmlFor="player-name">SEU NOME</label>
            <input id="player-name" className="text-field" maxLength={18} placeholder="Como seus amigos te chamam?" value={name} onChange={(event) => { setName(event.target.value); setError('') }} />
            <button className="primary-button" onClick={() => void createRoom()} disabled={isConnecting}><span>{isConnecting ? 'Conectando…' : 'Criar uma sala'}</span><span className="button-arrow">↗</span></button>
            <div className="divider"><span />ou entre com um código<span /></div>
            <div className="join-row"><input className="text-field code-field" maxLength={5} placeholder="CÓDIGO" value={roomCode} onChange={(event) => { setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError('') }} aria-label="Código da sala" /><button className="join-button" onClick={() => void joinRoom()} disabled={isConnecting}>Entrar <span>→</span></button></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="privacy-note"><span>◈</span> Salas temporárias. Seu nome aparece só para quem tem o código.</div>
          </section>
          <div className="home-footer"><span>UMA MESA PARA A SUA TURMA</span><span>01 <i>/</i> 03</span></div>
        </section>
      )}

      {screen === 'room' && (
        <section className="room-layout">
          <div className="room-card">
            <button className="back-link" onClick={() => void leaveRoom()}>← Início</button>
            <span className="eyebrow">SALA PRIVADA</span>
            <h1>Chame a<br /><em>sua turma.</em></h1>
            <p>Compartilhe o código com seus amigos para sentarem à mesa.</p>
            <div className="room-code-label">CÓDIGO DA SALA</div><button className="room-code" onClick={() => navigator.clipboard?.writeText(roomCode)}>{roomCode}<span>▣</span></button>
            <div className="room-mode"><span className="mode-icon">✦</span><div><strong>{modeDetails[mode].title}</strong><small>{modeDetails[mode].duration} · {modeDetails[mode].detail}</small></div></div>
            <div className={`dev-tools-setting${devModeEnabled ? ' enabled' : ''}`} aria-live="polite"><span><strong>Modo DEV · dados forçados</strong><small>{devModeEnabled ? 'Ativado para esta partida' : 'Desativado para esta partida'}</small></span>{isHost && <button type="button" aria-pressed={devModeEnabled} onClick={() => room?.send('setDevToolsEnabled', { enabled: !devModeEnabled })}>{devModeEnabled ? 'Desativar' : 'Ativar'}</button>}</div>
            {roomPlayers.some((player) => player.sessionId === room?.sessionId) && <div className="character-selector" aria-label="Escolha sua ficha para a partida">
              <span className="character-selector-label">ESCOLHA SUA FICHA</span>
              <div className="character-option-list">{CHARACTER_OPTIONS.map((option) => {
                const selected = roomPlayers.find((player) => player.sessionId === room?.sessionId)?.characterType === option.id
                return <button key={option.id} type="button" className={`character-option${selected ? ' selected' : ''}`} aria-pressed={selected} onClick={() => selectCharacter(option.id)}>
                  <CharacterIcon characterType={option.id} />
                  <span>{option.label}</span>
                </button>
              })}</div>
            </div>}
            <div className="seat-list">{roomPlayers.map((player, index) => <div className="seat" key={player.sessionId}><span className={`seat-avatar avatar-${index}`}>{player.name.slice(0, 1).toUpperCase()}</span><span>{player.name}</span>{player.isBot ? <small className="seat-bot">BOT</small> : player.isBotControlled ? <small className="seat-bot">BOT NO CONTROLE</small> : player.isConnected === false ? <small className="seat-reconnecting">{player.reconnectionExpired ? 'OFFLINE' : 'RECONECTANDO'}</small> : player.isHost ? <small>ANFITRIÃO</small> : null}{isHost && player.isBot && <button className="seat-remove-bot" onClick={() => removeBot(player.sessionId)} aria-label={`Remover ${player.name}`}>×</button>}</div>)}{Array.from({ length: Math.max(0, 4 - roomPlayers.length) }, (_, index) => <div className="seat waiting" key={`waiting-${index}`}><span className="seat-avatar">+</span><span>Aguardando jogador</span></div>)}</div>
            {isHost && roomPlayers.length < 4 && <button className="add-bot-button" onClick={addBot}>＋ Adicionar bot</button>}
            <div className="prototype-note">{roomPlayers.length}/4 lugares ocupados · sala temporária para sua turma.</div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" onClick={startGame} disabled={!isHost || roomPlayers.length < 2 || roomPlayers.some((player) => !player.isBot && player.isConnected === false)}><span>{isHost ? (roomPlayers.length < 2 ? 'Aguardando jogadores ou bots' : roomPlayers.some((player) => !player.isBot && player.isConnected === false) ? 'Aguardando reconexão' : 'Iniciar partida') : 'Aguardando anfitrião'}</span><span className="button-arrow">↗</span></button>
          </div>
          <div className="room-aside" aria-label="Lugares da sala">
            <div className="aside-top">LUGARES À MESA</div>
            <div className="seat-orbit"><div className="orbit-center">MESA</div>{Array.from({ length: 4 }, (_, index) => {
              const player = roomPlayers[index]
              return <div className={`seat-orb seat-orb-${index} ${player ? 'occupied' : 'empty'}`} key={player?.sessionId ?? `empty-${index}`}><span>{player?.name.slice(0, 1).toUpperCase() ?? '+'}</span><small>{player?.name ?? 'Livre'}</small></div>
            })}</div>
            <div className="aside-bottom">{roomPlayers.length < 4 ? 'COMPARTILHE O CÓDIGO E COMPLETE A MESA.' : 'A MESA ESTÁ COMPLETA.'}</div>
          </div>
        </section>
      )}

      {screen === 'game' && (
        <section className="game-overlay">
          <div className="game-topline"><button className="back-link" onClick={() => setScreen('room')}>← Sala {roomCode}</button><div className={`game-pill ${matchEnding || (mode === 'classic' && matchSeconds <= 60) ? 'clock-warning' : ''}`}>{modeDetails[mode].title.toUpperCase()} <span>·</span> {mode === 'classic' ? formatClock(matchSeconds) : `RODADA ${expressRound}/${6} · ${phaseSeconds}s`}</div><div className="game-tools">{mode === 'express' && expressObjective && turnPhase !== 'ended' && <button className={`portfolio-toggle objective-toggle ${expressObjective.completed ? 'objective-complete' : ''}`} aria-expanded={showObjectivePanel} onClick={() => { setShowObjectivePanel((open) => !open); setShowAuctionPanel(false); setShowTradePanel(false); setShowPropertyPanel(false) }}>{expressObjective.completed ? '✓ Meta' : `Meta ${expressObjective.progress}/${expressObjective.target}`}</button>}{auctionId > 0 && <button className="portfolio-toggle auction-toggle-active" aria-expanded={showAuctionPanel} onClick={() => { setShowAuctionPanel((open) => !open); setShowTradePanel(false); setShowPropertyPanel(false); setShowObjectivePanel(false); setError('') }}>{`Leilão · ${auctionSeconds}s`}</button>}</div></div>
          <div className="game-topline-camera-hint" aria-label="Controles da câmera">Arraste para girar · scroll ou pinça para zoom</div>
          <div className="player-hud">{roomPlayers.map((player, index) => <button type="button" aria-label={`Ver perfil de ${player.name}, saldo ${formatMoney(player.cash)}`} aria-expanded={profilePlayerSessionId === player.sessionId} className={`player-card seat-${index} ${player.sessionId === activePlayerSessionId ? 'active' : ''} ${player.isBankrupt ? 'bankrupt' : ''} ${player.isConnected === false ? 'disconnected' : ''} ${tradeOffer?.toSessionId === player.sessionId ? 'has-trade-offer' : ''}`} key={player.sessionId} style={{ backgroundColor: PLAYER_COLORS[index] ?? PLAYER_COLORS[0] }} onClick={() => { setProfilePlayerSessionId(player.sessionId); setTradeTargetSessionId(player.sessionId); setShowTradePanel(false); setShowPropertyPanel(false); setShowAuctionPanel(false); setShowObjectivePanel(false); setSelectedSpaceId(null); setError('') }}><div className="player-card-main"><strong>{player.name}</strong><b>{formatMoney(player.cash)}</b></div><CashChangeToast cash={player.cash} playerName={player.name} placement={getCashToastPlacement(index)} /><span className="player-money-anchor" data-cash-anchor={player.sessionId} aria-hidden="true"><CashHudSymbols cash={player.cash} /></span>{tradeOffer?.toSessionId === player.sessionId && <span className="player-card-offer-badge">PROPOSTA</span>}</button>)}</div>
          {modalVisible && !feedbackPending && <div className="game-modal-backdrop" aria-hidden="true" />}
          {selectedSpace && turnPhase !== 'ended' && !ownPropertyLanding && !(isMyTurn && (turnPhase === 'purchase' || turnPhase === 'world-cup' || turnPhase === 'world-tour')) && !showTradePanel && !incomingTradeOffer && !showPropertyPanel && !showObjectivePanel && (
            <aside className={`space-inspector${selectedSpace.kind === 'property' ? ' property-inspection-panel' : ''}`} aria-label={`Detalhes de ${selectedSpace.name}`}>
              <button className="trade-close" aria-label="Fechar detalhes" onClick={() => setSelectedSpaceId(null)}>×</button>
              <span className="turn-label">CASA {String(selectedSpace.id + 1).padStart(2, '0')} · {selectedSpace.kind === 'property' ? 'PROPRIEDADE' : 'ESPAÇO ESPECIAL'}</span>
              <h2>{selectedSpace.name}</h2>
              {selectedSpace.kind === 'property' ? (
                <>
                  <div className="space-owner-line"><i style={{ backgroundColor: selectedOwner ? PLAYER_COLORS[Math.max(0, roomPlayers.findIndex((player) => player.sessionId === selectedOwner.sessionId))] : '#a9b4a0' }} />{selectedOwner ? `Pertence a ${selectedOwner.name}` : 'Terreno livre'}</div>
                  <div className="space-facts"><div><small>PREÇO</small><strong>{formatMoney(selectedSpace.price ?? 0)}</strong></div><div><small>ALUGUEL POR PARADA</small><strong>{selectedHolding?.isMortgaged ? 'Hipotecado' : selectedSpace.buildable ? formatMoney(selectedRent) : 'R$ 50.000–300.000 (1 dado)'}</strong></div></div>
                  <p>{selectedHolding?.houses ? selectedHolding.houses === PROPERTY_HOTEL_LEVEL ? 'Hotel construído' : `${selectedHolding.houses} ${selectedHolding.houses === 1 ? 'casa construída' : 'casas construídas'}` : selectedSpace.buildable ? `Imóvel residencial · construção por ${formatMoney(constructionCost(selectedSpace.id))} cada nível` : 'Estação · aluguel de 1 dado'}</p>
                  {selectedSpace.buildable && <div className="property-build-levels purchase-level-options inspection-level-options" role="group" aria-label="Níveis de construção e aluguel">
                    {Array.from({ length: PROPERTY_BUILD_LEVELS + 1 }, (_, houses) => {
                      const rent = selectedHolding?.isMortgaged ? null : calculateRent(selectedSpace.id, rentOwnership, houses, false, worldCupSpaceId)
                      const isCurrent = Boolean(selectedHolding?.ownerSessionId) && selectedHolding?.houses === houses
                      return <div key={houses} className={`property-level-option purchase-choice inspection-choice${isCurrent ? ' selected' : ''}`} aria-current={isCurrent ? 'true' : undefined}><span>{houses === 0 ? 'Terreno' : houses === 1 ? '1 casa' : `${houses} casas`}</span><span className="property-choice-houses" aria-hidden="true">{houses === 0 ? <i className="property-choice-flag" /> : Array.from({ length: houses }, (_, index) => <i key={index} />)}</span><small>Aluguel · {rent === null ? 'Hipotecada' : formatMoney(rent)}</small><b>{formatMoney((selectedSpace.price ?? 0) + houses * constructionCost(selectedSpace.id))}</b></div>
                    })}
                    {selectedHolding?.houses === PROPERTY_HOTEL_LEVEL && <div className="property-level-option purchase-choice inspection-choice selected" aria-current="true"><span>Hotel</span><span className="property-choice-houses" aria-hidden="true">🏨</span><small>Aluguel · {selectedHolding.isMortgaged ? 'Hipotecada' : formatMoney(calculateRent(selectedSpace.id, rentOwnership, PROPERTY_HOTEL_LEVEL, false, worldCupSpaceId))}</small><b>{formatMoney(hotelConstructionCost(selectedSpace.id))}</b></div>}
                  </div>}
                  {selectedOwner?.sessionId === room?.sessionId && <div className="inspector-auction-actions"><div className="auction-start-label">LANCE INICIAL<span className="auction-bid-stepper"><button type="button" aria-label="Diminuir lance inicial" disabled={Number(auctionStartingBids[selectedSpace.id] ?? selectedSpace.price ?? AUCTION_MIN_BID_INCREMENT) <= AUCTION_MIN_BID_INCREMENT} onClick={() => stepAuctionBid(selectedSpace.id, -1)}>−</button><output>{formatMoney(Number(auctionStartingBids[selectedSpace.id] ?? selectedSpace.price ?? AUCTION_MIN_BID_INCREMENT))}</output><button type="button" aria-label="Aumentar lance inicial" onClick={() => stepAuctionBid(selectedSpace.id, 1)}>+</button></span></div><button className="asset-action auction-inspector-button" disabled={!canAuctionNow || isTradePropertyLocked(selectedSpace.id) || Number(auctionStartingBids[selectedSpace.id] ?? selectedSpace.price ?? 0) < AUCTION_MIN_BID_INCREMENT} title={isTradePropertyLocked(selectedSpace.id) ? 'Venda primeiro as construções do grupo' : 'Leiloar este imóvel durante seu turno'} onClick={() => { room?.send('auctionStart', { propertyId: selectedSpace.id, startingBid: Number(auctionStartingBids[selectedSpace.id] ?? selectedSpace.price ?? 0) }); setError('') }}>Leiloar imóvel</button></div>}
                </>
              ) : <p>{selectedSpace.kind === 'tax' ? `Ao parar aqui, pague ${formatMoney(taxForSpace(selectedSpace.id))} ao banco.` : selectedSpace.kind === 'event' ? 'Ao parar aqui, compre uma carta Sorte ou Revés.' : selectedSpace.kind === 'start' ? `Receba ${formatMoney(START_BONUS)} ao cruzar a Partida.` : selectedSpace.kind === 'prison' ? 'Ao cair na prisão, você pode aguardar, tentar duplas para sair ou pagar R$ 200.000 e lançar os dados.' : selectedSpace.kind === 'world-cup' ? `Escolha uma propriedade sua para sediar a Copa. O aluguel dela fica triplicado até outra Copa ser escolhida.${worldCupSpaceId !== 255 ? ` Sede atual: ${boardSpaces[worldCupSpaceId]?.name ?? '—'}.` : ''}` : selectedSpace.kind === 'world-tour' ? 'Escolha uma propriedade sua, livre ou uma casa especial. A viagem não concede bônus de passagem pela Partida.' : 'Espaço de descanso: nenhuma cobrança.'}</p>}
            </aside>
          )}
          {feedbackToast && turnPhase !== 'ended' && <div className="game-feedback-toast" role="status" aria-live="polite" style={feedbackToast.playerColor ? { '--feedback-player-color': feedbackToast.playerColor } as CSSProperties : undefined}>{feedbackToast.playerName && <strong>{feedbackToast.playerName}</strong>}<span>{feedbackToast.playerName ? ` · ${feedbackToast.message}` : feedbackToast.message}</span>{feedbackQueue.length > 1 && <small className="feedback-queue-count">+{feedbackQueue.length - 1} {feedbackQueue.length === 2 ? 'aviso na fila' : 'avisos na fila'}</small>}</div>}
          {ownPropertyLanding && isMyTurn && !isPresentationAnimating ? (
            <aside className="turn-card property-decision-panel" aria-label={`Construir em ${activeSpace.name}`}>
              <div className="asset-panel-heading"><span className="turn-label">VOCÊ JÁ POSSUI · {formatMoney(localPlayer?.cash ?? 0)}</span></div>
              <h2>{activeSpace.name}</h2>
              <p>Você caiu no seu terreno. Escolha até três casas para construir agora. Hotel só fica disponível numa próxima visita, depois das três casas.</p>
              <div className="property-build-levels" role="group" aria-label="Nível de construção desejado">
                {[1, 2, 3].filter((level) => level > (landedHolding?.houses ?? 0)).map((level) => <button key={level} className={`property-level-option ${targetBuildHouses === level ? 'selected' : ''}`} onClick={() => setTargetBuildHouses(level)}><span>{level === 1 ? '1 casa' : `${level} casas`}</span><small>+{formatMoney((level - (landedHolding?.houses ?? 0)) * constructionCost(activeSpace.id))}</small></button>)}
                {(landedHolding?.houses ?? 0) === 3 && <button className="property-level-option hotel-level-option" onClick={() => room?.send('build', { propertyId: activeSpace.id, hotel: true })} disabled={!isMyTurn || !canBuildHotelHere}><span>Hotel</span><small>{formatMoney(hotelConstructionCost(activeSpace.id))}</small></button>}
              </div>
              <div className="space-facts"><div><small>ALUGUEL POR PARADA</small><strong>{activeSpace.buildable ? formatMoney(calculateRent(activeSpace.id, rentOwnership, landedHolding?.houses ?? 0)) : 'R$ 50.000–300.000 (1 dado)'}</strong></div><div><small>PRÓXIMA CONSTRUÇÃO</small><strong>{landedHolding?.houses === PROPERTY_HOTEL_LEVEL ? 'Hotel' : formatMoney(constructionCost(activeSpace.id))}</strong></div></div>
              <div className="purchase-actions property-decision-actions"><button className="roll-button" onClick={() => room?.send('build', { propertyId: activeSpace.id, targetHouses: targetBuildHouses })} disabled={!isMyTurn || !canBuildSelected}>Construir <span>{formatMoney(Math.max(0, targetBuildHouses - (landedHolding?.houses ?? 0)) * constructionCost(activeSpace.id))}</span></button><button className="secondary-action" onClick={() => room?.send('finishTurn')} disabled={!isMyTurn}>Concluir vez</button></div>
              {landedHolding?.houses === PROPERTY_HOTEL_LEVEL && <p className="purchase-hint">Este terreno já tem hotel.</p>}
            </aside>
          ) : !feedbackPending && showAuctionPanel && turnPhase !== 'ended' ? (
            <aside className="turn-card trade-panel auction-panel" aria-label="Leilão voluntário de propriedade">
              <div className="asset-panel-heading"><span className="turn-label">{auctionId > 0 ? `LEILÃO · ${auctionSeconds}s` : 'MERCADO ENTRE JOGADORES'}</span><button className="trade-close" onClick={() => setShowAuctionPanel(false)} aria-label="Fechar leilão">×</button></div>
              {error && <p className="form-error" role="alert">{error}</p>}
              {auctionId > 0 ? (
                <>
                  <h2>{boardSpaces[auctionPropertyId]?.name ?? 'Imóvel em leilão'}</h2>
                  <p>Venda voluntária aberta por {auctionSeller?.name ?? 'um jogador'}. O lance fica reservado até o fim; hipoteca acompanha o imóvel.</p>
                  <div className="auction-current-bid"><span>{auctionHighestBid > 0 ? `Maior lance · ${auctionHighBidder?.name ?? 'jogador'}` : 'Lance inicial'}</span><strong>{formatMoney(auctionHighestBid || auctionStartingBid)}</strong></div>
                  {isAuctionSeller ? (
                    auctionHighestBid === 0 && <button className="secondary-action trade-full-button" onClick={() => room?.send('auctionCancel', { auctionId })}>Cancelar leilão</button>
                  ) : (
                    <>
                      <MoneyStepper label={`SEU LANCE · MÍNIMO ${formatMoney(auctionMinimumBid)}`} value={Number(auctionBidAmount) || auctionMinimumBid} minimum={auctionMinimumBid} maximum={localPlayer?.cash ?? 0} step={AUCTION_MIN_BID_INCREMENT} onChange={(value) => setAuctionBidAmount(String(value))} />
                      <button className="roll-button trade-full-button" disabled={turnPhase === 'purchase' || turnPhase === 'debt' || Number(auctionBidAmount) < auctionMinimumBid || (localPlayer?.cash ?? 0) < Number(auctionBidAmount)} onClick={() => { room?.send('auctionBid', { auctionId, amount: Number(auctionBidAmount) }); setError('') }}>Dar lance</button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <h2>Leilão voluntário</h2>
                  <p>Qualquer jogador pode vender um imóvel próprio, mesmo fora da vez. Abra a carteira para escolher o título e definir o lance inicial. Recusar uma propriedade livre não a coloca em leilão.</p>
                  <button className="roll-button trade-full-button" onClick={() => { setShowAuctionPanel(false); setShowPropertyPanel(true) }}>Abrir minha carteira</button>
                </>
              )}
            </aside>
          ) : !feedbackPending && showPropertyPanel && turnPhase !== 'ended' ? (
            <aside className="turn-card asset-panel" aria-label="Minha carteira de imóveis">
              <div className="asset-panel-heading"><span className="turn-label">{turnPhase === 'debt' ? 'LIQUIDAÇÃO DE DÍVIDA' : 'CARTEIRA DA PARTIDA'}</span>{turnPhase === 'debt' ? <button className="trade-close" onClick={() => setShowPropertyPanel(false)} aria-label="Voltar para a dívida">×</button> : <span>{formatMoney(localPlayer?.cash ?? 0)}</span>}</div>
              <h2>{turnPhase === 'debt' ? 'Bens para quitar a dívida' : 'Meus imóveis'}</h2>
              <p>{turnPhase === 'debt' ? `Falta pagar ${formatMoney(debtAmount)}. Seu saldo é ${formatMoney(localPlayer?.cash ?? 0)}; venda construções ou hipoteque títulos para completar o pagamento.` : 'Toque num imóvel seu no tabuleiro para abrir as opções. Hipotecas ficam disponíveis apenas para quitar uma dívida.'}</p>
              <div className="asset-list">
                {myProperties.length === 0 ? <span className="asset-empty">Você ainda não tem propriedades.</span> : myProperties.map(({ spaceId, holding, space }) => {
                  const canMortgage = canMortgageProperty(spaceId, room?.sessionId ?? '', holdingsById)
                  const redemptionCost = mortgageRedemptionCost(spaceId)
                  return (
                    <div className={`asset-row ${holding.isMortgaged ? 'mortgaged' : ''}`} key={spaceId}>
                      <div className="asset-info"><strong>{space.name}</strong><small>{holding.isMortgaged ? `HIPOTECADO · sem aluguel` : holding.houses === PROPERTY_HOTEL_LEVEL ? 'HOTEL' : holding.houses ? `${holding.houses} CASA(S)` : space.buildable ? 'IMÓVEL' : 'ESTAÇÃO'}</small></div>
                      <div className="asset-row-actions">{holding.houses > 0 && canSellBuilding(spaceId, room?.sessionId ?? '', holdingsById) ? (
                        <button className="asset-action" disabled={!isMyTurn || !['resolve', 'debt'].includes(turnPhase) || (turnPhase === 'debt' && (localPlayer?.cash ?? 0) >= debtAmount)} onClick={() => room?.send('sellBuilding', { propertyId: spaceId })}>Vender construção <b>+{formatMoney(buildingSaleValue(spaceId))}</b></button>
                      ) : holding.isMortgaged ? (
                        <button className="asset-action" disabled={!isMyTurn || turnPhase !== 'resolve' || !canRedeemMortgage(spaceId, room?.sessionId ?? '', holdingsById, localPlayer?.cash ?? 0)} onClick={() => room?.send('redeemMortgage', { propertyId: spaceId })} title={`Resgate por ${formatMoney(redemptionCost)}`}>Resgatar <b>{formatMoney(redemptionCost)}</b></button>
                      ) : (
                        <button className="asset-action" disabled={!isMyTurn || !canMortgage || turnPhase !== 'debt' || (localPlayer?.cash ?? 0) >= debtAmount} onClick={() => room?.send('mortgage', { propertyId: spaceId })} title={canMortgage ? 'Disponível apenas para completar o pagamento de uma dívida' : 'Venda primeiro as construções do grupo'}>Hipotecar <b>+{formatMoney(mortgageValue(spaceId))}</b></button>
                      )}</div>
                    </div>
                  )
                })}
              </div>
              <span className="asset-note">Inicie leilões durante seu turno, fora de compras e dívidas. Os lances ficam reservados durante 20 segundos.</span>
            </aside>
          ) : !feedbackPending && mode === 'express' && expressObjective && showObjectivePanel && turnPhase !== 'ended' ? (
            <aside className="turn-card objective-panel" aria-label="Objetivo privado Express">
              <div className="asset-panel-heading"><span className="turn-label">SUA CARTA · EXPRESS</span><button className="trade-close" onClick={() => setShowObjectivePanel(false)} aria-label="Fechar objetivo">×</button></div>
              <h2>{expressObjective.title}</h2>
              <p>{expressObjective.description}</p>
              <div className="objective-progress" role="progressbar" aria-label="Progresso do objetivo" aria-valuemin={0} aria-valuemax={expressObjective.target} aria-valuenow={expressObjective.progress}>
                <span><b>{expressObjective.completed ? expressObjective.target : expressObjective.progress}/{expressObjective.target}</b> progresso</span>
                <span>Bônus <b>{formatMoney(expressObjective.reward)}</b></span>
                <div className="objective-progress-track"><i style={{ width: `${Math.min(100, expressObjective.progress / expressObjective.target * 100)}%` }} /></div>
              </div>
              {expressObjective.completed && <p className="objective-complete-note">Objetivo cumprido! {formatMoney(expressObjective.rewardAwarded)} adicionados ao saldo. Continue jogando: a vitória é decidida ao fim da partida.</p>}
            </aside>
          ) : shouldSuppressTurnCardForFeedback(feedbackPending, turnPhase) || !showTurnCard || shouldSuppressTurnCardForSpaceSelection(Boolean(selectedSpace), turnPhase, ownPropertyLanding, showPropertyPanel, showObjectivePanel) ? null : (
            <div className={`turn-card${turnPhase === 'ended' ? ' final-result-card' : ''}${turnPhase === 'purchase' ? ' purchase-panel' : ''}${turnPhase === 'world-cup' || turnPhase === 'world-tour' ? ' corner-choice-panel' : ''}`}>
              <span className="turn-label">{turnPhase === 'ended' ? 'PARTIDA ENCERRADA' : turnPhase === 'debt' ? 'DÍVIDA EM ABERTO' : matchEnding ? 'TEMPO ESGOTADO · CONCLUA A JOGADA' : `TURNO ${turnNumber} · ${isMyTurn ? 'SUA VEZ' : `VEZ DE ${activePlayer?.name ?? '…'}`}`}{turnPhase !== 'ended' && turnSeconds > 0 && <b className="turn-countdown" aria-label={`${turnSeconds} segundos restantes`}>{turnSeconds}s</b>}</span>
              <h2>{presentationStage === 'dice' ? 'Rolando os dados…' : presentationStage === 'pawn' ? 'Peão em movimento…' : turnPhase === 'ended' ? (roomPlayers.find((player) => player.sessionId === winnerSessionId)?.name ?? 'Partida encerrada') : turnPhase === 'debt' ? 'Hora de liquidar bens' : activeCardTitle || (turnPhase === 'purchase' ? `Comprar ${pendingPurchaseSpace?.name ?? 'propriedade'}` : activeSpace.name)}</h2>
              {presentationStage !== 'idle' ? <p role="status" aria-live="polite">A próxima ação aparece quando a etapa atual terminar.</p> : turnPhase !== 'ended' && <p>{turnPhase === 'purchase' ? 'Este terreno está livre. Você escolhe se quer comprar; se recusar, ele continua sem dono.' : landingDescription || activeCardDescription || (activeSpace.kind === 'property' ? `Propriedade · ${formatMoney(activeSpace.price ?? 0)}` : 'Aguardando a jogada.')}</p>}
              {presentationStage === 'idle' && turnPhase === 'purchase' && pendingPurchaseSpace?.kind === 'property' && <>
                {pendingPurchaseSpace.buildable && <div className="property-build-levels purchase-level-options" role="group" aria-label="Pacotes de terreno e casas">{Array.from({ length: PROPERTY_BUILD_LEVELS + 1 }, (_, houses) => {
                  const total = (pendingPurchaseSpace.price ?? 0) + houses * constructionCost(pendingPurchaseSpace.id)
                  const rent = calculateRent(pendingPurchaseSpace.id, purchaseRentOwnership, houses, false, worldCupSpaceId)
                  return <button key={houses} className={`property-level-option purchase-choice ${pendingPurchaseHouses === houses ? 'selected' : ''}`} aria-pressed={pendingPurchaseHouses === houses} disabled={!canAffordPurchase(localPlayer?.cash ?? 0, total)} onClick={() => setPendingPurchaseHouses(houses)}><span>{houses === 0 ? 'Terreno' : houses === 1 ? '1 casa' : `${houses} casas`}</span><span className="property-choice-houses" aria-hidden="true">{houses === 0 ? <i className="property-choice-flag" /> : Array.from({ length: houses }, (_, index) => <i key={index} />)}</span><small>Aluguel · {formatMoney(rent)}</small><b>{formatMoney(total)}</b></button>
                })}</div>}
                <div className="purchase-rent-preview"><span>ALUGUEL COM ESTA ESCOLHA</span><strong>{pendingPurchaseSpace.buildable ? formatMoney(pendingPurchaseRent) : 'R$ 50.000–300.000'} <small>{pendingPurchaseSpace.buildable ? '/ parada' : '/ 1 dado'}</small></strong></div>
              </>}
              {presentationStage !== 'idle' && turnPhase !== 'ended' ? (
                <div className="presentation-wait" aria-hidden="true">{presentationStage === 'dice' ? '🎲' : '↗'}</div>
              ) : turnPhase === 'ended' ? (
                <div className="final-result-content">
                  <div className="winner-banner"><span aria-hidden="true">✦</span><strong>{winnerSessionId ? 'VENCEDOR DA PARTIDA' : 'PARTIDA ENCERRADA'}</strong><span aria-hidden="true">✦</span></div>
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
              ) : turnPhase === 'station-rent' ? (
                <div className="station-rent-actions"><p>Um dado decide o aluguel desta estação: cada ponto vale R$ 50.000. Role para descobrir o valor.</p><button className="roll-button" onClick={() => room?.send('stationRentRoll')} disabled={!isMyTurn}>Girar dado da estação <span>🎲</span></button></div>
              ) : turnPhase === 'debt' ? (
                <div className="debt-actions"><strong>Dívida: {formatMoney(debtAmount)}</strong><p>{debtReason} · credor: {roomPlayers.find((player) => player.sessionId === debtCreditorSessionId)?.name ?? 'banco'}</p><button className="roll-button" onClick={() => room?.send('payDebt')} disabled={!isMyTurn || (localPlayer?.cash ?? 0) < debtAmount}>Pagar dívida <span>{formatMoney(debtAmount)}</span></button><button className="secondary-action" onClick={() => setShowPropertyPanel(true)} disabled={!isMyTurn}>Ver bens para liquidar</button><button className="secondary-action" onClick={() => room?.send('declareBankruptcy')} disabled={!isMyTurn || (localPlayer?.cash ?? 0) >= debtAmount || hasLiquidatableAssets(room?.sessionId ?? '', holdingsById)}>Declarar falência</button></div>
              ) : turnPhase === 'jail' ? (
                <div className="jail-actions"><p className="jail-hint" role="status">Você ainda precisa cumprir {localPlayer?.jailTurns ?? activePlayer?.jailTurns ?? 0} turno(s) preso. Tente duplas para sair ou pague R$ 200.000.</p><button className="roll-button" onClick={() => room?.send('jailRoll')} disabled={!isMyTurn}>Tentar duplas <span>🎲</span></button><button className="secondary-action" onClick={() => room?.send('jailPay')} disabled={!isMyTurn || (localPlayer?.cash ?? 0) < 200_000}>Pagar R$ 200.000 e sair</button><button className="secondary-action" onClick={() => room?.send('finishTurn')} disabled={!isMyTurn}>Aguardar este turno preso</button></div>
              ) : turnPhase === 'world-cup' ? (
                <div className="corner-choice-actions"><p className="map-choice-hint">Selecione uma propriedade sua iluminada no tabuleiro para definir a sede. O aluguel dela fica triplicado.</p></div>
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
                        <button className="roll-button" onClick={() => room?.send('buy', { houses: pendingPurchaseHouses })} disabled={!isMyTurn || !canAffordPendingPurchase}>Comprar <span>{formatMoney(pendingPurchasePrice)}</span></button>
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
          {profilePlayer && turnPhase !== 'ended' && <aside className="player-profile-panel" aria-label={`Perfil de ${profilePlayer.name}`} style={{ '--profile-player-color': PLAYER_COLORS[Math.max(0, roomPlayers.findIndex((player) => player.sessionId === profilePlayer.sessionId))] ?? PLAYER_COLORS[0] } as CSSProperties}>
            <div className="player-profile-heading"><div><span className="turn-label">PERFIL DO JOGADOR</span><h2>{profilePlayer.name}</h2><strong>{formatMoney(profilePlayer.cash)}</strong></div><button className="trade-close" aria-label="Fechar perfil" onClick={() => { setProfilePlayerSessionId(''); setShowTradePanel(false) }}>×</button></div>
            {incomingTradeOffer && tradeOffer && <section className="profile-offer-card" aria-label="Proposta recebida"><span className="turn-label">PROPOSTA RECEBIDA</span><h3>{tradeCounterparty?.name ?? 'Jogador'} propõe uma troca</h3><p>Você entrega {formatMoney(tradeOffer.cashRequested)}{tradeOffer.propertiesRequested.length ? ` e ${tradeOffer.propertiesRequested.map((id) => boardSpaces[id].name).join(', ')}` : ''}. Você recebe {formatMoney(tradeOffer.cashOffered)}{tradeOffer.propertiesOffered.length ? ` e ${tradeOffer.propertiesOffered.map((id) => boardSpaces[id].name).join(', ')}` : ''}.</p><div className="trade-actions"><button className="roll-button" onClick={() => room?.send('tradeAccept', { offerId: tradeOffer.id })}>Aceitar</button><button className="secondary-action" onClick={() => room?.send('tradeReject', { offerId: tradeOffer.id })}>Recusar</button></div></section>}
            {outgoingTradeOffer && tradeOffer && <section className="profile-offer-card" aria-label="Proposta enviada"><span className="turn-label">PROPOSTA PENDENTE</span><h3>Aguardando {tradeCounterparty?.name ?? 'jogador'}</h3><p>A proposta fica disponível até a outra pessoa responder. Você pode cancelá-la quando quiser.</p><button className="secondary-action trade-full-button" onClick={() => room?.send('tradeCancel', { offerId: tradeOffer.id })}>Cancelar proposta</button></section>}
            {tradeOffer && !incomingTradeOffer && !outgoingTradeOffer && <p className="trade-note">Já existe outra proposta aguardando resposta.</p>}
            <div className={`profile-property-list${profileProperties.length === 1 ? ' profile-property-list--single' : ''}`} aria-label={`Imóveis de ${profilePlayer.name}`}>
              {profileProperties.length === 0 ? <span className="asset-empty">Este jogador ainda não tem imóveis.</span> : profileProperties.map(({ spaceId, holding, space }) => {
                const icon = !space.buildable ? '🚉' : holding.houses === PROPERTY_HOTEL_LEVEL ? '🏨' : holding.houses > 0 ? '🏠'.repeat(holding.houses) : '🏡'
                const type = !space.buildable ? 'Estação' : holding.houses === PROPERTY_HOTEL_LEVEL ? 'Hotel' : holding.houses > 0 ? `${holding.houses} ${holding.houses === 1 ? 'casa' : 'casas'}` : 'Terreno'
                const rentLabel = getPropertyRentLabel(spaceId, propertyBuildings, worldCupSpaceId) ?? '—'
                return <div className="profile-property-row" key={spaceId}><span className="profile-property-icon" aria-label={type}>{icon}</span><span className="profile-property-copy"><strong>{space.name}</strong><small>{type}{holding.isMortgaged ? ' · hipotecado' : ''}</small></span><span className="profile-property-rent"><small>ALUGUEL</small><b>{rentLabel}</b></span></div>
              })}
            </div>
            {profilePlayer.sessionId !== room?.sessionId && !profilePlayer.isBankrupt && !incomingTradeOffer && !outgoingTradeOffer && <div className="profile-trade-actions">{showTradePanel ? <button className="secondary-action trade-full-button" onClick={() => setShowTradePanel(false)}>Fechar proposta</button> : <button className="roll-button trade-full-button" disabled={Boolean(tradeOffer) || auctionId > 0} onClick={() => { setTradeTargetSessionId(profilePlayer.sessionId); setShowTradePanel(true); setTradePropertiesOffered([]); setTradePropertiesRequested([]); setError('') }}>Propor troca</button>}</div>}
            {showTradePanel && !tradeOffer && profilePlayer.sessionId !== room?.sessionId && <section className="profile-trade-composer" aria-label={`Proposta para ${profilePlayer.name}`}>
              <div className="trade-columns">
                <div><MoneyStepper label="VOCÊ OFERECE · DINHEIRO" value={Number(tradeCashOffered)} maximum={localPlayer?.cash ?? 0} onChange={(value) => setTradeCashOffered(String(value))} /><label className="trade-label">IMÓVEIS QUE VOCÊ OFERECE</label><div className="trade-property-list">{myProperties.length ? myProperties.map(({ spaceId, holding, space }) => <button type="button" className={`trade-property ${tradePropertiesOffered.includes(spaceId) ? 'selected' : ''}`} key={`offer-${spaceId}`} aria-pressed={tradePropertiesOffered.includes(spaceId)} disabled={isTradePropertyLocked(spaceId)} onClick={() => setTradePropertiesOffered((current) => toggleSelection(current, spaceId))}><span>{space.name}</span><small>{holding.isMortgaged ? 'Hipotecado' : isTradePropertyLocked(spaceId) ? 'Venda construções primeiro' : 'Selecionar imóvel'}</small></button>) : <small>Você não tem imóveis.</small>}</div></div>
                <div><MoneyStepper label="VOCÊ PEDE · DINHEIRO" value={Number(tradeCashRequested)} maximum={tradeTarget?.cash ?? 0} onChange={(value) => setTradeCashRequested(String(value))} /><label className="trade-label">IMÓVEIS QUE VOCÊ PEDE</label><div className="trade-property-list">{targetProperties.length ? targetProperties.map(({ spaceId, holding, space }) => <button type="button" className={`trade-property ${tradePropertiesRequested.includes(spaceId) ? 'selected' : ''}`} key={`request-${spaceId}`} aria-pressed={tradePropertiesRequested.includes(spaceId)} disabled={isTradePropertyLocked(spaceId)} onClick={() => setTradePropertiesRequested((current) => toggleSelection(current, spaceId))}><span>{space.name}</span><small>{holding.isMortgaged ? 'Hipotecado' : isTradePropertyLocked(spaceId) ? 'Venda construções primeiro' : 'Selecionar imóvel'}</small></button>) : <small>Este jogador não tem imóveis.</small>}</div></div>
              </div>
              <p className="trade-note">Imóveis hipotecados continuam hipotecados. A troca só acontece se a outra pessoa aceitar.</p>{error && <p className="form-error" role="alert">{error}</p>}
              <button className="roll-button trade-full-button" disabled={!tradeTarget || Boolean(tradeOffer) || auctionId > 0} onClick={() => { room?.send('tradeOffer', { toSessionId: tradeTarget?.sessionId, cashOffered: Number(tradeCashOffered), cashRequested: Number(tradeCashRequested), propertiesOffered: tradePropertiesOffered, propertiesRequested: tradePropertiesRequested }); setError('') }}>Enviar proposta</button>
            </section>}
          </aside>}
          {turnPhase === 'roll' && !feedbackPending && (isMyTurn || (isHost && devModeEnabled)) && <div className={`roll-control${isHost && devModeEnabled ? ' roll-control-dev' : ''}`}>
            {isMyTurn && <button className="roll-control-button" type="button" onClick={() => room?.send('roll')}>Girar dados</button>}
            {isHost && devModeEnabled && <form className="dev-dice-controls" aria-label="Forçar resultado dos dados" onSubmit={(event) => { event.preventDefault(); room?.send('devRoll', { diceOne: forcedDice[0], diceTwo: forcedDice[1] }) }}>
              <span>DEV</span>
              {[0, 1].map((dieIndex) => <div className="dev-die-stepper" key={dieIndex} role="group" aria-label={`Valor do dado ${dieIndex + 1}`}><span>D{dieIndex + 1}</span><button type="button" aria-label={`Diminuir valor do dado ${dieIndex + 1}`} onClick={() => setForcedDice((current) => current.map((value, index) => index === dieIndex ? stepDieValue(value, -1) : value) as [number, number])}>−</button><output aria-live="polite">{forcedDice[dieIndex]}</output><button type="button" aria-label={`Aumentar valor do dado ${dieIndex + 1}`} onClick={() => setForcedDice((current) => current.map((value, index) => index === dieIndex ? stepDieValue(value, 1) : value) as [number, number])}>+</button></div>)}
              <button type="submit">Forçar</button>
            </form>}
          </div>}
          {isMyTurn && turnPhase === 'resolve' && !ownPropertyLanding && !activeCardTitle && !feedbackPending && <div className="turn-action-control"><button type="button" onClick={() => room?.send('finishTurn')}>Continuar</button></div>}
          {isMyTurn && !showTransientReveal && !feedbackPending && turnPhase === 'world-cup' && <div className="map-choice-prompt" role="status">Toque em uma propriedade sua iluminada para escolher a sede</div>}
          {isMyTurn && !showTransientReveal && !feedbackPending && turnPhase === 'world-tour' && <div className="map-choice-prompt" role="status">Toque em uma casa iluminada para escolher o destino</div>}
          {showTransientReveal && <div className="card-reveal-backdrop" role="button" tabIndex={0} aria-label="Fechar carta e continuar" onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') dismissTransientReveal() }}><article className="game-event-card" aria-live="polite"><span className="event-card-kicker">{revealKind === 'event' ? 'SORTE OU REVÉS' : revealKind === 'world-cup' ? 'COPA DO MUNDO' : 'VOLTA AO MUNDO'}</span><div className="event-card-art" aria-hidden="true">{revealKind === 'world-cup' ? '✦' : revealKind === 'world-tour' ? '↗' : '◆'}</div><h2>{revealKind === 'event' ? activeCardTitle : revealKind === 'world-cup' ? 'Escolha a sede' : 'Escolha para onde viajar'}</h2><p>{revealKind === 'event' ? activeCardDescription : revealKind === 'world-cup' ? 'Toque em uma propriedade sua iluminada no tabuleiro. O aluguel dela vale três vezes.' : 'Toque em uma casa iluminada. Propriedades de outras pessoas ficam indisponíveis.'}</p><small>Toque em qualquer lugar para continuar · {turnSeconds || 15}s</small></article></div>}
          <div className="game-bottom"><span className="game-sync-label">JOGADA SINCRONIZADA · {modeDetails[mode].title.toUpperCase()}</span><div className="game-session-tools">{animationSpeedControl}<button className="game-preference fps-toggle" aria-pressed={fpsMeterEnabled} aria-label={`Medidor de FPS ${fpsMeterEnabled ? 'ativado' : 'desativado'}`} title={`Medidor de FPS ${fpsMeterEnabled ? 'ativado' : 'desativado'}`} onClick={() => setFpsMeterEnabled((enabled) => !enabled)}>FPS</button><button className="game-preference" aria-pressed={soundEnabled} aria-label={`Áudio da partida ${soundEnabled ? 'ativado' : 'desativado'}`} title={`Trilha e efeitos ${soundEnabled ? 'ativados' : 'desativados'}`} onClick={() => { unlockGameAudio(); setSoundEnabled((enabled) => !enabled) }}>{soundEnabled ? '♫' : '♪̸'}</button><button className="game-preference" aria-pressed={reducedMotion} aria-label={`Movimento reduzido ${reducedMotion ? 'ativado' : 'desativado'}`} title={`Movimento reduzido ${reducedMotion ? 'ativado' : 'desativado'}`} onClick={() => setReducedMotion((enabled) => !enabled)}>◌</button><div className="game-options-wrap"><button className="game-preference" aria-label="Opções da partida" aria-expanded={showOptions} onClick={() => setShowOptions((open) => !open)}>⚙</button>{showOptions && <section className="game-options-panel" role="dialog" aria-label="Opções gráficas"><div className="game-options-heading"><strong>GRÁFICOS</strong><small>{graphicsQuality === 'high' ? 'Alta resolução' : graphicsQuality === 'balanced' ? 'Equilibrado' : 'Desempenho'}</small></div><p>Mais qualidade deixa a imagem mais nítida e pode reduzir o desempenho em aparelhos modestos.</p><div className="graphics-quality-options" role="group" aria-label="Qualidade gráfica">{([['performance', 'Desempenho'], ['balanced', 'Equilibrado'], ['high', 'Alta']] as const).map(([quality, label]) => <button type="button" key={quality} className={graphicsQuality === quality ? 'selected' : ''} aria-pressed={graphicsQuality === quality} onClick={() => setGraphicsQuality(quality)}>{label}</button>)}</div></section>}</div><button className="game-preference" aria-label="Ajuda" aria-expanded={showHelp} aria-controls="game-help-dialog" onClick={() => setShowHelp((open) => !open)}>?</button></div><button className="leave-button" onClick={() => void leaveRoom()}>Sair da mesa</button></div>
        </section>
      )}
      {screen === 'game' && <Suspense fallback={null}><CashHudOverlay players={roomPlayers.map((player) => ({ id: player.sessionId, cash: player.cash }))} /></Suspense>}
      {screen === 'game' && fpsMeterEnabled && <FpsMeter samples={fpsSamples} />}
      {showHelp && <div className="help-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHelp(false) }}><section id="game-help-dialog" className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title"><button className="help-close" onClick={() => setShowHelp(false)} aria-label="Fechar ajuda">×</button><span className="eyebrow">GUIA RÁPIDO</span><h2 id="help-title">Como jogar</h2><p>Jogue com amigos na mesma sala. Na sua vez, lance os dados, acompanhe o peão e responda à ação da casa.</p><ul><li><strong>20 segundos:</strong> sem ação, os dados são lançados automaticamente.</li><li><strong>15 segundos:</strong> para decidir. Compra sem resposta é recusada; cobranças e eventos são confirmados automaticamente. Na prisão, você pode aguardar, tentar duplas ou pagar R$ 200.000 para sair.</li><li><strong>Copa do Mundo:</strong> escolha uma propriedade; o aluguel dela triplica até outra sede ser escolhida.</li><li><strong>Volta ao Mundo:</strong> viaje para uma propriedade sua, livre ou para uma casa especial. A chegada resolve normalmente, sem bônus da Partida.</li><li><strong>Comprar:</strong> propriedades livres podem ser compradas pelo preço indicado; recusar mantém o terreno livre.</li><li><strong>Dinheiro:</strong> sons ascendentes indicam entrada; sons descendentes indicam saída. Use o controle de áudio para silenciar.</li><li><strong>Partida:</strong> no Clássico vence o maior patrimônio ao fim de 30 minutos. No Express, vence o maior saldo após seis rodadas.</li></ul><button className="roll-button help-ok" onClick={() => setShowHelp(false)}>Entendi</button></section></div>}
    </main>
  )
}

export default App
