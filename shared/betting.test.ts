import { describe, expect, it } from 'vitest'
import { BET_MINIMUM, BET_PROFILES, betLimit, betPayout, betWon, chooseBetProfiles } from './betting.js'

describe('apostas', () => {
  it('limita a aposta a metade do saldo inicial e ao saldo disponível', () => {
    expect(betLimit(2_000_000, 2_000_000)).toBe(1_000_000)
    expect(betLimit(2_000_000, 55_555)).toBe(50_000)
    expect(betLimit(19_999, 2_000_000)).toBe(0)
    expect(betLimit(-1, 2_000_000)).toBe(0)
    expect(betLimit(2_000_000, -1)).toBe(0)
  })

  it('calcula recebimento total incluindo a devolução da aposta', () => {
    expect(betPayout(100_000, BET_PROFILES.find((profile) => profile.id === 'safe-60')!)).toBe(150_000)
    expect(betPayout(100_000, BET_PROFILES.find((profile) => profile.id === 'balanced-35')!)).toBe(250_000)
    expect(betPayout(100_000, BET_PROFILES.find((profile) => profile.id === 'long-15')!)).toBe(600_000)
    expect(betPayout(BET_MINIMUM - 1, BET_PROFILES[0]!)).toBe(0)
  })

  it('seleciona exatamente um perfil de cada faixa', () => {
    const result = chooseBetProfiles((max) => max - 1)
    expect(result.map((profile) => profile.id)).toEqual(['safe-70', 'balanced-45', 'long-20'])
  })

  it('usa a fronteira inferior inclusiva e nunca usa a superior como vitória', () => {
    expect(betWon(5999, 6000)).toBe(true)
    expect(betWon(6000, 6000)).toBe(false)
    expect(betWon(-1, 6000)).toBe(false)
    expect(betWon(10_000, 0)).toBe(false)
  })

  it('mantém todas as combinações com retorno médio ligeiramente desfavorável', () => {
    for (const profile of BET_PROFILES) {
      const expectedReturn = profile.chance / 10_000 * profile.payoutNumerator / profile.payoutDenominator
      expect(expectedReturn).toBeGreaterThanOrEqual(0.875)
      expect(expectedReturn).toBeLessThanOrEqual(0.91)
    }
  })
})
