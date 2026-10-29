import { ColyseusTestServer, boot } from '@colyseus/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createServer } from 'node:net'
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

async function getAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const probe = createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      if (!address || typeof address === 'string') {
        probe.close()
        reject(new Error('Não foi possível escolher uma porta local para os testes.'))
        return
      }
      probe.close((error) => error ? reject(error) : resolve(address.port))
    })
  })
}

function setPrivateObjective(room: unknown, sessionId: string, id: ExpressObjectiveId) {
  const privateState = room as { privateObjectives: Map<string, { id: ExpressObjectiveId; progress: number; completed: boolean }> }
  privateState.privateObjectives.set(sessionId, { id, progress: 0, completed: false })
}

describe('sala privada', () => {
  let colyseus: ColyseusTestServer<typeof appConfig>

  beforeAll(async () => {
    colyseus = await boot(appConfig, await getAvailablePort())
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

  it('permite quatro participantes e rejeita a quinta conexão', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })

    for (const name of ['Ana', 'Bia', 'Caio', 'Duda']) {
      await colyseus.connectTo(room, { name })
    }

    expect(room.state.players.size).toBe(4)
    await expect(colyseus.connectTo(room, { name: 'Eva' })).rejects.toThrow()
    expect(room.state.players.size).toBe(4)
    expect(Array.from(room.state.players.values()).map((player) => player.name)).toEqual(['Ana', 'Bia', 'Caio', 'Duda'])
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

  it('sincroniza a velocidade das animações e aceita a alteração apenas da anfitriã', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Caio' })
    const guest = await colyseus.connectTo(room, { name: 'Duda' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started

    expect(room.state.animationSpeed).toBe(0.5)
    expect(room.state.presentationSpeed).toBe(0.5)
    const unauthorized = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('setAnimationSpeed', { speed: 2 })
    await expect(unauthorized).resolves.toMatchObject({ message: 'Só a pessoa anfitriã pode alterar a velocidade das animações.' })
    expect(room.state.animationSpeed).toBe(0.5)

    host.send('setAnimationSpeed', { speed: 2 })
    await waitFor(() => room.state.animationSpeed === 2)
    expect(room.state.presentationSpeed).toBe(0.5)
    host.send('roll')
    await waitFor(() => room.state.turnPhase === 'rolling')
    expect(room.state.presentationSpeed).toBe(2)
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
    expect(room.state.players.get(guest.sessionId)?.reconnectionExpired).toBe(false)
    const offlineStartMessage = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('start')
    await expect(offlineStartMessage).resolves.toMatchObject({ message: expect.stringContaining('Aguarde a reconexão') })
    expect(room.state.status).toBe('waiting')

    await reconnected
    await waitFor(() => room.state.players.get(guest.sessionId)?.isConnected === true)
    await waitFor(() => host.state.players.get(guest.sessionId)?.isConnected === true)
    expect(room.state.players.get(guest.sessionId)?.reconnectionExpired).toBe(false)
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started

    expect(room.state.status).toBe('playing')
    expect(room.state.players.has(guest.sessionId)).toBe(true)
  })

  it('assume imediatamente a vez de uma pessoa desconectada e preserva seus imóveis', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Lia' })
    const guest = await colyseus.connectTo(room, { name: 'Nina' })
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started

    const ownedProperty = new PropertyState()
    ownedProperty.ownerSessionId = host.sessionId
    room.state.properties.set('1', ownedProperty)
    host.reconnection.enabled = false
    const serverRoom = room as unknown as { allowReconnection: (...args: unknown[]) => Promise<never> }
    serverRoom.allowReconnection = () => Promise.reject(new Error('Simulated expired reconnection window.'))
    void host.leave(false)
    await waitFor(() => room.state.players.get(host.sessionId)?.isBotControlled === true)

    expect(room.state.status).toBe('playing')
    expect(room.state.players.get(host.sessionId)).toMatchObject({ name: 'Lia', isConnected: false, isBotControlled: true, isHost: true })
    expect(room.state.properties.get('1')?.ownerSessionId).toBe(host.sessionId)
    expect(room.state.activePlayerSessionId).toBe(host.sessionId)
    expect(room.state.turnNumber).toBe(1)
    const serverGame = room as unknown as { processBotStep: () => void; schedulePresentation: (_delayMs: number, action: () => void) => void }
    serverGame.schedulePresentation = (_delayMs, action) => action()
    serverGame.processBotStep()
    expect(room.state.turnPhase).not.toBe('roll')
    room.onReconnect({ sessionId: host.sessionId } as never)
    expect(room.state.players.get(host.sessionId)).toMatchObject({ isConnected: true, isBotControlled: false, reconnectionExpired: false })
    await waitFor(() => room.state.matchSeconds < 30 * 60, 1500)
  })

  it('resolve a dívida da pessoa desconectada e devolve o controle na reconexão', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Lia' })
    await colyseus.connectTo(room, { name: 'Nina' })
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started
    const player = room.state.players.get(host.sessionId)!
    player.cash = 300_000
    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'debt'
    room.state.debtAmount = 75_000
    room.state.debtReason = 'Aluguel'
    player.isConnected = false
    room.onLeave({ sessionId: host.sessionId } as never)

    const serverGame = room as unknown as { processBotStep: () => void }
    serverGame.processBotStep()

    expect(player.cash).toBe(225_000)
    expect(room.state.turnPhase).toBe('resolve')
    expect(room.state.debtAmount).toBe(0)
    room.onReconnect({ sessionId: host.sessionId } as never)
    expect(player.isBotControlled).toBe(false)
  })

  it('mantém a vez de quem está sendo controlado pelo bot em turnos futuros', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Lia' })
    const guest = await colyseus.connectTo(room, { name: 'Nina' })
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started

    room.state.players.get(guest.sessionId)!.isConnected = false
    room.onLeave({ sessionId: guest.sessionId } as never)
    room.state.turnPhase = 'resolve'
    host.send('finishTurn')
    await waitFor(() => room.state.activePlayerSessionId === guest.sessionId)

    expect(room.state.status).toBe('playing')
    expect(room.state.players.has(guest.sessionId)).toBe(true)
    expect(room.state.players.get(guest.sessionId)?.isBotControlled).toBe(true)
    expect(room.state.activePlayerSessionId).toBe(guest.sessionId)
    expect(room.state.turnNumber).toBe(2)
    const serverGame = room as unknown as { processBotStep: () => void }
    serverGame.processBotStep()
    expect(room.state.turnPhase).not.toBe('roll')
    expect(room.state.expressRound).toBe(1)
    expect(room.state.phaseSeconds).toBe(40)
  })

  it('deixa o bot decidir uma compra pendente de quem perdeu a conexão', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Lia' })
    const guest = await colyseus.connectTo(room, { name: 'Nina' })
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started
    room.state.turnPhase = 'purchase'
    room.state.pendingPropertyId = 1
    room.state.players.get(host.sessionId)!.cash = 0
    room.state.players.get(host.sessionId)!.isConnected = false
    room.onLeave({ sessionId: host.sessionId } as never)
    const serverGame = room as unknown as { processBotStep: () => void }
    serverGame.processBotStep()

    expect(room.state.status).toBe('playing')
    expect(room.state.pendingPropertyId).toBe(255)
    expect(room.state.properties.has('1')).toBe(false)
    expect(room.state.activePlayerSessionId).toBe(host.sessionId)
    expect(room.state.turnPhase).toBe('resolve')
    expect(room.state.landingDescription).toContain('escolheu não comprar')
  })

  it('permite ao anfitrião preencher lugares com bots e removê-los antes da partida', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Lia' })
    host.send('addBot')
    await waitFor(() => room.state.players.size === 2)
    const bot = [...room.state.players.entries()].find(([, player]) => player.isBot)
    expect(bot?.[1]).toMatchObject({ name: 'Bot 1', isBot: true, isBotControlled: true, isConnected: true })
    host.send('removeBot', { sessionId: bot?.[0] })
    await waitFor(() => room.state.players.size === 1)
    host.send('addBot')
    await waitFor(() => room.state.players.size === 2)
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started
    expect(room.state.status).toBe('playing')
  })

  it('serializa as ações quando há vários bots e impede nova jogada durante animação', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const host = await colyseus.connectTo(room, { name: 'Pessoa' })
    host.send('addBot')
    await waitFor(() => room.state.players.size === 2)
    host.send('addBot')
    await waitFor(() => room.state.players.size === 3)
    host.send('addBot')
    await waitFor(() => room.state.players.size === 4)
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started

    const serverGame = room as unknown as { processBotStep: () => void }
    const activePlayer = room.state.players.get(host.sessionId)!
    activePlayer.isBotControlled = true
    const otherBots = [...room.state.players.entries()].filter(([sessionId, player]) => sessionId !== host.sessionId && player.isBot)
    const initialDiceSequence = room.state.diceSequence

    serverGame.processBotStep()
    expect(room.state.turnPhase).toBe('rolling')
    expect(room.state.diceSequence).toBe(initialDiceSequence + 1)
    for (let attempt = 0; attempt < 8; attempt += 1) serverGame.processBotStep()
    expect(room.state.diceSequence).toBe(initialDiceSequence + 1)
    expect(otherBots.every(([sessionId]) => room.state.players.get(sessionId)?.position === 0)).toBe(true)

    await waitFor(() => room.state.turnPhase === 'moving', 4000)
    const destination = activePlayer.position
    expect(destination).not.toBe(0)
    for (let attempt = 0; attempt < 8; attempt += 1) serverGame.processBotStep()
    expect(room.state.turnPhase).toBe('moving')
    expect(room.state.diceSequence).toBe(initialDiceSequence + 1)
    expect(activePlayer.position).toBe(destination)
    expect(otherBots.every(([sessionId]) => room.state.players.get(sessionId)?.position === 0)).toBe(true)
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

  it('permite recusar uma propriedade sem dono e deixa o imóvel livre para a próxima vez', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started

    const buyer = room.state.activePlayerSessionId === host.sessionId ? host : guest
    const buyerId = buyer.sessionId
    const propertyId = boardSpaces.find((space) => space.kind === 'property')!.id
    room.state.turnPhase = 'purchase'
    room.state.pendingPropertyId = propertyId
    buyer.send('declinePurchase')
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.turnPhase).toBe('resolve')
    expect(room.state.properties.get(String(propertyId))?.ownerSessionId ?? '').toBe('')
    expect(room.state.pendingPropertyId).toBe(255)
    expect(room.state.activePlayerSessionId).toBe(buyerId)

    buyer.send('finishTurn')
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.activePlayerSessionId).not.toBe(buyerId)
    expect(room.state.properties.get(String(propertyId))?.ownerSessionId ?? '').toBe('')
  })

  it('restringe o início do leilão ao turno do dono, reserva lances e transfere o título ao maior lance', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const seller = await colyseus.connectTo(room, { name: 'Bia' })
    const bidder = await colyseus.connectTo(room, { name: 'Caio' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => seller.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => bidder.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started

    const title = new PropertyState()
    title.ownerSessionId = seller.sessionId
    title.isMortgaged = true
    room.state.properties.set('1', title)
    room.state.activePlayerSessionId = seller.sessionId
    room.state.turnPhase = 'resolve'
    const wrongTurnError = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('auctionStart', { propertyId: 1, startingBid: 120_000 })
    await expect(wrongTurnError).resolves.toMatchObject({ message: expect.stringContaining('durante seu turno') })
    expect(room.state.auctionId).toBe(0)
    seller.send('auctionStart', { propertyId: 1, startingBid: 120_000 })
    await waitFor(() => room.state.auctionId > 0)
    expect(room.state.activePlayerSessionId).toBe(seller.sessionId)
    expect(room.state.auctionStartingBid).toBe(120_000)

    const sellerBidError = new Promise<{ message: string }>((resolve) => seller.onMessage('room:error', resolve))
    seller.send('auctionBid', { auctionId: room.state.auctionId, amount: 120_000 })
    await expect(sellerBidError).resolves.toMatchObject({ message: expect.stringContaining('não está disponível') })

    const hostCash = room.state.players.get(host.sessionId)!.cash
    host.send('auctionBid', { auctionId: room.state.auctionId, amount: 120_000 })
    await waitFor(() => room.state.auctionHighestBidderSessionId === host.sessionId)
    expect(room.state.players.get(host.sessionId)!.cash).toBe(hostCash - 120_000)
    bidder.send('auctionBid', { auctionId: room.state.auctionId, amount: 130_000 })
    await waitFor(() => room.state.auctionHighestBidderSessionId === bidder.sessionId)
    expect(room.state.players.get(host.sessionId)!.cash).toBe(hostCash)
    expect(room.state.players.get(bidder.sessionId)!.cash).toBe(STARTING_CASH - 130_000)

    room.state.auctionSeconds = 1
    await waitFor(() => room.state.auctionId === 0, 1800)
    expect(room.state.properties.get('1')).toMatchObject({ ownerSessionId: bidder.sessionId, isMortgaged: true })
    expect(room.state.players.get(seller.sessionId)!.cash).toBe(STARTING_CASH + 130_000)
    expect(room.state.players.get(bidder.sessionId)!.cash).toBe(STARTING_CASH - 130_000)
  })

  it('não permite leiloar imóvel livre ou título cujo grupo ainda tem construções', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Duda' })
    const guest = await colyseus.connectTo(room, { name: 'Eva' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started
    const unownedMessage = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('auctionStart', { propertyId: 1, startingBid: 50_000 })
    await expect(unownedMessage).resolves.toMatchObject({ message: expect.stringContaining('imóvel próprio') })

    const title = new PropertyState()
    title.ownerSessionId = host.sessionId
    room.state.properties.set('1', title)
    const sibling = boardSpaces.find((space) => space.kind === 'property' && space.color === boardSpaces[1].color && space.id !== 1)!
    const builtSibling = new PropertyState()
    builtSibling.ownerSessionId = host.sessionId
    builtSibling.houses = 1
    room.state.properties.set(String(sibling.id), builtSibling)
    const builtMessage = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('auctionStart', { propertyId: 1, startingBid: 50_000 })
    await expect(builtMessage).resolves.toMatchObject({ message: expect.stringContaining('Venda as construções') })
    expect(room.state.auctionId).toBe(0)
    expect(room.state.properties.get('1')?.ownerSessionId).toBe(host.sessionId)
  })

  it('permite comprar terreno livre já com até três casas no pagamento', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await waitFor(() => room.state.status === 'playing')

    const property = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    room.state.turnPhase = 'purchase'
    room.state.pendingPropertyId = property.id
    const cost = (property.price ?? 0) + constructionCost(property.id) * 3
    const cashBefore = room.state.players.get(host.sessionId)!.cash
    host.send('buy', { houses: 3 })
    await waitFor(() => room.state.turnPhase === 'resolve')

    expect(room.state.properties.get(String(property.id))).toMatchObject({ ownerSessionId: host.sessionId, houses: 3 })
    expect(room.state.players.get(host.sessionId)!.cash).toBe(cashBefore - cost)
  })

  it('valida construções no servidor, permite até três casas e bloqueia grupo hipotecado', async () => {
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
    room.state.players.get(host.sessionId)!.position = first.id
    room.state.pendingPropertyId = first.id
    const cost = Math.floor((first.price ?? 0) * 0.5)
    const cashBefore = room.state.players.get(host.sessionId)!.cash

    host.send('build', { propertyId: first.id, targetHouses: 3 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.properties.get(String(first.id))?.houses).toBe(3)
    expect(room.state.players.get(host.sessionId)!.cash).toBe(cashBefore - cost * 3)

    const sameVisitHotelError = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('build', { propertyId: first.id, hotel: true })
    await expect(sameVisitHotelError).resolves.toMatchObject({ message: expect.stringContaining('Só é possível construir ao cair no próprio terreno') })
    expect(room.state.properties.get(String(first.id))?.houses).toBe(3)

    room.state.properties.get(String(group[1].id))!.isMortgaged = true
    const mortgagedGroupError = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    room.state.pendingPropertyId = first.id
    host.send('build', { propertyId: first.id, hotel: true })
    await expect(mortgagedGroupError).resolves.toMatchObject({ message: expect.stringContaining('O hotel só pode ser comprado') })
    expect(room.state.properties.get(String(first.id))?.houses).toBe(3)

    room.state.properties.get(String(group[1].id))!.isMortgaged = false
    room.state.turnNumber += 1
    room.state.pendingPropertyId = first.id
    host.send('build', { propertyId: first.id, hotel: true })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.properties.get(String(first.id))?.houses).toBe(4)
    expect(room.state.players.get(host.sessionId)!.cash).toBe(cashBefore - cost * 6)
    room.state.pendingPropertyId = first.id
    const cashBeforeSale = room.state.players.get(host.sessionId)!.cash
    host.send('sellBuilding', { propertyId: first.id })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.properties.get(String(first.id))?.houses).toBe(3)
    expect(room.state.players.get(host.sessionId)!.cash).toBe(cashBeforeSale + buildingSaleValue(first.id, 4))
    expect(buildingSaleValue(first.id)).toBe(Math.floor(constructionCost(first.id) / 2))
  })

  it('permite hipotecar só ao dono durante dívida insuficiente e resgatar ao dono no turno', async () => {
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
    room.state.turnPhase = 'debt'
    room.state.debtAmount = 180_000
    room.state.activePlayerSessionId = host.sessionId
    const hostPlayer = room.state.players.get(host.sessionId)!
    hostPlayer.cash = 100_000
    room.state.players.get(guest.sessionId)!.cash = 100_000

    const outOfTurnMortgage = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('mortgage', { propertyId })
    await expect(outOfTurnMortgage).resolves.toMatchObject({ message: expect.stringContaining('Hipotecas só podem') })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property.isMortgaged).toBe(false)

    room.state.activePlayerSessionId = guest.sessionId
    const notOwnedMortgage = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('mortgage', { propertyId })
    await expect(notOwnedMortgage).resolves.toMatchObject({ message: expect.stringContaining('não pode ser hipotecada') })
    expect(property.isMortgaged).toBe(false)

    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'resolve'
    const outsideDebt = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('mortgage', { propertyId })
    await expect(outsideDebt).resolves.toMatchObject({ message: expect.stringContaining('Hipotecas só podem') })
    expect(property.isMortgaged).toBe(false)
    room.state.turnPhase = 'debt'
    host.send('mortgage', { propertyId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property.isMortgaged).toBe(true)
    expect(hostPlayer.cash).toBe(100_000 + mortgageValue(propertyId))

    const secondTitle = new PropertyState()
    secondTitle.ownerSessionId = host.sessionId
    room.state.properties.set('16', secondTitle)
    const alreadyCovered = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('mortgage', { propertyId: 16 })
    await expect(alreadyCovered).resolves.toMatchObject({ message: expect.stringContaining('saldo já cobre') })

    room.state.turnPhase = 'resolve'
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

    const debtAuctionError = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('auctionStart', { propertyId: 15, startingBid: 10_000 })
    await expect(debtAuctionError).resolves.toMatchObject({ message: expect.stringContaining('durante seu turno') })
    expect(room.state.auctionId).toBe(0)

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
    expect(room.state.turnPhase).toBe('rolling')
    await waitFor(() => room.state.turnPhase === 'moving', 4000)
    await waitFor(() => ['resolve', 'purchase', 'debt'].includes(room.state.turnPhase), 13_500)
    expect(room.state.diceOne).toBeGreaterThanOrEqual(1)
  }, 20_000)

  it('exige a fiança completa e mantém a pessoa presa se o saldo for insuficiente', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started

    const player = room.state.players.get(host.sessionId)!
    player.isJailed = true
    player.jailTurns = 1
    player.cash = 49_999
    room.state.turnPhase = 'jail'
    const insufficientFine = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))

    host.send('jailPay')
    await expect(insufficientFine).resolves.toMatchObject({ message: expect.stringContaining('A fiança custa 50.000') })
    expect(player).toMatchObject({ isJailed: true, jailTurns: 1, cash: 49_999 })
    expect(room.state.turnPhase).toBe('jail')

    player.cash = 50_000
    host.send('jailPay')
    await waitFor(() => room.state.turnPhase === 'roll')
    expect(player).toMatchObject({ isJailed: false, jailTurns: 0, cash: 0 })
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

    const diceSequenceBeforeRoll = room.state.diceSequence
    const startPosition = room.state.players.get(host.sessionId)?.position
    host.send('roll')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(room.state.diceSequence).toBe(diceSequenceBeforeRoll + 1)
    expect(room.state.turnPhase).toBe('rolling')
    expect(room.state.players.get(host.sessionId)?.position).toBe(startPosition)
    await waitFor(() => room.state.turnPhase === 'moving', 4000)
    expect(room.state.players.get(host.sessionId)?.position).not.toBe(startPosition)
    await waitFor(() => ['resolve', 'purchase', 'debt'].includes(room.state.turnPhase), 13_500)
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
      await waitFor(() => room.state.turnPhase === 'resolve')
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
  }, 12_000)

  it('rola automaticamente após 20 segundos e recusa uma compra após a janela de 10 segundos', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    const serverGame = room as unknown as { updateTurnClock: () => void; turnTimerKey: string }
    const activeSessionId = room.state.activePlayerSessionId
    const initialDiceSequence = room.state.diceSequence
    serverGame.turnTimerKey = `${room.state.turnNumber}:${activeSessionId}:roll`
    room.state.turnSeconds = 1
    serverGame.updateTurnClock()
    expect(room.state.diceSequence).toBe(initialDiceSequence + 1)
    expect(room.state.turnPhase).toBe('rolling')

    const propertyId = boardSpaces.find((space) => space.kind === 'property')!.id
    room.state.turnPhase = 'purchase'
    room.state.pendingPropertyId = propertyId
    serverGame.turnTimerKey = `${room.state.turnNumber}:${activeSessionId}:purchase`
    room.state.turnSeconds = 1
    serverGame.updateTurnClock()
    expect(room.state.turnPhase).toBe('resolve')
    expect(room.state.pendingPropertyId).toBe(255)
    expect(room.state.properties.get(String(propertyId))?.ownerSessionId ?? '').toBe('')
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

  it('conclui uma partida Express completa com quatro jogadores após as seis rodadas', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'express' })
    const clients = []
    for (const name of ['Ana', 'Bia', 'Caio', 'Duda']) clients.push(await colyseus.connectTo(room, { name }))
    const host = clients[0]!
    host.send('start')
    await waitFor(() => room.state.status === 'playing')
    const expirePhase = (room as unknown as { expireExpressPhase: () => void }).expireExpressPhase.bind(room)

    for (let turn = 0; turn < 23; turn += 1) {
      room.state.phaseSeconds = 0
      expirePhase()
      expect(room.state.status).toBe('playing')
    }
    room.state.phaseSeconds = 0
    expirePhase()

    expect(room.state.status).toBe('ended')
    expect(room.state.expressRound).toBe(6)
    expect(room.state.turnNumber).toBe(24)
    expect(clients.map((client) => room.state.players.get(client.sessionId)?.finalCash)).toEqual([1_500_000, 1_500_000, 1_500_000, 1_500_000])
    expect(clients.map((client) => room.state.players.get(client.sessionId)?.finalNetWorth)).toEqual([1_500_000, 1_500_000, 1_500_000, 1_500_000])
    expect(clients.some((client) => client.sessionId === room.state.winnerSessionId)).toBe(true)
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
