export type DicePresentationPhase = 'roll' | 'company-roll' | 'rolling' | 'moving' | 'resolve' | 'purchase' | 'buyback' | 'buyback-upgrade' | 'jail' | 'world-cup' | 'world-tour' | 'card-target' | 'start-upgrade' | 'debt' | 'ended'
export type DiceRotation = [number, number, number]
export type DicePosition = [number, number, number]

export const DICE_ROLL_BOUNCE_HEIGHT = 0.065
export const DICE_ROLL_BOUNCE_COUNT = 3
export const DICE_VISUAL_SCALE = 1.65

export const DICE_PRESENTATION_POSITIONS: DicePosition[] = [
  [-1.25, 1.5, 0.15],
  [1.25, 1.5, -0.15],
]
export const DICE_RESULT_BADGE_POSITION: DicePosition = [0, 2.15, 0]

export function shouldShowRolledDice(phase: DicePresentationPhase, belongsToPawnMovement: boolean) {
  return phase === 'rolling' || (phase === 'moving' && belongsToPawnMovement)
}

export function getDiceRollRotation(start: DiceRotation, progress: number): DiceRotation {
  const clamped = Math.min(1, Math.max(0, progress))
  const eased = 1 - (1 - clamped) ** 3.4
  const finalTurns = [3, 4, 2]
  const axisWobble = [1, -0.8, 0.62]
  const wobble = Math.sin(clamped * Math.PI * 6) * (1 - clamped) * 0.28
  return start.map((angle, axis) => {
    const finalRotation = Math.PI * 2 * finalTurns[axis]!
    return angle + (finalRotation - angle) * eased + wobble * axisWobble[axis]!
  }) as DiceRotation
}

export function getDiceRollBounce(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress))
  const bounceWave = Math.abs(Math.sin(clamped * Math.PI * DICE_ROLL_BOUNCE_COUNT))
  return DICE_ROLL_BOUNCE_HEIGHT * bounceWave * (1 - clamped) ** 1.2
}
