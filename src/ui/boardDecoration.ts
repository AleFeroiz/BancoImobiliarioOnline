export const BOARD_SURFACE_Y = 0.16
export const BUILDING_GROUP_Y = 0.038
export const BUILDING_MODEL_Y_OFFSET = BOARD_SURFACE_Y - BUILDING_GROUP_Y

export type BoardSpaceDecoration = {
  tileRotation: number
  labelRotation: number
  buildingRotation: number
  buildingOffset: [number, number]
}

export function getBoardSpaceDecoration(spaceId: number): BoardSpaceDecoration {
  if (spaceId < 0 || spaceId >= 40 || !Number.isInteger(spaceId)) throw new RangeError('spaceId must be a board index')

  if (spaceId <= 10) return { tileRotation: 0, labelRotation: Math.PI, buildingRotation: Math.PI, buildingOffset: [0, -0.58] }
  if (spaceId <= 20) return { tileRotation: Math.PI / 2, labelRotation: Math.PI, buildingRotation: -Math.PI / 2, buildingOffset: [-0.58, 0] }
  if (spaceId <= 30) return { tileRotation: 0, labelRotation: 0, buildingRotation: 0, buildingOffset: [0, 0.58] }
  return { tileRotation: Math.PI / 2, labelRotation: 0, buildingRotation: Math.PI / 2, buildingOffset: [0.58, 0] }
}
