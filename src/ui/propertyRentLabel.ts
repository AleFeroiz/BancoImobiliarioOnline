import { boardSpaces, formatMoney } from '../game/board'
import { PROPERTY_HOTEL_LEVEL, calculateCompanyRent, calculateRent } from '../../shared/game'

export type PropertyRentHolding = { spaceId: number; ownerSessionId: string; houses: number; blackoutTurns?: number }

export function getPropertyRentLabel(spaceId: number, holdings: readonly PropertyRentHolding[], worldCupSpaceId = -1) {
  const space = boardSpaces[spaceId]
  if (space?.kind !== 'property') return null
  const holding = holdings.find((item) => item.spaceId === spaceId)
  if (!holding?.ownerSessionId) return null
  if ((holding.blackoutTurns ?? 0) > 0 && holding.houses !== PROPERTY_HOTEL_LEVEL) return formatMoney(0)
  const ownership = new Map(boardSpaces
    .filter((candidate) => candidate.kind === 'property')
    .map((candidate) => [candidate.id, holdings.find((item) => item.spaceId === candidate.id)?.ownerSessionId || `banco:${candidate.id}`]))
  if (space.company) return formatMoney(calculateCompanyRent(ownership, holding.ownerSessionId) * (spaceId === worldCupSpaceId ? 3 : 1))
  return formatMoney(calculateRent(spaceId, ownership, holding?.houses ?? 0, worldCupSpaceId))
}
