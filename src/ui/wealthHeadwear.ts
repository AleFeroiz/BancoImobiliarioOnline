import { calculateNetWorth, type PropertyHolding } from '../../shared/game'

type RankedPlayer = { id: string; seatIndex: number; cash: number }
type OwnedProperty = { spaceId: number; ownerSessionId: string; houses: number }

export type WealthHeadwear = { richestId: string | null; poorestId: string | null }

export function getWealthHeadwear(players: readonly RankedPlayer[], properties: readonly OwnedProperty[]): WealthHeadwear {
  if (players.length < 2) return { richestId: null, poorestId: null }

  const holdings = new Map<number, PropertyHolding>(properties.map(({ spaceId, ownerSessionId, houses }) => [spaceId, { ownerSessionId, houses }]))
  const ranked = players.map((player) => ({ ...player, wealth: calculateNetWorth(player.id, player.cash, holdings) }))
    .sort((first, second) => second.wealth - first.wealth || first.seatIndex - second.seatIndex || first.id.localeCompare(second.id))

  if (ranked[0]!.wealth === ranked[ranked.length - 1]!.wealth) return { richestId: null, poorestId: null }

  const poorestWealth = ranked[ranked.length - 1]!.wealth
  const poorest = ranked.find((player) => player.wealth === poorestWealth)!
  return { richestId: ranked[0]!.id, poorestId: poorest.id }
}
