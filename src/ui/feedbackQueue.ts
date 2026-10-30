import type { GameSound } from './gameFeedback'

export type GameFeedbackItem = { id: number; message: string; sound: GameSound; playerName?: string; playerColor?: string }

export function personalizePlayerFeedback(message: string, playerName: string) {
  return message
    .replace(/\b[Ss]ua peça\b/g, (match) => `${match[0] === 'S' ? 'Peça' : 'peça'} de ${playerName}`)
    .replace(/você/gi, playerName)
}

export function appendGameFeedback(queue: GameFeedbackItem[], item: GameFeedbackItem) {
  if (queue.some((queued) => queued.message === item.message && queued.playerName === item.playerName)) return queue
  return [...queue, item]
}
