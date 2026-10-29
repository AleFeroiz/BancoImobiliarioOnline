import { describe, expect, it } from 'vitest'
import { shouldStartCameraDrag } from './cameraDrag'

describe('camera drag input', () => {
  it('starts on empty interface space with mouse or touch primary pointer', () => {
    expect(shouldStartCameraDrag({ button: 0, isCanvasTarget: false, isInteractiveTarget: false })).toBe(true)
  })

  it('leaves board clicks to the canvas and never turns controls into camera drags', () => {
    expect(shouldStartCameraDrag({ button: 0, isCanvasTarget: true, isInteractiveTarget: false })).toBe(false)
    expect(shouldStartCameraDrag({ button: 0, isCanvasTarget: false, isInteractiveTarget: true })).toBe(false)
    expect(shouldStartCameraDrag({ button: 2, isCanvasTarget: false, isInteractiveTarget: false })).toBe(false)
  })
})
