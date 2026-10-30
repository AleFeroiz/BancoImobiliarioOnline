import { describe, expect, it } from 'vitest'
import { stepDieValue } from './forcedDice'

describe('seletor de dados forçados', () => {
  it('avança e volta pelo intervalo de 1 a 6', () => {
    expect(stepDieValue(3, 1)).toBe(4)
    expect(stepDieValue(3, -1)).toBe(2)
    expect(stepDieValue(6, 1)).toBe(1)
    expect(stepDieValue(1, -1)).toBe(6)
    expect(() => stepDieValue(0, 1)).toThrow(RangeError)
  })
})
