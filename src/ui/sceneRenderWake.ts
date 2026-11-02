type InvalidateScene = (frames?: number) => void
type ScheduleFrame = (callback: () => void) => number
type CancelFrame = (frame: number) => void
type ScheduleDelay = (callback: () => void, delayMs: number) => number
type CancelDelay = (timer: number) => void

type SceneWakeTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>
type VisibilityWakeTarget = Pick<Document, 'addEventListener' | 'removeEventListener'>
type ContextEventTarget = Pick<HTMLCanvasElement, 'addEventListener' | 'removeEventListener'>

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

/** Keeps demand-rendered scenes visible after a tab, window, or WebGL context resumes. */
export function subscribeSceneResumeWake(
  invalidate: InvalidateScene,
  windowTarget: SceneWakeTarget,
  documentTarget: VisibilityWakeTarget,
  isVisible: () => boolean,
) {
  const wake = () => invalidate(3)
  const wakeWhenVisible = () => { if (isVisible()) wake() }
  windowTarget.addEventListener('focus', wake)
  windowTarget.addEventListener('pageshow', wake)
  documentTarget.addEventListener('visibilitychange', wakeWhenVisible)
  return () => {
    windowTarget.removeEventListener('focus', wake)
    windowTarget.removeEventListener('pageshow', wake)
    documentTarget.removeEventListener('visibilitychange', wakeWhenVisible)
  }
}

/** Gives WebGL a short chance to restore before replacing a persistently lost canvas. */
export function subscribeSceneContextRecovery(
  canvas: ContextEventTarget,
  invalidate: InvalidateScene,
  onUnrecoveredContextLoss: () => void,
  setDelay: ScheduleDelay,
  clearDelay: CancelDelay,
  recoveryDelayMs = 1800,
  notifyContextLost: () => void = () => {},
  notifyContextRestored: () => void = () => {},
) {
  let recoveryTimer: number | undefined
  const onContextLost: EventListener = (event) => {
    event.preventDefault()
    notifyContextLost()
    if (recoveryTimer !== undefined) clearDelay(recoveryTimer)
    recoveryTimer = setDelay(onUnrecoveredContextLoss, recoveryDelayMs)
  }
  const onContextRestored = () => {
    if (recoveryTimer !== undefined) clearDelay(recoveryTimer)
    recoveryTimer = undefined
    notifyContextRestored()
    invalidate(3)
  }
  canvas.addEventListener('webglcontextlost', onContextLost)
  canvas.addEventListener('webglcontextrestored', onContextRestored)
  return () => {
    if (recoveryTimer !== undefined) clearDelay(recoveryTimer)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    canvas.removeEventListener('webglcontextrestored', onContextRestored)
  }
}
