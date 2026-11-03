import { describe, expect, it, vi } from 'vitest'
import { clearLastRoom, configureRoomReconnection, readLastRoom, recoverRoomAfterRetries, ROOM_RECONNECT_MAX_RETRIES, saveLastRoom } from './roomRecovery'

describe('room reconnection recovery', () => {
  it('stores and restores the last room identity and token for a new visit', () => {
    const values = new Map<string, string>()
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) }, removeItem: (key: string) => { values.delete(key) } }
    const lastRoom = { roomCode: 'ABCDE', name: 'Lia', reconnectionToken: 'secret-token' }
    saveLastRoom(storage, lastRoom)
    expect(readLastRoom(storage)).toEqual(lastRoom)
    clearLastRoom(storage)
    expect(readLastRoom(storage)).toBeNull()
  })

  it('ignores malformed saved rooms and unavailable storage', () => {
    expect(readLastRoom({ getItem: () => '{broken' })).toBeNull()
    expect(readLastRoom({ getItem: () => JSON.stringify({ roomCode: 'bad', name: 'Lia' }) })).toBeNull()
    expect(readLastRoom(null)).toBeNull()
    expect(() => saveLastRoom({ setItem: () => { throw new Error('blocked') } }, { roomCode: 'ABCDE', name: 'Lia', reconnectionToken: '' })).not.toThrow()
  })
  it('limita as tentativas automáticas para liberar a recuperação por identidade', () => {
    const room = { reconnection: { maxRetries: 15, minUptime: 5000 } }

    configureRoomReconnection(room)

    expect(ROOM_RECONNECT_MAX_RETRIES).toBe(6)
    expect(room.reconnection).toMatchObject({ maxRetries: ROOM_RECONNECT_MAX_RETRIES, minUptime: 0 })
  })

  it('tries the session token before rejoining with the player identity', async () => {
    const recoveredRoom = { id: 'room' }
    const reconnectByToken = vi.fn().mockRejectedValue(new Error('expired token'))
    const rejoinByIdentity = vi.fn().mockResolvedValue(recoveredRoom)

    await expect(recoverRoomAfterRetries(reconnectByToken, rejoinByIdentity)).resolves.toEqual({ room: recoveredRoom, method: 'identity' })
    expect(reconnectByToken).toHaveBeenCalledOnce()
    expect(rejoinByIdentity).toHaveBeenCalledOnce()
  })

  it('does not try identity rejoin when token recovery succeeds', async () => {
    const recoveredRoom = { id: 'room' }
    const rejoinByIdentity = vi.fn()

    await expect(recoverRoomAfterRetries(async () => recoveredRoom, rejoinByIdentity)).resolves.toEqual({ room: recoveredRoom, method: 'token' })
    expect(rejoinByIdentity).not.toHaveBeenCalled()
  })

  it('reports when neither recovery path succeeds', async () => {
    await expect(recoverRoomAfterRetries(async () => { throw new Error('token failed') }, async () => { throw new Error('identity failed') }))
      .resolves.toEqual({ room: null, method: null })
  })
})
