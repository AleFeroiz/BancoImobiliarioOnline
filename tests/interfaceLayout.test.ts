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
    expect(stylesheet).toContain('max-height:calc(100dvh - 80px);padding:9px')
    expect(stylesheet).toContain('@media(max-width:640px)')
  })
})
