import { describe, expect, it } from 'vitest'
import { DEFAULT_GRAPHICS_QUALITY, getGraphicsDprRange, getLowerGraphicsQuality } from './graphicsQuality'

describe('qualidade gráfica da cena', () => {
  it('usa alta resolução como padrão e oferece perfis de desempenho menores', () => {
    expect(DEFAULT_GRAPHICS_QUALITY).toBe('high')
    expect(getGraphicsDprRange(DEFAULT_GRAPHICS_QUALITY)).toEqual([1, 2])
    expect(getGraphicsDprRange('balanced')[1]).toBeLessThan(getGraphicsDprRange('high')[1])
    expect(getGraphicsDprRange('performance')[1]).toBeLessThan(getGraphicsDprRange('balanced')[1])
  })

  it('reduz a resolução automaticamente após uma perda persistente do contexto WebGL', () => {
    expect(getLowerGraphicsQuality('high')).toBe('balanced')
    expect(getLowerGraphicsQuality('balanced')).toBe('performance')
    expect(getLowerGraphicsQuality('performance')).toBe('performance')
  })
})
