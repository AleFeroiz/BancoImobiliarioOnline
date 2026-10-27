export type GameMode = 'classic' | 'express'
export type LobbyStatus = 'waiting' | 'playing'

export type LobbyPlayer = {
  name: string
  isHost: boolean
}

export function isGameMode(value: unknown): value is GameMode {
  return value === 'classic' || value === 'express'
}

export function normalizePlayerName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.trim().replace(/\s+/g, ' ')
  return name.length > 0 && name.length <= 18 ? name : null
}
