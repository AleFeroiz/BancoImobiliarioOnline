import { describe, expect, it, vi } from 'vitest'
import { scheduleSceneRenderWake, subscribeSceneContextRecovery, subscribeSceneResumeWake } from './sceneRenderWake'

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

  it('wakes the scene after focus, page restoration, and visible-tab restoration', () => {
    const invalidate = vi.fn()
    const windowTarget = new EventTarget()
    const documentTarget = new EventTarget()
    let visible = false
    const cleanup = subscribeSceneResumeWake(invalidate, windowTarget, documentTarget, () => visible)

    windowTarget.dispatchEvent(new Event('focus'))
    windowTarget.dispatchEvent(new Event('pageshow'))
    documentTarget.dispatchEvent(new Event('visibilitychange'))
    expect(invalidate).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenNthCalledWith(1, 3)
    expect(invalidate).toHaveBeenNthCalledWith(2, 3)

    visible = true
    documentTarget.dispatchEvent(new Event('visibilitychange'))
    expect(invalidate).toHaveBeenCalledTimes(3)

    cleanup()
    windowTarget.dispatchEvent(new Event('focus'))
    expect(invalidate).toHaveBeenCalledTimes(3)
  })

  it('replaces a canvas only if WebGL does not restore its context', () => {
    const canvas = new EventTarget()
    const invalidate = vi.fn()
    const onReset = vi.fn()
    let recoveryCallback: (() => void) | undefined
    const clearDelay = vi.fn()
    const cleanup = subscribeSceneContextRecovery(
      canvas as HTMLCanvasElement,
      invalidate,
      onReset,
      (callback, delayMs) => { expect(delayMs).toBe(1800); recoveryCallback = callback; return 31 },
      clearDelay,
    )

    const lost = new Event('webglcontextlost', { cancelable: true })
    canvas.dispatchEvent(lost)
    expect(lost.defaultPrevented).toBe(true)
    canvas.dispatchEvent(new Event('webglcontextrestored'))
    expect(clearDelay).toHaveBeenCalledWith(31)
    expect(invalidate).toHaveBeenCalledWith(3)
    cleanup()

    const secondCanvas = new EventTarget()
    const removeSecondListeners = subscribeSceneContextRecovery(
      secondCanvas as HTMLCanvasElement,
      invalidate,
      onReset,
      (callback) => { recoveryCallback = callback; return 32 },
      vi.fn(),
    )
    secondCanvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    recoveryCallback?.()
    expect(onReset).toHaveBeenCalledOnce()
    removeSecondListeners()
  })
})
