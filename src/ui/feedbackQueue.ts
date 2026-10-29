import type { GameSound } from './gameFeedback'

export type GameFeedbackItem = { id: number; message: string; sound: GameSound }

export function appendGameFeedback(queue: GameFeedbackItem[], item: GameFeedbackItem) {
  if (queue.some((queued) => queued.message === item.message)) return queue
  return [...queue, item]
}
