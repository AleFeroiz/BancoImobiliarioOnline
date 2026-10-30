export function adjustMoneyValue(value: number, direction: -1 | 1, step: number, minimum: number, maximum: number) {
  const lower = Math.max(0, Math.trunc(minimum))
  const upper = Math.max(lower, Math.trunc(maximum))
  const current = Number.isFinite(value) ? Math.trunc(value) : lower
  return Math.max(lower, Math.min(upper, current + direction * Math.max(1, Math.trunc(step))))
}
