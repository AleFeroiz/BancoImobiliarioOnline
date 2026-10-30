export type CameraZoomLimits = { minDistance: number; maxDistance: number }

export function getCameraZoomLimits(referenceDistance: number): CameraZoomLimits {
  const distance = Math.max(1, referenceDistance)
  return { minDistance: distance * 0.48, maxDistance: distance * 1.55 }
}
