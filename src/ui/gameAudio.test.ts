import { describe, expect, it } from 'vitest'
import { getBackgroundMusicFrequency } from './gameAudio'

describe('background game music', () => {
  it('uses a calm repeating phrase in a safe audible range', () => {
    const phrase = Array.from({ length: 16 }, (_, step) => getBackgroundMusicFrequency(step))

    expect(new Set(phrase).size).toBeGreaterThan(4)
    expect(phrase.every((frequency) => frequency >= 200 && frequency <= 450)).toBe(true)
    expect(getBackgroundMusicFrequency(16)).toBe(phrase[0])
    expect(getBackgroundMusicFrequency(-1)).toBe(phrase[15])
  })
})
