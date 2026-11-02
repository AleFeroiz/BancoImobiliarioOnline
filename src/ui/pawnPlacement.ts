import { positionOnBoard } from '../game/board'
import { getBoardSpaceDecoration } from './boardDecoration'
import { getFestivalBannerPlacement } from './festivalBanner'

export const PAWN_STACK_SPACING = 0.72

export type PawnStackParticipant = { id: string; position: number; seatIndex: number }

export function getPawnStackIndices(players: readonly PawnStackParticipant[]) {
  const playersBySpace = new Map<number, PawnStackParticipant[]>()
  for (const player of players) {
    const stack = playersBySpace.get(player.position) ?? []
    stack.push(player)
    playersBySpace.set(player.position, stack)
  }

  const indices = new Map<string, number>()
  for (const stack of playersBySpace.values()) {
    stack.sort((first, second) => first.seatIndex - second.seatIndex || first.id.localeCompare(second.id))
    stack.forEach((player, index) => indices.set(player.id, index))
  }
  return indices
}

export function getPawnTilePosition(spaceId: number, baseY: number, stackIndex = 0, tileSize = 0.98) {
  if (!Number.isInteger(spaceId) || spaceId < 0 || spaceId >= 40) throw new RangeError('spaceId must be a board index')
  if (!Number.isFinite(baseY)) throw new RangeError('baseY must be finite')
  if (!Number.isInteger(stackIndex) || stackIndex < 0) throw new RangeError('stackIndex must be a non-negative integer')

  const tile = positionOnBoard(spaceId)
  let offsetX = 0
  let offsetZ = 0

  if (spaceId % 10 !== 0) {
    const banner = getFestivalBannerPlacement(spaceId, tileSize)
    const rotation = getBoardSpaceDecoration(spaceId).tileRotation
    offsetX = Math.sin(rotation) * banner.position[2]
    offsetZ = Math.cos(rotation) * banner.position[2]
  }

  return {
    x: tile.x + offsetX,
    y: baseY + stackIndex * PAWN_STACK_SPACING,
    z: tile.z + offsetZ,
  }
}
