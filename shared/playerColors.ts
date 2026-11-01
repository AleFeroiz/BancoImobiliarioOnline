export const PLAYER_COLORS = ['#ce7558', '#4e9da7', '#9170aa', '#d1a33e', '#3d76c6', '#5a9b60', '#c65b89', '#8b9b3c', '#3b9da0', '#d37736', '#7168b2', '#59616d'] as const
export type PlayerColor = (typeof PLAYER_COLORS)[number]
export const PLAYER_COLOR_NAMES = ['Coral', 'Turquesa', 'Roxo', 'Dourado', 'Azul', 'Verde', 'Magenta', 'Oliva', 'Ciano', 'Laranja', 'Lavanda', 'Grafite'] as const

export function isPlayerColor(value: unknown): value is PlayerColor {
  return typeof value === 'string' && PLAYER_COLORS.some((color) => color === value)
}
