export { boardSpaces, type BoardSpace, type SpaceKind } from '../../shared/board'

export function positionOnBoard(id: number) {
  if (id <= 10) return { x: -5 + id, z: 5 }
  if (id <= 20) return { x: 5, z: 15 - id }
  if (id <= 30) return { x: 25 - id, z: -5 }
  return { x: -5, z: id - 35 }
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}
