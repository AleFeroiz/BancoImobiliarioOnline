import { describe, expect, it } from 'vitest'
import { getCameraZoomLimits } from './cameraZoom'

describe('camera zoom limits', () => {
  it('allows a useful zoom range around the responsive starting frame', () => {
    const limits = getCameraZoomLimits(24)

    expect(limits.minDistance).toBeCloseTo(11.52)
    expect(limits.maxDistance).toBeCloseTo(37.2)
    expect(limits.minDistance).toBeLessThan(24)
    expect(limits.maxDistance).toBeGreaterThan(24)
  })

  it('keeps camera limits positive for invalid distances', () => {
    expect(getCameraZoomLimits(0)).toEqual({ minDistance: 0.48, maxDistance: 1.55 })
  })
})
