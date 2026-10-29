export type CameraFraming = {
  position: [number, number, number]
  fov: number
  distance: number
  azimuth: number
  tilt: number
}

const BOARD_HALF_SIZE = 6.2
const FRAME_MARGIN = 1.08

export function getCameraFraming(width: number, height: number, tiltDegrees = 16, horizontalDegrees = 45): CameraFraming {
  const aspect = Math.max(0.25, width / Math.max(height, 1))
  const tilt = Math.min(75, Math.max(0, tiltDegrees)) * Math.PI / 180
  const azimuth = ((horizontalDegrees % 360) + 360) % 360 * Math.PI / 180
  const fov = width < 640 ? 46 : width < 900 ? 42 : 38
  const verticalHalfFov = fov * Math.PI / 360
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * aspect)
  const sinTilt = Math.sin(tilt)
  const cosTilt = Math.cos(tilt)
  const sinAzimuth = Math.sin(azimuth)
  const cosAzimuth = Math.cos(azimuth)
  const corners = [
    [-BOARD_HALF_SIZE, -BOARD_HALF_SIZE],
    [-BOARD_HALF_SIZE, BOARD_HALF_SIZE],
    [BOARD_HALF_SIZE, -BOARD_HALF_SIZE],
    [BOARD_HALF_SIZE, BOARD_HALF_SIZE],
  ] as const

  // Fit the projected board corners in both axes, accounting for their different perspective depths.
  const requiredDistance = corners.reduce((maximum, [x, z]) => {
    const towardCamera = x * sinAzimuth + z * cosAzimuth
    const acrossCamera = x * cosAzimuth - z * sinAzimuth
    const depthOffset = towardCamera * sinTilt
    const horizontalDistance = depthOffset + Math.abs(acrossCamera) / Math.tan(horizontalHalfFov)
    const verticalDistance = depthOffset + Math.abs(towardCamera * cosTilt) / Math.tan(verticalHalfFov)
    return Math.max(maximum, horizontalDistance, verticalDistance)
  }, 0)
  const distance = requiredDistance * FRAME_MARGIN
  const position: [number, number, number] = [
    distance * sinTilt * sinAzimuth,
    distance * cosTilt,
    distance * sinTilt * cosAzimuth,
  ]
  return { position, fov, distance, azimuth, tilt: tilt * 180 / Math.PI }
}
