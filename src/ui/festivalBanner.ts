export const FESTIVAL_BANNER_STAKE_SPACING = 0.68
export const FESTIVAL_BANNER_HEIGHT = 0.475
export const FESTIVAL_BANNER_PENNANT_COUNT = 6

export function getFestivalBannerPlacement(spaceId: number, tileSize: number) {
  if (!Number.isInteger(spaceId) || spaceId < 0 || spaceId >= 40) throw new RangeError('spaceId must be a board index')
  if (!Number.isFinite(tileSize) || tileSize <= 0) throw new RangeError('tileSize must be a positive number')

  const inwardDirection = spaceId <= 20 ? -1 : 1
  return {
    position: [0, 0.08, tileSize * 0.28 * inwardDirection] as [number, number, number],
    scale: Math.min(1, tileSize / 0.98),
  }
}
