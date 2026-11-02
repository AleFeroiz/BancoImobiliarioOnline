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

export function getBuildingEdgeOffset(spaceId: number, tileSize: number, modelDepth: number, modelScale = 1, edgeGap = 0.08): [number, number] {
  if (!Number.isInteger(spaceId) || spaceId < 0 || spaceId >= 40) throw new RangeError('spaceId must be a board index')
  const inset = Math.max(0, tileSize / 2 - modelDepth * modelScale / 2 - edgeGap)
  if (spaceId <= 10) return [0, inset]
  if (spaceId <= 20) return [inset, 0]
  if (spaceId <= 30) return [0, -inset]
  return [-inset, 0]
}

export function getBuildingRentLabelPosition(spaceId: number, bounds: Bounds3, tileSize = 0.98, modelScale = 1.25, edgeGap = 0.04, verticalGap = 0.2, groupY = 0.16): [number, number, number] {
  const [offsetX, offsetZ] = getBuildingEdgeOffset(spaceId, tileSize, getModelEdgeFootprint(bounds, spaceId), modelScale, edgeGap)
  const height = (bounds.max.y - bounds.min.y) * modelScale
  return [offsetX, groupY + height + verticalGap, offsetZ]
}

export function getModelFootprintDepth(bounds: Bounds3) {
  return bounds.max.z - bounds.min.z
}

export function getModelEdgeFootprint(bounds: Bounds3, spaceId: number) {
  if (!Number.isInteger(spaceId) || spaceId < 0 || spaceId >= 40) throw new RangeError('spaceId must be a board index')
  const isSide = (spaceId > 10 && spaceId <= 20) || spaceId > 30
  return isSide ? bounds.max.x - bounds.min.x : getModelFootprintDepth(bounds)
}
