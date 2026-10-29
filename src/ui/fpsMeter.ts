export type FrameRateReading = {
  fps: number
  frameTimeMs: number
}

export type FrameRateAccumulator = {
  windowStart: number
  frameCount: number
  lastFrameAt: number | null
  reading: FrameRateReading | null
}

export type FrameRateDisplay =
  | { state: 'measuring' }
  | { state: 'idle' }
  | ({ state: 'active' } & FrameRateReading)

export const FPS_SAMPLE_WINDOW_MS = 500
export const FPS_IDLE_AFTER_MS = 1_000

export function createFrameRateAccumulator(): FrameRateAccumulator {
  return { windowStart: 0, frameCount: 0, lastFrameAt: null, reading: null }
}

export function recordRenderedFrame(
  current: FrameRateAccumulator,
  timestamp: number,
  sampleWindowMs = FPS_SAMPLE_WINDOW_MS,
): FrameRateAccumulator {
  if (!Number.isFinite(timestamp)) return current

  if (current.lastFrameAt !== null && timestamp - current.lastFrameAt > FPS_IDLE_AFTER_MS) {
    return { ...current, windowStart: timestamp, frameCount: 1, lastFrameAt: timestamp }
  }

  const windowStart = current.frameCount === 0 ? timestamp : current.windowStart
  const frameCount = current.frameCount + 1
  const elapsed = timestamp - windowStart
  if (frameCount < 2 || (elapsed < sampleWindowMs && current.reading !== null)) {
    return { ...current, windowStart, frameCount, lastFrameAt: timestamp }
  }

  const frameIntervals = frameCount - 1
  return {
    windowStart: timestamp,
    frameCount: 0,
    lastFrameAt: timestamp,
    reading: {
      fps: Math.round(frameIntervals * 1000 / elapsed),
      frameTimeMs: Math.round(elapsed / frameIntervals * 10) / 10,
    },
  }
}

export function readFrameRate(
  current: FrameRateAccumulator,
  timestamp: number,
  idleAfterMs = FPS_IDLE_AFTER_MS,
): FrameRateDisplay {
  if (current.lastFrameAt === null) return { state: 'measuring' }
  if (timestamp - current.lastFrameAt > idleAfterMs) return { state: 'idle' }
  if (!current.reading) return { state: 'measuring' }
  return { state: 'active', ...current.reading }
}
