import { schema, t, type SchemaType } from '@colyseus/schema'

export const LobbyPlayerState = schema({
  name: t.string().default(''),
  isHost: t.boolean().default(false),
})

export type LobbyPlayerState = SchemaType<typeof LobbyPlayerState>

export const LobbyState = schema({
  players: t.map(LobbyPlayerState),
  roomCode: t.string().default(''),
  mode: t.string().default('classic'),
  status: t.string().default('waiting'),
})

export type LobbyState = SchemaType<typeof LobbyState>
