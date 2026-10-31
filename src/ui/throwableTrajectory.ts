export type ThrowablePoint = readonly [number, number, number]

const THROWABLE_HEAD_OFFSET = 0.55
const THROWABLE_ARC_HEIGHT = 1.05

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
