import { describe, expect, it } from 'vitest'
// @ts-expect-error Node types are intentionally excluded from the browser app config; Vitest runs this regression test in Node.
import { readFileSync } from 'node:fs'

const stylesheet = readFileSync(new URL('./styles.css', import.meta.url), 'utf8')
const cashHudRules = stylesheet.match(/\.cash-[^{]+\{[^}]*\}/g)?.join('\n') ?? ''

describe('símbolos de dinheiro da HUD', () => {
  it('mantém os ícones planos para não travar a composição no Chrome', () => {
    expect(cashHudRules).toContain('.cash-hud-symbols')
    expect(cashHudRules).not.toMatch(/\b(?:filter|perspective|clip-path|box-shadow|transform)\s*:/i)
  })
})
