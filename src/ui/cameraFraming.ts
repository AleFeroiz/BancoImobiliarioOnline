export type CameraFraming = {
  position: [number, number, number]
  fov: number
  fogScale: number
}

export function getCameraFraming(width: number, height: number): CameraFraming {
  const aspect = width / height
  if (width < 640 && aspect < 0.7) {
    return { position: [0, 32, 18], fov: 42, fogScale: 1.5 }
  }

  const distance = aspect < 0.7 ? 1.5 : aspect < 1.1 ? 1.15 : 1
  return {
    position: [10.5 * distance, 27 * distance, 10.5 * distance],
    fov: width < 640 ? 49 : width < 900 ? 40 : 34,
    fogScale: distance,
  }
}
