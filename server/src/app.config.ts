import { Server } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { GameRoom } from './rooms/GameRoom.js'

const server = new Server({ transport: new WebSocketTransport() })
server.define('game_room', GameRoom)

export default server
