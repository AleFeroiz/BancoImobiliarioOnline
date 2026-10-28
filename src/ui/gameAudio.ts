import type { GameSound } from './gameFeedback'

let context: AudioContext | null = null
let musicTimer: number | null = null
let musicGeneration = 0
let musicBus: GainNode | null = null
let musicOscillators: OscillatorNode[] = []

const musicPhrase = [0, 2, 3, 4, 2, 3, 5, 3, 0, 2, 4, 3, 1, 3, 2, 0]
const musicScale = [220, 261.63, 293.66, 329.63, 392, 440]

export function getBackgroundMusicFrequency(step: number) {
  const phraseIndex = ((Math.floor(step) % musicPhrase.length) + musicPhrase.length) % musicPhrase.length
  return musicScale[musicPhrase[phraseIndex] ?? 0] ?? musicScale[0]!
}

function getAudioContext() {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
    return context
  } catch {
    return null
  }
}

const soundNotes: Record<GameSound, number[]> = {
  dice: [392, 523],
  purchase: [523, 659, 784],
  money: [659, 784],
  auction: [440, 587, 740],
  milestone: [523, 659, 880],
  construction: [587, 784, 988],
  demolition: [392, 330, 262],
  ownership: [494, 659, 784],
  mortgage: [392, 494],
  redemption: [494, 659],
}

export function playGameSound(sound: GameSound) {
  const audio = getAudioContext()
  if (!audio) return
  try {
    const start = audio.currentTime
    soundNotes[sound].forEach((frequency, index) => {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      const onset = start + index * 0.075
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, onset)
      gain.gain.setValueAtTime(0.0001, onset)
      gain.gain.exponentialRampToValueAtTime(0.055, onset + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, onset + 0.16)
      oscillator.connect(gain)
      gain.connect(context!.destination)
      oscillator.start(onset)
      oscillator.stop(onset + 0.17)
    })
  } catch {
    // Audio is decorative; blocked or unavailable audio must never interrupt a turn.
  }
}

export function unlockGameAudio() {
  getAudioContext()
}

export function startGameMusic() {
  const audio = getAudioContext()
  if (!audio || typeof window === 'undefined') return

  stopGameMusic()
  const generation = musicGeneration
  const bus = audio.createGain()
  bus.gain.setValueAtTime(0.22, audio.currentTime)
  bus.connect(audio.destination)
  musicBus = bus

  const pad = audio.createOscillator()
  const padGain = audio.createGain()
  pad.type = 'sine'
  pad.frequency.setValueAtTime(130.81, audio.currentTime)
  padGain.gain.setValueAtTime(0.012, audio.currentTime)
  pad.connect(padGain)
  padGain.connect(bus)
  pad.start()
  musicOscillators.push(pad)

  let step = 0
  const scheduleNote = () => {
    if (musicGeneration !== generation || musicBus !== bus) return
    const onset = audio.currentTime + 0.04
    const oscillator = audio.createOscillator()
    const envelope = audio.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(getBackgroundMusicFrequency(step), onset)
    envelope.gain.setValueAtTime(0.0001, onset)
    envelope.gain.exponentialRampToValueAtTime(0.075, onset + 0.06)
    envelope.gain.exponentialRampToValueAtTime(0.0001, onset + 0.72)
    oscillator.connect(envelope)
    envelope.connect(bus)
    oscillator.onended = () => {
      oscillator.disconnect()
      envelope.disconnect()
      musicOscillators = musicOscillators.filter((active) => active !== oscillator)
    }
    oscillator.start(onset)
    oscillator.stop(onset + 0.74)
    musicOscillators.push(oscillator)
    step += 1
    musicTimer = window.setTimeout(scheduleNote, 820)
  }

  try {
    scheduleNote()
  } catch {
    stopGameMusic()
  }
}

export function stopGameMusic() {
  musicGeneration += 1
  if (musicTimer !== null && typeof window !== 'undefined') window.clearTimeout(musicTimer)
  musicTimer = null

  const audio = context
  const bus = musicBus
  musicBus = null
  if (audio && bus) {
    const now = audio.currentTime
    bus.gain.cancelScheduledValues(now)
    bus.gain.setTargetAtTime(0, now, 0.06)
    window.setTimeout(() => bus.disconnect(), 300)
  }
  for (const oscillator of musicOscillators) {
    try {
      oscillator.stop()
      oscillator.disconnect()
    } catch {
      // An already-ended note needs no cleanup.
    }
  }
  musicOscillators = []
}
