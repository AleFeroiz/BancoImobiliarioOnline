import { describe, expect, it } from 'vitest'
import { getCameraTargetShift } from './cameraTarget'

describe('getCameraTargetShift', () => {
  it('moves the camera focus without changing its relative framing', () => {
    expect(getCameraTargetShift([0, 0, 0], [4, 0.5, -3])).toEqual([4, 0.5, -3])
    expect(getCameraTargetShift([4, 0.5, -3], [0, 0, 0])).toEqual([-4, -0.5, 3])
  })
})
