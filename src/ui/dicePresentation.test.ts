import { describe, expect, it } from 'vitest'
import { DICE_PRESENTATION_POSITIONS, DICE_RESULT_BADGE_POSITION, getDiceRollRotation, shouldShowRolledDice } from './dicePresentation'

const FATEC_TOWER_TOP_Y = 1.81
const DICE_HALF_HEIGHT = 0.21

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

  it('mantém os dados logo acima da FATEC e o total acima dos dados', () => {
    expect(DICE_PRESENTATION_POSITIONS).toHaveLength(2)
    expect(DICE_PRESENTATION_POSITIONS.every((position) => position[1] >= 2.4 && position[1] <= 2.6)).toBe(true)
    expect(DICE_PRESENTATION_POSITIONS.every((position) => position[1] - DICE_HALF_HEIGHT - FATEC_TOWER_TOP_Y >= 0.4)).toBe(true)
    expect(DICE_PRESENTATION_POSITIONS[0]?.[0]).toBeLessThan(0)
    expect(DICE_PRESENTATION_POSITIONS[1]?.[0]).toBeGreaterThan(0)
    expect(Math.sign(DICE_PRESENTATION_POSITIONS[0]![2])).toBe(-Math.sign(DICE_PRESENTATION_POSITIONS[1]![2]!))
    expect(Math.abs(DICE_RESULT_BADGE_POSITION[0])).toBeLessThan(0.1)
    expect(DICE_RESULT_BADGE_POSITION[1]).toBeGreaterThan(DICE_PRESENTATION_POSITIONS[0]![1] + 0.48 + 0.21)
    expect(DICE_RESULT_BADGE_POSITION[1]).toBeLessThan(4)
  })
})
