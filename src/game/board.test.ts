import { describe, expect, it } from 'vitest'
import { boardSpaces, positionOnBoard } from './board'
import { describeLanding, movePosition } from '../../shared/game'

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
})
