import type { GameSound } from './gameFeedback'

let context: AudioContext | null = null
let musicGeneration = 0
let musicSource: AudioBufferSourceNode | null = null
let musicBus: GainNode | null = null
let musicRequest: AbortController | null = null
function getAudioContext() {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume().catch(() => {})
    return context
  } catch {
    return null
  }
}

const soundNotes: Record<GameSound, number[]> = {
  none: [],
  dice: [392, 523],
  'pawn-step': [],
  purchase: [523, 659, 784],
  'money-in': [523, 659, 784, 1047],
  'money-out': [784, 659, 523, 392],
  auction: [440, 587, 740],
  milestone: [523, 659, 880],
  construction: [587, 784, 988],
  demolition: [392, 330, 262],
  ownership: [494, 659, 784],
  'airplane-pass': [],
  'police-siren': [],
  'crowd-cheer': [],
  earthquake: [],
}

export type GameAudioEffectStyle = 'silent' | 'cash-register' | 'distorted-loss' | 'dice-rattle' | 'pawn-puff' | 'airplane-pass' | 'police-siren' | 'crowd-cheer' | 'earthquake-rumble' | 'musical'

export function getGameAudioEffectStyle(sound: GameSound): GameAudioEffectStyle {
  if (sound === 'money-in') return 'cash-register'
  if (sound === 'money-out') return 'distorted-loss'
  if (sound === 'dice') return 'dice-rattle'
  if (sound === 'pawn-step') return 'pawn-puff'
  if (sound === 'airplane-pass') return 'airplane-pass'
  if (sound === 'police-siren') return 'police-siren'
  if (sound === 'crowd-cheer') return 'crowd-cheer'
  if (sound === 'earthquake') return 'earthquake-rumble'
  if (sound === 'none') return 'silent'
  return 'musical'
}

function playNoise(audio: AudioContext, start: number, duration: number, frequency: number, volume: number) {
  const frames = Math.max(1, Math.floor(audio.sampleRate * duration))
  const buffer = audio.createBuffer(1, frames, audio.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let index = 0; index < frames; index += 1) samples[index] = Math.random() * 2 - 1

  const source = audio.createBufferSource()
  const filter = audio.createBiquadFilter()
  const envelope = audio.createGain()
  source.buffer = buffer
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(frequency, start)
  envelope.gain.setValueAtTime(volume, start)
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  source.connect(filter)
  filter.connect(envelope)
  envelope.connect(audio.destination)
  source.start(start)
  source.stop(start + duration)
}

function playCashRegister(audio: AudioContext) {
  const start = audio.currentTime
  playNoise(audio, start, 0.055, 950, 0.055)
  for (const [index, frequency] of [1318.5, 1760].entries()) {
    const onset = start + 0.035 + index * 0.085
    const oscillator = audio.createOscillator()
    const envelope = audio.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, onset)
    envelope.gain.setValueAtTime(0.0001, onset)
    envelope.gain.exponentialRampToValueAtTime(0.075, onset + 0.012)
    envelope.gain.exponentialRampToValueAtTime(0.0001, onset + 0.3)
    oscillator.connect(envelope)
    envelope.connect(audio.destination)
    oscillator.start(onset)
    oscillator.stop(onset + 0.31)
  }
}

function playDistortedLoss(audio: AudioContext) {
  const start = audio.currentTime
  playNoise(audio, start, 0.24, 360, 0.075)
  const oscillator = audio.createOscillator()
  const distortion = audio.createWaveShaper()
  const envelope = audio.createGain()
  const curve = new Float32Array(256)
  for (let index = 0; index < curve.length; index += 1) curve[index] = Math.tanh(((index / (curve.length - 1)) * 2 - 1) * 4)
  distortion.curve = curve
  distortion.oversample = '2x'
  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(480, start)
  oscillator.frequency.exponentialRampToValueAtTime(125, start + 0.34)
  envelope.gain.setValueAtTime(0.0001, start)
  envelope.gain.exponentialRampToValueAtTime(0.11, start + 0.025)
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.38)
  oscillator.connect(distortion)
  distortion.connect(envelope)
  envelope.connect(audio.destination)
  oscillator.start(start)
  oscillator.stop(start + 0.39)
}

function playDiceRattle(audio: AudioContext) {
  const start = audio.currentTime
  playNoise(audio, start, 0.23, 1800, 0.085)
  playNoise(audio, start + 0.065, 0.19, 1150, 0.065)
  playNoise(audio, start + 0.13, 0.15, 2100, 0.05)
}

function playPawnPuff(audio: AudioContext) {
  const start = audio.currentTime
  playNoise(audio, start, 0.095, 520, 0.035)
  const oscillator = audio.createOscillator()
  const envelope = audio.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(185, start)
  oscillator.frequency.exponentialRampToValueAtTime(95, start + 0.085)
  envelope.gain.setValueAtTime(0.0001, start)
  envelope.gain.exponentialRampToValueAtTime(0.045, start + 0.008)
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.105)
  oscillator.connect(envelope)
  envelope.connect(audio.destination)
  oscillator.start(start)
  oscillator.stop(start + 0.11)
}

