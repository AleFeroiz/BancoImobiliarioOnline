export type RoulettePoint = [number, number]

function squareBoundaryPoint(angle: number, halfSize: number): RoulettePoint {
  const x = Math.cos(angle)
  const y = Math.sin(angle)
  const edgeDistance = halfSize / Math.max(Math.abs(x), Math.abs(y))
  return [x * edgeDistance, y * edgeDistance]
}

export function getRouletteFloorSectors(size: number, sectorCount = 8): RoulettePoint[][] {
  const halfSize = Math.max(0, size) / 2
  const safeSectorCount = Math.max(1, Math.floor(sectorCount))
  return Array.from({ length: safeSectorCount }, (_, index) => {
    const start = index * Math.PI * 2 / safeSectorCount
    const end = (index + 1) * Math.PI * 2 / safeSectorCount
    return [[0, 0], squareBoundaryPoint(start, halfSize), squareBoundaryPoint(end, halfSize)]
  })
}

export function getPolygonArea(polygon: readonly RoulettePoint[]) {
  return Math.abs(polygon.reduce((area, [x, y], index) => {
    const [nextX, nextY] = polygon[(index + 1) % polygon.length] ?? [0, 0]
    return area + x * nextY - nextX * y
  }, 0)) / 2
}
