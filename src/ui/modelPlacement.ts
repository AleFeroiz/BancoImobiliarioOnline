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
