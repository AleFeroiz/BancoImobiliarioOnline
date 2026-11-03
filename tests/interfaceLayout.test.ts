import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appSource = readFileSync(new URL('../src/ui/App.tsx', import.meta.url), 'utf8')
const stylesheet = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8')

describe('home e lobby responsivos', () => {
  it('mantém o percurso de marcadores logo abaixo do título BANTEC na home', () => {
    const titleStart = appSource.indexOf('<h1>BANTEC.</h1>')
    const routeStart = appSource.indexOf('className="home-region-route"', titleStart)
    const descriptionStart = appSource.indexOf('Reúna a turma', routeStart)

    expect(titleStart).toBeGreaterThan(-1)
    expect(routeStart).toBeGreaterThan(titleStart)
    expect(descriptionStart).toBeGreaterThan(routeStart)
    expect(appSource).not.toContain('Seu Brasil, seu negócio.')
  })

  it('organiza o lobby sem o painel de lugares decorativo e remove rolagem do cartão desktop', () => {
    expect(appSource).not.toContain('LUGARES À MESA')
    expect(appSource).not.toContain('className="room-aside"')
    expect(stylesheet).toContain('grid-template-areas:"intro appearance" "settings roster"')
    expect(stylesheet).toContain('.screen-room .room-card{display:grid;')
    expect(stylesheet).toContain('max-height:calc(100dvh - 102px);overflow:visible')
    expect(stylesheet).toContain('min-height:calc(100dvh - 82px);padding:8px 12px')
    expect(stylesheet).toContain('grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)')
    expect(stylesheet).toContain('max-height:calc(100dvh - 80px);padding:12px')
    expect(stylesheet).toContain('.screen-room .character-option{min-height:41px;gap:1px;font-size:7px}')
    expect(stylesheet).toContain('.screen-room .seat{height:27px;gap:4px;font-size:8px}')
    expect(stylesheet).toContain('@media(max-width:640px)')
  })
})

describe('interações responsivas durante a partida', () => {
  it('permite mouse e toque nos seletores e steppers do modo DEV', () => {
    expect(stylesheet).toContain('.game-overlay button,.game-overlay input,.game-overlay select{pointer-events:auto}')
    expect(stylesheet).toContain('.roll-control-dev .dev-teleport-controls select')
    expect(stylesheet).toContain('min-height:42px;touch-action:manipulation')
    expect(stylesheet).toContain('max-height:min(48dvh,420px)')
    expect(stylesheet).toContain('overscroll-behavior:contain;touch-action:pan-y')
    expect(stylesheet).toContain('.roll-control-dev .dev-teleport-controls>select,.roll-control-dev .dev-event-card-controls>select{grid-column:1;min-width:0;width:100%}')
    expect(appSource).toContain('aria-label="Diminuir saldo DEV"')
    expect(appSource).toContain('aria-label="Aumentar saldo DEV"')
    expect(appSource).toContain('inputMode="numeric"')
  })

  it('afasta o segundo cartão em telas médias para preservar o topo do tabuleiro', () => {
    expect(appSource).toContain('player-count-${roomPlayers.length}')
    expect(stylesheet).toContain('.screen-game .player-hud.player-count-2>.player-card:nth-child(2){grid-column:3}')
    expect(stylesheet).toContain('@media(min-width:1200px) and (max-height:800px){.screen-game .player-hud.player-count-6{grid-template-columns:repeat(6,minmax(0,1fr))')
  })

  it('limita a largura dos tooltips à viewport e amplia a leitura em telas largas', () => {
    expect(stylesheet).toContain('width:clamp(150px,15vw,210px);max-width:calc(100vw - 16px);overflow-wrap:anywhere')
  })
})
