import { ColyseusTestServer, boot } from '@colyseus/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import appConfig from '../src/app.config.js'
import type { LobbyState } from '../src/rooms/schema/LobbyState.js'

describe('sala privada', () => {
  let colyseus: ColyseusTestServer<typeof appConfig>

  beforeAll(async () => {
    colyseus = await boot(appConfig)
  })

  afterAll(async () => {
    if (colyseus) await colyseus.shutdown()
  })

  beforeEach(async () => {
    await colyseus.cleanup()
  })

  it('cria código, escolhe anfitrião e sincroniza modo e participantes', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })

    expect(room.roomId).toMatch(/^[A-HJ-NP-Z2-9]{5}$/)
    expect(room.state.roomCode).toBe(room.roomId)
    expect(room.state.mode).toBe('express')
    expect(room.state.players.get(host.sessionId)).toMatchObject({ name: 'Ana', isHost: true })
    expect(room.state.players.get(guest.sessionId)).toMatchObject({ name: 'Bia', isHost: false })
  })

  it('cria e entra na sala pelos mesmos métodos do cliente web', async () => {
    const host = await colyseus.sdk.create('game_room', { mode: 'express', name: 'Eva' })
    const guest = await colyseus.sdk.joinById(host.roomId, { name: 'Fábio' })
    await Promise.all([host.waitForInitialState(), guest.waitForInitialState()])

    expect(host.roomId).toMatch(/^[A-HJ-NP-Z2-9]{5}$/)
    expect(guest.roomId).toBe(host.roomId)
    expect(host.state.mode).toBe('express')
    expect(host.state.players.size).toBe(2)
  })

  it('só permite ao anfitrião iniciar com pelo menos duas pessoas', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Caio' })
    const onePlayerMessage = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))

    host.send('start')
    await onePlayerMessage
    expect(room.state.status).toBe('waiting')

    const guest = await colyseus.connectTo(room, { name: 'Duda' })
    const unauthorizedMessage = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('start')
    await expect(unauthorizedMessage).resolves.toMatchObject({
      message: 'Somente a pessoa anfitriã pode iniciar a partida.',
    })
    expect(room.state.status).toBe('waiting')

    const hostStarted = new Promise<{ mode: string }>((resolve) => host.onMessage('game:started', resolve))
    const guestStarted = new Promise<{ mode: string }>((resolve) => guest.onMessage('game:started', resolve))
    host.send('start')
    await expect(hostStarted).resolves.toEqual({ mode: 'classic' })
    await guestStarted
    expect(room.state.status).toBe('playing')
    expect(room.state.activePlayerSessionId).toBe(host.sessionId)
    expect(room.state.turnNumber).toBe(1)
    expect(room.state.players.get(host.sessionId)?.cash).toBe(1_500_000)
    expect(room.state.players.get(guest.sessionId)?.cash).toBe(1_500_000)
  })

  it('compra uma propriedade livre ou abre leilão público quando a compra é recusada', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    const clients = new Map([[host.sessionId, host], [guest.sessionId, guest]])
    let buyerId = ''
    let propertyId = -1
    for (let turn = 0; turn < 40 && propertyId < 0; turn += 1) {
      const active = clients.get(room.state.activePlayerSessionId)
      if (!active) throw new Error('Jogador da vez ausente')
      if (room.state.turnPhase === 'roll') active.send('roll')
      await new Promise((resolve) => setTimeout(resolve, 30))
      if (room.state.turnPhase === 'purchase') {
        buyerId = active.sessionId
        propertyId = room.state.pendingPropertyId
        break
      }
      if (room.state.turnPhase === 'resolve') {
        active.send('finishTurn')
        await new Promise((resolve) => setTimeout(resolve, 30))
      }
    }
    expect(propertyId).toBeGreaterThanOrEqual(0)

    const buyer = clients.get(buyerId)!
    buyer.send('declinePurchase')
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.turnPhase).toBe('auction')
    expect(room.state.auctionSeconds).toBe(20)

    const other = clients.get(buyerId === host.sessionId ? guest.sessionId : host.sessionId)!
    const otherCashBeforeBid = room.state.players.get(other.sessionId)!.cash
    other.send('bid', { amount: 10_000 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.auctionHighestBid).toBe(10_000)
    buyer.send('auctionPass')
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.turnPhase).toBe('resolve')
    expect(room.state.properties.get(String(propertyId))?.ownerSessionId).toBe(other.sessionId)
    expect(room.state.players.get(other.sessionId)!.cash).toBe(otherCashBeforeBid - 10_000)
  })

  it('autoriza apenas a pessoa da vez a rolar e só avança após concluir a casa', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 50))

    const unauthorizedRoll = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('roll')
    await expect(unauthorizedRoll).resolves.toMatchObject({ message: 'Aguarde a sua vez para lançar os dados.' })
    expect(room.state.turnPhase).toBe('roll')

    host.send('roll')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(['resolve', 'purchase']).toContain(room.state.turnPhase)
    expect(room.state.diceOne).toBeGreaterThanOrEqual(1)
    expect(room.state.diceOne).toBeLessThanOrEqual(6)
    expect(room.state.diceTwo).toBeGreaterThanOrEqual(1)
    expect(room.state.diceTwo).toBeLessThanOrEqual(6)
    expect(room.state.players.get(host.sessionId)?.position).toBe(room.state.diceOne + room.state.diceTwo)
    expect(room.state.landingDescription.length).toBeGreaterThan(0)

    if (room.state.turnPhase === 'purchase') {
      host.send('buy')
      await new Promise((resolve) => setTimeout(resolve, 30))
    }
    expect(room.state.turnPhase).toBe('resolve')

    const unauthorizedFinish = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('finishTurn')
    await expect(unauthorizedFinish).resolves.toMatchObject({ message: 'Somente a pessoa da vez pode concluir a jogada.' })
    expect(room.state.activePlayerSessionId).toBe(host.sessionId)

    host.send('finishTurn')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(room.state.activePlayerSessionId).toBe(guest.sessionId)
    expect(room.state.turnNumber).toBe(2)
    expect(room.state.turnPhase).toBe('roll')
    expect(room.state.landingDescription).toBe('')
  })

  it('recusa nomes inválidos antes de ocupar um assento', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })

    await expect(colyseus.connectTo(room, { name: '   ' })).rejects.toThrow()
    expect(room.state.players.size).toBe(0)
  })

  it('limita a sala a quatro jogadores', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    await colyseus.connectTo(room, { name: 'Caio' })
    await colyseus.connectTo(room, { name: 'Duda' })

    await expect(colyseus.connectTo(room, { name: 'Extra' })).rejects.toThrow()
    expect(room.state.players.size).toBe(4)
  })
})
