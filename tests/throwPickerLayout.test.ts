import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('seletor de arremesso em telas pequenas', () => {
  it('centraliza o menu na viewport e limita seu tamanho', () => {
    const css = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8')
    const mobileRule = css.match(/@media\(max-width:\s*1024px\)\s*\{\s*\.screen-game \.throw-picker,[\s\S]*?\n\s*\}/)?.[0]
    expect(mobileRule).toBeDefined()
    expect(mobileRule).toMatch(/position:\s*fixed/)
    expect(mobileRule).toMatch(/left:\s*50%/)
    expect(mobileRule).toMatch(/transform:\s*translate\(-50%,-50%\)/)
    expect(mobileRule).toMatch(/max-height:\s*calc\(100dvh - 24px\)/)
    expect(css).toMatch(/\.screen-game \.player-hud:has\(\.throw-picker\)\s*\{\s*z-index:\s*30/)
  })
})

