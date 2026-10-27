import { useMemo, useState } from 'react'
import BoardScene from './BoardScene'
import { boardSpaces, formatMoney } from '../game/board'

type Mode = 'classic' | 'express'
type Screen = 'home' | 'room' | 'game'

const modeDetails: Record<Mode, { title: string; duration: string; detail: string }> = {
  classic: { title: 'Clássico Rápido', duration: '30 min', detail: 'Regras completas • patrimônio no final' },
  express: { title: 'Express', duration: '≈ 8 min', detail: '6 rodadas • objetivos valem bônus' },
}

function createRoomCode() {
  return Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState<Mode>('classic')
  const [error, setError] = useState('')
  const [position, setPosition] = useState(0)
  const [dice, setDice] = useState<[number, number]>([2, 5])
  const playerName = name.trim() || 'Visitante'
  const activeSpace = boardSpaces[position]
  const players = useMemo(() => [playerName, 'Luna', 'Rafa', 'Nico'], [playerName])

  function createRoom() {
    if (!name.trim()) return setError('Escolha um nome para continuar.')
    setError('')
    setRoomCode(createRoomCode())
    setScreen('room')
  }

  function joinRoom() {
    if (!name.trim()) return setError('Escolha um nome para continuar.')
    if (roomCode.trim().length !== 5) return setError('Digite um código de sala com 5 caracteres.')
    setError('')
    setRoomCode(roomCode.trim().toUpperCase())
    setScreen('room')
  }

  function rollDice() {
    const result: [number, number] = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]
    setDice(result)
    setPosition((current) => (current + result[0] + result[1]) % boardSpaces.length)
  }

  return (
    <main className={`app-shell screen-${screen}`}>
      <div className="scene-backdrop"><BoardScene currentSpace={position} /></div>
      <header className="topbar">
        <button className="brand" onClick={() => setScreen('home')} aria-label="Voltar ao início">
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
            <button className="primary-button" onClick={createRoom}><span>Criar uma sala</span><span className="button-arrow">↗</span></button>
            <div className="divider"><span />ou entre com um código<span /></div>
            <div className="join-row"><input className="text-field code-field" maxLength={5} placeholder="CÓDIGO" value={roomCode} onChange={(event) => { setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError('') }} aria-label="Código da sala" /><button className="join-button" onClick={joinRoom}>Entrar <span>→</span></button></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="privacy-note"><span>◈</span> Salas temporárias. Seu nome aparece só para quem tem o código.</div>
          </section>
          <div className="home-footer"><span>UMA MESA PARA A SUA TURMA</span><span>01 <i>/</i> 03</span></div>
        </section>
      )}

      {screen === 'room' && (
        <section className="room-layout">
          <div className="room-card">
            <button className="back-link" onClick={() => setScreen('home')}>← Início</button>
            <span className="eyebrow">SALA PRIVADA</span>
            <h1>Chame a<br /><em>sua turma.</em></h1>
            <p>Compartilhe o código com seus amigos para sentarem à mesa.</p>
            <div className="room-code-label">CÓDIGO DA SALA</div><button className="room-code" onClick={() => navigator.clipboard?.writeText(roomCode)}>{roomCode}<span>▣</span></button>
            <div className="room-mode"><span className="mode-icon">✦</span><div><strong>{modeDetails[mode].title}</strong><small>{modeDetails[mode].duration} · {modeDetails[mode].detail}</small></div></div>
            <div className="seat-list">{players.slice(0, 2).map((player, index) => <div className="seat" key={`${player}-${index}`}><span className={`seat-avatar avatar-${index}`}>{player.slice(0, 1).toUpperCase()}</span><span>{player}</span>{index === 0 && <small>ANFITRIÃO</small>}</div>)}<div className="seat waiting"><span className="seat-avatar">+</span><span>Aguardando jogador</span></div></div>
            <div className="prototype-note">Protótipo local: salas ainda não conectam jogadores em dispositivos diferentes.</div>
            <button className="primary-button" onClick={() => setScreen('game')}><span>Ver mesa 3D</span><span className="button-arrow">↗</span></button>
          </div>
          <div className="room-aside"><div className="aside-top">SEUS AMIGOS VÃO APARECER AQUI</div><div className="avatar-orbit"><span className="orbit-orb orb-one">L</span><span className="orbit-orb orb-two">R</span><span className="orbit-orb orb-three">N</span><div className="orbit-center">B</div></div><div className="aside-bottom">UMA BOA PARTIDA COMEÇA<br />COM UMA BOA COMPANHIA.</div></div>
        </section>
      )}

      {screen === 'game' && (
        <section className="game-overlay">
          <div className="game-topline"><button className="back-link" onClick={() => setScreen('room')}>← Sala {roomCode}</button><div className="game-pill">{modeDetails[mode].title.toUpperCase()} <span>·</span> {mode === 'classic' ? '30:00' : 'RODADA 1/6'}</div><button className="icon-button" aria-label="Menu">···</button></div>
          <div className="player-hud">{players.map((player, index) => <div className={`player-card ${index === 0 ? 'active' : ''}`} key={`${player}-${index}`}><span className={`player-avatar player-${index}`}>{player.slice(0, 1).toUpperCase()}</span><div className="player-info"><strong>{player}</strong><small>{index === 0 ? 'SUA VEZ' : 'NO JOGO'}</small></div><b>{formatMoney(1500000 - index * 80000)}</b></div>)}</div>
          <div className="turn-card"><span className="turn-label">CASA {String(activeSpace.id + 1).padStart(2, '0')}</span><h2>{activeSpace.name}</h2><p>{activeSpace.kind === 'property' ? `Propriedade · ${formatMoney(activeSpace.price ?? 0)}` : 'Resolva o efeito desta casa'}</p><div className="dice-row"><span className="die">{dice[0]}</span><span className="die">{dice[1]}</span><button className="roll-button" onClick={rollDice}>Lançar dados <span>↗</span></button></div></div>
          <div className="game-bottom"><span>PRÉVIA DA MESA · REGRAS ONLINE EM CONSTRUÇÃO</span><button className="leave-button" onClick={() => setScreen('room')}>Sair da mesa</button></div>
        </section>
      )}
    </main>
  )
}

export default App
