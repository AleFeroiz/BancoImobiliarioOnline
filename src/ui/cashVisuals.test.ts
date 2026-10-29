import { describe, expect, it } from 'vitest'
import { CASH_VISUAL_DENOMINATIONS, getCashVisualBreakdown, representedCashValue } from './cashVisuals'

describe('representação visual do dinheiro no tabuleiro', () => {
  it('usa barras de ouro, prata e maços de notas com valores fixos e decrescentes', () => {
    expect(CASH_VISUAL_DENOMINATIONS).toEqual({ goldBar: 500_000, silverStack: 50_000, banknoteStack: 10_000 })
    expect(getCashVisualBreakdown(1_220_000)).toEqual({ goldBars: 2, silverStacks: 4, banknoteStacks: 2, partialBanknote: 0 })
  })

  it.each([0, -50_000, 1_000, 9_999, 10_000, 49_999, 50_000, 499_999, 500_000, 1_220_000, 1_500_000, 9_999_999])(
    'representa o saldo %i sem perder valor', (cash) => {
      const breakdown = getCashVisualBreakdown(cash)
      expect(representedCashValue(breakdown)).toBe(Math.max(0, Math.floor(cash)))
      expect(breakdown.partialBanknote).toBeGreaterThanOrEqual(0)
      expect(breakdown.partialBanknote).toBeLessThan(1)
    },
  )

  it('trata saldo não finito como zero', () => {
    expect(getCashVisualBreakdown(Number.NaN)).toEqual({ goldBars: 0, silverStacks: 0, banknoteStacks: 0, partialBanknote: 0 })
  })
})
