import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { Room } from '@colyseus/sdk'
import type { GameMode, LobbyPlayer } from '../../shared/lobby'
import { scheduleSceneLoad } from './sceneLoading'
import { roomClient } from './roomClient'
import { finalScoreMetrics, rankFinalScore, scoreCriteria } from './scoreCriteria'
import { getLobbyPlayerEntries } from './lobbySnapshot'
import { canAffordPurchase } from './purchaseActions'
import { normalizeAuctionBidInput } from './auctionActions'
import { boardSpaces, formatMoney } from '../game/board'
import { AUCTION_MIN_BID_INCREMENT, JAIL_FINE, START_BONUS, buildingSaleValue, calculateRent, canBuildProperty, canMortgageProperty, canRedeemMortgage, canSellBuilding, constructionCost, hasLiquidatableAssets, liquidatablePropertyIds, mortgageRedemptionCost, mortgageValue, taxForSpace, type PropertyHolding } from '../../shared/game'
import type { ExpressObjectiveUpdate } from '../../shared/objectives'
import { PLAYER_COLORS } from './playerPalette'
import { getGameSound, getPropertyChangeSound, getPropertyVisualChange, formatCashDelta, type GameSound } from './gameFeedback'
import { playGameSound, startGameMusic, stopGameMusic, unlockGameAudio } from './gameAudio'

