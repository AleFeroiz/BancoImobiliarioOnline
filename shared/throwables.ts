export const THROWABLES = [
  { id: 'tomato', label: 'Tomate', symbol: '🍅' },
  { id: 'egg', label: 'Ovo', symbol: '🥚' },
  { id: 'mud', label: 'Lama', symbol: '🟤' },
  { id: 'flour', label: 'Farinha', symbol: '🌫️' },
] as const

export type ThrowableObject = typeof THROWABLES[number]['id']

export const THROW_COOLDOWN_MS = 5_000
export const THROW_IMPACT_DURATION_MS = 3_000
export const THROW_PROJECTILE_DURATION_MS = 850

export function isThrowableObject(value: unknown): value is ThrowableObject {
  return typeof value === 'string' && THROWABLES.some((throwable) => throwable.id === value)
}

export function getThrowableLabel(value: ThrowableObject) {
  return THROWABLES.find((throwable) => throwable.id === value)?.label ?? ''
}

export function getThrowableSymbol(value: ThrowableObject) {
  return THROWABLES.find((throwable) => throwable.id === value)?.symbol ?? ''
}
