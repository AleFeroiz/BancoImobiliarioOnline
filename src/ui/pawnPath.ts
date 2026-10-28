export function getPawnStepPath(from: number, to: number, boardLength = 40) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || !Number.isInteger(boardLength) || boardLength < 1) return []
  if (from < 0 || from >= boardLength || to < 0 || to >= boardLength) return []
  const steps = (to - from + boardLength) % boardLength
  return Array.from({ length: steps }, (_, index) => (from + index + 1) % boardLength)
}