type Mode = GameMode
type Screen = 'home' | 'room' | 'game'
type TurnPhase = 'roll' | 'resolve' | 'purchase' | 'jail' | 'debt' | 'ended'
type SyncedPlayer = LobbyPlayer & { sessionId: string; cash: number; isJailed: boolean; jailTurns: number; isBankrupt: boolean; finalCash: number; finalNetWorth: number; tieBreakRoll: number }
type TradeOfferView = { id: number; fromSessionId: string; toSessionId: string; cashOffered: number; cashRequested: number; propertiesOffered: number[]; propertiesRequested: number[] }
const BoardScene = lazy(() => import('./BoardScene'))

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

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [sceneReady, setSceneReady] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [feedbackToast, setFeedbackToast] = useState('')
  const [diceRollSequence, setDiceRollSequence] = useState(0)
  const [landingPulseSpaceId, setLandingPulseSpaceId] = useState(-1)
  const [landingPulseSequence, setLandingPulseSequence] = useState(0)
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState<Mode>('classic')
  const [error, setError] = useState('')
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [activePlayerSessionId, setActivePlayerSessionId] = useState('')
  const [turnNumber, setTurnNumber] = useState(0)
  const [matchSeconds, setMatchSeconds] = useState(0)
  const [matchEnding, setMatchEnding] = useState(false)
  const [expressRound, setExpressRound] = useState(0)
  const [phaseSeconds, setPhaseSeconds] = useState(0)
  const [expressObjective, setExpressObjective] = useState<ExpressObjectiveUpdate | null>(null)
  const [showObjectivePanel, setShowObjectivePanel] = useState(false)
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('roll')
  const [dice, setDice] = useState<[number, number]>([0, 0])
  const [landingDescription, setLandingDescription] = useState('')
  const [activeCardTitle, setActiveCardTitle] = useState('')
  const [activeCardDescription, setActiveCardDescription] = useState('')
  const [pendingPropertyId, setPendingPropertyId] = useState(255)
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null)
  const [debtAmount, setDebtAmount] = useState(0)
  const [debtReason, setDebtReason] = useState('')
  const [debtCreditorSessionId, setDebtCreditorSessionId] = useState('')
  const [winnerSessionId, setWinnerSessionId] = useState('')
  const [showPropertyPanel, setShowPropertyPanel] = useState(false)
  const [showTradePanel, setShowTradePanel] = useState(false)
  const [showAuctionPanel, setShowAuctionPanel] = useState(false)
  const [auctionSeconds, setAuctionSeconds] = useState(0)
  const [auctionId, setAuctionId] = useState(0)
  const [auctionPropertyId, setAuctionPropertyId] = useState(255)
  const [auctionSellerSessionId, setAuctionSellerSessionId] = useState('')
  const [auctionStartingBid, setAuctionStartingBid] = useState(0)
  const [auctionHighestBid, setAuctionHighestBid] = useState(0)
  const [auctionHighestBidderSessionId, setAuctionHighestBidderSessionId] = useState('')
  const [auctionBidAmount, setAuctionBidAmount] = useState('10000')
  const [auctionStartingBids, setAuctionStartingBids] = useState<Record<number, string>>({})
  const [tradeSeconds, setTradeSeconds] = useState(0)
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
  const previousFeedbackSnapshot = useRef<{ description: string; diceOne: number; diceTwo: number; players: Map<string, { cash: number; position: number }>; properties: Map<string, PropertyHolding> } | null>(null)
  const previousObjectiveComplete = useRef(false)
  const feedbackTimeout = useRef<number | null>(null)
  const previousTradeOfferId = useRef<number | null>(null)
  const activePlayer = roomPlayers.find((player) => player.sessionId === activePlayerSessionId)
  const activeSpace = boardSpaces[activePlayer?.position ?? 0]
  const playerTokens = roomPlayers.length > 0
    ? roomPlayers.flatMap((player, seatIndex) => player.isBankrupt ? [] : [{ id: player.sessionId, position: player.position, color: PLAYER_COLORS[seatIndex] ?? PLAYER_COLORS[0], seatIndex }])
    : [0, 3, 6, 9].map((position, seatIndex) => ({ id: `preview-${seatIndex}`, position, color: PLAYER_COLORS[seatIndex] ?? PLAYER_COLORS[0], seatIndex }))
  const isMyTurn = room?.sessionId === activePlayerSessionId
  const incomingTradeOffer = tradeOffer?.toSessionId === room?.sessionId
  const outgoingTradeOffer = tradeOffer?.fromSessionId === room?.sessionId
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
  const canAuctionNow = Boolean(localPlayer && !localPlayer.isBankrupt && turnPhase !== 'purchase' && turnPhase !== 'debt' && turnPhase !== 'ended' && auctionId === 0 && !tradeOffer)
  const pendingPurchasePrice = boardSpaces[pendingPropertyId]?.price ?? 0
  const pendingPurchaseSpace = boardSpaces[pendingPropertyId]
  const highlightedSpaceIds = turnPhase === 'purchase'
    ? [pendingPropertyId, ...(selectedSpaceId === null ? [] : [selectedSpaceId])]
    : turnPhase === 'debt' && showPropertyPanel && isMyTurn
      ? liquidatablePropertyIds(room?.sessionId ?? '', holdingsById)
      : selectedSpaceId === null ? [] : [selectedSpaceId]
  const canAffordPendingPurchase = canAffordPurchase(localPlayer?.cash ?? 0, pendingPurchasePrice)
  const myProperties = Array.from(roomProperties.entries())
    .filter(([_, holding]) => holding.ownerSessionId === room?.sessionId)
    .map(([id, holding]) => ({ spaceId: Number(id), holding, space: boardSpaces[Number(id)] }))
    .filter((entry) => entry.space)
    .sort((first, second) => first.spaceId - second.spaceId)
  const availableTradePartners = roomPlayers.filter((player) => player.sessionId !== room?.sessionId && !player.isBankrupt)
  const tradeTarget = availableTradePartners.find((player) => player.sessionId === tradeTargetSessionId) ?? availableTradePartners[0]
  const targetProperties = Array.from(roomProperties.entries())
    .filter(([_, holding]) => holding.ownerSessionId === tradeTarget?.sessionId)
    .map(([id, holding]) => ({ spaceId: Number(id), holding, space: boardSpaces[Number(id)] }))
    .filter((entry) => entry.space)
    .sort((first, second) => first.spaceId - second.spaceId)
  const buildOptions = activePlayer
    ? Array.from(roomProperties.keys()).map(Number).filter((id) => canBuildProperty(id, activePlayerSessionId, holdingsById, activePlayer.cash))
    : []
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
    ? calculateRent(selectedSpace.id, rentOwnership, selectedHolding?.houses ?? 0, selectedHolding?.isMortgaged ?? false)
    : 0
  const pendingRentOwnership = new Map(Array.from(roomProperties.entries()).map(([id, holding]) => [Number(id), holding.ownerSessionId]))
  if (pendingPurchaseSpace?.kind === 'property') pendingRentOwnership.set(pendingPurchaseSpace.id, '__preview__')
  const pendingPurchaseRent = pendingPurchaseSpace?.kind === 'property'
    ? calculateRent(pendingPurchaseSpace.id, pendingRentOwnership)
    : 0

  function showGameFeedback(message: string, sound: GameSound) {
    setFeedbackToast(message)
    if (feedbackTimeout.current !== null) window.clearTimeout(feedbackTimeout.current)
    feedbackTimeout.current = window.setTimeout(() => setFeedbackToast(''), 4500)
    if (soundEnabled) playGameSound(sound)
  }

  useEffect(() => {
    if (sceneReady || screen === 'game') {
      setSceneReady(true)
      return
    }

    return scheduleSceneLoad(() => setSceneReady(true))
  }, [sceneReady, screen])

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
    if (!room) return

    const updateLobby = (state: unknown) => {
      const playerEntries = getLobbyPlayerEntries<Omit<SyncedPlayer, 'sessionId'>>(state)
      if (!playerEntries) return

      const snapshot = state as {
        players: Map<string, Omit<SyncedPlayer, 'sessionId'>>
        roomCode: string
        mode: Mode
        status: 'waiting' | 'playing' | 'ended'
        activePlayerSessionId: string
        properties: Map<string, PropertyHolding>
        turnNumber: number
        matchSeconds: number
        matchEnding: boolean
        expressRound: number
        phaseSeconds: number
        turnPhase: TurnPhase
        diceOne: number
        diceTwo: number
        landingDescription: string
        activeCardTitle: string
        activeCardDescription: string
        pendingPropertyId: number
        debtAmount: number
        debtReason: string
        debtCreditorSessionId: string
        winnerSessionId: string
        tradeSeconds: number
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
        const didRoll = snapshot.diceOne > 0 && (previous.diceOne === 0 && previous.diceTwo === 0 || snapshot.diceOne !== previous.diceOne || snapshot.diceTwo !== previous.diceTwo)
        if (didRoll) setDiceRollSequence((sequence) => sequence + 1)
        if (snapshot.landingDescription && snapshot.landingDescription !== previous.description) {
          const localCashDelta = (nextPlayerFacts.get(room.sessionId)?.cash ?? 0) - (previous.players.get(room.sessionId)?.cash ?? 0)
          const delta = formatCashDelta(localCashDelta)
          showGameFeedback(`${snapshot.landingDescription}${delta ? ` · ${delta}` : ''}`, propertySound ?? getGameSound(snapshot.landingDescription))
        } else if (propertySound && soundEnabled) {
          playGameSound(propertySound)
        } else if (didRoll && soundEnabled) {
          playGameSound('dice')
        }
      }
      previousFeedbackSnapshot.current = { description: snapshot.landingDescription, diceOne: snapshot.diceOne, diceTwo: snapshot.diceTwo, players: nextPlayerFacts, properties: nextPropertyFacts }
      setRoomPlayers(nextPlayers)
      setRoomProperties(new Map(snapshot.properties.entries()))
      setRoomCode(snapshot.roomCode)
      setMode(snapshot.mode)
      setIsHost(snapshot.players.get(room.sessionId)?.isHost ?? false)
      setActivePlayerSessionId(snapshot.activePlayerSessionId)
      setTurnNumber(snapshot.turnNumber)
      setMatchSeconds(snapshot.matchSeconds)
      setMatchEnding(snapshot.matchEnding)
      setExpressRound(snapshot.expressRound)
      setPhaseSeconds(snapshot.phaseSeconds)
      setTurnPhase(snapshot.turnPhase)
      setDice([snapshot.diceOne, snapshot.diceTwo])
      setLandingDescription(snapshot.landingDescription)
      setActiveCardTitle(snapshot.activeCardTitle)
      setActiveCardDescription(snapshot.activeCardDescription)
      setPendingPropertyId(snapshot.pendingPropertyId)
      setDebtAmount(snapshot.debtAmount)
      setDebtReason(snapshot.debtReason)
      setDebtCreditorSessionId(snapshot.debtCreditorSessionId)
      setWinnerSessionId(snapshot.winnerSessionId)
      setTradeSeconds(snapshot.tradeSeconds)
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
  }, [room, soundEnabled])

  useEffect(() => () => {
    if (feedbackTimeout.current !== null) window.clearTimeout(feedbackTimeout.current)
  }, [])

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
    setFeedbackToast('')
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
    setTradeSeconds(0)
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

  return (
    <main className={`app-shell screen-${screen}${screen === 'game' && turnPhase === 'ended' ? ' screen-ended' : ''}`} data-reduced-motion={reducedMotion}>
      <div className="scene-backdrop">
        {sceneReady && (
          <Suspense fallback={<div className="scene-placeholder" aria-hidden="true" />}>
            <BoardScene players={playerTokens} propertyBuildings={propertyBuildings} highlightedSpaceIds={highlightedSpaceIds} landingPulseSpaceId={landingPulseSpaceId} landingPulseSequence={landingPulseSequence} diceRollSequence={diceRollSequence} dice={dice} reducedMotion={reducedMotion} onSelectSpace={setSelectedSpaceId} />
          </Suspense>
        )}
      </div>
      <header className="topbar">
        <button className="brand" onClick={() => { if (room) void leaveRoom(); else setScreen('home') }} aria-label="Voltar ao início">
          <span className="brand-mark">B</span><span>BANCO<span className="brand-light">IMOBILIÁRIO</span></span>
        </button>
        <div className="topbar-right"><span className={`connection-dot ${isReconnecting ? 'connection-dot-retrying' : ''}`} /> <span className={isReconnecting ? 'connection-retrying' : ''} role={isReconnecting ? 'status' : undefined} aria-live={isReconnecting ? 'polite' : undefined}>{isReconnecting ? 'RECONECTANDO…' : 'PRÉVIA DE JOGO'}</span>{screen === 'game' && <><button className="game-preference" aria-pressed={soundEnabled} aria-label={`Áudio da partida ${soundEnabled ? 'ativado' : 'desativado'}`} title={`Trilha e efeitos ${soundEnabled ? 'ativados' : 'desativados'}`} onClick={() => { unlockGameAudio(); setSoundEnabled((enabled) => !enabled) }}>{soundEnabled ? '♫' : '♪̸'}</button><button className="game-preference" aria-pressed={reducedMotion} aria-label={`Movimento reduzido ${reducedMotion ? 'ativado' : 'desativado'}`} title={`Movimento reduzido ${reducedMotion ? 'ativado' : 'desativado'}`} onClick={() => setReducedMotion((enabled) => !enabled)}>◌</button></>}<button className="icon-button" aria-label="Ajuda">?</button></div>
      </header>

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
            <div className="seat-list">{roomPlayers.map((player, index) => <div className="seat" key={`${player.name}-${index}`}><span className={`seat-avatar avatar-${index}`}>{player.name.slice(0, 1).toUpperCase()}</span><span>{player.name}</span>{player.isConnected === false ? <small className="seat-reconnecting">{player.reconnectionExpired ? 'OFFLINE' : 'RECONECTANDO'}</small> : player.isHost && <small>ANFITRIÃO</small>}</div>)}{Array.from({ length: Math.max(0, 4 - roomPlayers.length) }, (_, index) => <div className="seat waiting" key={`waiting-${index}`}><span className="seat-avatar">+</span><span>Aguardando jogador</span></div>)}</div>
            <div className="prototype-note">{roomPlayers.length}/4 lugares ocupados · sala temporária para sua turma.</div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" onClick={startGame} disabled={!isHost || roomPlayers.length < 2 || roomPlayers.some((player) => player.isConnected === false)}><span>{isHost ? (roomPlayers.length < 2 ? 'Aguardando jogadores' : roomPlayers.some((player) => player.isConnected === false) ? 'Aguardando reconexão' : 'Iniciar partida') : 'Aguardando anfitrião'}</span><span className="button-arrow">↗</span></button>
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
          <div className="game-topline"><button className="back-link" onClick={() => setScreen('room')}>← Sala {roomCode}</button><div className={`game-pill ${matchEnding || (mode === 'classic' && matchSeconds <= 60) ? 'clock-warning' : ''}`}>{modeDetails[mode].title.toUpperCase()} <span>·</span> {mode === 'classic' ? formatClock(matchSeconds) : `RODADA ${expressRound}/${6} · ${phaseSeconds}s`}</div><div className="game-tools">{mode === 'express' && expressObjective && turnPhase !== 'ended' && <button className={`portfolio-toggle objective-toggle ${expressObjective.completed ? 'objective-complete' : ''}`} aria-expanded={showObjectivePanel} onClick={() => { setShowObjectivePanel((open) => !open); setShowAuctionPanel(false); setShowTradePanel(false); setShowPropertyPanel(false) }}>{expressObjective.completed ? '✓ Meta' : `Meta ${expressObjective.progress}/${expressObjective.target}`}</button>}<button className={`portfolio-toggle ${auctionId > 0 ? 'auction-toggle-active' : ''}`} aria-expanded={showAuctionPanel} onClick={() => { setShowAuctionPanel((open) => !open); setShowTradePanel(false); setShowPropertyPanel(false); setShowObjectivePanel(false); setError('') }}>{auctionId > 0 ? `Leilão · ${auctionSeconds}s` : 'Leilão'}</button><button className="portfolio-toggle" aria-expanded={showTradePanel || Boolean(incomingTradeOffer)} disabled={(tradeSeconds === 0 && !incomingTradeOffer) || auctionId > 0} onClick={() => { setShowTradePanel((open) => !open); setShowAuctionPanel(false); setShowPropertyPanel(false); setShowObjectivePanel(false); setError('') }}>{incomingTradeOffer ? 'Oferta recebida' : `Negociar · ${tradeSeconds}s`}</button><button className="portfolio-toggle" aria-expanded={showPropertyPanel} onClick={() => { setShowPropertyPanel((open) => !open); setShowAuctionPanel(false); setShowTradePanel(false); setShowObjectivePanel(false) }}>{showPropertyPanel ? '← Jogada' : `Imóveis · ${myProperties.length}`}</button></div></div>
          <div className="player-hud">{roomPlayers.map((player, index) => <div className={`player-card seat-${index} ${player.sessionId === activePlayerSessionId ? 'active' : ''} ${player.isBankrupt ? 'bankrupt' : ''} ${player.isConnected === false ? 'disconnected' : ''}`} key={player.sessionId}><span className={`player-avatar player-${index}`}>{player.name.slice(0, 1).toUpperCase()}</span><div className="player-info"><strong>{player.name}</strong><small>{player.isBankrupt ? 'FALIU' : player.isConnected === false ? player.reconnectionExpired ? 'OFFLINE' : 'RECONECTANDO' : player.isJailed ? `PRESO · ${player.jailTurns}/3` : player.sessionId === activePlayerSessionId ? 'VEZ ATUAL' : `CASA ${String(player.position + 1).padStart(2, '0')}`}</small></div><b>{formatMoney(player.cash)}</b></div>)}</div>
          {selectedSpace && turnPhase !== 'ended' && !(turnPhase === 'purchase' && selectedSpace.id === pendingPropertyId) && !showTradePanel && !incomingTradeOffer && !showPropertyPanel && !showObjectivePanel && (
            <aside className="space-inspector" aria-label={`Detalhes de ${selectedSpace.name}`}>
              <button className="trade-close" aria-label="Fechar detalhes" onClick={() => setSelectedSpaceId(null)}>×</button>
              <span className="turn-label">CASA {String(selectedSpace.id + 1).padStart(2, '0')} · {selectedSpace.kind === 'property' ? 'PROPRIEDADE' : 'ESPAÇO ESPECIAL'}</span>
              <h2>{selectedSpace.name}</h2>
              {selectedSpace.kind === 'property' ? (
                <>
                  <div className="space-owner-line"><i style={{ backgroundColor: selectedOwner ? PLAYER_COLORS[Math.max(0, roomPlayers.findIndex((player) => player.sessionId === selectedOwner.sessionId))] : '#a9b4a0' }} />{selectedOwner ? `Pertence a ${selectedOwner.name}` : 'Terreno livre'}</div>
                  <div className="space-facts"><div><small>PREÇO</small><strong>{formatMoney(selectedSpace.price ?? 0)}</strong></div><div><small>ALUGUEL ATUAL</small><strong>{selectedHolding?.isMortgaged ? 'Hipotecado' : formatMoney(selectedRent)}</strong></div></div>
                  <p>{selectedHolding?.houses ? selectedHolding.houses === 5 ? 'Hotel construído' : `${selectedHolding.houses} ${selectedHolding.houses === 1 ? 'casa construída' : 'casas construídas'}` : selectedSpace.buildable ? `Imóvel residencial · construção por ${formatMoney(constructionCost(selectedSpace.id))} cada nível` : 'Estação · sem construções'}</p>
                </>
              ) : <p>{selectedSpace.kind === 'tax' ? `Ao parar aqui, pague ${formatMoney(taxForSpace(selectedSpace.id))} ao banco.` : selectedSpace.kind === 'event' ? 'Ao parar aqui, compre uma carta Sorte ou Revés.' : selectedSpace.kind === 'start' ? `Receba ${formatMoney(START_BONUS)} ao cruzar a Partida.` : selectedSpace.kind === 'go-to-prison' || selectedSpace.kind === 'prison' ? selectedSpace.kind === 'go-to-prison' ? 'Vá direto para a prisão e encerre sua vez.' : 'Você está só de visita; continue normalmente.' : 'Espaço de descanso: nenhuma cobrança.'}</p>}
            </aside>
          )}
          {(turnPhase === 'resolve' || turnPhase === 'purchase') && dice[0] > 0 && (
            <div className="dice-result" aria-live="polite" aria-label={`Resultado dos dados: ${dice[0]} e ${dice[1]}, total ${dice[0] + dice[1]}`}>
              <span className="dice-result-label">Resultado da jogada</span>
              <div className="dice-result-pair" aria-hidden="true"><span>{dice[0]}</span><span>{dice[1]}</span></div>
              <span className="dice-result-total">Total {dice[0] + dice[1]}</span>
            </div>
          )}
          {feedbackToast && turnPhase !== 'ended' && <div className="game-feedback-toast" role="status" aria-live="polite">{feedbackToast}</div>}
          {showAuctionPanel && turnPhase !== 'ended' ? (
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
                      <label className="trade-label">SEU LANCE · MÍNIMO {formatMoney(auctionMinimumBid)}<input className="trade-input" type="number" min={auctionMinimumBid} step={AUCTION_MIN_BID_INCREMENT} value={auctionBidAmount} onChange={(event) => setAuctionBidAmount(event.target.value)} /></label>
                      <button className="roll-button trade-full-button" disabled={turnPhase === 'purchase' || turnPhase === 'debt' || (localPlayer?.cash ?? 0) < Number(auctionBidAmount)} onClick={() => { room?.send('auctionBid', { auctionId, amount: Number(auctionBidAmount) }); setError('') }}>Dar lance</button>
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
          ) : (showTradePanel || incomingTradeOffer) && turnPhase !== 'ended' ? (
            <aside className="turn-card trade-panel" aria-label="Negociação entre jogadores">
              <div className="asset-panel-heading"><span className="turn-label">NEGOCIAÇÃO · {tradeSeconds}s</span><button className="trade-close" onClick={() => setShowTradePanel(false)} aria-label="Fechar negociação">×</button></div>
              {error && <p className="form-error" role="alert">{error}</p>}
              {tradeOffer ? incomingTradeOffer ? (
                <>
                  <h2>Proposta de {tradeCounterparty?.name ?? 'jogador'}</h2>
                  <p>Você oferece {formatMoney(tradeOffer.cashRequested)}{tradeOffer.propertiesRequested.length ? ` e ${tradeOffer.propertiesRequested.map((id) => boardSpaces[id].name).join(', ')}` : ''}. Em troca, recebe {formatMoney(tradeOffer.cashOffered)}{tradeOffer.propertiesOffered.length ? ` e ${tradeOffer.propertiesOffered.map((id) => boardSpaces[id].name).join(', ')}` : ''}.</p>
                  <div className="trade-actions"><button className="roll-button" disabled={tradeSeconds === 0} onClick={() => room?.send('tradeAccept', { offerId: tradeOffer.id })}>Aceitar troca</button><button className="secondary-action" onClick={() => room?.send('tradeReject', { offerId: tradeOffer.id })}>Recusar</button></div>
                </>
              ) : outgoingTradeOffer ? (
                <>
                  <h2>Aguardando {tradeCounterparty?.name ?? 'jogador'}</h2>
                  <p>Proposta enviada. A outra pessoa pode aceitar ou recusar enquanto a janela estiver aberta.</p>
                  <button className="secondary-action trade-full-button" onClick={() => room?.send('tradeCancel', { offerId: tradeOffer.id })}>Cancelar oferta</button>
                </>
              ) : (
                <>
                  <h2>Troca em andamento</h2>
                  <p>{roomPlayers.find((player) => player.sessionId === tradeOffer.fromSessionId)?.name ?? 'Um jogador'} enviou uma proposta para {roomPlayers.find((player) => player.sessionId === tradeOffer.toSessionId)?.name ?? 'outro jogador'}.</p>
                </>
              ) : (
                <>
                  <h2>Propor uma troca</h2>
                  <label className="trade-label">NEGOCIAR COM<select className="trade-select" value={tradeTarget?.sessionId ?? ''} onChange={(event) => setTradeTargetSessionId(event.target.value)}>{availableTradePartners.map((player) => <option key={player.sessionId} value={player.sessionId}>{player.name}</option>)}</select></label>
                  <div className="trade-columns">
                    <div><label className="trade-label">VOCÊ OFERECE · DINHEIRO<input className="trade-input" type="number" min="0" max={localPlayer?.cash ?? 0} value={tradeCashOffered} onChange={(event) => setTradeCashOffered(event.target.value)} /></label>
                      <label className="trade-label">VOCÊ OFERECE · IMÓVEIS</label><div className="trade-property-list">{myProperties.length ? myProperties.map(({ spaceId, holding, space }) => <label className="trade-property" key={`offer-${spaceId}`}><input type="checkbox" disabled={isTradePropertyLocked(spaceId)} checked={tradePropertiesOffered.includes(spaceId)} onChange={() => setTradePropertiesOffered((current) => current.includes(spaceId) ? current.filter((id) => id !== spaceId) : [...current, spaceId])} /><span>{space.name}{holding.isMortgaged ? ' · hipotecado' : isTradePropertyLocked(spaceId) ? ' · venda construções do grupo' : ''}</span></label>) : <small>Nenhum imóvel disponível</small>}</div>
                    </div>
                    <div><label className="trade-label">VOCÊ PEDE · DINHEIRO<input className="trade-input" type="number" min="0" max={tradeTarget?.cash ?? 0} value={tradeCashRequested} onChange={(event) => setTradeCashRequested(event.target.value)} /></label>
                      <label className="trade-label">VOCÊ PEDE · IMÓVEIS</label><div className="trade-property-list">{targetProperties.length ? targetProperties.map(({ spaceId, holding, space }) => <label className="trade-property" key={`request-${spaceId}`}><input type="checkbox" disabled={isTradePropertyLocked(spaceId)} checked={tradePropertiesRequested.includes(spaceId)} onChange={() => setTradePropertiesRequested((current) => current.includes(spaceId) ? current.filter((id) => id !== spaceId) : [...current, spaceId])} /><span>{space.name}{holding.isMortgaged ? ' · hipotecado' : isTradePropertyLocked(spaceId) ? ' · venda construções do grupo' : ''}</span></label>) : <small>Nenhum imóvel disponível</small>}</div>
                    </div>
                  </div>
                  <p className="trade-note">Imóvel hipotecado mantém a hipoteca. Proposta expira quando o tempo de negociação termina.</p>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <button className="roll-button trade-full-button" disabled={!isMyTurn || tradeSeconds === 0 || !tradeTarget} onClick={() => { room?.send('tradeOffer', { toSessionId: tradeTarget?.sessionId, cashOffered: Number(tradeCashOffered), cashRequested: Number(tradeCashRequested), propertiesOffered: tradePropertiesOffered, propertiesRequested: tradePropertiesRequested }); setError('') }}>Enviar proposta</button>
                </>
              )}
            </aside>
          ) : showPropertyPanel && turnPhase !== 'ended' ? (
            <aside className="turn-card asset-panel" aria-label="Minha carteira de imóveis">
              <div className="asset-panel-heading"><span className="turn-label">{turnPhase === 'debt' ? 'LIQUIDAÇÃO DE DÍVIDA' : 'CARTEIRA DA PARTIDA'}</span>{turnPhase === 'debt' ? <button className="trade-close" onClick={() => setShowPropertyPanel(false)} aria-label="Voltar para a dívida">×</button> : <span>{formatMoney(localPlayer?.cash ?? 0)}</span>}</div>
              <h2>{turnPhase === 'debt' ? 'Bens para quitar a dívida' : 'Meus imóveis'}</h2>
              <p>{turnPhase === 'debt' ? `Falta pagar ${formatMoney(debtAmount)}. Seu saldo é ${formatMoney(localPlayer?.cash ?? 0)}; os aros dourados indicam bens que podem ser liquidados.` : 'Hipoteque para receber metade do valor ou abra um leilão voluntário de um título próprio.'}</p>
              <div className="asset-list">
                {myProperties.length === 0 ? <span className="asset-empty">Você ainda não tem propriedades.</span> : myProperties.map(({ spaceId, holding, space }) => {
                  const canMortgage = canMortgageProperty(spaceId, room?.sessionId ?? '', holdingsById)
                  const redemptionCost = mortgageRedemptionCost(spaceId)
                  return (
                    <div className={`asset-row ${holding.isMortgaged ? 'mortgaged' : ''}`} key={spaceId}>
                      <div className="asset-info"><strong>{space.name}</strong><small>{holding.isMortgaged ? `HIPOTECADO · sem aluguel` : holding.houses ? `${holding.houses === 5 ? 'HOTEL' : `${holding.houses} CASA(S)`}` : space.buildable ? 'IMÓVEL' : 'ESTAÇÃO'}</small></div>
                      <div className="asset-row-actions">{holding.houses > 0 && canSellBuilding(spaceId, room?.sessionId ?? '', holdingsById) ? (
                        <button className="asset-action" disabled={!isMyTurn || !['resolve', 'debt'].includes(turnPhase)} onClick={() => room?.send('sellBuilding', { propertyId: spaceId })}>Vender construção <b>+{formatMoney(buildingSaleValue(spaceId))}</b></button>
                      ) : holding.isMortgaged ? (
                        <button className="asset-action" disabled={!isMyTurn || turnPhase !== 'resolve' || !canRedeemMortgage(spaceId, room?.sessionId ?? '', holdingsById, localPlayer?.cash ?? 0)} onClick={() => room?.send('redeemMortgage', { propertyId: spaceId })} title={`Resgate por ${formatMoney(redemptionCost)}`}>Resgatar <b>{formatMoney(redemptionCost)}</b></button>
                      ) : (
                        <button className="asset-action" disabled={!isMyTurn || !canMortgage || !['resolve', 'debt'].includes(turnPhase)} onClick={() => room?.send('mortgage', { propertyId: spaceId })} title={canMortgage ? `Receba ${formatMoney(mortgageValue(spaceId))}` : 'Venda primeiro as construções do grupo'}>Hipotecar <b>+{formatMoney(mortgageValue(spaceId))}</b></button>
                      )}<label className="auction-start-label">LANCE INICIAL<input className="trade-input" type="number" min={AUCTION_MIN_BID_INCREMENT} step={AUCTION_MIN_BID_INCREMENT} value={auctionStartingBids[spaceId] ?? String(space.price ?? AUCTION_MIN_BID_INCREMENT)} onChange={(event) => setAuctionStartingBids((current) => ({ ...current, [spaceId]: event.target.value }))} /></label><button className="asset-action auction-start-button" disabled={!canAuctionNow || isTradePropertyLocked(spaceId) || Number(auctionStartingBids[spaceId] ?? space.price ?? 0) < AUCTION_MIN_BID_INCREMENT} title={isTradePropertyLocked(spaceId) ? 'Venda primeiro as construções do grupo' : 'Leiloar seu imóvel para os outros jogadores'} onClick={() => { room?.send('auctionStart', { propertyId: spaceId, startingBid: Number(auctionStartingBids[spaceId] ?? space.price ?? 0) }); setError('') }}>Leiloar</button></div>
                    </div>
                  )
                })}
              </div>
              <span className="asset-note">Leilões podem ser iniciados fora da sua vez; os lances ficam reservados durante 20 segundos.</span>
            </aside>
          ) : mode === 'express' && expressObjective && showObjectivePanel && turnPhase !== 'ended' ? (
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
          ) : (
            <div className={`turn-card${turnPhase === 'ended' ? ' final-result-card' : ''}`}>
              <span className="turn-label">{turnPhase === 'ended' ? 'PARTIDA ENCERRADA' : turnPhase === 'debt' ? 'DÍVIDA EM ABERTO' : matchEnding ? 'TEMPO ESGOTADO · CONCLUA A JOGADA' : `TURNO ${turnNumber} · ${isMyTurn ? 'SUA VEZ' : `VEZ DE ${activePlayer?.name ?? '…'}`}`}</span>
              <h2>{turnPhase === 'ended' ? (roomPlayers.find((player) => player.sessionId === winnerSessionId)?.name ?? 'Partida encerrada') : turnPhase === 'debt' ? 'Hora de liquidar bens' : activeCardTitle || (turnPhase === 'purchase' ? `Comprar ${pendingPurchaseSpace?.name ?? 'propriedade'}` : activeSpace.name)}</h2>
              {turnPhase !== 'ended' && <p>{turnPhase === 'purchase' ? 'Este terreno está livre. Você escolhe se quer comprar; se recusar, ele continua sem dono.' : landingDescription || activeCardDescription || (activeSpace.kind === 'property' ? `Propriedade · ${formatMoney(activeSpace.price ?? 0)}` : 'Aguardando a jogada.')}</p>}
              {turnPhase === 'purchase' && pendingPurchaseSpace?.kind === 'property' && <div className="purchase-summary"><div><small>PREÇO DO TERRENO</small><strong>{formatMoney(pendingPurchasePrice)}</strong></div><div><small>ALUGUEL INICIAL</small><strong>{formatMoney(pendingPurchaseRent)}</strong></div><div><small>CONSTRUÇÃO</small><strong>{pendingPurchaseSpace.buildable ? `${formatMoney(constructionCost(pendingPurchaseSpace.id))} por nível` : 'Não disponível'}</strong></div></div>}
              {turnPhase === 'ended' ? (
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
              ) : turnPhase === 'debt' ? (
                <div className="debt-actions"><strong>Dívida: {formatMoney(debtAmount)}</strong><p>{debtReason} · credor: {roomPlayers.find((player) => player.sessionId === debtCreditorSessionId)?.name ?? 'banco'}</p><button className="roll-button" onClick={() => room?.send('payDebt')} disabled={!isMyTurn || (localPlayer?.cash ?? 0) < debtAmount}>Pagar dívida <span>{formatMoney(debtAmount)}</span></button><button className="secondary-action" onClick={() => setShowPropertyPanel(true)} disabled={!isMyTurn}>Ver bens para liquidar</button><button className="secondary-action" onClick={() => room?.send('declareBankruptcy')} disabled={!isMyTurn || (localPlayer?.cash ?? 0) >= debtAmount || hasLiquidatableAssets(room?.sessionId ?? '', holdingsById)}>Declarar falência</button></div>
              ) : turnPhase === 'jail' ? (
                <div className="jail-actions">
                  {(localPlayer?.cash ?? 0) < JAIL_FINE && <p className="jail-hint" role="status">Fiança de {formatMoney(JAIL_FINE)}. Seu saldo não cobre o pagamento; tente tirar duplas.</p>}
                  <button className="secondary-action" onClick={() => room?.send('jailRoll')} disabled={!isMyTurn}>Tentar duplas</button>
                  <button className="roll-button" onClick={() => room?.send('jailPay')} disabled={!isMyTurn || (localPlayer?.cash ?? 0) < JAIL_FINE}>Pagar fiança <span>{formatMoney(JAIL_FINE)}</span></button>
                </div>
              ) : (
                <>
                  <div className={`dice-row ${turnPhase === 'resolve' || turnPhase === 'purchase' ? 'dice-row-result-shown' : ''}`}>
                    <span className="die">{dice[0] || '·'}</span><span className="die">{dice[1] || '·'}</span>
                    {turnPhase === 'roll' ? (
                      <button className="roll-button" onClick={() => room?.send('roll')} disabled={!isMyTurn}>Lançar dados <span>↗</span></button>
                    ) : turnPhase === 'purchase' ? (
                      <div className="purchase-actions">
                        <button className="roll-button" onClick={() => room?.send('buy')} disabled={!isMyTurn || !canAffordPendingPurchase}>Comprar <span>{formatMoney(pendingPurchasePrice)}</span></button>
                        <button className="secondary-action" onClick={() => room?.send('declinePurchase')} disabled={!isMyTurn}>Não comprar</button>
                      </div>
                    ) : (
                      <button className="roll-button" onClick={() => room?.send('finishTurn')} disabled={!isMyTurn}>Concluir vez <span>↗</span></button>
                    )}
                  </div>
                  {turnPhase === 'purchase' && !canAffordPendingPurchase && <p className="purchase-hint" role="status">Seu saldo não cobre a compra. Você pode deixar o terreno livre.</p>}
                  {turnPhase === 'resolve' && buildOptions.length > 0 && <div className="build-actions" aria-label="Construções disponíveis"><span>CONSTRUIR · 50% DO PREÇO</span>{buildOptions.map((propertyId) => <button key={propertyId} className="secondary-action" onClick={() => room?.send('build', { propertyId })} disabled={!isMyTurn}>Construir em {boardSpaces[propertyId].name} · {formatMoney(constructionCost(propertyId))}</button>)}</div>}
                </>
              )}
            </div>
          )}
          <div className="game-bottom"><span>JOGADA SINCRONIZADA · {modeDetails[mode].title.toUpperCase()}</span><button className="leave-button" onClick={() => void leaveRoom()}>Sair da mesa</button></div>
        </section>
      )}
    </main>
  )
}

export default App
