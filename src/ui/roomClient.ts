import { Client } from '@colyseus/sdk'

export function resolveRoomServerUrl(configuredUrl?: string) {
  return configuredUrl?.trim() || 'http://127.0.0.1:2567'
}

export const roomClient = new Client(resolveRoomServerUrl(import.meta.env.VITE_ROOM_SERVER_URL))
