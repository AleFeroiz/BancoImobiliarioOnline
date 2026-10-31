import { describe, expect, it } from 'vitest'
import { DICE_PRESENTATION_POSITIONS, DICE_RESULT_BADGE_POSITION, DICE_ROLL_BOUNCE_HEIGHT, DICE_VISUAL_SCALE, getDiceRollRotation, shouldShowRolledDice } from './dicePresentation'

const FATEC_TOWER_TOP_Y = 1.81
const DICE_ROTATION_BOUNDING_RADIUS = Math.hypot(0.225, 0.21, 0.225) * DICE_VISUAL_SCALE

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

  it('mantém os dados baixos sobre a FATEC durante a rolagem, sem atravessar a torre', () => {
    expect(DICE_PRESENTATION_POSITIONS).toHaveLength(2)
    expect(DICE_PRESENTATION_POSITIONS.every((position) => position[1] >= 2.17 && position[1] <= 2.19)).toBe(true)
    expect(DICE_PRESENTATION_POSITIONS.every((position) => position[1] - DICE_ROTATION_BOUNDING_RADIUS - FATEC_TOWER_TOP_Y >= 0.02)).toBe(true)
    expect(DICE_ROLL_BOUNCE_HEIGHT).toBeLessThan(0.12)
    expect(DICE_PRESENTATION_POSITIONS.every((position) => position[1] + DICE_ROLL_BOUNCE_HEIGHT + DICE_ROTATION_BOUNDING_RADIUS < 2.9)).toBe(true)
    expect(DICE_PRESENTATION_POSITIONS[0]?.[0]).toBeLessThan(0)
    expect(DICE_PRESENTATION_POSITIONS[1]?.[0]).toBeGreaterThan(0)
    expect(Math.sign(DICE_PRESENTATION_POSITIONS[0]![2])).toBe(-Math.sign(DICE_PRESENTATION_POSITIONS[1]![2]!))
    expect(Math.abs(DICE_RESULT_BADGE_POSITION[0])).toBeLessThan(0.1)
    expect(DICE_RESULT_BADGE_POSITION[1]).toBeGreaterThan(DICE_PRESENTATION_POSITIONS[0]![1] + DICE_ROLL_BOUNCE_HEIGHT + DICE_ROTATION_BOUNDING_RADIUS + 0.1)
    expect(DICE_RESULT_BADGE_POSITION[1]).toBeLessThan(3)
  })
})
