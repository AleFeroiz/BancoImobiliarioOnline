import { describe, expect, it, vi } from 'vitest'
import { scheduleSceneRenderWake } from './sceneRenderWake'

describe('demand-rendered board wake', () => {
  it('requests redraws immediately, on the next frame, and after the turn transition settles', () => {
    const invalidate = vi.fn()
    let frameCallback: (() => void) | undefined
    let delayCallback: (() => void) | undefined
    const cancelFrame = vi.fn()
    const clearDelay = vi.fn()

    scheduleSceneRenderWake(
      invalidate,
      (callback) => { frameCallback = callback; return 17 },
      cancelFrame,
      (callback, delayMs) => { expect(delayMs).toBe(180); delayCallback = callback; return 23 },
      clearDelay,
    )

    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenNthCalledWith(1, 2)

    frameCallback?.()
    delayCallback?.()

    expect(invalidate).toHaveBeenCalledTimes(3)
    expect(invalidate).toHaveBeenNthCalledWith(2, 2)
    expect(invalidate).toHaveBeenNthCalledWith(3, 2)
  })

  it('cancels pending redraws when a newer turn replaces the previous wake', () => {
    const cancelFrame = vi.fn()
    const clearDelay = vi.fn()
    const cancel = scheduleSceneRenderWake(vi.fn(), () => 17, cancelFrame, () => 23, clearDelay)

    cancel()

    expect(cancelFrame).toHaveBeenCalledWith(17)
    expect(clearDelay).toHaveBeenCalledWith(23)
  })
})
