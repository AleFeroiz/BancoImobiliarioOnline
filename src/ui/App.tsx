import { useEffect, useRef, useState } from 'react'
import type { Room } from '@colyseus/sdk'
import type { GameMode, LobbyPlayer } from '../../shared/lobby'
import BoardScene from './BoardScene'
import { roomClient } from './roomClient'
import { boardSpaces, formatMoney } from '../game/board'
import { buildingSaleValue, canBuildProperty, canMortgageProperty, canRedeemMortgage, canSellBuilding, constructionCost, hasLiquidatableAssets, mortgageRedemptionCost, mortgageValue, type PropertyHolding } from '../../shared/game'

type Mode = GameMode
type Screen = 'home' | 'room' | 'game'
type TurnPhase = 'roll' | 'resolve' | 'purchase' | 'auction' | 'jail' | 'debt' | 'ended'
type SyncedPlayer = LobbyPlayer & { sessionId: string; cash: number; isJailed: boolean; jailTurns: number; isBankrupt: boolean }

const modeDetails: Record<Mode, { title: string; duration: string; detail: string }> = {
  classic: { title: 'Clássico Rápido', duration: '30 min', detail: 'Regras completas • patrimônio no final' },
  express: { title: 'Express', duration: '≈ 8 min', detail: '6 rodadas • objetivos valem bônus' },
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState<Mode>('classic')
  const [error, setError] = useState('')
  const [activePlayerSessionId, setActivePlayerSessionId] = useState('')
  const [turnNumber, setTurnNumber] = useState(0)
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('roll')
  const [dice, setDice] = useState<[number, number]>([0, 0])
  const [landingDescription, setLandingDescription] = useState('')
  const [activeCardTitle, setActiveCardTitle] = useState('')
  const [activeCardDescription, setActiveCardDescription] = useState('')
  const [pendingPropertyId, setPendingPropertyId] = useState(255)
  const [auctionSeconds, setAuctionSeconds] = useState(0)
  const [auctionHighestBid, setAuctionHighestBid] = useState(0)
  const [debtAmount, setDebtAmount] = useState(0)
  const [debtReason, setDebtReason] = useState('')
  const [debtCreditorSessionId, setDebtCreditorSessionId] = useState('')
  const [winnerSessionId, setWinnerSessionId] = useState('')
  const [bidAmount, setBidAmount] = useState('')
  const [showPropertyPanel, setShowPropertyPanel] = useState(false)
  const [room, setRoom] = useState<Room | null>(null)
  const [roomPlayers, setRoomPlayers] = useState<SyncedPlayer[]>([])
  const [roomProperties, setRoomProperties] = useState<Map<string, PropertyHolding>>(new Map())
  const [isHost, setIsHost] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const activeRoom = useRef<Room | null>(null)
  const activePlayer = roomPlayers.find((player) => player.sessionId === activePlayerSessionId)
  const activeSpace = boardSpaces[activePlayer?.position ?? 0]
  const playerPositions = roomPlayers.length > 0 ? roomPlayers.filter((player) => !player.isBankrupt).map((player) => player.position) : [0, 3, 6, 9]
  const isMyTurn = room?.sessionId === activePlayerSessionId
  const holdingsById = new Map(Array.from(roomProperties.entries()).map(([id, holding]) => [Number(id), holding]))
  const localPlayer = roomPlayers.find((player) => player.sessionId === room?.sessionId)
  const myProperties = Array.from(roomProperties.entries())
    .filter(([_, holding]) => holding.ownerSessionId === room?.sessionId)
    .map(([id, holding]) => ({ spaceId: Number(id), holding, space: boardSpaces[Number(id)] }))
    .filter((entry) => entry.space)
    .sort((first, second) => first.spaceId - second.spaceId)
  const buildOptions = activePlayer
    ? Array.from(roomProperties.keys()).map(Number).filter((id) => canBuildProperty(id, activePlayerSessionId, holdingsById, activePlayer.cash))
    : []
  const propertyBuildings = Array.from(roomProperties.entries()).map(([id, holding]) => ({ spaceId: Number(id), houses: holding.houses, isMortgaged: holding.isMortgaged ?? false }))

  useEffect(() => {
    if (!room) return

    const updateLobby = (state: unknown) => {
      const snapshot = state as {
        players: Map<string, LobbyPlayer & { cash: number; isJailed: boolean; jailTurns: number; isBankrupt: boolean }>
        roomCode: string
        mode: Mode
        status: 'waiting' | 'playing' | 'ended'
        activePlayerSessionId: string
        properties: Map<string, PropertyHolding>
        turnNumber: number
        turnPhase: TurnPhase
        diceOne: number
        diceTwo: number
        landingDescription: string
        activeCardTitle: string
        activeCardDescription: string
        pendingPropertyId: number
        auctionSeconds: number
        auctionHighestBid: number
        debtAmount: number
        debtReason: string
        debtCreditorSessionId: string
        winnerSessionId: string
      }
      const nextPlayers = Array.from(snapshot.players.entries()).map(([sessionId, player]) => ({ ...player, sessionId }))
      setRoomPlayers(nextPlayers)
      setRoomProperties(new Map(snapshot.properties.entries()))
      setRoomCode(snapshot.roomCode)
      setMode(snapshot.mode)
      setIsHost(snapshot.players.get(room.sessionId)?.isHost ?? false)
      setActivePlayerSessionId(snapshot.activePlayerSessionId)
      setTurnNumber(snapshot.turnNumber)
      setTurnPhase(snapshot.turnPhase)
      setDice([snapshot.diceOne, snapshot.diceTwo])
      setLandingDescription(snapshot.landingDescription)
      setActiveCardTitle(snapshot.activeCardTitle)
      setActiveCardDescription(snapshot.activeCardDescription)
      setPendingPropertyId(snapshot.pendingPropertyId)
      setAuctionSeconds(snapshot.auctionSeconds)
      setAuctionHighestBid(snapshot.auctionHighestBid)
      setDebtAmount(snapshot.debtAmount)
      setDebtReason(snapshot.debtReason)
      setDebtCreditorSessionId(snapshot.debtCreditorSessionId)
      setWinnerSessionId(snapshot.winnerSessionId)
      if (snapshot.status === 'playing' || snapshot.status === 'ended') setScreen('game')
    }
    const handleRoomError = (payload: { message: string }) => setError(payload.message)
    const handleLeave = (_code: number, reason?: string) => {
      if (activeRoom.current !== room) return
      activeRoom.current = null
      setRoom(null)
      setScreen('home')
      setError(reason || 'A conexão com a sala foi encerrada.')
    }

    room.onStateChange(updateLobby)
    room.onMessage('room:error', handleRoomError)
    room.onLeave(handleLeave)
    updateLobby(room.state)

    return () => {
      room.onStateChange.remove(updateLobby)
      room.onLeave.remove(handleLeave)
    }
  }, [room])

  async function createRoom() {
    if (!name.trim()) return setError('Escolha um nome para continuar.')
    setIsConnecting(true)
    setError('')
    try {
      const nextRoom = await roomClient.create('game_room', { mode, name: name.trim() })
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
    setIsHost(false)
    setActivePlayerSessionId('')
    setTurnNumber(0)
    setDice([0, 0])
    setLandingDescription('')
    setActiveCardTitle('')
    setActiveCardDescription('')
    setPendingPropertyId(255)
    setAuctionSeconds(0)
    setAuctionHighestBid(0)
    setDebtAmount(0)
    setDebtReason('')
    setDebtCreditorSessionId('')
    setWinnerSessionId('')
    setBidAmount('')
    setShowPropertyPanel(false)
    setScreen('home')
    if (currentRoom) await currentRoom.leave()
  }

  function startGame() {
    room?.send('start')
  }

  return (
    <main className={`app-shell screen-${screen}`}>
      <div className="scene-backdrop"><BoardScene playerPositions={playerPositions} propertyBuildings={propertyBuildings} /></div>
      <header className="topbar">
        <button className="brand" onClick={() => { if (room) void leaveRoom(); else setScreen('home') }} aria-label="Voltar ao início">
          <span className="brand-mark">B</span><span>BANCO<span className="brand-light">IMOBILIÁRIO</span></span>
        </button>
        <div className="topbar-right"><span className="connection-dot" /> <span>PRÉVIA DE JOGO</span><button className="icon-button" aria-label="Ajuda">?</button></div>
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
            <div className="seat-list">{roomPlayers.map((player, index) => <div className="seat" key={`${player.name}-${index}`}><span className={`seat-avatar avatar-${index}`}>{player.name.slice(0, 1).toUpperCase()}</span><span>{player.name}</span>{player.isHost && <small>ANFITRIÃO</small>}</div>)}{Array.from({ length: Math.max(0, 4 - roomPlayers.length) }, (_, index) => <div className="seat waiting" key={`waiting-${index}`}><span className="seat-avatar">+</span><span>Aguardando jogador</span></div>)}</div>
            <div className="prototype-note">{roomPlayers.length}/4 lugares ocupados · sala temporária para sua turma.</div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" onClick={startGame} disabled={!isHost || roomPlayers.length < 2}><span>{isHost ? (roomPlayers.length < 2 ? 'Aguardando jogadores' : 'Iniciar partida') : 'Aguardando anfitrião'}</span><span className="button-arrow">↗</span></button>
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
          <div className="game-topline"><button className="back-link" onClick={() => setScreen('room')}>← Sala {roomCode}</button><div className="game-pill">{modeDetails[mode].title.toUpperCase()} <span>·</span> {mode === 'classic' ? '30:00' : 'RODADA 1/6'}</div><button className="portfolio-toggle" aria-expanded={showPropertyPanel} onClick={() => setShowPropertyPanel((open) => !open)}>{showPropertyPanel ? '← Jogada' : `Imóveis · ${myProperties.length}`}</button></div>
          <div className="player-hud">{roomPlayers.map((player, index) => <div className={`player-card ${player.sessionId === activePlayerSessionId ? 'active' : ''} ${player.isBankrupt ? 'bankrupt' : ''}`} key={player.sessionId}><span className={`player-avatar player-${index}`}>{player.name.slice(0, 1).toUpperCase()}</span><div className="player-info"><strong>{player.name}</strong><small>{player.isBankrupt ? 'FALIU' : player.isJailed ? `PRESO · ${player.jailTurns}/3` : player.sessionId === activePlayerSessionId ? 'VEZ ATUAL' : `CASA ${String(player.position + 1).padStart(2, '0')}`}</small></div><b>{formatMoney(player.cash)}</b></div>)}</div>
          {showPropertyPanel && turnPhase !== 'ended' ? (
            <aside className="turn-card asset-panel" aria-label="Minha carteira de imóveis">
              <div className="asset-panel-heading"><span className="turn-label">CARTEIRA DA PARTIDA</span><span>{formatMoney(localPlayer?.cash ?? 0)}</span></div>
              <h2>Meus imóveis</h2>
              <p>Hipoteque para receber metade do valor. O resgate custa 10% a mais.</p>
              <div className="asset-list">
                {myProperties.length === 0 ? <span className="asset-empty">Você ainda não tem propriedades.</span> : myProperties.map(({ spaceId, holding, space }) => {
                  const canMortgage = canMortgageProperty(spaceId, room?.sessionId ?? '', holdingsById)
                  const redemptionCost = mortgageRedemptionCost(spaceId)
                  return (
                    <div className={`asset-row ${holding.isMortgaged ? 'mortgaged' : ''}`} key={spaceId}>
                      <div className="asset-info"><strong>{space.name}</strong><small>{holding.isMortgaged ? `HIPOTECADO · sem aluguel` : holding.houses ? `${holding.houses === 5 ? 'HOTEL' : `${holding.houses} CASA(S)`}` : space.buildable ? 'IMÓVEL' : 'ESTAÇÃO'}</small></div>
                      {holding.houses > 0 && canSellBuilding(spaceId, room?.sessionId ?? '', holdingsById) ? (
                        <button className="asset-action" disabled={!isMyTurn || !['resolve', 'debt'].includes(turnPhase)} onClick={() => room?.send('sellBuilding', { propertyId: spaceId })}>Vender construção <b>+{formatMoney(buildingSaleValue(spaceId))}</b></button>
                      ) : holding.isMortgaged ? (
                        <button className="asset-action" disabled={!isMyTurn || turnPhase !== 'resolve' || !canRedeemMortgage(spaceId, room?.sessionId ?? '', holdingsById, localPlayer?.cash ?? 0)} onClick={() => room?.send('redeemMortgage', { propertyId: spaceId })} title={`Resgate por ${formatMoney(redemptionCost)}`}>Resgatar <b>{formatMoney(redemptionCost)}</b></button>
                      ) : (
                        <button className="asset-action" disabled={!isMyTurn || !canMortgage || !['resolve', 'debt'].includes(turnPhase)} onClick={() => room?.send('mortgage', { propertyId: spaceId })} title={canMortgage ? `Receba ${formatMoney(mortgageValue(spaceId))}` : 'Venda primeiro as construções do grupo'}>Hipotecar <b>+{formatMoney(mortgageValue(spaceId))}</b></button>
                      )}
                    </div>
                  )
                })}
              </div>
              <span className="asset-note">Apenas a pessoa da vez pode alterar a carteira.</span>
            </aside>
          ) : (
            <div className="turn-card">
              <span className="turn-label">{turnPhase === 'ended' ? 'PARTIDA ENCERRADA' : turnPhase === 'debt' ? 'DÍVIDA EM ABERTO' : `TURNO ${turnNumber} · ${isMyTurn ? 'SUA VEZ' : `VEZ DE ${activePlayer?.name ?? '…'}`}`}</span>
              <h2>{turnPhase === 'ended' ? 'Fim de jogo' : turnPhase === 'debt' ? 'Hora de liquidar bens' : activeCardTitle || boardSpaces[pendingPropertyId]?.name || activeSpace.name}</h2>
              <p>{landingDescription || activeCardDescription || (activeSpace.kind === 'property' ? `Propriedade · ${formatMoney(activeSpace.price ?? 0)}` : 'Aguardando a jogada.')}</p>
              {turnPhase === 'ended' ? (
                <div className="debt-actions"><strong>{winnerSessionId ? `${roomPlayers.find((player) => player.sessionId === winnerSessionId)?.name ?? 'Jogador'} venceu!` : 'Partida encerrada sem vencedor.'}</strong><button className="roll-button" onClick={() => void leaveRoom()}>Voltar ao início</button></div>
              ) : turnPhase === 'debt' ? (
                <div className="debt-actions"><strong>Dívida: {formatMoney(debtAmount)}</strong><p>{debtReason} · credor: {roomPlayers.find((player) => player.sessionId === debtCreditorSessionId)?.name ?? 'banco'}</p><button className="roll-button" onClick={() => room?.send('payDebt')} disabled={!isMyTurn || (localPlayer?.cash ?? 0) < debtAmount}>Pagar dívida <span>{formatMoney(debtAmount)}</span></button><button className="secondary-action" onClick={() => setShowPropertyPanel(true)} disabled={!isMyTurn}>Ver bens para liquidar</button><button className="secondary-action" onClick={() => room?.send('declareBankruptcy')} disabled={!isMyTurn || (localPlayer?.cash ?? 0) >= debtAmount || hasLiquidatableAssets(room?.sessionId ?? '', holdingsById)}>Declarar falência</button></div>
              ) : turnPhase === 'jail' ? <div className="jail-actions"><button className="secondary-action" onClick={() => room?.send('jailRoll')} disabled={!isMyTurn}>Tentar duplas</button><button className="roll-button" onClick={() => room?.send('jailPay')} disabled={!isMyTurn}>Pagar fiança <span>{formatMoney(50_000)}</span></button></div> : turnPhase === 'auction' ? <><div className="auction-info"><span>{auctionHighestBid ? `Maior lance: ${formatMoney(auctionHighestBid)}` : 'Sem lances ainda'}</span><strong>{auctionSeconds}s</strong></div><div className="auction-actions"><input aria-label="Valor do lance" inputMode="numeric" value={bidAmount} onChange={(event) => setBidAmount(event.target.value.replace(/[^0-9]/g, ''))} placeholder="Seu lance" /><button className="roll-button" onClick={() => { room?.send('bid', { amount: Number(bidAmount) }); setBidAmount('') }}>Lance</button><button className="secondary-action" onClick={() => room?.send('auctionPass')}>Passar</button></div></> : <><div className="dice-row"><span className="die">{dice[0] || '·'}</span><span className="die">{dice[1] || '·'}</span>{turnPhase === 'roll' ? <button className="roll-button" onClick={() => room?.send('roll')} disabled={!isMyTurn}>Lançar dados <span>↗</span></button> : turnPhase === 'purchase' ? <><button className="roll-button" onClick={() => room?.send('buy')} disabled={!isMyTurn}>Comprar <span>{formatMoney(boardSpaces[pendingPropertyId]?.price ?? 0)}</span></button><button className="secondary-action" onClick={() => room?.send('declinePurchase')} disabled={!isMyTurn}>Leilão</button></> : <button className="roll-button" onClick={() => room?.send('finishTurn')} disabled={!isMyTurn}>Concluir vez <span>↗</span></button>}</div>{turnPhase === 'resolve' && buildOptions.length > 0 && <div className="build-actions" aria-label="Construções disponíveis"><span>CONSTRUIR · 50% DO PREÇO</span>{buildOptions.map((propertyId) => <button key={propertyId} className="secondary-action" onClick={() => room?.send('build', { propertyId })} disabled={!isMyTurn}>Construir em {boardSpaces[propertyId].name} · {formatMoney(constructionCost(propertyId))}</button>)}</div>}</>}
            </div>
          )}
          <div className="game-bottom"><span>JOGADA SINCRONIZADA · {modeDetails[mode].title.toUpperCase()}</span><button className="leave-button" onClick={() => void leaveRoom()}>Sair da mesa</button></div>
        </section>
      )}
    </main>
  )
}

export default App
