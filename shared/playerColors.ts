export const PLAYER_COLORS = ['#ce7558', '#4e9da7', '#9170aa', '#d1a33e'] as const
export type PlayerColor = (typeof PLAYER_COLORS)[number]
export const PLAYER_COLOR_NAMES = ['Coral', 'Turquesa', 'Roxo', 'Dourado'] as const

export function isPlayerColor(value: unknown): value is PlayerColor {
  return typeof value === 'string' && PLAYER_COLORS.some((color) => color === value)
}
