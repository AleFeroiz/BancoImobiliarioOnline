import { normalizePlayerName } from '../../shared/lobby'
import { normalizeRoomCode } from './roomInvite'

export const ROOM_RECONNECT_MAX_RETRIES = 6
const LAST_ROOM_KEY = 'bantec:last-room'

export type LastRoom = { roomCode: string; name: string; reconnectionToken: string }

export function readLastRoom(storage: Pick<Storage, 'getItem'> | null): LastRoom | null {
  try {
    const value = storage?.getItem(LAST_ROOM_KEY)
    if (!value) return null
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return null
    const candidate = parsed as Partial<LastRoom>
    const roomCode = normalizeRoomCode(candidate.roomCode ?? '')
    const name = normalizePlayerName(candidate.name)
    if (!roomCode || !name) return null
    return { roomCode, name, reconnectionToken: typeof candidate.reconnectionToken === 'string' ? candidate.reconnectionToken : '' }
  } catch {
    return null
  }
}

export function saveLastRoom(storage: Pick<Storage, 'setItem'> | null, room: LastRoom) {
  try { storage?.setItem(LAST_ROOM_KEY, JSON.stringify(room)) } catch { /* Storage may be unavailable. */ }
}

export function clearLastRoom(storage: Pick<Storage, 'removeItem'> | null) {
  try { storage?.removeItem(LAST_ROOM_KEY) } catch { /* Storage may be unavailable. */ }
}

export function configureRoomReconnection(room: { reconnection: { maxRetries: number; minUptime: number } }) {
  room.reconnection.maxRetries = ROOM_RECONNECT_MAX_RETRIES
  room.reconnection.minUptime = 0
}

export async function recoverRoomAfterRetries<T>(reconnectByToken: () => Promise<T>, rejoinByIdentity: () => Promise<T>) {
  try {
    return { room: await reconnectByToken(), method: 'token' as const }
  } catch {
    try {
      return { room: await rejoinByIdentity(), method: 'identity' as const }
    } catch {
      return { room: null, method: null }
    }
  }
}
