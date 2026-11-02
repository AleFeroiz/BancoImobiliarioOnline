export const ROOM_RECONNECT_MAX_RETRIES = 60

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
