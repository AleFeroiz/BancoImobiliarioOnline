const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{5}$/

export function normalizeRoomCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const code = value.trim().toUpperCase()
  return ROOM_CODE_PATTERN.test(code) ? code : null
}

export function getRoomInviteCode(search: string): string | null {
  const params = new URLSearchParams(search)
  const value = params.get('room')
  return value === null ? null : normalizeRoomCode(value)
}

export function buildRoomInviteUrl(currentUrl: string, roomCode: string): string | null {
  const normalizedCode = normalizeRoomCode(roomCode)
  if (!normalizedCode) return null

  const url = new URL(currentUrl)
  url.searchParams.set('room', normalizedCode)
  url.hash = ''
  return url.toString()
}