function playAirplanePass(audio: AudioContext) {
  const start = audio.currentTime
  const noise = audio.createBufferSource()
  const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * 1.45), audio.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let index = 0; index < samples.length; index += 1) samples[index] = (Math.random() * 2 - 1) * 0.45
  noise.buffer = buffer
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(400, start)
  filter.frequency.exponentialRampToValueAtTime(1550, start + 0.58)
  filter.frequency.exponentialRampToValueAtTime(360, start + 1.4)
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.13, start + 0.55)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.42)
  const pan = audio.createStereoPanner()
  pan.pan.setValueAtTime(-0.9, start)
  pan.pan.linearRampToValueAtTime(0.9, start + 1.4)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(pan)
  pan.connect(audio.destination)
  noise.start(start)
  noise.stop(start + 1.45)
}

function playPoliceSiren(audio: AudioContext) {
  const start = audio.currentTime
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(660, start)
  for (let index = 0; index < 4; index += 1) {
    oscillator.frequency.setValueAtTime(920, start + index * 0.36 + 0.18)
    oscillator.frequency.setValueAtTime(660, start + (index + 1) * 0.36)
  }
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.075, start + 0.035)
  gain.gain.setValueAtTime(0.075, start + 1.35)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.48)
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start(start)
  oscillator.stop(start + 1.5)
}

function playCrowdCheer(audio: AudioContext) {
  const start = audio.currentTime
  playNoise(audio, start, 0.95, 720, 0.11)
  playNoise(audio, start + 0.11, 0.82, 1180, 0.08)
  for (const [index, frequency] of [784, 988, 1175].entries()) {
    const onset = start + index * 0.075
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, onset)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.16, onset + 0.3)
    gain.gain.setValueAtTime(0.0001, onset)
    gain.gain.exponentialRampToValueAtTime(0.035, onset + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, onset + 0.72)
    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.start(onset)
    oscillator.stop(onset + 0.74)
  }
}

function playEarthquake(audio: AudioContext) {
  const start = audio.currentTime
  playNoise(audio, start, 1.25, 72, 0.13)
  playNoise(audio, start + 0.08, 0.85, 145, 0.07)
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  const filter = audio.createBiquadFilter()
  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(58, start)
  oscillator.frequency.exponentialRampToValueAtTime(31, start + 1.1)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(135, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.07, start + 0.1)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2)
  oscillator.connect(filter)
  filter.connect(gain)
  gain.connect(audio.destination)
  oscillator.start(start)
  oscillator.stop(start + 1.22)
}

export function playGameSound(sound: GameSound) {
  if (getGameAudioEffectStyle(sound) === 'silent') return
  const audio = getAudioContext()
  if (!audio) return
  try {
    const style = getGameAudioEffectStyle(sound)
    if (style === 'cash-register') {
      playCashRegister(audio)
      return
    }
    if (style === 'distorted-loss') {
      playDistortedLoss(audio)
      return
    }
    if (style === 'dice-rattle') {
      playDiceRattle(audio)
      return
    }
    if (style === 'pawn-puff') {
      playPawnPuff(audio)
      return
    }
    if (style === 'airplane-pass') { playAirplanePass(audio); return }
    if (style === 'police-siren') { playPoliceSiren(audio); return }
    if (style === 'crowd-cheer') { playCrowdCheer(audio); return }
    if (style === 'earthquake-rumble') { playEarthquake(audio); return }
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

export type MusicTrack = 'home' | 'game'

export function startGameMusic(track: MusicTrack) {
  const audio = getAudioContext()
  if (!audio) return

  stopGameMusic()
  const generation = musicGeneration
  const request = new AbortController()
  musicRequest = request
  const url = `${import.meta.env.BASE_URL}assets/music/${track}.mp3`

  void fetch(url, { signal: request.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`Music request failed: ${response.status}`)
      return response.arrayBuffer()
    })
    .then((data) => audio.decodeAudioData(data))
    .then((buffer) => {
      if (generation !== musicGeneration) return
      const bus = audio.createGain()
      const source = audio.createBufferSource()
      bus.gain.value = 0.14
      source.buffer = buffer
      source.loop = true
      source.connect(bus)
      bus.connect(audio.destination)
      musicSource = source
      musicBus = bus
      musicRequest = null
      source.start()
    })
    .catch(() => {
      // Music is optional and can fail to load or be blocked without affecting the game.
    })
}

export function stopGameMusic() {
  musicGeneration += 1
  musicRequest?.abort()
  musicRequest = null
  if (musicSource) {
    musicSource.stop()
    musicSource.disconnect()
    musicSource = null
  }
  musicBus?.disconnect()
  musicBus = null
}