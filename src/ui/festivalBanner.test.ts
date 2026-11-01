import { describe, expect, it } from 'vitest'
import { FESTIVAL_BANNER_HEIGHT, FESTIVAL_BANNER_PENNANT_COUNT, FESTIVAL_BANNER_STAKE_SPACING, getFestivalBannerPlacement } from './festivalBanner'

describe('bandeira de festival no tabuleiro', () => {
  it('usa duas estacas, bandeirolas coloridas e dimensões compatíveis com uma cidade', () => {
    expect(FESTIVAL_BANNER_STAKE_SPACING).toBeLessThan(0.98)
    expect(FESTIVAL_BANNER_HEIGHT).toBeLessThan(0.5)
    expect(FESTIVAL_BANNER_PENNANT_COUNT).toBe(6)

    const placement = getFestivalBannerPlacement(0.98)
    expect(placement.position.slice(0, 2)).toEqual([0, 0.08])
    expect(placement.position[2]).toBeCloseTo(0.2744)
    expect(placement.scale).toBe(1)
    expect(FESTIVAL_BANNER_STAKE_SPACING * placement.scale).toBeLessThan(0.98)
    expect(placement.position[2] + 0.02 * placement.scale).toBeLessThan(0.98 / 2)
  })

  it('escala para pisos menores e rejeita dimensões inválidas', () => {
    expect(getFestivalBannerPlacement(0.49).scale).toBe(0.5)
    expect(() => getFestivalBannerPlacement(0)).toThrow(RangeError)
    expect(() => getFestivalBannerPlacement(Number.NaN)).toThrow(RangeError)
  })
})
