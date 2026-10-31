export type RegionId = 'north' | 'center-west' | 'northeast' | 'south' | 'southeast'
export type SpaceKind = 'start' | 'property' | 'event' | 'tax' | 'prison' | 'world-cup' | 'world-tour'

export type BoardSpace = {
  id: number
  name: string
  kind: SpaceKind
  color: string
  price?: number
  buildable?: boolean
  region?: RegionId
  company?: boolean
  taxAmount?: number
}

export const REGION_DETAILS: Record<RegionId, { name: string; color: string }> = {
  north: { name: 'Norte', color: '#00A6A6' },
  'center-west': { name: 'Centro-Oeste', color: '#E6B84B' },
  northeast: { name: 'Nordeste', color: '#D45087' },
  south: { name: 'Sul', color: '#4A9D68' },
  southeast: { name: 'Sudeste', color: '#3B65CC' },
}

type City = { name: string; price: number; region: RegionId }
const cities: City[] = [
  { name: 'Canaã dos Carajás', price: 200_000, region: 'north' },
  { name: 'Porto Velho', price: 250_000, region: 'north' },
  { name: 'Parauapebas', price: 275_000, region: 'north' },
  { name: 'Belém', price: 350_000, region: 'north' },
  { name: 'Manaus', price: 650_000, region: 'north' },
  { name: 'Rio Verde', price: 225_000, region: 'center-west' },
  { name: 'Cuiabá', price: 325_000, region: 'center-west' },
  { name: 'Campo Grande', price: 375_000, region: 'center-west' },
  { name: 'Goiânia', price: 500_000, region: 'center-west' },
  { name: 'Brasília', price: 725_000, region: 'center-west' },
  { name: 'Maceió', price: 300_000, region: 'northeast' },
  { name: 'São Luís', price: 400_000, region: 'northeast' },
  { name: 'Recife', price: 475_000, region: 'northeast' },
  { name: 'Salvador', price: 525_000, region: 'northeast' },
  { name: 'Fortaleza', price: 550_000, region: 'northeast' },
  { name: 'Itajaí', price: 425_000, region: 'south' },
  { name: 'Joinville', price: 450_000, region: 'south' },
  { name: 'Porto Alegre', price: 575_000, region: 'south' },
  { name: 'Curitiba', price: 625_000, region: 'south' },
  { name: 'Osasco', price: 600_000, region: 'southeast' },
  { name: 'Belo Horizonte', price: 675_000, region: 'southeast' },
  { name: 'Maricá', price: 700_000, region: 'southeast' },
  { name: 'Rio de Janeiro', price: 800_000, region: 'southeast' },
  { name: 'São Paulo', price: 950_000, region: 'southeast' },
]

const companySpaces: Record<number, string> = {
  4: 'AgroBrasil',
  14: 'Aviação Brasil',
  24: 'Energia Brasil',
  34: 'Mineração Brasil',
}
const taxSpaces: Record<number, { name: string; amount: number }> = {
  2: { name: 'Imposto de Renda', amount: 10_000 },
  12: { name: 'Taxa de Desenvolvimento', amount: 15_000 },
  22: { name: 'Imposto sobre Patrimônio', amount: 20_000 },
  32: { name: 'Contribuição Nacional', amount: 25_000 },
}
const eventSpaces = new Set([6, 16, 26, 36])
const cityIds = [1, 3, 5, 7, 8, 9, 11, 13, 15, 17, 18, 19, 21, 23, 25, 27, 28, 29, 31, 33, 35, 37, 38, 39]
const corners: Record<number, Omit<BoardSpace, 'id'>> = {
  0: { name: 'Partida', kind: 'start', color: '#edbf61' },
  10: { name: 'Prisão', kind: 'prison', color: '#8e9caa' },
  20: { name: 'Copa do Mundo', kind: 'world-cup', color: '#62a995' },
  30: { name: 'Volta ao Brasil', kind: 'world-tour', color: '#579bb3' },
}

let cityIndex = 0
export const boardSpaces: BoardSpace[] = Array.from({ length: 40 }, (_, id) => {
  if (corners[id]) return { id, ...corners[id] }
  if (companySpaces[id]) return { id, name: companySpaces[id], kind: 'property', color: '#6c91ad', price: 500_000, company: true }
  if (taxSpaces[id]) return { id, name: taxSpaces[id].name, kind: 'tax', color: '#c56f59', taxAmount: taxSpaces[id].amount }
  if (eventSpaces.has(id)) return { id, name: 'Sorte ou Revés', kind: 'event', color: '#e4a447' }
  if (!cityIds.includes(id)) throw new Error(`Casa ${id} não foi configurada.`)
  const city = cities[cityIndex++]
  if (!city) throw new Error(`Cidade ausente para a casa ${id}.`)
  return { id, name: city.name, kind: 'property', color: REGION_DETAILS[city.region].color, price: city.price, buildable: true, region: city.region }
})

export const companyIds = Object.keys(companySpaces).map(Number)
export const taxIds = Object.keys(taxSpaces).map(Number)

export function getLineTitleIds(sideIndex: number) {
  if (!Number.isInteger(sideIndex) || sideIndex < 0 || sideIndex > 3) return []
  const start = sideIndex * 10
  return boardSpaces.filter((space) => space.id > start && space.id < start + 10 && (space.buildable || space.company)).map((space) => space.id)
}
