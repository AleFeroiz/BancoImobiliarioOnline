import { boardSpaces, formatMoney } from '../game/board'
import { calculateRent } from '../../shared/game'

export type PropertyRentHolding = { spaceId: number; ownerSessionId: string; houses: number; isMortgaged: boolean }

export function getPropertyRentLabel(spaceId: number, holdings: readonly PropertyRentHolding[], worldCupSpaceId = -1) {
  const space = boardSpaces[spaceId]
  if (space?.kind !== 'property') return null
  const holding = holdings.find((item) => item.spaceId === spaceId)
  if (!holding?.ownerSessionId) return null
  if (holding?.isMortgaged) return 'HIPOTECADA'
  if (!space.buildable) {
    const multiplier = spaceId === worldCupSpaceId ? 3 : 1
    return `${formatMoney(50_000 * multiplier)}–${formatMoney(300_000 * multiplier)}`
  }

  const ownership = new Map(boardSpaces
    .filter((candidate) => candidate.kind === 'property')
    .map((candidate) => [candidate.id, holdings.find((item) => item.spaceId === candidate.id)?.ownerSessionId || `banco:${candidate.id}`]))
  return formatMoney(calculateRent(spaceId, ownership, holding?.houses ?? 0, false, worldCupSpaceId))
}
