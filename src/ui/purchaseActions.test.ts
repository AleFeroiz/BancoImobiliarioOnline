import { describe, expect, it } from 'vitest'
import { canAffordPurchase } from './purchaseActions'

describe('disponibilidade da compra de propriedade', () => {
  it('impede uma compra acima do saldo disponível', () => {
    expect(canAffordPurchase(260_000, 1_200_000)).toBe(false)
  })

  it('permite a compra quando o saldo cobre exatamente o preço', () => {
    expect(canAffordPurchase(1_200_000, 1_200_000)).toBe(true)
  })
})
