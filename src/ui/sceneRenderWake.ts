type InvalidateScene = (frames?: number) => void
type ScheduleFrame = (callback: () => void) => number
type CancelFrame = (frame: number) => void
type ScheduleDelay = (callback: () => void, delayMs: number) => number
type CancelDelay = (timer: number) => void

/** Reissues a few frames at a turn boundary to refresh demand-rendered canvases. */
export function scheduleSceneRenderWake(
  invalidate: InvalidateScene,
  requestFrame: ScheduleFrame,
  cancelFrame: CancelFrame,
  setDelay: ScheduleDelay,
  clearDelay: CancelDelay,
) {
  invalidate(2)
  const frame = requestFrame(() => invalidate(2))
  const delayedFrame = setDelay(() => invalidate(2), 180)

  return () => {
    cancelFrame(frame)
    clearDelay(delayedFrame)
  }
}
