import { describe, expect, it } from 'vitest'
import { FESTIVAL_BANNER_HEIGHT, FESTIVAL_BANNER_PENNANT_COUNT, FESTIVAL_BANNER_STAKE_SPACING, getFestivalBannerPlacement } from './festivalBanner'

describe('bandeira de festival no tabuleiro', () => {
  it('usa duas estacas, bandeirolas coloridas e dimensões compatíveis com uma cidade', () => {
    expect(FESTIVAL_BANNER_STAKE_SPACING).toBeLessThan(0.98)
    expect(FESTIVAL_BANNER_HEIGHT).toBeLessThan(0.5)
    expect(FESTIVAL_BANNER_PENNANT_COUNT).toBe(6)

    const placement = getFestivalBannerPlacement(5, 0.98)
    expect(placement.position.slice(0, 2)).toEqual([0, 0.08])
    expect(placement.position[2]).toBeCloseTo(-0.2744)
    expect(placement.scale).toBe(1)
    expect(FESTIVAL_BANNER_STAKE_SPACING * placement.scale).toBeLessThan(0.98)
    expect(Math.abs(placement.position[2]) + 0.02 * placement.scale).toBeLessThan(0.98 / 2)
  })

  it('coloca a bandeira da borda em direção ao interior nos quatro lados do percurso', () => {
    const offsets = [5, 15, 25, 35].map((spaceId) => getFestivalBannerPlacement(spaceId, 0.98).position[2])
    const expectedOffsets = [-0.2744, -0.2744, 0.2744, 0.2744]
    expectedOffsets.forEach((expected, index) => expect(offsets[index]).toBeCloseTo(expected))
    for (const offset of offsets) expect(Math.abs(offset) + 0.02).toBeLessThan(0.98 / 2)
  })

  it('escala para pisos menores e rejeita argumentos inválidos', () => {
    expect(getFestivalBannerPlacement(5, 0.49).scale).toBe(0.5)
    expect(() => getFestivalBannerPlacement(40, 0.98)).toThrow(RangeError)
    expect(() => getFestivalBannerPlacement(5, 0)).toThrow(RangeError)
    expect(() => getFestivalBannerPlacement(5, Number.NaN)).toThrow(RangeError)
  })
})
