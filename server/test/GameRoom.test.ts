import { ColyseusTestServer, boot } from '@colyseus/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import appConfig from '../src/app.config.js'
import type { LobbyState } from '../src/rooms/schema/LobbyState.js'
import { PropertyState } from '../src/rooms/schema/LobbyState.js'
import { boardSpaces } from '../../shared/board.js'
import { START_BONUS, STARTING_CASH, buildingSaleValue, constructionCost, mortgageRedemptionCost, mortgageValue } from '../../shared/game.js'
import { EXPRESS_OBJECTIVES, type ExpressObjectiveId, type ExpressObjectiveUpdate } from '../../shared/objectives.js'

async function waitFor(condition: () => boolean, timeout = 2500) {
  const start = Date.now()
  while (!condition()) {
    if (Date.now() - start >= timeout) throw new Error('Estado esperado não chegou antes do timeout.')
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

function setPrivateObjective(room: unknown, sessionId: string, id: ExpressObjectiveId) {
  const privateState = room as { privateObjectives: Map<string, { id: ExpressObjectiveId; progress: number; completed: boolean }> }
  privateState.privateObjectives.set(sessionId, { id, progress: 0, completed: false })
}

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
    expect(room.state.matchSeconds).toBe(30 * 60)
    expect(room.state.matchEnding).toBe(false)
    expect(room.state.expressRound).toBe(0)
    expect(room.state.phaseSeconds).toBe(0)
    expect(room.state.players.get(host.sessionId)?.cash).toBe(1_500_000)
    expect(room.state.players.get(guest.sessionId)?.cash).toBe(1_500_000)
  })

  it('sincroniza a reconexão e bloqueia o início enquanto alguém está offline', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Lia' })
    const guest = await colyseus.connectTo(room, { name: 'Nina' })

    guest.reconnection.delay = 300
    guest.reconnection.minDelay = 300
    guest.reconnection.maxDelay = 300
    guest.reconnection.minUptime = 0
    const dropped = new Promise<void>((resolve) => guest.onDrop(() => resolve()))
    const reconnected = new Promise<void>((resolve) => guest.onReconnect(() => resolve()))
    void guest.leave(false)

    await dropped
    await waitFor(() => room.state.players.get(guest.sessionId)?.isConnected === false)
    await waitFor(() => host.state.players.get(guest.sessionId)?.isConnected === false)
    const offlineStartMessage = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('start')
    await expect(offlineStartMessage).resolves.toMatchObject({ message: expect.stringContaining('Aguarde a reconexão') })
    expect(room.state.status).toBe('waiting')

    await reconnected
    await waitFor(() => room.state.players.get(guest.sessionId)?.isConnected === true)
    await waitFor(() => host.state.players.get(guest.sessionId)?.isConnected === true)
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started

    expect(room.state.status).toBe('playing')
    expect(room.state.players.has(guest.sessionId)).toBe(true)
  })

  it('abre a janela de negociação de 45 segundos e troca dinheiro e títulos entre as duas pessoas', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started
    expect(room.state.tradeSeconds).toBe(45)

    const hostTitle = new PropertyState()
    hostTitle.ownerSessionId = host.sessionId
    room.state.properties.set('1', hostTitle)
    const guestTitle = new PropertyState()
    guestTitle.ownerSessionId = guest.sessionId
    guestTitle.isMortgaged = true
    room.state.properties.set('3', guestTitle)
    const hostCash = room.state.players.get(host.sessionId)!.cash
    const guestCash = room.state.players.get(guest.sessionId)!.cash

    host.send('tradeOffer', { toSessionId: guest.sessionId, cashOffered: 25_000, cashRequested: 10_000, propertiesOffered: [1], propertiesRequested: [3] })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.tradeOfferId).toBeGreaterThan(0)
    guest.send('tradeAccept', { offerId: room.state.tradeOfferId })
    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(room.state.players.get(host.sessionId)!.cash).toBe(hostCash - 15_000)
    expect(room.state.players.get(guest.sessionId)!.cash).toBe(guestCash + 15_000)
    expect(room.state.properties.get('1')?.ownerSessionId).toBe(guest.sessionId)
    expect(room.state.properties.get('3')).toMatchObject({ ownerSessionId: host.sessionId, isMortgaged: true })
    expect(room.state.tradeOfferId).toBe(0)
  })

  it('abre janela express de 40 segundos e rejeita oferta após a janela expirar', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Eva' })
    const guest = await colyseus.connectTo(room, { name: 'Fábio' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started
    expect(room.state.tradeSeconds).toBe(40)

    room.state.tradeSeconds = 0
    const expiredMessage = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('tradeOffer', { toSessionId: guest.sessionId, cashOffered: 1_000, cashRequested: 0 })
    await expect(expiredMessage).resolves.toMatchObject({ message: expect.stringContaining('janela aberta') })
    expect(room.state.tradeOfferId).toBe(0)
  })

  it('permite uma oferta pendente por sala e revalida o saldo antes de aceitar', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Joana' })
    const guest = await colyseus.connectTo(room, { name: 'Kauã' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started
    host.send('tradeOffer', { toSessionId: guest.sessionId, cashOffered: 100_000, cashRequested: 0 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const offerId = room.state.tradeOfferId
    expect(offerId).toBeGreaterThan(0)

    const concurrentMessage = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('tradeOffer', { toSessionId: guest.sessionId, cashOffered: 1_000, cashRequested: 0 })
    await expect(concurrentMessage).resolves.toMatchObject({ message: expect.stringContaining('Já existe uma oferta') })
    expect(room.state.tradeOfferId).toBe(offerId)

    const cashBefore = room.state.players.get(guest.sessionId)!.cash
    room.state.players.get(host.sessionId)!.cash = 0
    const changedBalanceMessage = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('tradeAccept', { offerId })
    await expect(changedBalanceMessage).resolves.toMatchObject({ message: expect.stringContaining('não pode mais ser concluída') })
    expect(room.state.players.get(guest.sessionId)!.cash).toBe(cashBefore)
    expect(room.state.tradeOfferId).toBe(offerId)
  })

  it('rejeita negociação fora da vez, imóveis sem dono ou com construções e aceite por terceiro', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Gabi' })
    const guest = await colyseus.connectTo(room, { name: 'Hugo' })
    const third = await colyseus.connectTo(room, { name: 'Iris' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => third.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started

    const outOfTurn = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('tradeOffer', { toSessionId: host.sessionId, cashOffered: 0, cashRequested: 0 })
    await expect(outOfTurn).resolves.toMatchObject({ message: expect.stringContaining('pessoa da vez') })

    const builtTitle = new PropertyState()
    builtTitle.ownerSessionId = host.sessionId
    builtTitle.houses = 1
    room.state.properties.set('1', builtTitle)
    const builtTitleMessage = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('tradeOffer', { toSessionId: guest.sessionId, cashOffered: 0, cashRequested: 0, propertiesOffered: [1] })
    await expect(builtTitleMessage).resolves.toMatchObject({ message: expect.stringContaining('Venda as construções') })
    expect(room.state.tradeOfferId).toBe(0)

    builtTitle.houses = 0
    const siblingSpace = boardSpaces.find((space) => space.kind === 'property' && space.color === boardSpaces[1].color && space.id !== 1)!
    const siblingTitle = new PropertyState()
    siblingTitle.ownerSessionId = host.sessionId
    siblingTitle.houses = 1
    room.state.properties.set(String(siblingSpace.id), siblingTitle)
    const groupBuildingsMessage = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('tradeOffer', { toSessionId: guest.sessionId, cashOffered: 0, cashRequested: 0, propertiesOffered: [1] })
    await expect(groupBuildingsMessage).resolves.toMatchObject({ message: expect.stringContaining('Venda as construções') })
    expect(room.state.tradeOfferId).toBe(0)
    siblingTitle.houses = 0

    const unownedTitleMessage = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('tradeOffer', { toSessionId: guest.sessionId, cashOffered: 0, cashRequested: 0, propertiesRequested: [3] })
    await expect(unownedTitleMessage).resolves.toMatchObject({ message: expect.stringContaining('próprios') })

    host.send('tradeOffer', { toSessionId: guest.sessionId, cashOffered: 10_000, cashRequested: 0 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const unauthorized = new Promise<{ message: string }>((resolve) => third.onMessage('room:error', resolve))
    third.send('tradeAccept', { offerId: room.state.tradeOfferId })
    await expect(unauthorized).resolves.toMatchObject({ message: expect.stringContaining('não está mais disponível') })
    expect(room.state.tradeOfferId).toBeGreaterThan(0)
    host.send('tradeCancel', { offerId: room.state.tradeOfferId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.tradeOfferId).toBe(0)

    host.send('tradeOffer', { toSessionId: guest.sessionId, cashOffered: 20_000, cashRequested: 0 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const rejectionOfferId = room.state.tradeOfferId
    const hostCashBeforeRejection = room.state.players.get(host.sessionId)!.cash
    guest.send('tradeReject', { offerId: rejectionOfferId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.tradeOfferId).toBe(0)
    expect(room.state.players.get(host.sessionId)!.cash).toBe(hostCashBeforeRejection)
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
    const resolveSpace = (room as unknown as { resolveSpace: (sessionId: string, player: typeof player, drawEvent?: boolean) => void }).resolveSpace
    resolveSpace.call(room, host.sessionId, player)

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
    const landedPosition = room.state.players.get(host.sessionId)?.position
    expect(landedPosition).toBeGreaterThanOrEqual(0)
    expect(landedPosition).toBeLessThan(boardSpaces.length)
    if (!room.state.activeCardTitle) {
      expect(landedPosition).toBe(room.state.diceOne + room.state.diceTwo)
    }
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

  it('distribui objetivos Express privados sem repetição e fora do estado compartilhado', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const hostObjectives: ExpressObjectiveUpdate[] = []
    const guestObjectives: ExpressObjectiveUpdate[] = []
    host.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => hostObjectives.push(objective))
    guest.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => guestObjectives.push(objective))

    host.send('start')
    await waitFor(() => hostObjectives.length === 1 && guestObjectives.length === 1)

    expect(hostObjectives[0]).toMatchObject({ progress: 0, completed: false, rewardAwarded: 0 })
    expect(guestObjectives[0]).toMatchObject({ progress: 0, completed: false, rewardAwarded: 0 })
    expect(hostObjectives[0]?.id).not.toBe(guestObjectives[0]?.id)
    expect(hostObjectives).toHaveLength(1)
    expect(guestObjectives).toHaveLength(1)
    expect('objectives' in room.state).toBe(false)
    expect('privateObjectives' in room.state).toBe(false)
    expect('expressActivity' in room.state).toBe(false)
  })

  it('paga o bônus do objetivo uma única vez e envia o progresso apenas à pessoa dona da carta', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const hostObjectives: ExpressObjectiveUpdate[] = []
    const guestObjectives: ExpressObjectiveUpdate[] = []
    host.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => hostObjectives.push(objective))
    guest.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => guestObjectives.push(objective))

    host.send('start')
    await waitFor(() => hostObjectives.length === 1 && guestObjectives.length === 1)
    setPrivateObjective(room, host.sessionId, 'own-four-properties')
    const privateObjective = EXPRESS_OBJECTIVES.find((objective) => objective.id === 'own-four-properties')
    expect(privateObjective).toBeDefined()

    for (const space of boardSpaces.filter((candidate) => candidate.kind === 'property')) {
      const property = new PropertyState()
      property.ownerSessionId = host.sessionId
      property.houses = space.buildable ? 5 : 0
      room.state.properties.set(String(space.id), property)
    }

    const refreshObjective = (room as unknown as { refreshExpressObjective: (sessionId: string) => void }).refreshExpressObjective
    refreshObjective.call(room, host.sessionId)
    await waitFor(() => hostObjectives.length === 2)
    expect(hostObjectives[1]).toMatchObject({ completed: true, progress: privateObjective?.target, rewardAwarded: privateObjective?.reward })
    expect(room.state.players.get(host.sessionId)?.cash).toBe(STARTING_CASH + (privateObjective?.reward ?? 0))

    refreshObjective.call(room, host.sessionId)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(hostObjectives).toHaveLength(2)
    expect(guestObjectives).toHaveLength(1)
    expect(room.state.players.get(host.sessionId)?.cash).toBe(STARTING_CASH + (privateObjective?.reward ?? 0))
  })

  it('atualiza o objetivo privado depois de uma compra de propriedade', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    const hostObjectives: ExpressObjectiveUpdate[] = []
    host.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => hostObjectives.push(objective))
    host.send('start')
    await waitFor(() => hostObjectives.length === 1)

    const objectiveStates = (room as unknown as { privateObjectives: Map<string, { id: string; progress: number; completed: boolean }> }).privateObjectives
    objectiveStates.set(host.sessionId, { id: 'own-one-property', progress: 0, completed: false })
    const property = boardSpaces.find((space) => space.kind === 'property' && typeof space.price === 'number')!
    room.state.pendingPropertyId = property.id
    room.state.turnPhase = 'purchase'
    host.send('buy')
    await waitFor(() => hostObjectives.length === 2)

    expect(hostObjectives[1]).toMatchObject({ id: 'own-one-property', progress: 1, completed: true, rewardAwarded: 50_000 })
    expect(room.state.players.get(host.sessionId)?.cash).toBe(STARTING_CASH - (property.price ?? 0) + 50_000)
  })

  it('conclui em segredo o objetivo Express ao passar pela Partida', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const hostObjectives: ExpressObjectiveUpdate[] = []
    const guestObjectives: ExpressObjectiveUpdate[] = []
    host.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => hostObjectives.push(objective))
    guest.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => guestObjectives.push(objective))
    host.send('start')
    await waitFor(() => hostObjectives.length === 1 && guestObjectives.length === 1)
    setPrivateObjective(room, host.sessionId, 'pass-start')

    const player = room.state.players.get(host.sessionId)!
    player.position = boardSpaces.length - 1
    const movePlayer = (room as unknown as { movePlayer: (sessionId: string, player: typeof player, spaces: number) => void }).movePlayer
    movePlayer.call(room, host.sessionId, player, 2)
    await waitFor(() => hostObjectives.length === 2)

    expect(hostObjectives[1]).toMatchObject({ id: 'pass-start', progress: 1, completed: true, rewardAwarded: 75_000 })
    expect(guestObjectives).toHaveLength(1)
    expect(player.position).toBe(1)
    expect(player.cash).toBe(STARTING_CASH + START_BONUS + 75_000)
  })

  it('registra carta Sorte ou Revés comprada para o objetivo Express privado', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const hostObjectives: ExpressObjectiveUpdate[] = []
    const guestObjectives: ExpressObjectiveUpdate[] = []
    host.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => hostObjectives.push(objective))
    guest.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => guestObjectives.push(objective))
    host.send('start')
    await waitFor(() => hostObjectives.length === 1 && guestObjectives.length === 1)
    setPrivateObjective(room, host.sessionId, 'draw-event-card')

    const player = room.state.players.get(host.sessionId)!
    player.position = boardSpaces.find((space) => space.kind === 'event')!.id
    const resolveSpace = (room as unknown as { resolveSpace: (sessionId: string, player: typeof player, drawEvent?: boolean) => void }).resolveSpace
    resolveSpace.call(room, host.sessionId, player)
    await waitFor(() => hostObjectives.length === 2)

    expect(hostObjectives[1]).toMatchObject({ id: 'draw-event-card', progress: 1, completed: true, rewardAwarded: 75_000 })
    expect(guestObjectives).toHaveLength(1)
  })

  it('acompanha aluguel pago e recebido em atividade direta de Express', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const hostObjectives: ExpressObjectiveUpdate[] = []
    const guestObjectives: ExpressObjectiveUpdate[] = []
    host.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => hostObjectives.push(objective))
    guest.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => guestObjectives.push(objective))
    host.send('start')
    await waitFor(() => hostObjectives.length === 1 && guestObjectives.length === 1)
    setPrivateObjective(room, host.sessionId, 'pay-rent')
    setPrivateObjective(room, guest.sessionId, 'receive-rent')

    const debtor = room.state.players.get(host.sessionId)!
    const creditor = room.state.players.get(guest.sessionId)!
    const collectPayment = (room as unknown as { collectPayment: (debtorId: string, debtor: typeof debtor, amount: number, creditorId: string, reason: string) => void }).collectPayment
    collectPayment.call(room, host.sessionId, debtor, 100_000, guest.sessionId, 'Aluguel')
    await waitFor(() => hostObjectives.length === 2 && guestObjectives.length === 2)

    expect(hostObjectives[1]).toMatchObject({ id: 'pay-rent', progress: 1, completed: true, rewardAwarded: 75_000 })
    expect(guestObjectives[1]).toMatchObject({ id: 'receive-rent', progress: 1, completed: true, rewardAwarded: 100_000 })
    expect(debtor.cash).toBe(STARTING_CASH - 100_000 + 75_000)
    expect(creditor.cash).toBe(STARTING_CASH + 100_000 + 100_000)
  })

  it('só registra objetivos de aluguel após a liquidação integral de uma dívida', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const hostObjectives: ExpressObjectiveUpdate[] = []
    const guestObjectives: ExpressObjectiveUpdate[] = []
    host.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => hostObjectives.push(objective))
    guest.onMessage<ExpressObjectiveUpdate>('game:objective', (objective) => guestObjectives.push(objective))
    host.send('start')
    await waitFor(() => hostObjectives.length === 1 && guestObjectives.length === 1)
    setPrivateObjective(room, host.sessionId, 'pay-rent')
    setPrivateObjective(room, guest.sessionId, 'receive-rent')

    const debtor = room.state.players.get(host.sessionId)!
    const creditor = room.state.players.get(guest.sessionId)!
    debtor.cash = 100_000
    const collectPayment = (room as unknown as { collectPayment: (debtorId: string, debtor: typeof debtor, amount: number, creditorId: string, reason: string) => void }).collectPayment
    collectPayment.call(room, host.sessionId, debtor, 600_000, guest.sessionId, 'Aluguel')
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(room.state.turnPhase).toBe('debt')
    expect(hostObjectives).toHaveLength(1)
    expect(guestObjectives).toHaveLength(1)

    debtor.cash = 600_000
    host.send('payDebt')
    await waitFor(() => hostObjectives.length === 2 && guestObjectives.length === 2)
    expect(hostObjectives[1]).toMatchObject({ completed: true, rewardAwarded: 75_000 })
    expect(guestObjectives[1]).toMatchObject({ completed: true, rewardAwarded: 100_000 })
    expect(creditor.cash).toBe(STARTING_CASH + 600_000 + 100_000)
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

  it('mantém o relógio Clássico durante a dívida e encerra ao liquidar a cobrança pelo patrimônio de cada pessoa', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    room.state.players.get(host.sessionId)!.cash = 1_500_000
    const title = new PropertyState()
    title.ownerSessionId = host.sessionId
    room.state.properties.set('1', title)
    room.state.turnPhase = 'debt'
    room.state.debtAmount = 50_000
    room.state.debtReason = 'taxa'
    room.state.matchSeconds = 1
    await waitFor(() => room.state.matchEnding)
    expect(room.state.status).toBe('playing')
    expect(room.state.turnPhase).toBe('debt')

    host.send('payDebt')
    await waitFor(() => room.state.status === 'ended')
    expect(room.state.winnerSessionId).toBe(host.sessionId)
    expect(room.state.players.get(host.sessionId)).toMatchObject({ finalCash: 1_450_000, finalNetWorth: 1_510_000 })
    expect(room.state.players.get(host.sessionId)?.tieBreakRoll).toBe(0)
  })

  it('conta seis rodadas Express com 40 segundos por jogador e usa saldo antes do patrimônio', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.expressRound).toBe(1)
    expect(room.state.phaseSeconds).toBe(40)

    room.state.phaseSeconds = 1
    await waitFor(() => room.state.activePlayerSessionId === guest.sessionId)
    expect(room.state.expressRound).toBe(1)
    expect(room.state.phaseSeconds).toBe(40)

    room.state.players.get(host.sessionId)!.cash = 1_250_000
    room.state.players.get(guest.sessionId)!.cash = 1_300_000
    const hostTitle = new PropertyState()
    hostTitle.ownerSessionId = host.sessionId
    room.state.properties.set('27', hostTitle)
    room.state.expressRound = 6
    room.state.phaseSeconds = 1
    room.state.turnPhase = 'roll'
    await waitFor(() => room.state.status === 'ended')

    expect(room.state.expressRound).toBe(6)
    expect(room.state.winnerSessionId).toBe(guest.sessionId)
    expect(room.state.players.get(host.sessionId)?.finalNetWorth).toBeGreaterThan(room.state.players.get(guest.sessionId)!.finalNetWorth)
    expect(room.state.players.get(guest.sessionId)?.finalCash).toBe(1_300_000)
  })

  it('desempata saldo Express igual pelo patrimônio antes de rolar dados', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    room.state.players.get(host.sessionId)!.cash = 1_200_000
    room.state.players.get(guest.sessionId)!.cash = 1_200_000
    const title = new PropertyState()
    title.ownerSessionId = host.sessionId
    room.state.properties.set('3', title)
    room.state.expressRound = 6
    room.state.activePlayerSessionId = guest.sessionId
    room.state.phaseSeconds = 1
    room.state.turnPhase = 'roll'
    await waitFor(() => room.state.status === 'ended')

    expect(room.state.winnerSessionId).toBe(host.sessionId)
    expect(room.state.players.get(host.sessionId)?.finalNetWorth).toBe(1_200_000 + (boardSpaces[3]?.price ?? 0))
    expect(room.state.players.get(host.sessionId)?.tieBreakRoll).toBe(0)
    expect(room.state.landingDescription).toContain('patrimônio')
  })

  it('desempata patrimônio Clássico igual com uma rolagem de dois dados', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))
    room.state.matchSeconds = 1
    room.state.turnPhase = 'resolve'
    await waitFor(() => room.state.status === 'ended')

    expect([host.sessionId, guest.sessionId]).toContain(room.state.winnerSessionId)
    expect(room.state.players.get(host.sessionId)?.finalNetWorth).toBe(room.state.players.get(guest.sessionId)?.finalNetWorth)
    expect(room.state.players.get(host.sessionId)?.tieBreakRoll).toBeGreaterThanOrEqual(2)
    expect(room.state.players.get(host.sessionId)?.tieBreakRoll).toBeLessThanOrEqual(12)
    expect(room.state.landingDescription).toContain('Desempate nos dados')
  })

  it('avança para o próximo jogador não falido e mantém a ordem após falência', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    await colyseus.connectTo(room, { name: 'Caio' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    const player = room.state.players.get(host.sessionId)!
    player.cash = 0
    room.state.turnPhase = 'debt'
    room.state.debtAmount = 50_000
    host.send('declareBankruptcy')
    await waitFor(() => room.state.activePlayerSessionId === guest.sessionId)

    expect(player.isBankrupt).toBe(true)
    expect(room.state.status).toBe('playing')
    expect(room.state.turnNumber).toBe(2)
  })
})
