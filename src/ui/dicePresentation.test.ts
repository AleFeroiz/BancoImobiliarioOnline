import { describe, expect, it } from 'vitest'
import { DICE_PRESENTATION_POSITIONS, DICE_RESULT_BADGE_POSITION, DICE_ROLL_BOUNCE_COUNT, DICE_ROLL_BOUNCE_HEIGHT, DICE_VISUAL_SCALE, getDiceRollBounce, getDiceRollRotation, shouldShowRolledDice } from './dicePresentation'

const FATEC_MAIN_ROOF_TOP_Y = 0.845
const FATEC_TOWER_CENTER = [-0.456, 0.648] as const
const FATEC_TOWER_HALF_FOOTPRINT = 0.1632
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
    settled.forEach((angle) => expect(angle % (Math.PI * 2)).toBeCloseTo(0))
    expect(getDiceRollRotation([0.12, -0.28, 0.31], 0)).toEqual([0.12, -0.28, 0.31])
    expect(getDiceRollRotation([0, 0, 0], 0.5)).not.toEqual([0, 0, 0])
  })

  it('faz três quicadas progressivamente menores antes de assentar', () => {
    expect(DICE_ROLL_BOUNCE_COUNT).toBe(3)
    expect(getDiceRollBounce(0)).toBe(0)
    expect(getDiceRollBounce(1)).toBe(0)
    expect(getDiceRollBounce(0.15)).toBeGreaterThan(getDiceRollBounce(0.05))
    expect(getDiceRollBounce(0.15)).toBeGreaterThan(getDiceRollBounce(0.25))
    expect(getDiceRollBounce(0.5)).toBeGreaterThan(getDiceRollBounce(0.4))
    expect(getDiceRollBounce(0.5)).toBeGreaterThan(getDiceRollBounce(0.6))
    expect(getDiceRollBounce(0.8)).toBeGreaterThan(getDiceRollBounce(0.7))
    expect(getDiceRollBounce(0.8)).toBeGreaterThan(getDiceRollBounce(0.9))
    expect(getDiceRollBounce(0.5)).toBeLessThan(getDiceRollBounce(0.15))
  })

  it('mantém os dados mais baixos sobre os prédios da FATEC e fora do volume da torre durante o giro', () => {
    expect(DICE_PRESENTATION_POSITIONS).toHaveLength(2)
    expect(DICE_PRESENTATION_POSITIONS.every((position) => position[1] >= 1.49 && position[1] <= 1.51)).toBe(true)
    expect(DICE_PRESENTATION_POSITIONS.every((position) => position[1] - 0.21 * DICE_VISUAL_SCALE - FATEC_MAIN_ROOF_TOP_Y >= 0.01)).toBe(true)
    expect(DICE_PRESENTATION_POSITIONS.every((position) => {
      const horizontalDistance = Math.hypot(position[0] - FATEC_TOWER_CENTER[0], position[2] - FATEC_TOWER_CENTER[1])
      const towerCornerRadius = Math.hypot(FATEC_TOWER_HALF_FOOTPRINT, FATEC_TOWER_HALF_FOOTPRINT)
      return horizontalDistance - DICE_ROTATION_BOUNDING_RADIUS * 0.58 - towerCornerRadius > 0
    })).toBe(true)
    expect(DICE_ROLL_BOUNCE_HEIGHT).toBeLessThan(0.08)
    expect(DICE_VISUAL_SCALE).toBeCloseTo(0.55 * 3)
    expect(DICE_PRESENTATION_POSITIONS.every((position) => position[1] + DICE_ROLL_BOUNCE_HEIGHT + DICE_ROTATION_BOUNDING_RADIUS < 2.8)).toBe(true)
    expect(DICE_PRESENTATION_POSITIONS[0]?.[0]).toBeLessThan(0)
    expect(DICE_PRESENTATION_POSITIONS[1]?.[0]).toBeGreaterThan(0)
    expect(Math.sign(DICE_PRESENTATION_POSITIONS[0]![2])).toBe(-Math.sign(DICE_PRESENTATION_POSITIONS[1]![2]!))
    expect(Math.abs(DICE_RESULT_BADGE_POSITION[0])).toBeLessThan(0.1)
    expect(DICE_RESULT_BADGE_POSITION[1]).toBeGreaterThan(DICE_PRESENTATION_POSITIONS[0]![1] + DICE_ROLL_BOUNCE_HEIGHT + 0.21 * DICE_VISUAL_SCALE + 0.1)
    expect(DICE_RESULT_BADGE_POSITION[1]).toBeLessThan(2.5)
  })
})
