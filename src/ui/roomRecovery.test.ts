import { describe, expect, it, vi } from 'vitest'
import { configureRoomReconnection, recoverRoomAfterRetries, ROOM_RECONNECT_MAX_RETRIES } from './roomRecovery'

describe('room reconnection recovery', () => {
  it('keeps automatic retries active long enough for a temporary server outage', () => {
    const room = { reconnection: { maxRetries: 15, minUptime: 5000 } }

    configureRoomReconnection(room)

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
