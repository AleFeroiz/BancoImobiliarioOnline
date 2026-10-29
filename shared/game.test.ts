import { describe, expect, it } from 'vitest'
import { boardSpaces } from './board.js'
import { calculateNetWorth, liquidatablePropertyIds } from './game.js'

describe('patrimônio final', () => {
  it('soma apenas os imóveis da pessoa, desconta hipoteca e inclui valor de liquidação das construções', () => {
    const holdings = new Map([
      [1, { ownerSessionId: 'ana', houses: 2, isMortgaged: true }],
      [3, { ownerSessionId: 'bia', houses: 0, isMortgaged: false }],
    ])

    expect(calculateNetWorth('ana', 500_000, holdings)).toBe(560_000)
    expect(calculateNetWorth('bia', 500_000, holdings)).toBe(500_000 + (boardSpaces[3]?.price ?? 0))
  })

  it('ignora saldo e títulos negativos ou inválidos na avaliação', () => {
    const holdings = new Map([
      [2, { ownerSessionId: 'ana', houses: 4, isMortgaged: false }],
      [999, { ownerSessionId: 'ana', houses: 2, isMortgaged: false }],
    ])

    expect(calculateNetWorth('ana', -10, holdings)).toBe(0)
  })
})

describe('bens que podem ser liquidados', () => {
  it('lista apenas construções que podem ser vendidas e títulos próprios hipotecáveis', () => {
    const color = boardSpaces.find((space) => space.kind === 'property' && space.buildable)?.color
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.color === color)
    const buildingProperty = group[0]
    const station = boardSpaces.find((space) => space.kind === 'property' && !space.buildable)
    const opponentProperty = boardSpaces.find((space) => space.kind === 'property' && space.buildable && space.color !== color)
    if (!buildingProperty || !station || !opponentProperty) throw new Error('Tabuleiro sem propriedades para o teste.')

    const holdings = new Map([
      ...group.map((space, index) => [space.id, { ownerSessionId: 'ana', houses: index === 0 ? 1 : 0 }] as const),
      [station.id, { ownerSessionId: 'ana', houses: 0 }],
      [opponentProperty.id, { ownerSessionId: 'bia', houses: 0 }],
    ])

    expect(liquidatablePropertyIds('ana', holdings)).toEqual([buildingProperty.id, station.id].sort((a, b) => a - b))
  })

  it('não inclui casas hipotecadas, sem construção vendável ou de outro jogador', () => {
    const mortgageable = boardSpaces.find((space) => space.kind === 'property' && space.buildable)
    const station = boardSpaces.find((space) => space.kind === 'property' && !space.buildable)
    if (!mortgageable || !station) throw new Error('Tabuleiro sem propriedades para o teste.')
    const holdings = new Map([
      [mortgageable.id, { ownerSessionId: 'ana', houses: 0, isMortgaged: true }],
      [station.id, { ownerSessionId: 'bia', houses: 0 }],
    ])

    expect(liquidatablePropertyIds('ana', holdings)).toEqual([])
  })
})
