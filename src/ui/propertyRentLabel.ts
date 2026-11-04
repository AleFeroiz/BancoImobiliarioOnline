import { boardSpaces, formatMoney } from '../game/board'
import { PROPERTY_HOTEL_LEVEL, bankReturnValue, buildingSaleValue, calculateCompanyRent, calculateRent } from '../../shared/game'

export type PropertyRentHolding = { spaceId: number; ownerSessionId: string; houses: number; blackoutTurns?: number; ownerColor?: string }

export function canShowLiquidationValues(turnPhase: string, localSessionId: string, activePlayerSessionId: string) {
  return turnPhase === 'debt' && Boolean(localSessionId) && localSessionId === activePlayerSessionId
}

export function getPropertyLiquidationLabel(spaceId: number, holdings: readonly PropertyRentHolding[]) {
  const space = boardSpaces[spaceId]
  const holding = holdings.find((item) => item.spaceId === spaceId)
  if (space?.kind !== 'property' || !holding?.ownerSessionId) return null
  return formatMoney(holding.houses > 0 ? buildingSaleValue(spaceId, holding.houses) : bankReturnValue(spaceId))
}

export function getPropertyRentLabel(spaceId: number, holdings: readonly PropertyRentHolding[], worldCupSpaceId = -1, festivalSpaceIds: ReadonlySet<number> = new Set(), worldCupMultiplier = 2, festivalMultiplier = 2) {
  const space = boardSpaces[spaceId]
  if (space?.kind !== 'property') return null
  const holding = holdings.find((item) => item.spaceId === spaceId)
  if (!holding?.ownerSessionId) return null
  if (!space.company && (holding.blackoutTurns ?? 0) > 0 && holding.houses !== PROPERTY_HOTEL_LEVEL) return formatMoney(0)
  const ownership = new Map(boardSpaces
    .filter((candidate) => candidate.kind === 'property')
    .map((candidate) => [candidate.id, holdings.find((item) => item.spaceId === candidate.id)?.ownerSessionId || `banco:${candidate.id}`]))
  if (space.company) return `${formatMoney(calculateCompanyRent(ownership, holding.ownerSessionId) * (spaceId === worldCupSpaceId ? worldCupMultiplier : 1))} × D6`
  return formatMoney(calculateRent(spaceId, ownership, holding?.houses ?? 0, worldCupSpaceId, festivalSpaceIds, worldCupMultiplier, festivalMultiplier))
}

export function getPropertyBoardLabel(spaceId: number, holdings: readonly PropertyRentHolding[], worldCupSpaceId = -1, festivalSpaceIds: ReadonlySet<number> = new Set(), showLiquidation = false, worldCupMultiplier = 2, festivalMultiplier = 2) {
  const space = boardSpaces[spaceId]
  const holding = holdings.find((item) => item.spaceId === spaceId)
  const rent = getPropertyRentLabel(spaceId, holdings, worldCupSpaceId, festivalSpaceIds, worldCupMultiplier, festivalMultiplier)
  if (space?.kind !== 'property' || !holding?.ownerSessionId || !rent) return null
  return {
    name: space.name,
    ownerColor: holding.ownerColor ?? '#243b2e',
    rent,
    liquidation: showLiquidation ? getPropertyLiquidationLabel(spaceId, holdings) : null,
  }
}
