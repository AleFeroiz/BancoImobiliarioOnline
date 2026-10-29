import { Box3, Vector3, type Object3D } from 'three'

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

export function getCashHudPieceCounts(cash: number) {
  const breakdown = getCashVisualBreakdown(cash)
  return {
    gold: Math.min(3, breakdown.goldBars),
    silver: Math.min(3, breakdown.silverStacks),
    note: Math.min(3, breakdown.banknoteStacks + Number(breakdown.partialBanknote > 0)),
  }
}

export function representedCashValue(breakdown: CashVisualBreakdown) {
  return breakdown.goldBars * CASH_VISUAL_DENOMINATIONS.goldBar
    + breakdown.silverStacks * CASH_VISUAL_DENOMINATIONS.silverStack
    + breakdown.banknoteStacks * CASH_VISUAL_DENOMINATIONS.banknoteStack
    + breakdown.partialBanknote * CASH_VISUAL_DENOMINATIONS.banknoteStack
}

export function fitCashModelRoot<T extends Object3D>(model: T, targetHeight: number, rotation: [number, number, number] = [0, 0, 0]) {
  model.position.set(0, 0, 0)
  model.rotation.set(...rotation)
  model.scale.set(1, 1, 1)
  model.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(model)
  if (bounds.isEmpty()) return model
  const size = bounds.getSize(new Vector3())
  if (size.y <= 0) return model
  const center = bounds.getCenter(new Vector3())
  const scale = targetHeight / size.y
  model.scale.setScalar(scale)
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
  model.updateMatrixWorld(true)
  return model
}
