import { describe, expect, it } from 'vitest'
import { boardSpaces } from '../game/board'
import { getBoardTileTheme } from './boardTileTheme'

describe('cores dos pisos do tabuleiro', () => {
  it('usa a cor completa do grupo em cada imóvel residencial', () => {
    const residentialSpaces = boardSpaces.filter((space) => space.kind === 'property' && space.buildable)

    expect(residentialSpaces.length).toBe(24)
    for (const space of residentialSpaces) {
      expect(getBoardTileTheme(space, false).floor, space.name).toBe(space.color)
    }
  })

  it('separa estações, sorte ou revés, taxas e descanso dos imóveis residenciais', () => {
    const byName = (name: string) => boardSpaces.find((space) => space.name === name)!
    const residential = getBoardTileTheme(byName('Vila do Sol'), false).floor

    expect(getBoardTileTheme(byName('Estação Central'), false).floor).not.toBe(residential)
    expect(getBoardTileTheme(byName('Sorte ou Revés'), false).floor).not.toBe(residential)
    expect(getBoardTileTheme(byName('Taxa urbana'), false).floor).not.toBe(residential)
    expect(getBoardTileTheme(byName('Praça'), false).floor).not.toBe(residential)
  })

  it('destaca todas as casas Sorte ou Revés com o piso dourado da roleta', () => {
    const eventSpaces = boardSpaces.filter((space) => space.kind === 'event')
    const eventFloors = new Set(eventSpaces.map((space) => getBoardTileTheme(space, false).floor))

    expect(eventSpaces).toHaveLength(4)
    expect(eventFloors).toEqual(new Set(['#d89d3d']))
    expect(eventFloors.has(getBoardTileTheme(boardSpaces[1]!, false).floor)).toBe(false)
  })

  it('dá a cada canto uma superfície própria e mantém texto contrastante', () => {
    const corners = [0, 10, 20, 30].map((id) => boardSpaces[id]!)
    const themes = corners.map((space) => getBoardTileTheme(space, true))

    expect(new Set(themes.map((theme) => theme.floor)).size).toBe(4)
    expect(themes.every((theme) => theme.ink && theme.outline)).toBe(true)
  })
})
