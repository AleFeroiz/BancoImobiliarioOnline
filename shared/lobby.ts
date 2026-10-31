import type { PlayerColor } from './playerColors.js'

export type GameMode = 'classic'
export type LobbyStatus = 'waiting' | 'playing' | 'ended'
export type CharacterType = 'pawn' | 'car' | 'motorcycle' | 'airplane'

export const CHARACTER_OPTIONS: ReadonlyArray<{ id: CharacterType; label: string }> = [
  { id: 'pawn', label: 'Peão' },
  { id: 'car', label: 'Carrinho' },
  { id: 'motorcycle', label: 'Moto' },
  { id: 'airplane', label: 'Avião' },
]

export type LobbyPlayer = {
  name: string
  isHost: boolean
  isConnected?: boolean
  reconnectionExpired?: boolean
  isBot?: boolean
  isBotControlled?: boolean
  characterType: CharacterType
  color?: PlayerColor
  position: number
  isBankrupt?: boolean
}

export function isGameMode(value: unknown): value is GameMode {
  return value === 'classic'
}

export function isCharacterType(value: unknown): value is CharacterType {
  return value === 'pawn' || value === 'car' || value === 'motorcycle' || value === 'airplane'
}

export function normalizePlayerName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.trim().replace(/\s+/g, ' ')
  return name.length > 0 && name.length <= 18 ? name : null
}
