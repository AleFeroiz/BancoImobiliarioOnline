import { Vector2 } from 'three'

// Profile reviewed in Blender: broad foot, tapered body, collar and faceted head.
const profile = [
  [0, 0.04], [0.21, 0.04], [0.23, 0.065], [0.22, 0.09], [0.18, 0.11],
  [0.13, 0.12], [0.12, 0.15], [0.1, 0.25], [0.08, 0.28], [0.15, 0.29],
  [0.15, 0.33], [0.105, 0.34], [0.12, 0.36], [0.15, 0.4], [0.15, 0.45],
  [0.13, 0.49], [0.08, 0.53], [0, 0.54],
].map(([radius, height]) => new Vector2(radius, height))

export function PawnGeometry() {
  return <latheGeometry args={[profile, 10]} />
}
