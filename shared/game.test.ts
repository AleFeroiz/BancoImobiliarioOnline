import { describe, expect, it } from 'vitest'
import { boardSpaces } from './board.js'
import { ANIMATION_SPEEDS, DEFAULT_ANIMATION_SPEED, DICE_ANIMATION_DURATION_MS, PAWN_STEP_ANIMATION_DURATION_MS, TURN_DECISION_SECONDS, areDiceDoubles, calculateNetWorth, calculateStationRent, getAnimationDuration, isAnimationSpeed, liquidatablePropertyIds } from './game.js'

describe('tentativas para sair da prisão', () => {
  it('reconhece dois dados iguais como duplas', () => {
    expect(areDiceDoubles([4, 4])).toBe(true)
    expect(areDiceDoubles([4, 5])).toBe(false)
  })
})

describe('velocidade da apresentação', () => {
  it('começa em 1x e aplica 0,5x e 2x proporcionalmente', () => {
    expect(DEFAULT_ANIMATION_SPEED).toBe(1)
    expect(ANIMATION_SPEEDS).toEqual([0.5, 1, 2])
    expect(getAnimationDuration(DICE_ANIMATION_DURATION_MS, 0.5)).toBe(5_600)
    expect(getAnimationDuration(DICE_ANIMATION_DURATION_MS, 1)).toBe(2_800)
    expect(getAnimationDuration(DICE_ANIMATION_DURATION_MS, 2)).toBe(1_400)
    expect(getAnimationDuration(PAWN_STEP_ANIMATION_DURATION_MS, 2)).toBe(375)
    expect(getAnimationDuration(DICE_ANIMATION_DURATION_MS, 0.75)).toBe(2_800)
  })

  it('aceita somente as três velocidades disponíveis', () => {
    expect(ANIMATION_SPEEDS.every(isAnimationSpeed)).toBe(true)
    expect(isAnimationSpeed(0.75)).toBe(false)
    expect(isAnimationSpeed('1')).toBe(false)
  })
})

describe('aluguel das estações', () => {
  it('multiplica a rolagem única por R$ 50.000 e só aceita resultados de 1 a 6', () => {
    expect([1, 2, 3, 4, 5, 6].map(calculateStationRent)).toEqual([50_000, 100_000, 150_000, 200_000, 250_000, 300_000])
    expect(() => calculateStationRent(0)).toThrow(RangeError)
    expect(() => calculateStationRent(7)).toThrow(RangeError)
  })
})

describe('tempo para decisões', () => {
  it('dá 15 segundos para decisões após o movimento', () => {
    expect(TURN_DECISION_SECONDS).toBe(15)
  })
})

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
    const nonProperty = boardSpaces.find((space) => space.kind !== 'property')
    if (!nonProperty) throw new Error('Tabuleiro sem casas especiais para o teste.')
    const holdings = new Map([
      [nonProperty.id, { ownerSessionId: 'ana', houses: 4, isMortgaged: false }],
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
