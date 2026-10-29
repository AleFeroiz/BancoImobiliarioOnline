export type SpaceKind = 'start' | 'property' | 'event' | 'tax' | 'rest' | 'prison' | 'go-to-prison'

export type BoardSpace = {
  id: number
  name: string
  kind: SpaceKind
  color: string
  price?: number
  buildable?: boolean
}

const colorGroups = ['#d66b55', '#e0ad51', '#6da998', '#8295ca', '#c8789a', '#6f9c73', '#53a6bd', '#a979b2']
const properties: Array<[string, number]> = [
  ['Vila do Sol', 60000], ['Jardim das Flores', 80000], ['Praça Central', 110000],
  ['Rua das Palmeiras', 120000], ['Alameda Azul', 140000], ['Porto Dourado', 160000],
  ['Lago Sereno', 180000], ['Colina Verde', 200000], ['Centro Antigo', 220000],
  ['Avenida Imperial', 260000], ['Jardins do Norte', 280000], ['Parque das Águas', 300000],
  ['Costa Branca', 330000], ['Mirante Alto', 360000], ['Boulevard Real', 400000],
  ['Ilha das Palmeiras', 430000], ['Vale das Nuvens', 460000], ['Distrito Solar', 500000],
  ['Alameda Real', 540000], ['Morro do Farol', 580000], ['Jardim Imperial', 620000],
  ['Porto das Estrelas', 660000], ['Avenida do Horizonte', 720000], ['Parque Imperial', 780000],
]

const specialSpaces: Record<number, Omit<BoardSpace, 'id'>> = {
  0: { name: 'Partida', kind: 'start', color: '#edbf61' },
  4: { name: 'Taxa urbana', kind: 'tax', color: '#c56f59' },
  8: { name: 'Sorte ou Revés', kind: 'event', color: '#e4a447' },
  9: { name: 'Praça', kind: 'rest', color: '#81a998' },
  10: { name: 'Visita à prisão', kind: 'prison', color: '#8e9caa' },
  14: { name: 'Sorte ou Revés', kind: 'event', color: '#e4a447' },
  18: { name: 'Taxa de serviço', kind: 'tax', color: '#c56f59' },
  19: { name: 'Estação Central', kind: 'property', color: '#6c91ad', price: 180000 },
  20: { name: 'Parada livre', kind: 'rest', color: '#81a998' },
  24: { name: 'Sorte ou Revés', kind: 'event', color: '#e4a447' },
  28: { name: 'Taxa de luxo', kind: 'tax', color: '#c56f59' },
  29: { name: 'Aeroporto', kind: 'property', color: '#6c91ad', price: 240000 },
  30: { name: 'Vá para a prisão', kind: 'go-to-prison', color: '#a96f63' },
  34: { name: 'Sorte ou Revés', kind: 'event', color: '#e4a447' },
  38: { name: 'Imposto especial', kind: 'tax', color: '#c56f59' },
  39: { name: 'Estação do Porto', kind: 'property', color: '#6c91ad', price: 280000 },
}

let residentialIndex = 0

export const boardSpaces: BoardSpace[] = Array.from({ length: 40 }, (_, id) => {
  const special = specialSpaces[id]
  if (special) return { id, ...special }
  const property = properties[residentialIndex]
  const color = colorGroups[Math.floor(residentialIndex / 3)]
  if (!property || !color) throw new Error(`Configuração incompleta da casa residencial ${id}.`)
  residentialIndex += 1
  const [name, price] = property
  return {
    id,
    name,
    kind: 'property',
    color,
    price,
    buildable: true,
  }
})
