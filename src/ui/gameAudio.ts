import type { GameSound } from './gameFeedback'

let context: AudioContext | null = null

const soundNotes: Record<GameSound, number[]> = {
  dice: [392, 523],
  purchase: [523, 659, 784],
  money: [659, 784],
  auction: [440, 587, 740],
  milestone: [523, 659, 880],
}

export function playGameSound(sound: GameSound) {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
    const start = context.currentTime
    soundNotes[sound].forEach((frequency, index) => {
      const oscillator = context!.createOscillator()
      const gain = context!.createGain()
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
  if (typeof window === 'undefined' || !('AudioContext' in window)) return
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
  } catch {
    // Audio is optional and may be disabled by the browser.
  }
}
