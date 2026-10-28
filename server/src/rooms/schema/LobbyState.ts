import { schema, t, type SchemaType } from '@colyseus/schema'

export const LobbyPlayerState = schema({
  name: t.string().default(''),
  isHost: t.boolean().default(false),
  position: t.uint8().default(0),
  cash: t.int32().default(0),
  isJailed: t.boolean().default(false),
  jailTurns: t.uint8().default(0),
})

export type LobbyPlayerState = SchemaType<typeof LobbyPlayerState>

export const PropertyState = schema({
  ownerSessionId: t.string().default(''),
  houses: t.uint8().default(0),
  isMortgaged: t.boolean().default(false),
})

export type PropertyState = SchemaType<typeof PropertyState>

export const LobbyState = schema({
  players: t.map(LobbyPlayerState),
  properties: t.map(PropertyState),
  roomCode: t.string().default(''),
  mode: t.string().default('classic'),
  status: t.string().default('waiting'),
  turnPhase: t.string().default('roll'),
  activePlayerSessionId: t.string().default(''),
  turnNumber: t.uint8().default(0),
  diceOne: t.uint8().default(0),
  diceTwo: t.uint8().default(0),
  landingDescription: t.string().default(''),
  activeCardTitle: t.string().default(''),
  activeCardDescription: t.string().default(''),
  pendingPropertyId: t.uint8().default(255),
  auctionPropertyId: t.uint8().default(255),
  auctionHighestBid: t.int32().default(0),
  auctionHighestBidderSessionId: t.string().default(''),
  auctionSeconds: t.uint8().default(0),
})

export type LobbyState = SchemaType<typeof LobbyState>
