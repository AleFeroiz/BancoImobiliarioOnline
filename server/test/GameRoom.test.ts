import { ColyseusTestServer, boot } from '@colyseus/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createServer } from 'node:net'
import appConfig from '../src/app.config.js'
import type { LobbyState } from '../src/rooms/schema/LobbyState.js'
import { PropertyState } from '../src/rooms/schema/LobbyState.js'
import { boardSpaces, getLineTitleIds } from '../../shared/board.js'
import { EVENT_CARDS, type EventCard } from '../../shared/cards.js'
import { START_BONUS, STARTING_CASH, bankReturnValue, buildingSaleValue, calculateRent, constructionCost, forcedBuybackCost } from '../../shared/game.js'

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
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })

    expect(room.roomId).toMatch(/^[A-HJ-NP-Z2-9]{5}$/)
    expect(room.state.roomCode).toBe(room.roomId)
    expect(room.state.mode).toBe('classic')
    expect(room.state.players.get(host.sessionId)).toMatchObject({ name: 'Ana', isHost: true, characterType: 'pawn' })
    expect(room.state.players.get(guest.sessionId)).toMatchObject({ name: 'Bia', isHost: false })
  })

  it('transmite emotes escolhidos por qualquer participante e rejeita valores inválidos', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started

    const emote = new Promise<{ sessionId: string; emote: string }>((resolve) => host.onMessage('game:emote', resolve))
    guest.send('emote', { emote: 'laugh' })
    expect(await emote).toEqual({ sessionId: guest.sessionId, emote: 'laugh' })

    const invalid = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('emote', { emote: 'wave' })
    expect((await invalid).message).toContain('emote')
  })

  it('sincroniza a ficha escolhida por cada pessoa somente antes de iniciar', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Lia' })
    const guest = await colyseus.connectTo(room, { name: 'Nina' })

    host.send('setCharacter', { characterType: 'car' })
    await waitFor(() => room.state.players.get(host.sessionId)?.characterType === 'car')
    guest.send('setCharacter', { characterType: 'airplane' })
    await waitFor(() => room.state.players.get(guest.sessionId)?.characterType === 'airplane')
    const invalidChoice = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('setCharacter', { characterType: 'boat' })
    expect((await invalidChoice).message).toContain('ficha válida')
    expect(room.state.players.get(host.sessionId)?.characterType).toBe('car')

    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started
    expect(room.state.players.get(host.sessionId)?.characterType).toBe('car')
    expect(room.state.players.get(guest.sessionId)?.characterType).toBe('airplane')

    const lockedChoice = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('setCharacter', { characterType: 'motorcycle' })
    expect((await lockedChoice).message).toContain('lobby')
    expect(room.state.players.get(guest.sessionId)?.characterType).toBe('airplane')
  })

  it('cria e entra na sala pelos mesmos métodos do cliente web', async () => {
    const host = await colyseus.sdk.create('game_room', { mode: 'classic', name: 'Eva' })
    const guest = await colyseus.sdk.joinById(host.roomId, { name: 'Fábio' })
    await Promise.all([host.waitForInitialState(), guest.waitForInitialState()])

    expect(host.roomId).toMatch(/^[A-HJ-NP-Z2-9]{5}$/)
    expect(guest.roomId).toBe(host.roomId)
    expect(host.state.mode).toBe('classic')
    expect(host.state.players.size).toBe(2)
  })

  it('permite quatro participantes e rejeita a quinta conexão', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })

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
    expect(room.state.players.get(host.sessionId)?.cash).toBe(STARTING_CASH)
    expect(room.state.players.get(guest.sessionId)?.cash).toBe(STARTING_CASH)
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

    expect(room.state.animationSpeed).toBe(1)
    expect(room.state.presentationSpeed).toBe(1)
    const unauthorized = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('setAnimationSpeed', { speed: 2 })
    await expect(unauthorized).resolves.toMatchObject({ message: 'Só a pessoa anfitriã pode alterar a velocidade das animações.' })
    expect(room.state.animationSpeed).toBe(1)

    host.send('setAnimationSpeed', { speed: 2 })
    await waitFor(() => room.state.animationSpeed === 2)
    expect(room.state.presentationSpeed).toBe(1)
    host.send('roll')
    await waitFor(() => room.state.turnPhase === 'rolling')
    expect(room.state.presentationSpeed).toBe(2)
  })

  it('permite ao anfitrião forçar valores de dados em desenvolvimento com validação autoritativa', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Caio' })
    const guest = await colyseus.connectTo(room, { name: 'Duda' })
    const unauthorizedSetting = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('setDevToolsEnabled', { enabled: true })
    await expect(unauthorizedSetting).resolves.toMatchObject({ message: 'Só a pessoa anfitriã pode alterar o modo DEV enquanto a sala está no lobby.' })
    expect(room.state.devToolsEnabled).toBe(false)
    host.send('setDevToolsEnabled', { enabled: true })
    await waitFor(() => room.state.devToolsEnabled)
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started

    const unauthorized = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('devRoll', { diceOne: 6, diceTwo: 4 })
    await expect(unauthorized).resolves.toMatchObject({ message: 'A rolagem DEV está desativada ou disponível apenas para a pessoa anfitriã.' })
    expect(room.state.turnPhase).toBe('roll')

    const invalid = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('devRoll', { diceOne: 7, diceTwo: 1 })
    await expect(invalid).resolves.toMatchObject({ message: 'Escolha um valor inteiro entre 1 e 6 para cada dado.' })
    expect(room.state.turnPhase).toBe('roll')

    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      host.send('devRoll', { diceOne: 6, diceTwo: 4 })
      await waitFor(() => room.state.turnPhase === 'rolling')
      expect(room.state.diceOne).toBe(6)
      expect(room.state.diceTwo).toBe(4)
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = originalNodeEnv
    }
  })

  it('sincroniza a reconexão e bloqueia o início enquanto alguém está offline', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
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
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
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
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Lia' })
    host.send('addBot')
    await waitFor(() => room.state.players.size === 2)
    const bot = [...room.state.players.entries()].find(([, player]) => player.isBot)
    expect(bot?.[1]).toMatchObject({ name: 'Bot 1', isBot: true, isBotControlled: true, isConnected: true, characterType: 'pawn' })
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
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
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

  it('troca dinheiro e títulos entre as duas pessoas após a aceitação da proposta', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started

    const hostTitle = new PropertyState()
    hostTitle.ownerSessionId = host.sessionId
    room.state.properties.set('1', hostTitle)
    const guestTitle = new PropertyState()
    guestTitle.ownerSessionId = guest.sessionId
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
    expect(room.state.properties.get('3')?.ownerSessionId).toBe(host.sessionId)
    expect(room.state.tradeOfferId).toBe(0)
  })

  it('mantém propostas até resposta mesmo após a vez mudar', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Eva' })
    const guest = await colyseus.connectTo(room, { name: 'Fábio' })
    const started = Promise.all([
      new Promise<void>((resolve) => host.onMessage('game:started', () => resolve())),
      new Promise<void>((resolve) => guest.onMessage('game:started', () => resolve())),
    ])
    host.send('start')
    await started
    const hostCash = room.state.players.get(host.sessionId)!.cash
    const guestCash = room.state.players.get(guest.sessionId)!.cash
    guest.send('tradeOffer', { toSessionId: host.sessionId, cashOffered: 1_000, cashRequested: 0 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const offerId = room.state.tradeOfferId
    expect(offerId).toBeGreaterThan(0)
    room.state.turnNumber += 1
    room.state.activePlayerSessionId = host.sessionId
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.tradeOfferId).toBe(offerId)
    host.send('tradeAccept', { offerId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.tradeOfferId).toBe(0)
    expect(room.state.players.get(host.sessionId)!.cash).toBe(hostCash + 1_000)
    expect(room.state.players.get(guest.sessionId)!.cash).toBe(guestCash - 1_000)
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

  it('permite propostas fora da vez e ainda rejeita imóveis sem dono ou com construções e aceite por terceiro', async () => {
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

    guest.send('tradeOffer', { toSessionId: host.sessionId, cashOffered: 1_000, cashRequested: 0 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.tradeOfferId).toBeGreaterThan(0)
    guest.send('tradeCancel', { offerId: room.state.tradeOfferId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.tradeOfferId).toBe(0)

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
    expect(room.state.properties.get('1')?.ownerSessionId).toBe(bidder.sessionId)
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

  it('concede nova rolagem após duplas e envia à prisão na terceira dupla sem mover', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('setDevToolsEnabled', { enabled: true })
    await waitFor(() => room.state.devToolsEnabled)
    host.send('start')
    await waitFor(() => room.state.status === 'playing')

    room.state.animationSpeed = 2
    const rollDoubles = async (expectedPosition: number) => {
      host.send('devRoll', { diceOne: 1, diceTwo: 1 })
      await waitFor(() => room.state.turnPhase === 'purchase' || room.state.turnPhase === 'resolve', 6000)
      expect(room.state.players.get(host.sessionId)?.position).toBe(expectedPosition)
      if (room.state.turnPhase === 'purchase') host.send('declinePurchase')
      await waitFor(() => room.state.turnPhase === 'resolve')
      host.send('finishTurn')
    }

    await rollDoubles(2)
    await waitFor(() => room.state.turnPhase === 'roll')
    expect(room.state.activePlayerSessionId).toBe(host.sessionId)

    await rollDoubles(4)
    await waitFor(() => room.state.turnPhase === 'roll')
    expect(room.state.activePlayerSessionId).toBe(host.sessionId)

    host.send('devRoll', { diceOne: 1, diceTwo: 1 })
    await waitFor(() => room.state.players.get(host.sessionId)?.isJailed === true, 6000)
    expect(room.state.players.get(host.sessionId)).toMatchObject({ position: 10, isJailed: true, jailTurns: 3 })
    expect(room.state.activePlayerSessionId).toBe(host.sessionId)
    expect(room.state.landingDescription).toContain('três vezes seguidas')

    await waitFor(() => room.state.turnPhase === 'resolve')
    host.send('finishTurn')
    await waitFor(() => room.state.activePlayerSessionId === guest.sessionId)
    expect(room.state.turnPhase).toBe('roll')
  }, 25_000)

  it('encerra a partida no servidor para cada condição imediata de monopólio', async () => {
    const regionalIds = boardSpaces
      .filter((space) => space.buildable && (space.region === 'north' || space.region === 'center-west'))
      .map((space) => space.id)
    const companyIds = boardSpaces.filter((space) => space.company).map((space) => space.id)
    const winConditions = [
      { label: 'Monopólio em Linha', propertyIds: getLineTitleIds(0) },
      { label: 'Monopólio Duplo Regional', propertyIds: regionalIds },
      { label: 'quatro companhias', propertyIds: companyIds },
    ]

    for (const condition of winConditions) {
      const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
      const host = await colyseus.connectTo(room, { name: 'Ana' })
      await colyseus.connectTo(room, { name: 'Bia' })
      host.send('start')
      await waitFor(() => room.state.status === 'playing')

      for (const propertyId of condition.propertyIds) {
        const property = new PropertyState()
        property.ownerSessionId = host.sessionId
        room.state.properties.set(String(propertyId), property)
      }

      const checkMonopolyVictory = (room as unknown as { checkMonopolyVictory: (sessionId: string) => boolean }).checkMonopolyVictory
      expect(checkMonopolyVictory.call(room, host.sessionId), condition.label).toBe(true)
      expect(room.state.status, condition.label).toBe('ended')
      expect(room.state.turnPhase, condition.label).toBe('ended')
      expect(room.state.winnerSessionId, condition.label).toBe(host.sessionId)
      expect(room.state.landingDescription, condition.label).toContain('venceu ao completar um monopólio')
    }
  })

  it('valida construções no servidor, permite até três casas e hotel em visita posterior', async () => {
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

  it('devolve o título ao banco por metade do preço apenas durante dívida insuficiente', async () => {
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

    const outOfTurnReturn = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('returnPropertyToBank', { propertyId })
    await expect(outOfTurnReturn).resolves.toMatchObject({ message: expect.stringContaining('devolver um imóvel ao banco') })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property.ownerSessionId).toBe(host.sessionId)

    room.state.activePlayerSessionId = guest.sessionId
    const notOwnedReturn = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('returnPropertyToBank', { propertyId })
    await expect(notOwnedReturn).resolves.toMatchObject({ message: expect.stringContaining('não pode ser devolvido') })
    expect(property.ownerSessionId).toBe(host.sessionId)

    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'resolve'
    const outsideDebt = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('returnPropertyToBank', { propertyId })
    await expect(outsideDebt).resolves.toMatchObject({ message: expect.stringContaining('devolver um imóvel ao banco') })
    expect(property.ownerSessionId).toBe(host.sessionId)
    room.state.turnPhase = 'debt'
    host.send('returnPropertyToBank', { propertyId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property).toMatchObject({ ownerSessionId: '', houses: 0 })
    expect(hostPlayer.cash).toBe(100_000 + bankReturnValue(propertyId))

    const secondTitle = new PropertyState()
    secondTitle.ownerSessionId = host.sessionId
    room.state.properties.set('16', secondTitle)
    const alreadyCovered = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('returnPropertyToBank', { propertyId: 16 })
    await expect(alreadyCovered).resolves.toMatchObject({ message: expect.stringContaining('saldo já cobre') })

  })

  it('registra a dívida integral sem debitar saldo parcialmente e paga após devolver imóvel ao banco', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    const player = room.state.players.get(host.sessionId)!
    player.cash = 20_000
    const collectPayment = (room as unknown as { collectPayment: (sessionId: string, player: typeof player, amount: number, creditorId: string, reason: string) => void }).collectPayment
    collectPayment.call(room, host.sessionId, player, 50_000, '', 'Taxa')

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
    host.send('returnPropertyToBank', { propertyId })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property).toMatchObject({ ownerSessionId: '', houses: 0 })
    expect(player.cash).toBe(20_000 + bankReturnValue(propertyId))

    host.send('payDebt')
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(room.state.debtAmount).toBe(0)
    expect(room.state.turnPhase).toBe('resolve')
    expect(player.cash).toBe(20_000 + bankReturnValue(propertyId) - 50_000)
  })

  it('transfere saldo e títulos do falido ao credor e encerra quando resta uma pessoa solvente', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    const debtor = room.state.players.get(host.sessionId)!
    const creditor = room.state.players.get(guest.sessionId)!
    debtor.cash = 45_000
    room.state.turnPhase = 'debt'
    room.state.debtAmount = 80_000
    room.state.debtCreditorSessionId = guest.sessionId
    room.state.debtReason = 'Aluguel'

    host.send('declareBankruptcy')
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(debtor.isBankrupt).toBe(true)
    expect(debtor.cash).toBe(0)
    expect(creditor.cash).toBe(STARTING_CASH + 45_000)
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
    room.state.debtAmount = 500_000
    room.state.debtCreditorSessionId = ''

    const prematureBankruptcy = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('declareBankruptcy')
    await expect(prematureBankruptcy).resolves.toMatchObject({ message: expect.stringContaining('liquide todos os bens') })
    expect(debtor.isBankrupt).toBe(false)

    host.send('returnPropertyToBank', { propertyId: 15 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(property).toMatchObject({ ownerSessionId: '', houses: 0 })
    expect(debtor.cash).toBeLessThan(room.state.debtAmount)
    host.send('declareBankruptcy')
    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(debtor.isBankrupt).toBe(true)
    expect(creditor.cash).toBe(STARTING_CASH)
    expect(property).toMatchObject({ ownerSessionId: '', houses: 0 })
    expect(room.state.status).toBe('ended')
  })

  it('mantém a prisão por três turnos completos e libera automaticamente depois', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started

    const player = room.state.players.get(host.sessionId)!
    player.position = 10
    player.isJailed = true
    player.jailTurns = 3
    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'jail'
    for (const remaining of [2, 1, 0]) {
      host.send('finishTurn')
      await waitFor(() => room.state.activePlayerSessionId === guest.sessionId && room.state.turnPhase === 'roll')
      expect(player.jailTurns).toBe(remaining)
      if (remaining === 0) break
      room.state.activePlayerSessionId = host.sessionId
      room.state.turnPhase = 'jail'
      room.state.turnNumber += 1
    }
    expect(player.isJailed).toBe(false)
    expect(player.cash).toBe(STARTING_CASH)
  })

  it('permite pagar R$ 200.000 para sair da prisão e continuar rolando na mesma vez', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started
    const player = room.state.players.get(host.sessionId)!
    player.position = 10
    player.isJailed = true
    player.jailTurns = 3
    player.cash = 300_000
    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'jail'

    const insufficient = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    player.cash = 100_000
    host.send('jailPay')
    await expect(insufficient).resolves.toMatchObject({ message: expect.stringContaining('R$ 200.000') })
    expect(player.isJailed).toBe(true)

    player.cash = 300_000
    host.send('jailPay')
    await waitFor(() => room.state.turnPhase === 'roll')

    expect(room.state.activePlayerSessionId).toBe(host.sessionId)
    expect(player).toMatchObject({ isJailed: false, jailTurns: 0, cash: 100_000 })
    expect(room.state.landingDescription).toContain('R$ 200.000')
    expect(guest.sessionId).not.toBe(room.state.activePlayerSessionId)
  })

  it('permite recompra forçada por 1,5× e paga o antigo proprietário', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const visitorClient = await colyseus.connectTo(room, { name: 'Ana' })
    const ownerClient = await colyseus.connectTo(room, { name: 'Bia' })
    const started = new Promise<void>((resolve) => visitorClient.onMessage('game:started', () => resolve()))
    visitorClient.send('start')
    await started

    const propertySpace = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const title = new PropertyState()
    title.ownerSessionId = ownerClient.sessionId
    title.houses = 1
    room.state.properties.set(String(propertySpace.id), title)
    room.state.activePlayerSessionId = visitorClient.sessionId
    const visitor = room.state.players.get(visitorClient.sessionId)!
    const owner = room.state.players.get(ownerClient.sessionId)!
    visitor.position = propertySpace.id
    visitor.cash = 2_147_000_000
    owner.cash = STARTING_CASH

    const privateRoom = room as unknown as { resolveSpace: (sessionId: string, player: typeof visitor) => void }
    privateRoom.resolveSpace(visitorClient.sessionId, visitor)

    expect(room.state.turnPhase).toBe('buyback')
    const price = forcedBuybackCost(propertySpace.id, 1)
    visitorClient.send('buyback', { accept: true })
    await waitFor(() => room.state.turnPhase === 'resolve')
    expect(visitor.cash).toBe(2_147_000_000 - price)
    expect(owner.cash).toBe(STARTING_CASH + price)
    expect(room.state.properties.get(String(propertySpace.id))?.ownerSessionId).toBe(visitorClient.sessionId)
    expect(room.state.properties.get(String(propertySpace.id))?.houses).toBe(1)
    expect(room.state.landingDescription).toContain('recomprada')
  })

  it('aplica a sede da Copa ao aluguel e impede a Volta ao Mundo para imóvel de outra pessoa', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started
    const owner = room.state.players.get(host.sessionId)!
    const visitor = room.state.players.get(guest.sessionId)!
    const property = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const opponentProperty = boardSpaces.find((space) => space.kind === 'property' && space.id !== property.id)!
    const unownedProperty = boardSpaces.find((space) => space.kind === 'property' && space.id !== property.id && space.id !== opponentProperty.id)!
    const title = new PropertyState()
    title.ownerSessionId = host.sessionId
    room.state.properties.set(String(property.id), title)
    const opponentTitle = new PropertyState()
    opponentTitle.ownerSessionId = guest.sessionId
    room.state.properties.set(String(opponentProperty.id), opponentTitle)
    const normalRent = calculateRent(property.id, new Map([[property.id, host.sessionId]]))

    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'world-cup'
    const freeVenue = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('chooseWorldCup', { propertyId: unownedProperty.id })
    await expect(freeVenue).resolves.toMatchObject({ message: 'Escolha uma propriedade sua para sediar a Copa do Mundo.' })
    const opponentVenue = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('chooseWorldCup', { propertyId: opponentProperty.id })
    await expect(opponentVenue).resolves.toMatchObject({ message: 'Escolha uma propriedade sua para sediar a Copa do Mundo.' })
    host.send('chooseWorldCup', { propertyId: property.id })
    await waitFor(() => room.state.turnPhase === 'resolve')
    expect(room.state.worldCupSpaceId).toBe(property.id)

    const privateRoom = room as unknown as { resolveSpace: (sessionId: string, player: typeof visitor) => void }
    room.state.activePlayerSessionId = guest.sessionId
    visitor.position = property.id
    visitor.cash = STARTING_CASH
    owner.cash = STARTING_CASH
    privateRoom.resolveSpace(guest.sessionId, visitor)
    expect(room.state.turnPhase).toBe('buyback')
    guest.send('buyback', { accept: false })
    await waitFor(() => room.state.turnPhase === 'resolve' || room.state.turnPhase === 'debt')
    expect(visitor.cash).toBe(STARTING_CASH - normalRent * 3)
    expect(owner.cash).toBe(STARTING_CASH + normalRent * 3)

    visitor.position = 10
    privateRoom.resolveSpace(guest.sessionId, visitor)
    expect(visitor).toMatchObject({ isJailed: true, jailTurns: 3 })

    room.state.turnPhase = 'world-tour'
    visitor.position = 30
    const invalidDestination = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('chooseWorldTour', { spaceId: property.id })
    await expect(invalidDestination).resolves.toMatchObject({ message: expect.stringContaining('propriedade sua, livre') })

    room.state.animationSpeed = 2
    guest.send('chooseWorldTour', { spaceId: 0 })
    await waitFor(() => room.state.turnPhase === 'resolve', 2_500)
    expect(visitor.position).toBe(0)
    expect(visitor.cash).toBe(STARTING_CASH - normalRent * 3)
    expect(room.state.landingDescription).toContain('sem bônus por passagem pela Partida')
  })

  it('não oferece sede da Copa quando a pessoa da vez não possui propriedades', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const started = new Promise<void>((resolve) => host.onMessage('game:started', () => resolve()))
    host.send('start')
    await started
    const player = room.state.players.get(host.sessionId)!
    player.position = 20
    room.state.activePlayerSessionId = host.sessionId
    const privateRoom = room as unknown as { resolveSpace: (sessionId: string, target: typeof player) => void }

    privateRoom.resolveSpace(host.sessionId, player)

    expect(room.state.turnPhase).toBe('resolve')
    expect(room.state.worldCupSpaceId).toBe(255)
    expect(room.state.landingDescription).toContain('Você não possui propriedades para sediar a Copa')
    expect(guest.sessionId).not.toBe(room.state.activePlayerSessionId)
  })

  it('autoriza apenas a pessoa da vez a rolar e só avança após concluir a casa', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('setDevToolsEnabled', { enabled: true })
    await waitFor(() => room.state.devToolsEnabled)
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 50))

    const unauthorizedRoll = new Promise<{ message: string }>((resolve) => guest.onMessage('room:error', resolve))
    guest.send('roll')
    await expect(unauthorizedRoll).resolves.toMatchObject({ message: 'Aguarde a sua vez para lançar os dados.' })
    expect(room.state.turnPhase).toBe('roll')

    const diceSequenceBeforeRoll = room.state.diceSequence
    const startPosition = room.state.players.get(host.sessionId)?.position
    ;(room as unknown as { drawEventCard: () => EventCard }).drawEventCard = () => EVENT_CARDS.find((card) => card.id === 'start')!
    host.send('devRoll', { diceOne: 1, diceTwo: 2 })
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

  it('rola automaticamente após 20 segundos e recusa uma compra após a janela de 15 segundos', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
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

  it('abre a compra normal ao resolver um destino escolhido por carta', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await waitFor(() => room.state.status === 'playing')

    const player = room.state.players.get(host.sessionId)!
    const property = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    player.position = property.id
    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'moving'
    room.state.activeCardTitle = 'Cidade-sede'
    room.state.activeCardDescription = 'Vá para a cidade-sede e resolva a chegada.'

    const resolveSpace = (room as unknown as { resolveSpace: (sessionId: string, target: typeof player, drawEvent: boolean, descriptionPrefix: string) => void }).resolveSpace
    resolveSpace.call(room, host.sessionId, player, false, 'Carta Cidade-sede.')

    expect(room.state.turnPhase).toBe('purchase')
    expect(room.state.pendingPropertyId).toBe(property.id)
    expect(room.state.activeCardTitle).toBe('')
    expect(room.state.activeCardDescription).toBe('')
    expect(room.state.landingDescription).toContain(property.name)
  })

  it('valida alvos de Generoso, Apagão, Proteção e Terremoto no servidor', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await waitFor(() => room.state.status === 'playing')

    const serverGame = room as unknown as {
      drawEventCard: () => EventCard
      resolveSpace: (sessionId: string, player: NonNullable<ReturnType<typeof room.state.players.get>>, drawEvent?: boolean) => void
      advanceTurn: () => void
    }
    const [giveId, targetId, protectionId] = boardSpaces.filter((space) => space.kind === 'property').slice(0, 3).map((space) => space.id)
    const hostPlayer = room.state.players.get(host.sessionId)!
    const giveProperty = new PropertyState()
    giveProperty.ownerSessionId = host.sessionId
    room.state.properties.set(String(giveId), giveProperty)
    const targetProperty = new PropertyState()
    targetProperty.ownerSessionId = guest.sessionId
    room.state.properties.set(String(targetId), targetProperty)
    const eventSpace = boardSpaces.find((space) => space.kind === 'event')!
    hostPlayer.position = eventSpace.id
    serverGame.drawEventCard = () => EVENT_CARDS.find((card) => card.id === 'blackout')!
    serverGame.resolveSpace(host.sessionId, hostPlayer, true)
    expect(room.state.turnPhase).toBe('card-target')
    expect(room.state.activeCardId).toBe('blackout')
    host.send('resolveCardTarget', { propertyId: targetId, targetSessionId: guest.sessionId })
    await waitFor(() => room.state.properties.get(String(targetId))?.blackoutTurns === 3)

    room.state.activePlayerSessionId = guest.sessionId
    serverGame.advanceTurn()
    expect(room.state.properties.get(String(targetId))?.blackoutTurns).toBe(2)

    const protectedProperty = room.state.properties.get(String(targetId))!
    protectedProperty.protectionTurns = 3
    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'card-target'
    room.state.activeCardId = 'earthquake'
    const blocked = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('resolveCardTarget', { propertyId: targetId, targetSessionId: guest.sessionId })
    expect((await blocked).message).toContain('proteção')
    expect(protectedProperty.ownerSessionId).toBe(guest.sessionId)

    giveProperty.protectionTurns = 3
    room.state.turnPhase = 'card-target'
    room.state.activeCardId = 'generous'
    const blockedGenerous = new Promise<{ message: string }>((resolve) => host.onMessage('room:error', resolve))
    host.send('resolveCardTarget', { propertyId: giveId, targetSessionId: guest.sessionId })
    expect((await blockedGenerous).message).toContain('proteção')
    expect(giveProperty.ownerSessionId).toBe(host.sessionId)

    giveProperty.protectionTurns = 0
    room.state.turnPhase = 'card-target'
    room.state.activeCardId = 'generous'
    host.send('resolveCardTarget', { propertyId: giveId, targetSessionId: guest.sessionId })
    await waitFor(() => giveProperty.ownerSessionId === guest.sessionId)
    expect(room.state.turnPhase).toBe('resolve')

    const protectionChoice = new PropertyState()
    protectionChoice.ownerSessionId = host.sessionId
    room.state.properties.set(String(protectionId), protectionChoice)
    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'card-target'
    room.state.activeCardId = 'protection'
    host.send('resolveCardTarget', { propertyId: protectionId })
    await waitFor(() => protectionChoice.protectionTurns === 4)
    expect(protectionChoice.protectionTurns).toBe(4)
  })

  it('suspende o aluguel durante três turnos do dono por Apagão e retoma a cobrança ao expirar', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await waitFor(() => room.state.status === 'playing')

    const propertySpace = boardSpaces.find((space) => space.buildable)!
    const property = new PropertyState()
    property.ownerSessionId = guest.sessionId
    property.houses = 1
    property.blackoutTurns = 3
    room.state.properties.set(String(propertySpace.id), property)

    const privateRoom = room as unknown as {
      resolveSpace: (sessionId: string, player: NonNullable<ReturnType<typeof room.state.players.get>>, drawEvent?: boolean) => void
      advanceTurn: () => void
    }
    const visitor = room.state.players.get(host.sessionId)!
    const owner = room.state.players.get(guest.sessionId)!
    visitor.position = propertySpace.id
    room.state.activePlayerSessionId = host.sessionId
    const visitorCash = visitor.cash

    privateRoom.resolveSpace(host.sessionId, visitor, false)
    expect(room.state.turnPhase).toBe('resolve')
    expect(room.state.landingDescription).toContain('está em apagão; não há aluguel')
    expect(visitor.cash).toBe(visitorCash)

    for (const turnsRemaining of [2, 1, 0]) {
      room.state.activePlayerSessionId = guest.sessionId
      privateRoom.advanceTurn()
      expect(property.blackoutTurns).toBe(turnsRemaining)
    }

    room.state.activePlayerSessionId = host.sessionId
    visitor.position = propertySpace.id
    privateRoom.resolveSpace(host.sessionId, visitor, false)
    expect(room.state.turnPhase).toBe('buyback')
    expect(room.state.landingDescription).not.toContain('está em apagão')

    const rent = calculateRent(propertySpace.id, new Map([[propertySpace.id, guest.sessionId]]), 1, 255)
    host.send('buyback', { accept: false })
    await waitFor(() => room.state.turnPhase === 'resolve')
    expect(visitor.cash).toBe(visitorCash - rent)
    expect(owner.cash).toBe(STARTING_CASH + rent)
  })

  it('Terremoto devolve ao banco o imóvel atingido e apaga suas construções', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await waitFor(() => room.state.status === 'playing')

    const propertySpace = boardSpaces.find((space) => space.buildable)!
    const property = new PropertyState()
    property.ownerSessionId = guest.sessionId
    property.houses = 2
    room.state.properties.set(String(propertySpace.id), property)
    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'card-target'
    room.state.activeCardId = 'earthquake'

    host.send('resolveCardTarget', { propertyId: propertySpace.id, targetSessionId: guest.sessionId })
    await waitFor(() => property.ownerSessionId === '')

    expect(property.houses).toBe(0)
    expect(room.state.turnPhase).toBe('resolve')
    expect(room.state.landingDescription.toLowerCase()).toContain('terremoto')
    expect(room.state.players.get(guest.sessionId)?.cash).toBe(STARTING_CASH)
  })

  it('paga Aniversário a cada pessoa e processa Ladrão com dívida ao alvo', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    const third = await colyseus.connectTo(room, { name: 'Caio' })
    host.send('start')
    await waitFor(() => room.state.status === 'playing')

    const serverGame = room as unknown as {
      drawEventCard: () => EventCard
      resolveSpace: (sessionId: string, player: NonNullable<ReturnType<typeof room.state.players.get>>, drawEvent?: boolean) => void
    }
    const actor = room.state.players.get(host.sessionId)!
    const eventSpace = boardSpaces.find((space) => space.kind === 'event')!
    actor.position = eventSpace.id
    serverGame.drawEventCard = () => EVENT_CARDS.find((card) => card.id === 'birthday')!
    serverGame.resolveSpace(host.sessionId, actor, true)
    await waitFor(() => room.state.players.get(host.sessionId)!.cash === STARTING_CASH + 100_000)
    expect(room.state.players.get(guest.sessionId)!.cash).toBe(STARTING_CASH - 50_000)
    expect(room.state.players.get(third.sessionId)!.cash).toBe(STARTING_CASH - 50_000)

    const guestProperty = new PropertyState()
    guestProperty.ownerSessionId = guest.sessionId
    const expensivePropertyId = boardSpaces.filter((space) => space.kind === 'property').sort((first, second) => (second.price ?? 0) - (first.price ?? 0))[0]!.id
    room.state.properties.set(String(expensivePropertyId), guestProperty)
    room.state.players.get(guest.sessionId)!.cash = 100_000
    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'card-target'
    room.state.activeCardId = 'thief'
    host.send('resolveCardTarget', { targetSessionId: guest.sessionId })
    await waitFor(() => room.state.turnPhase === 'debt')
    expect(room.state.activePlayerSessionId).toBe(guest.sessionId)
    expect(room.state.debtAmount).toBe(200_000)
    expect(room.state.debtCreditorSessionId).toBe(host.sessionId)
  })

  it('resolve as cartas de movimento sem duplicar bônus ou efeitos de chegada', async () => {
    const room = await colyseus.createRoom<LobbyState>('game_room', { mode: 'classic' })
    const host = await colyseus.connectTo(room, { name: 'Ana' })
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await waitFor(() => room.state.status === 'playing')

    const serverGame = room as unknown as {
      drawEventCard: () => EventCard
      resolveSpace: (sessionId: string, player: NonNullable<ReturnType<typeof room.state.players.get>>, drawEvent?: boolean) => void
      schedulePresentation: (_delayMs: number, action: () => void) => void
    }
    serverGame.schedulePresentation = (_delayMs, action) => action()
    const actor = room.state.players.get(host.sessionId)!
    const eventSpace = boardSpaces.find((space) => space.kind === 'event')!

    actor.position = eventSpace.id
    const startCash = actor.cash
    serverGame.drawEventCard = () => EVENT_CARDS.find((card) => card.id === 'start')!
    serverGame.resolveSpace(host.sessionId, actor, true)
    expect(actor.position).toBe(0)
    expect(actor.cash).toBe(startCash + START_BONUS)

    actor.position = eventSpace.id
    const worldTourCash = actor.cash
    serverGame.drawEventCard = () => EVENT_CARDS.find((card) => card.id === 'world-tour')!
    serverGame.resolveSpace(host.sessionId, actor, true)
    expect(actor.position).toBe(30)
    expect(actor.cash).toBe(worldTourCash + START_BONUS)
    expect(room.state.turnPhase).toBe('world-tour')

    actor.position = eventSpace.id
    room.state.worldCupSpaceId = 255
    serverGame.drawEventCard = () => EVENT_CARDS.find((card) => card.id === 'world-cup')!
    serverGame.resolveSpace(host.sessionId, actor, true)
    expect(actor.position).toBe(20)
    expect(room.state.turnPhase).toBe('resolve')

    const venueId = boardSpaces.find((space) => space.kind === 'property')!.id
    const venue = new PropertyState()
    venue.ownerSessionId = host.sessionId
    room.state.properties.set(String(venueId), venue)
    room.state.worldCupSpaceId = venueId
    actor.position = eventSpace.id
    serverGame.drawEventCard = () => EVENT_CARDS.find((card) => card.id === 'world-cup-city')!
    serverGame.resolveSpace(host.sessionId, actor, true)
    expect(actor.position).toBe(venueId)
    expect(actor.cash).toBe(worldTourCash + START_BONUS * 2)
    expect(room.state.turnPhase).toBe('resolve')

    room.state.worldCupSpaceId = 255
    actor.position = eventSpace.id
    serverGame.drawEventCard = () => EVENT_CARDS.find((card) => card.id === 'world-cup-city')!
    serverGame.resolveSpace(host.sessionId, actor, true)
    expect(actor.position).toBe(eventSpace.id)
    expect(room.state.landingDescription).toContain('Não há uma cidade-sede ativa')

    actor.position = eventSpace.id
    serverGame.drawEventCard = () => EVENT_CARDS.find((card) => card.id === 'jail')!
    serverGame.resolveSpace(host.sessionId, actor, true)
    expect(actor).toMatchObject({ position: 10, isJailed: true, jailTurns: 3 })
    expect(room.state.turnPhase).toBe('resolve')

    const guestPlayer = room.state.players.get(guest.sessionId)!
    actor.position = 4
    guestPlayer.position = 17
    room.state.activePlayerSessionId = host.sessionId
    room.state.turnPhase = 'card-target'
    room.state.activeCardId = 'swap'
    host.send('resolveCardTarget', { targetSessionId: host.sessionId, secondSessionId: guest.sessionId })
    await waitFor(() => room.state.turnPhase === 'resolve')
    expect(actor.position).toBe(17)
    expect(guestPlayer.position).toBe(4)
    expect(room.state.pendingPropertyId).toBe(255)
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
    const guest = await colyseus.connectTo(room, { name: 'Bia' })
    host.send('start')
    await new Promise((resolve) => setTimeout(resolve, 30))

    room.state.players.get(host.sessionId)!.cash = 1_500_000
    room.state.players.get(guest.sessionId)!.cash = 1_000_000
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
    expect(room.state.players.get(host.sessionId)).toMatchObject({ finalCash: 1_450_000, finalNetWorth: 1_650_000 })
    expect(room.state.players.get(host.sessionId)?.tieBreakRoll).toBe(0)
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
