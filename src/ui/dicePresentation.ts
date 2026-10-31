export type DicePresentationPhase = 'roll' | 'rolling' | 'moving' | 'resolve' | 'purchase' | 'buyback' | 'jail' | 'world-cup' | 'world-tour' | 'card-target' | 'debt' | 'ended'
export type DiceRotation = [number, number, number]
export type DicePosition = [number, number, number]

export const DICE_ROLL_BOUNCE_HEIGHT = 0.1

export const DICE_PRESENTATION_POSITIONS: DicePosition[] = [
  [-0.38, 2.23, 0.2],
  [0.38, 2.23, -0.2],
]
export const DICE_RESULT_BADGE_POSITION: DicePosition = [0, 2.92, 0]

export function shouldShowRolledDice(phase: DicePresentationPhase, belongsToPawnMovement: boolean) {
  return phase === 'rolling' || (phase === 'moving' && belongsToPawnMovement)
}

export function getDiceRollRotation(start: DiceRotation, progress: number): DiceRotation {
  const clamped = Math.min(1, Math.max(0, progress))
  const eased = 1 - (1 - clamped) ** 3
  const levelOrientation = Math.PI * 4
  return start.map((angle) => angle + (levelOrientation - angle) * eased) as DiceRotation
}
