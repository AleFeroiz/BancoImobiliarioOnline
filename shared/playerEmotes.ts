export const PLAYER_EMOTES = [
  { id: 'like', label: 'Joia', symbol: '👍' },
  { id: 'dislike', label: 'Joia invertido', symbol: '👎' },
  { id: 'laugh', label: 'Risada', symbol: '😂' },
  { id: 'angry', label: 'Raiva', symbol: '😡' },
  { id: 'middle-finger', label: 'Dedo do meio', symbol: '🖕' },
  { id: 'cry', label: 'Choro', symbol: '😭' },
] as const

export type PlayerEmote = typeof PLAYER_EMOTES[number]['id']

export function isPlayerEmote(value: unknown): value is PlayerEmote {
  return typeof value === 'string' && PLAYER_EMOTES.some((emote) => emote.id === value)
}

export function getPlayerEmoteSymbol(value: PlayerEmote) {
  return PLAYER_EMOTES.find((emote) => emote.id === value)?.symbol ?? ''
}
