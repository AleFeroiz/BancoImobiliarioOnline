export type CameraPoint = readonly [number, number, number]

export function getCameraTargetShift(current: CameraPoint, desired: CameraPoint): [number, number, number] {
  return [desired[0] - current[0], desired[1] - current[1], desired[2] - current[2]]
}
