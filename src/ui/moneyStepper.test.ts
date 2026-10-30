import { describe, expect, it } from 'vitest'
import { adjustMoneyValue } from './moneyStepper'

describe('controle de valores em dinheiro', () => {
  it('avança e volta pelo incremento escolhido', () => {
    expect(adjustMoneyValue(20_000, 1, 10_000, 0, 100_000)).toBe(30_000)
    expect(adjustMoneyValue(20_000, -1, 10_000, 0, 100_000)).toBe(10_000)
  })

  it('não ultrapassa o saldo nem desce abaixo do mínimo', () => {
    expect(adjustMoneyValue(95_000, 1, 10_000, 0, 100_000)).toBe(100_000)
    expect(adjustMoneyValue(5_000, -1, 10_000, 0, 100_000)).toBe(0)
    expect(adjustMoneyValue(40_000, 1, 10_000, 50_000, 60_000)).toBe(50_000)
  })
})
