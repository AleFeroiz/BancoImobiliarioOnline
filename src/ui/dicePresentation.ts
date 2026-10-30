export type DicePresentationPhase = 'roll' | 'rolling' | 'station-rent' | 'station-rent-rolling' | 'moving' | 'resolve' | 'purchase' | 'jail' | 'world-cup' | 'world-tour' | 'debt' | 'ended'
export type DiceRotation = [number, number, number]

export function shouldShowRolledDice(phase: DicePresentationPhase, belongsToPawnMovement: boolean) {
  return phase === 'rolling' || phase === 'station-rent-rolling' || (phase === 'moving' && belongsToPawnMovement)
}

export function getDiceRollRotation(start: DiceRotation, progress: number): DiceRotation {
  const clamped = Math.min(1, Math.max(0, progress))
  const eased = 1 - (1 - clamped) ** 3
  const levelOrientation = Math.PI * 4
  return start.map((angle) => angle + (levelOrientation - angle) * eased) as DiceRotation
}
