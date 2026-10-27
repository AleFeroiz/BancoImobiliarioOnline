import { randomInt } from 'node:crypto'
import { CloseCode, Client, Room } from '@colyseus/core'
import type { GameMode } from '../../../shared/lobby.js'
import { isGameMode, normalizePlayerName } from '../../../shared/lobby.js'
import { describeLanding, movePosition } from '../../../shared/game.js'
import { LobbyPlayerState, LobbyState } from './schema/LobbyState.js'

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 5
const ROOM_CODES_CHANNEL = '$banco-imobiliario-room-codes'

function createRoomCode() {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)]).join('')
}

export class GameRoom extends Room<{ state: LobbyState }> {
  maxClients = 4
  state = new LobbyState()

  async onCreate(options: { mode?: unknown }) {
    const mode: GameMode = isGameMode(options.mode) ? options.mode : 'classic'
    const occupiedCodes = await this.presence.smembers(ROOM_CODES_CHANNEL)
    let roomCode = createRoomCode()
    while (occupiedCodes.includes(roomCode)) roomCode = createRoomCode()

    await this.presence.sadd(ROOM_CODES_CHANNEL, roomCode)
    this.roomId = roomCode
    this.state.roomCode = roomCode
    this.state.mode = mode
    await this.setMatchmaking({ private: true })
  }

  onAuth(_client: Client, options: { name?: unknown }) {
    return normalizePlayerName(options.name) !== null && this.state.status === 'waiting'
  }

  onJoin(client: Client, options: { name: string }) {
    const player = new LobbyPlayerState()
    player.name = normalizePlayerName(options.name) ?? 'Jogador'
    player.isHost = this.state.players.size === 0
    this.state.players.set(client.sessionId, player)
  }

  messages = {
    start: (client: Client) => {
      const player = this.state.players.get(client.sessionId)
      if (!player?.isHost) {
        client.send('room:error', { message: 'Somente a pessoa anfitriã pode iniciar a partida.' })
        return
      }
      if (this.state.status !== 'waiting') return
      if (this.state.players.size < 2) {
        client.send('room:error', { message: 'São necessários pelo menos dois jogadores para iniciar.' })
        return
      }

      this.state.status = 'playing'
      for (const player of this.state.players.values()) player.position = 0
      this.state.turnPhase = 'roll'
      this.state.activePlayerSessionId = this.state.players.keys().next().value ?? ''
      this.state.turnNumber = 1
      this.state.diceOne = 0
      this.state.diceTwo = 0
      this.state.landingDescription = ''
      this.broadcast('game:started', { mode: this.state.mode })
    },
    roll: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'roll') return
      if (client.sessionId !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Aguarde a sua vez para lançar os dados.' })
        return
      }
      const player = this.state.players.get(client.sessionId)
      if (!player) return

      const diceOne = randomInt(1, 7)
      const diceTwo = randomInt(1, 7)
      player.position = movePosition(player.position, [diceOne, diceTwo])
      this.state.diceOne = diceOne
      this.state.diceTwo = diceTwo
      this.state.landingDescription = describeLanding(player.position)
      this.state.turnPhase = 'resolve'
    },
    finishTurn: (client: Client) => {
      if (this.state.status !== 'playing' || this.state.turnPhase !== 'resolve') return
      if (client.sessionId !== this.state.activePlayerSessionId) {
        client.send('room:error', { message: 'Somente a pessoa da vez pode concluir a jogada.' })
        return
      }
      const playerIds = Array.from(this.state.players.keys())
      if (playerIds.length < 2) return
      const activeIndex = playerIds.indexOf(this.state.activePlayerSessionId)
      this.state.activePlayerSessionId = playerIds[(activeIndex + 1) % playerIds.length]
      this.state.turnNumber += 1
      this.state.turnPhase = 'roll'
      this.state.diceOne = 0
      this.state.diceTwo = 0
      this.state.landingDescription = ''
    },
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId)
    if (this.state.status === 'playing') this.state.status = 'waiting'
    if (![...this.state.players.values()].some((player) => player.isHost)) {
      const nextHost = this.state.players.values().next().value
      if (nextHost) nextHost.isHost = true
    }
  }

  onDrop(client: Client, _code: CloseCode) {
    this.allowReconnection(client, 60).catch(() => {})
  }

  async onDispose() {
    await this.presence.srem(ROOM_CODES_CHANNEL, this.roomId)
  }
}
