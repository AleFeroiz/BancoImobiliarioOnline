export const FESTIVAL_BANNER_STAKE_SPACING = 0.68
export const FESTIVAL_BANNER_HEIGHT = 0.475
export const FESTIVAL_BANNER_PENNANT_COUNT = 6

export function getFestivalBannerPlacement(tileSize: number) {
  if (!Number.isFinite(tileSize) || tileSize <= 0) throw new RangeError('tileSize must be a positive number')

  return {
    position: [0, 0.08, tileSize * 0.28] as [number, number, number],
    scale: Math.min(1, tileSize / 0.98),
  }
}
