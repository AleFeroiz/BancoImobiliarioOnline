export type GraphicsQuality = 'performance' | 'balanced' | 'high'
export const DEFAULT_GRAPHICS_QUALITY: GraphicsQuality = 'high'

export function getGraphicsDprRange(quality: GraphicsQuality): [number, number] {
  if (quality === 'performance') return [0.8, 1]
  if (quality === 'balanced') return [1, 1.4]
  return [1, 2]
}
