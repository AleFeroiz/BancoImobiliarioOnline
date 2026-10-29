import type { Object3D } from 'three'

export const CASH_VISUAL_DENOMINATIONS = {
  goldBar: 500_000,
  silverStack: 50_000,
  banknoteStack: 10_000,
} as const

export type CashVisualBreakdown = {
  goldBars: number
  silverStacks: number
  banknoteStacks: number
  partialBanknote: number
}

export function getCashVisualBreakdown(cash: number): CashVisualBreakdown {
  let remaining = Math.max(0, Math.floor(Number.isFinite(cash) ? cash : 0))
  const goldBars = Math.floor(remaining / CASH_VISUAL_DENOMINATIONS.goldBar)
  remaining %= CASH_VISUAL_DENOMINATIONS.goldBar
  const silverStacks = Math.floor(remaining / CASH_VISUAL_DENOMINATIONS.silverStack)
  remaining %= CASH_VISUAL_DENOMINATIONS.silverStack
  const banknoteStacks = Math.floor(remaining / CASH_VISUAL_DENOMINATIONS.banknoteStack)
  remaining %= CASH_VISUAL_DENOMINATIONS.banknoteStack

  return {
    goldBars,
    silverStacks,
    banknoteStacks,
    partialBanknote: remaining / CASH_VISUAL_DENOMINATIONS.banknoteStack,
  }
}

export function representedCashValue(breakdown: CashVisualBreakdown) {
  return breakdown.goldBars * CASH_VISUAL_DENOMINATIONS.goldBar
    + breakdown.silverStacks * CASH_VISUAL_DENOMINATIONS.silverStack
    + breakdown.banknoteStacks * CASH_VISUAL_DENOMINATIONS.banknoteStack
    + breakdown.partialBanknote * CASH_VISUAL_DENOMINATIONS.banknoteStack
}

export function normalizeCashModelRoot<T extends Object3D>(model: T) {
  model.position.set(0, 0, 0)
  model.rotation.set(0, 0, 0)
  model.scale.set(1, 1, 1)
  return model
}
