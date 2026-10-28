type SceneScheduler = Pick<Window, 'setTimeout' | 'clearTimeout'> & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

export function scheduleSceneLoad(callback: () => void, scheduler: SceneScheduler = window) {
  let hasRun = false
  const runOnce = () => {
    if (hasRun) return
    hasRun = true
    callback()
  }

  const timeoutId = scheduler.setTimeout(runOnce, 1800)
  const idleId = scheduler.requestIdleCallback?.(runOnce, { timeout: 1600 })

  return () => {
    scheduler.clearTimeout(timeoutId)
    if (idleId !== undefined) scheduler.cancelIdleCallback?.(idleId)
  }
}
