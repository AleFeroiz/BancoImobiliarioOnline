import { describe, expect, it } from 'vitest'
import { getBackgroundMusicFrequency, getGameAudioEffectStyle } from './gameAudio'

describe('background game music', () => {
  it('uses a calm repeating phrase in a safe audible range', () => {
    const phrase = Array.from({ length: 16 }, (_, step) => getBackgroundMusicFrequency(step))

    expect(new Set(phrase).size).toBeGreaterThan(4)
    expect(phrase.every((frequency) => frequency >= 200 && frequency <= 450)).toBe(true)
    expect(getBackgroundMusicFrequency(16)).toBe(phrase[0])
    expect(getBackgroundMusicFrequency(-1)).toBe(phrase[15])
  })
})

describe('identidade dos efeitos de áudio', () => {
  it('diferencia dinheiro recebido, perda, dados e construção', () => {
    expect(getGameAudioEffectStyle('money-in')).toBe('cash-register')
    expect(getGameAudioEffectStyle('money-out')).toBe('distorted-loss')
    expect(getGameAudioEffectStyle('dice')).toBe('dice-rattle')
    expect(getGameAudioEffectStyle('pawn-step')).toBe('pawn-puff')
    expect(getGameAudioEffectStyle('airplane-pass')).toBe('airplane-pass')
    expect(getGameAudioEffectStyle('police-siren')).toBe('police-siren')
    expect(getGameAudioEffectStyle('crowd-cheer')).toBe('crowd-cheer')
    expect(getGameAudioEffectStyle('construction')).toBe('musical')
    expect(getGameAudioEffectStyle('none')).toBe('silent')
  })
})
