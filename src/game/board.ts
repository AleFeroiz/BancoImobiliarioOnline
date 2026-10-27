export type SpaceKind = 'start' | 'property' | 'event' | 'tax' | 'rest' | 'prison' | 'go-to-prison'

export type BoardSpace = {
  id: number
  name: string
  kind: SpaceKind
  color: string
  price?: number
}

const colorGroups = ['#d66b55', '#e0ad51', '#6da998', '#8295ca', '#c8789a', '#6f9c73', '#53a6bd']
const properties: Array<[string, number]> = [
  ['Vila do Sol', 60000], ['Jardim das Flores', 80000], ['Praça Central', 110000],
  ['Rua das Palmeiras', 120000], ['Alameda Azul', 140000], ['Porto Dourado', 160000],
  ['Lago Sereno', 180000], ['Colina Verde', 200000], ['Centro Antigo', 220000],
  ['Avenida Imperial', 260000], ['Jardins do Norte', 280000], ['Parque das Águas', 300000],
  ['Costa Branca', 330000], ['Mirante Alto', 360000], ['Boulevard Real', 400000],
  ['Ilha das Palmeiras', 430000], ['Vale das Nuvens', 460000], ['Distrito Solar', 500000],
  ['Alameda Real', 540000], ['Morro do Farol', 580000], ['Jardim Imperial', 620000],
  ['Porto das Estrelas', 660000], ['Avenida do Horizonte', 720000], ['Parque Imperial', 780000],
  ['Cidade Alta', 840000], ['Costa Esmeralda', 900000], ['Praça das Nações', 960000],
  ['Ilha do Tesouro', 1040000], ['Mirante das Estrelas', 1120000], ['Avenida das Artes', 1200000],
]

const specialSpaces: Record<number, Omit<BoardSpace, 'id'>> = {
  0: { name: 'Partida', kind: 'start', color: '#edbf61' },
  2: { name: 'Sorte ou Revés', kind: 'event', color: '#e4a447' },
  4: { name: 'Taxa urbana', kind: 'tax', color: '#c56f59' },
  7: { name: 'Praça', kind: 'rest', color: '#81a998' },
  10: { name: 'Visita à prisão', kind: 'prison', color: '#8e9caa' },
  12: { name: 'Sorte ou Revés', kind: 'event', color: '#e4a447' },
  15: { name: 'Estação Central', kind: 'property', color: '#6c91ad', price: 180000 },
  18: { name: 'Taxa de serviço', kind: 'tax', color: '#c56f59' },
  20: { name: 'Parada livre', kind: 'rest', color: '#81a998' },
  22: { name: 'Sorte ou Revés', kind: 'event', color: '#e4a447' },
  25: { name: 'Aeroporto', kind: 'property', color: '#6c91ad', price: 240000 },
  28: { name: 'Taxa de luxo', kind: 'tax', color: '#c56f59' },
  30: { name: 'Vá para a prisão', kind: 'go-to-prison', color: '#a96f63' },
  32: { name: 'Sorte ou Revés', kind: 'event', color: '#e4a447' },
  35: { name: 'Estação do Porto', kind: 'property', color: '#6c91ad', price: 280000 },
  38: { name: 'Imposto especial', kind: 'tax', color: '#c56f59' },
}

export const boardSpaces: BoardSpace[] = Array.from({ length: 40 }, (_, id) => {
  const special = specialSpaces[id]
  if (special) return { id, ...special }
  const propertyIndex = Math.max(0, id - Math.floor(id / 10) * 2 - 1)
  const [name, price] = properties[propertyIndex % properties.length]
  return {
    id,
    name,
    kind: 'property',
    color: colorGroups[Math.floor(propertyIndex / 2) % colorGroups.length],
    price,
  }
})

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
