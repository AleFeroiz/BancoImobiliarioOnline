export function stepDieValue(value: number, step: number) {
  if (!Number.isInteger(value) || value < 1 || value > 6 || !Number.isInteger(step)) throw new RangeError('O dado deve permanecer entre 1 e 6.')
  return ((value - 1 + step) % 6 + 6) % 6 + 1
}
