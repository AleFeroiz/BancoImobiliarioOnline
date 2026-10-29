import { schema, t, type SchemaType } from '@colyseus/schema'

export const LobbyPlayerState = schema({
  name: t.string().default(''),
  isHost: t.boolean().default(false),
  isConnected: t.boolean().default(true),
  reconnectionExpired: t.boolean().default(false),
  isBot: t.boolean().default(false),
  isBotControlled: t.boolean().default(false),
  position: t.uint8().default(0),
  cash: t.int32().default(0),
  isJailed: t.boolean().default(false),
  jailTurns: t.uint8().default(0),
  isBankrupt: t.boolean().default(false),
  finalCash: t.int32().default(0),
  finalNetWorth: t.int32().default(0),
  tieBreakRoll: t.uint8().default(0),
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
  turnNumber: t.uint16().default(0),
  matchSeconds: t.uint16().default(0),
  matchEnding: t.boolean().default(false),
  expressRound: t.uint8().default(0),
  phaseSeconds: t.uint8().default(0),
  diceOne: t.uint8().default(0),
  diceTwo: t.uint8().default(0),
  diceSequence: t.uint32().default(0),
  landingDescription: t.string().default(''),
  activeCardTitle: t.string().default(''),
  activeCardDescription: t.string().default(''),
  pendingPropertyId: t.uint8().default(255),
  debtAmount: t.int32().default(0),
  debtCreditorSessionId: t.string().default(''),
  debtReason: t.string().default(''),
  winnerSessionId: t.string().default(''),
  tradeSeconds: t.uint8().default(0),
  tradeOfferId: t.uint32().default(0),
  tradeOfferFromSessionId: t.string().default(''),
  tradeOfferToSessionId: t.string().default(''),
  tradeOfferCashOffered: t.int32().default(0),
  tradeOfferCashRequested: t.int32().default(0),
  tradeOfferPropertiesOffered: t.string().default(''),
  tradeOfferPropertiesRequested: t.string().default(''),
  auctionId: t.uint32().default(0),
  auctionPropertyId: t.uint8().default(255),
  auctionSellerSessionId: t.string().default(''),
  auctionStartingBid: t.int32().default(0),
  auctionHighestBid: t.int32().default(0),
  auctionHighestBidderSessionId: t.string().default(''),
  auctionSeconds: t.uint8().default(0),
})

export type LobbyState = SchemaType<typeof LobbyState>
