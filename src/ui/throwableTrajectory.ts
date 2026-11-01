export type ThrowablePoint = readonly [number, number, number]

const THROWABLE_HEAD_OFFSET = 0.55
const THROWABLE_ARC_HEIGHT = 1.05
const MAX_PROJECTILE_FRAME_STEP_SECONDS = 0.05

export function advanceThrowableElapsed(elapsedSeconds: number, deltaSeconds: number, durationSeconds: number) {
  const safeDelta = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(deltaSeconds, MAX_PROJECTILE_FRAME_STEP_SECONDS)) : 0
  return Math.min(Math.max(0, elapsedSeconds) + safeDelta, Math.max(0, durationSeconds))
}

export function getThrowableAimPoint(pawnPosition: ThrowablePoint): [number, number, number] {
  return [pawnPosition[0], pawnPosition[1] + THROWABLE_HEAD_OFFSET, pawnPosition[2]]
}

export function getThrowableFlightPoint(start: ThrowablePoint, target: ThrowablePoint, progress: number): [number, number, number] {
  const clampedProgress = Math.max(0, Math.min(progress, 1))
  if (clampedProgress === 0) return [...start]
  if (clampedProgress === 1) return [...target]
  const arc = Math.sin(clampedProgress * Math.PI) * THROWABLE_ARC_HEIGHT
  return [
    start[0] + (target[0] - start[0]) * clampedProgress,
    start[1] + (target[1] - start[1]) * clampedProgress + arc,
    start[2] + (target[2] - start[2]) * clampedProgress,
  ]
}
