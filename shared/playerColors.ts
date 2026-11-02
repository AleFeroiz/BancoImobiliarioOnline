export const PLAYER_COLORS = ['#b3261e', '#2459c4', '#27843a', '#cc438f', '#bd5a0e', '#b38c0d', '#434b53', '#b7c4d5', '#693aa5', '#754a29', '#138f9c', '#609c25'] as const
export type PlayerColor = (typeof PLAYER_COLORS)[number]
export const PLAYER_COLOR_NAMES = ['Vermelho', 'Azul', 'Verde', 'Rosa', 'Laranja', 'Amarelo', 'Preto', 'Branco', 'Roxo', 'Marrom', 'Ciano', 'Lima'] as const

export function isPlayerColor(value: unknown): value is PlayerColor {
  return typeof value === 'string' && PLAYER_COLORS.some((color) => color === value)
}
