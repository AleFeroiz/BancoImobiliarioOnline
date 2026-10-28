import { describe, expect, it } from 'vitest'
import { boardSpaces, positionOnBoard } from './board'
import { STARTING_CASH, calculateRent, describeLanding, movePosition, taxForSpace } from '../../shared/game'

describe('tabuleiro', () => {
  it('tem 40 casas com identificadores únicos e em ordem', () => {
    expect(boardSpaces).toHaveLength(40)
    expect(boardSpaces.map(({ id }) => id)).toEqual(Array.from({ length: 40 }, (_, id) => id))
  })

  it('posiciona cada casa em uma coordenada única ao redor do tabuleiro', () => {
    const coordinates = boardSpaces.map(({ id }) => positionOnBoard(id))
    const uniqueCoordinates = new Set(coordinates.map(({ x, z }) => `${x},${z}`))

    expect(uniqueCoordinates.size).toBe(40)
    expect(coordinates.every(({ x, z }) => Math.abs(x) === 5 || Math.abs(z) === 5)).toBe(true)
  })

  it('identifica a partida e mantém preço nas propriedades', () => {
    expect(boardSpaces[0]).toMatchObject({ name: 'Partida', kind: 'start' })

    const properties = boardSpaces.filter(({ kind }) => kind === 'property')
    expect(properties.length).toBeGreaterThan(0)
    expect(properties.every(({ price }) => typeof price === 'number' && price > 0)).toBe(true)
  })

  it('move pelo resultado dos dados e volta ao início ao completar uma volta', () => {
    expect(movePosition(37, [2, 3])).toBe(2)
    expect(movePosition(10, [1, 1])).toBe(12)
  })

  it('descreve a casa alcançada sem aplicar efeitos econômicos ainda não definidos', () => {
    expect(describeLanding(15)).toContain('Estação Central')
    expect(describeLanding(15)).toContain('Você parou em uma propriedade')
    expect(() => describeLanding(40)).toThrow(RangeError)
  })

  it('calcula aluguel base e dobra quando a mesma pessoa completa o grupo', () => {
    const property = boardSpaces.find((space) => space.kind === 'property')!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.color === property.color)
    const owner = new Map(group.map((space) => [space.id, 'jogador-1']))
    const base = Math.max(10_000, Math.floor((property.price ?? 0) * 0.1))

    expect(STARTING_CASH).toBe(1_500_000)
    expect(calculateRent(property.id, new Map([[property.id, 'jogador-1']]))).toBe(base)
    expect(calculateRent(property.id, owner)).toBe(base * 2)
    expect(calculateRent(property.id, owner, 2)).toBe(base * 2 + Math.floor((property.price ?? 0) * 0.1) * 2)
  })

  it('usa taxas fixas nas quatro casas de taxa', () => {
    expect([4, 18, 28, 38].map(taxForSpace)).toEqual([50_000, 75_000, 100_000, 125_000])
    expect(taxForSpace(0)).toBe(0)
  })
})
