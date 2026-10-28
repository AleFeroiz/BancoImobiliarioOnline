import { describe, expect, it, vi } from 'vitest'
import { scheduleSceneLoad } from './sceneLoading'

describe('scheduleSceneLoad', () => {
  it('loads the scene during idle time, with a timeout fallback', () => {
    const callback = vi.fn()
    let idleCallback: (() => void) | undefined
    const scheduler = {
      setTimeout: vi.fn(() => 1),
      clearTimeout: vi.fn(),
      requestIdleCallback: vi.fn((next: () => void) => {
        idleCallback = next
        return 2
      }),
      cancelIdleCallback: vi.fn(),
    }

    const cancel = scheduleSceneLoad(callback, scheduler)
    expect(callback).not.toHaveBeenCalled()
    expect(scheduler.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 1600 })

    idleCallback?.()
    expect(callback).toHaveBeenCalledOnce()

    cancel()
    expect(scheduler.clearTimeout).toHaveBeenCalledWith(1)
    expect(scheduler.cancelIdleCallback).toHaveBeenCalledWith(2)
  })

  it('supports browsers without requestIdleCallback and runs the fallback once', () => {
    const callback = vi.fn()
    let timerCallback: (() => void) | undefined
    const scheduler = {
      setTimeout: vi.fn((next: () => void) => {
        timerCallback = next
        return 3
      }),
      clearTimeout: vi.fn(),
    }

    scheduleSceneLoad(callback, scheduler)
    timerCallback?.()
    timerCallback?.()

    expect(callback).toHaveBeenCalledOnce()
    expect(scheduler.setTimeout).toHaveBeenCalledWith(expect.any(Function), 1800)
  })
})
