import type { BoardSpace } from './board.js'

export function isWorldCupVenue(space: BoardSpace | undefined) {
  return space?.kind === 'property' && space.company !== true
}
