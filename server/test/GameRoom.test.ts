import { ColyseusTestServer, boot } from '@colyseus/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import appConfig from '../src/app.config.js'
import type { LobbyState } from '../src/rooms/schema/LobbyState.js'
import { PropertyState } from '../src/rooms/schema/LobbyState.js'
import { boardSpaces } from '../../shared/board.js'
import { buildingSaleValue, constructionCost, mortgageRedemptionCost, mortgageValue } from '../../shared/game.js'

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
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started

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

  it('valida construções no servidor, cobra o custo e distribui casas igualmente', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    const first = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.color === first.color)
    for (const space of group) {
      const property = new PropertyState()
      property.ownerSessionId = host.sessionId
      room.state.properties.set(String(space.id), property)
    }
    room.state.turnPhase = 'resolve'
    room.state.activePlayerSessionId = host.sessionId
    const cost = Math.floor((first.price ?? 0) * 0.5)
    const cashBefore = room.state.players.get(host.sessionId)!.cash

    host.send('build', { propertyId: first.id })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.properties.get(String(first.id))?.houses).toBe(1)
    expect(room.state.players.get(host.sessionId)!.cash).toBe(cashBefore - cost)

    const unbalancedError = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('build', { propertyId: first.id })
    await expect(unbalancedError).resolves.toMatchObject({ message: expect.stringContaining('distribuição equilibrada') })
    expect(room.state.properties.get(String(first.id))?.houses).toBe(1)

    room.state.properties.get(String(first.id))!.houses = 0
    room.state.properties.get(String(group[1].id))!.isMortgaged = true
    const mortgagedGroupError = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('build', { propertyId: first.id })
    await expect(mortgagedGroupError).resolves.toMatchObject({ message: expect.stringContaining('complete o grupo') })
    expect(room.state.properties.get(String(first.id))?.houses).toBe(0)

    room.state.properties.get(String(group[1].id))!.isMortgaged = false
    room.state.properties.get(String(first.id))!.houses = 1
    const cashBeforeSale = room.state.players.get(host.sessionId)!.cash
    host.send('sellBuilding', { propertyId: first.id })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.properties.get(String(first.id))?.houses).toBe(0)
    expect(room.state.players.get(host.sessionId)!.cash).toBe(cashBeforeSale + buildingSaleValue(first.id))
    expect(buildingSaleValue(first.id)).toBe(Math.floor(constructionCost(first.id) / 2))
  })

  it('autoriza hipotecar e resgatar um título somente pelo dono na sua vez', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started

    const propertyId = 15
    const property = new PropertyState()
    property.ownerSessionId = host.sessionId
    room.state.properties.set(String(propertyId), property)
    room.state.turnPhase = 'resolve'
    room.state.activePlayerSessionId = host.sessionId
    const hostPlayer = room.state.players.get(host.sessionId)!
    hostPlayer.cash = 100_000

    guest.send('mortgage', { propertyId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property.isMortgaged).toBe(false)

    room.state.activePlayerSessionId = guest.sessionId
    const notOwnedMortgage = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('mortgage', { propertyId })
    await expect(notOwnedMortgage).resolves.toMatchObject({ message: expect.stringContaining('não pode ser hipotecada') })
    expect(property.isMortgaged).toBe(false)

    room.state.activePlayerSessionId = host.sessionId
    host.send('mortgage', { propertyId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property.isMortgaged).toBe(true)
    expect(hostPlayer.cash).toBe(100_000 + mortgageValue(propertyId))

    room.state.activePlayerSessionId = guest.sessionId
    const unauthorizedRedemption = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('redeemMortgage', { propertyId })
    await expect(unauthorizedRedemption).resolves.toMatchObject({ message: expect.stringContaining('ser dono') })
    expect(property.isMortgaged).toBe(true)

    room.state.activePlayerSessionId = host.sessionId
    host.send('redeemMortgage', { propertyId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property.isMortgaged).toBe(false)
    expect(hostPlayer.cash).toBe(100_000 + mortgageValue(propertyId) - mortgageRedemptionCost(propertyId))
  })

  it('abre dívida sem cobrar parcialmente e permite liquidar a hipoteca para pagar o valor integral', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    const player = room.state.players.get(host.sessionId)!
    player.position = 4
    player.cash = 20_000
    const resolveSpace = (room as unknown as { resolveSpace: (player: object) => void }).resolveSpace
    resolveSpace.call(room, player)

    expect(room.state.turnPhase).toBe('debt')
    expect(room.state.debtAmount).toBe(50_000)
    expect(room.state.debtCreditorSessionId).toBe('')
    expect(player.cash).toBe(20_000)

    const propertyId = 15
    const property = new PropertyState()
    property.ownerSessionId = host.sessionId
    room.state.properties.set(String(propertyId), property)
    host.send('mortgage', { propertyId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property.isMortgaged).toBe(true)
    expect(player.cash).toBe(20_000 + mortgageValue(propertyId))

    host.send('payDebt')
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.debtAmount).toBe(0)
    expect(room.state.turnPhase).toBe('resolve')
    expect(player.cash).toBe(20_000 + mortgageValue(propertyId) - 50_000)
  })

  it('transfere saldo e títulos hipotecados ao credor e encerra quando resta uma pessoa solvente', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    const debtor = room.state.players.get(host.sessionId)!
    const creditor = room.state.players.get(guest.sessionId)!
    debtor.cash = 45_000
    const property = new PropertyState()
    property.ownerSessionId = host.sessionId
    property.isMortgaged = true
    room.state.properties.set('15', property)
    room.state.turnPhase = 'debt'
    room.state.debtAmount = 80_000
    room.state.debtCreditorSessionId = guest.sessionId
    room.state.debtReason = 'Aluguel'

    host.send('declareBankruptcy')
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(debtor.isBankrupt).toBe(true)
    expect(debtor.cash).toBe(0)
    expect(creditor.cash).toBe(1_545_000)
    expect(property.ownerSessionId).toBe(guest.sessionId)
    expect(property.isMortgaged).toBe(true)
    expect(room.state.status).toBe('ended')
    expect(room.state.winnerSessionId).toBe(guest.sessionId)
  })

  it('impede falência enquanto há bens liquidáveis e devolve títulos ao banco após liquidá-los', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    const debtor = room.state.players.get(host.sessionId)!
    const creditor = room.state.players.get(guest.sessionId)!
    debtor.cash = 0
    const property = new PropertyState()
    property.ownerSessionId = host.sessionId
    room.state.properties.set('15', property)
    room.state.turnPhase = 'debt'
    room.state.debtAmount = 200_000
    room.state.debtCreditorSessionId = ''

    const prematureBankruptcy = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('declareBankruptcy')
    await expect(prematureBankruptcy).resolves.toMatchObject({ message: expect.stringContaining('liquide todos os bens') })
    expect(debtor.isBankrupt).toBe(false)

    host.send('mortgage', { propertyId: 15 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property.isMortgaged).toBe(true)
    expect(debtor.cash).toBeLessThan(room.state.debtAmount)
    host.send('declareBankruptcy')
    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(debtor.isBankrupt).toBe(true)
    expect(creditor.cash).toBe(1_500_000)
    expect(property).toMatchObject({ ownerSessionId: '', houses: 0, isMortgaged: false })
    expect(room.state.status).toBe('ended')
  })

  it('libera a pessoa presa após cobrar a fiança e permite rolar no mesmo turno', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    const player = room.state.players.get(host.sessionId)!
    player.isJailed = true
    player.cash = 80_000
    room.state.turnPhase = 'jail'
    host.send('jailPay')
    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(player.isJailed).toBe(false)
    expect(player.cash).toBe(30_000)
    expect(room.state.turnPhase).toBe('roll')
    host.send('roll')
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(['resolve', 'purchase', 'debt']).toContain(room.state.turnPhase)
    expect(room.state.diceOne).toBeGreaterThanOrEqual(1)
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
