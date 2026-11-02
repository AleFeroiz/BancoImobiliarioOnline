import { describe, expect, it } from 'vitest'
import { isPlayerColor, PLAYER_COLORS, PLAYER_COLOR_NAMES } from './playerColors.js'

describe('cores do lobby', () => {
  it('oferece doze cores distintas com um nome para cada uma', () => {
    expect(PLAYER_COLORS).toHaveLength(12)
    expect(new Set(PLAYER_COLORS).size).toBe(12)
    expect(PLAYER_COLOR_NAMES).toHaveLength(12)
    expect(PLAYER_COLOR_NAMES).toEqual(['Vermelho', 'Azul', 'Verde', 'Rosa', 'Laranja', 'Amarelo', 'Preto', 'Branco', 'Roxo', 'Marrom', 'Ciano', 'Lima'])
    expect(PLAYER_COLORS).toEqual(['#b3261e', '#2459c4', '#27843a', '#cc438f', '#bd5a0e', '#b38c0d', '#434b53', '#b7c4d5', '#693aa5', '#754a29', '#138f9c', '#609c25'])
  })

  it('valida todas as cores disponíveis e rejeita valores não listados', () => {
    for (const color of PLAYER_COLORS) expect(isPlayerColor(color)).toBe(true)
    expect(isPlayerColor('#ffffff')).toBe(false)
  })
})
