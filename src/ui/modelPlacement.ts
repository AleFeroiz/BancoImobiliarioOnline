type Bounds3 = {
  min: { x: number; y: number; z: number }
  max: { x: number; y: number; z: number }
}

export function getCenteredModelPlacement(bounds: Bounds3): [number, number, number] {
  const centerX = (bounds.min.x + bounds.max.x) / 2
  const centerZ = (bounds.min.z + bounds.max.z) / 2
  return [
    centerX === 0 ? 0 : -centerX,
    -bounds.min.y,
    centerZ === 0 ? 0 : -centerZ,
  ]
}

export function getBuildingInnerEdgeOffset(spaceId: number, tileSize: number, modelDepth: number, modelScale = 1, gap = 0.02): [number, number] {
  if (!Number.isInteger(spaceId) || spaceId < 0 || spaceId >= 40) throw new RangeError('spaceId must be a board index')
  const inset = tileSize / 2 + modelDepth * modelScale / 2 + gap
  if (spaceId <= 10) return [0, -inset]
  if (spaceId <= 20) return [-inset, 0]
  if (spaceId <= 30) return [0, inset]
  return [inset, 0]
}

export function getModelFootprintDepth(bounds: Bounds3) {
  return bounds.max.z - bounds.min.z
}
