export type BoardSpaceDecoration = {
  tileRotation: number
  labelRotation: number
  buildingOffset: [number, number]
}

export function getBoardSpaceDecoration(spaceId: number): BoardSpaceDecoration {
  if (spaceId < 0 || spaceId >= 40 || !Number.isInteger(spaceId)) throw new RangeError('spaceId must be a board index')

  if (spaceId <= 10) return { tileRotation: 0, labelRotation: Math.PI, buildingOffset: [0, -0.34] }
  if (spaceId <= 20) return { tileRotation: Math.PI / 2, labelRotation: Math.PI, buildingOffset: [-0.34, 0] }
  if (spaceId <= 30) return { tileRotation: Math.PI / 2, labelRotation: -Math.PI / 2, buildingOffset: [0, 0.34] }
  return { tileRotation: 0, labelRotation: Math.PI / 2, buildingOffset: [0.34, 0] }
}
