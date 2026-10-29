import { describe, expect, it } from 'vitest'
import { createFrameRateAccumulator, readFrameRate, recordRenderedFrame } from './fpsMeter'

describe('frame rate meter', () => {
  it('measures the actual rendered frame intervals', () => {
    let samples = createFrameRateAccumulator()
    for (let frame = 0; frame <= 30; frame += 1) {
      samples = recordRenderedFrame(samples, frame * (1000 / 60))
    }

    expect(readFrameRate(samples, 500)).toEqual({ state: 'active', fps: 60, frameTimeMs: 16.7 })
  })

  it('reports an idle scene after render callbacks stop', () => {
    const afterFrame = recordRenderedFrame(createFrameRateAccumulator(), 10)
    expect(readFrameRate(afterFrame, 10)).toEqual({ state: 'measuring' })

    let samples = afterFrame
    for (let frame = 1; frame <= 31; frame += 1) {
      samples = recordRenderedFrame(samples, 10 + frame * (1000 / 60))
    }

    expect(readFrameRate(samples, 2_000)).toEqual({ state: 'idle' })
  })

  it('starts a fresh sample window after the scene resumes from idle', () => {
    let samples = createFrameRateAccumulator()
    for (let frame = 0; frame <= 30; frame += 1) {
      samples = recordRenderedFrame(samples, frame * (1000 / 60))
    }
    samples = recordRenderedFrame(samples, 5_000)
    for (let frame = 1; frame <= 30; frame += 1) {
      samples = recordRenderedFrame(samples, 5_000 + frame * (1000 / 60))
    }

    expect(readFrameRate(samples, 5_500)).toEqual({ state: 'active', fps: 60, frameTimeMs: 16.7 })
  })

  it('ignores invalid timestamps instead of corrupting the sample window', () => {
    const samples = createFrameRateAccumulator()
    expect(recordRenderedFrame(samples, Number.NaN)).toBe(samples)
  })
})
