import { describe, expect, it } from 'vitest'
import { DICE_PRESENTATION_POSITIONS, DICE_RESULT_BADGE_POSITION, getDiceRollRotation, shouldShowRolledDice } from './dicePresentation'

describe('apresentação minimalista dos dados', () => {
  it('mantém dados na rolagem e no movimento que foi iniciado por ela', () => {
    expect(shouldShowRolledDice('rolling', false)).toBe(true)
    expect(shouldShowRolledDice('card-target', false)).toBe(false)
    expect(shouldShowRolledDice('moving', true)).toBe(true)
    expect(shouldShowRolledDice('moving', false)).toBe(false)
    expect(shouldShowRolledDice('resolve', true)).toBe(false)
  })

  it('termina a animação em uma orientação plana equivalente a dados alinhados', () => {
    const settled = getDiceRollRotation([0.12, -0.28, 0.31], 1)
    expect(settled.map((angle) => angle % (Math.PI * 2))).toEqual([0, 0, 0])
    expect(getDiceRollRotation([0.12, -0.28, 0.31], 0)).toEqual([0.12, -0.28, 0.31])
  })

  it('mantém os dados e o total elevados sobre a FATEC no centro da mesa', () => {
    expect(DICE_PRESENTATION_POSITIONS).toHaveLength(2)
    expect(DICE_PRESENTATION_POSITIONS.every((position) => position[1] >= 4 && position[1] <= 4.5)).toBe(true)
    expect(DICE_PRESENTATION_POSITIONS[0]?.[0]).toBeLessThan(0)
    expect(DICE_PRESENTATION_POSITIONS[1]?.[0]).toBeGreaterThan(0)
    expect(Math.sign(DICE_PRESENTATION_POSITIONS[0]![2])).toBe(-Math.sign(DICE_PRESENTATION_POSITIONS[1]![2]!))
    expect(Math.abs(DICE_RESULT_BADGE_POSITION[0])).toBeLessThan(0.1)
    expect(DICE_RESULT_BADGE_POSITION[1]).toBeGreaterThan(DICE_PRESENTATION_POSITIONS[0]![1])
    expect(DICE_RESULT_BADGE_POSITION[1]).toBeLessThan(5.5)
  })
})
