import { describe, expect, it } from 'vitest'
import { getDiceRollRotation, shouldShowRolledDice } from './dicePresentation'

describe('apresentação minimalista dos dados', () => {
  it('mantém dados na rolagem e no movimento que foi iniciado por ela', () => {
    expect(shouldShowRolledDice('rolling', false)).toBe(true)
    expect(shouldShowRolledDice('moving', true)).toBe(true)
    expect(shouldShowRolledDice('moving', false)).toBe(false)
    expect(shouldShowRolledDice('resolve', true)).toBe(false)
  })

  it('termina a animação em uma orientação plana equivalente a dados alinhados', () => {
    const settled = getDiceRollRotation([0.12, -0.28, 0.31], 1)
    expect(settled.map((angle) => angle % (Math.PI * 2))).toEqual([0, 0, 0])
    expect(getDiceRollRotation([0.12, -0.28, 0.31], 0)).toEqual([0.12, -0.28, 0.31])
  })
})
