import { describe, expect, it } from 'vitest'
import { isPlayerColor, PLAYER_COLORS, PLAYER_COLOR_NAMES } from './playerColors.js'

describe('cores do lobby', () => {
  it('oferece doze cores distintas com um nome para cada uma', () => {
    expect(PLAYER_COLORS).toHaveLength(12)
    expect(new Set(PLAYER_COLORS).size).toBe(12)
    expect(PLAYER_COLOR_NAMES).toHaveLength(12)
  })

  it('valida todas as cores disponíveis e rejeita valores não listados', () => {
    for (const color of PLAYER_COLORS) expect(isPlayerColor(color)).toBe(true)
    expect(isPlayerColor('#ffffff')).toBe(false)
  })
})
