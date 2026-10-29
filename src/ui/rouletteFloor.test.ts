import { describe, expect, it } from 'vitest'
import { boardSpaces } from '../game/board'
import { getBoardTileTheme } from './boardTileTheme'
import { getPolygonArea, getRouletteFloorSectors } from './rouletteFloor'

describe('piso-roleta das casas Sorte ou Revés', () => {
  it('divide a superfície inteira da casa em fatias que chegam às quatro bordas', () => {
    const size = 0.98
    const sectors = getRouletteFloorSectors(size)
    const allPoints = sectors.flat()

    expect(sectors).toHaveLength(8)
    expect(sectors.reduce((area, sector) => area + getPolygonArea(sector), 0)).toBeCloseTo(size * size)
    expect(Math.min(...allPoints.map(([x]) => x))).toBeCloseTo(-size / 2)
    expect(Math.max(...allPoints.map(([x]) => x))).toBeCloseTo(size / 2)
    expect(Math.min(...allPoints.map(([, z]) => z))).toBeCloseTo(-size / 2)
    expect(Math.max(...allPoints.map(([, z]) => z))).toBeCloseTo(size / 2)
  })

  it('mantém a roleta nos quatro espaços de evento sem alterar as regras do tabuleiro', () => {
    const eventSpaces = boardSpaces.filter((space) => space.kind === 'event')
    expect(eventSpaces).toHaveLength(4)
    expect(eventSpaces.every((space) => getBoardTileTheme(space, false).floor === '#d89d3d')).toBe(true)
  })
})
