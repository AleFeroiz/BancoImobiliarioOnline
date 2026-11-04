import { afterEach, describe, expect, it, vi } from 'vitest'
import { getGameAudioEffectStyle } from './gameAudio'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('background music', () => {
  it('loops the requested track and stops it when audio is disabled', async () => {
    const source = { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), loop: false, buffer: null }
    const bus = { gain: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() }
    const audio = { state: 'running', destination: {}, decodeAudioData: vi.fn().mockResolvedValue({}), createGain: () => bus, createBufferSource: () => source }
    vi.stubGlobal('window', { AudioContext: vi.fn(function () { return audio }) })
    vi.stubGlobal('AudioContext', vi.fn(function () { return audio }))
    const fetchAudio = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) })
    vi.stubGlobal('fetch', fetchAudio)
    const { startGameMusic, stopGameMusic } = await import('./gameAudio')

    startGameMusic('home')
    await vi.waitFor(() => expect(source.start).toHaveBeenCalledOnce())
    expect(fetchAudio.mock.calls[0]?.[0]).toContain('assets/music/home.mp3')
    expect(source.loop).toBe(true)
    stopGameMusic()
    expect(source.stop).toHaveBeenCalledOnce()
  })

  it('does not start an obsolete track after changing screens', async () => {
    let finishDecode!: (buffer: object) => void
    const source = { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() }
    const audio = { state: 'running', destination: {}, decodeAudioData: () => new Promise((resolve) => { finishDecode = resolve }), createGain: vi.fn(), createBufferSource: () => source }
    vi.stubGlobal('window', { AudioContext: vi.fn(function () { return audio }) })
    vi.stubGlobal('AudioContext', vi.fn(function () { return audio }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }))
    const { startGameMusic, stopGameMusic } = await import('./gameAudio')

    startGameMusic('game')
    await vi.waitFor(() => expect(finishDecode).toBeDefined())
    stopGameMusic()
    finishDecode({})
    await Promise.resolve()
    expect(source.start).not.toHaveBeenCalled()
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
    expect(getGameAudioEffectStyle('earthquake')).toBe('earthquake-rumble')
    expect(getGameAudioEffectStyle('construction')).toBe('musical')
    expect(getGameAudioEffectStyle('none')).toBe('silent')
  })
})
