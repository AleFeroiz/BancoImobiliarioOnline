import { describe, expect, it } from 'vitest'
import { boardSpaces } from './board.js'
import { ANIMATION_SPEEDS, DEFAULT_ANIMATION_SPEED, DICE_ANIMATION_DURATION_MS, PAWN_STEP_ANIMATION_DURATION_MS, TURN_DECISION_SECONDS, areDiceDoubles, calculateCompanyRent, calculateNetWorth, calculateRent, forcedBuybackCost, getAnimationDuration, hasWinningMonopoly, isAnimationSpeed, liquidatablePropertyIds } from './game.js'

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

describe('vitórias e companhias do tabuleiro regional', () => {
  it('vence ao completar seis casas e uma companhia em qualquer lado', () => {
    const ownership = new Map([1, 3, 4, 5, 7, 8, 9].map((spaceId) => [spaceId, 'ana']))
    expect(hasWinningMonopoly(ownership, 'ana')).toBe(true)
    expect(hasWinningMonopoly(ownership, 'bia')).toBe(false)
  })

  it('vence ao completar duas regiões e escala o aluguel de companhia', () => {
    const regionalTitles = boardSpaces.filter((space) => space.buildable && (space.region === 'north' || space.region === 'center-west'))
    const ownership = new Map(regionalTitles.map((space) => [space.id, 'ana']))
    const companyTitles = boardSpaces.filter((space) => space.company).slice(0, 3)
    companyTitles.forEach((space) => ownership.set(space.id, 'ana'))
    expect(hasWinningMonopoly(ownership, 'ana')).toBe(true)
    expect(calculateCompanyRent(ownership, 'ana')).toBe(450_000)
  })

  it('vence ao possuir as quatro companhias', () => {
    const ownership = new Map(boardSpaces.filter((space) => space.company).map((space) => [space.id, 'ana']))
    expect(hasWinningMonopoly(ownership, 'ana')).toBe(true)
    expect(calculateCompanyRent(ownership, 'ana')).toBe(750_000)
  })
})

describe('aluguéis de cidades', () => {
  it('preserva o valor exato de 70% sem perder um real por precisão decimal', () => {
    const belem = boardSpaces.find((space) => space.name === 'Belém')
    if (!belem) throw new Error('Belém não foi configurada no tabuleiro.')

    const ownership = new Map([[belem.id, 'ana']])
    expect(calculateRent(belem.id, ownership, 3)).toBe(245_000)
  })
})

describe('tempo para decisões', () => {
  it('dá 15 segundos para decisões após o movimento', () => {
    expect(TURN_DECISION_SECONDS).toBe(15)
  })
})

describe('recompra forçada', () => {
  it('cobra 1,5× o preço do imóvel e das construções, mas não permite tomar hotel', () => {
    const city = boardSpaces.find((space) => space.buildable)
    const company = boardSpaces.find((space) => space.company)
    if (!city || !company) throw new Error('Tabuleiro sem cidade ou companhia.')
    expect(forcedBuybackCost(city.id)).toBe(Math.floor((city.price ?? 0) * 1.5))
    expect(forcedBuybackCost(city.id, 2)).toBe(Math.floor(((city.price ?? 0) + 2 * (city.price ?? 0) * 0.5) * 1.5))
    expect(forcedBuybackCost(company.id)).toBe(Math.floor((company.price ?? 0) * 1.5))
    expect(forcedBuybackCost(city.id, 4)).toBe(0)
    expect(forcedBuybackCost(0)).toBe(0)
  })
})

describe('patrimônio final', () => {
  it('soma apenas os imóveis da pessoa e inclui o valor de venda das construções', () => {
    const holdings = new Map([
      [1, { ownerSessionId: 'ana', houses: 2 }],
      [3, { ownerSessionId: 'bia', houses: 0 }],
    ])

    expect(calculateNetWorth('ana', 500_000, holdings)).toBe(800_000)
    expect(calculateNetWorth('bia', 500_000, holdings)).toBe(500_000 + (boardSpaces[3]?.price ?? 0))
  })

  it('ignora saldo e títulos negativos ou inválidos na avaliação', () => {
    const nonProperty = boardSpaces.find((space) => space.kind !== 'property')
    if (!nonProperty) throw new Error('Tabuleiro sem casas especiais para o teste.')
    const holdings = new Map([
      [nonProperty.id, { ownerSessionId: 'ana', houses: 4 }],
      [999, { ownerSessionId: 'ana', houses: 2 }],
    ])

    expect(calculateNetWorth('ana', -10, holdings)).toBe(0)
  })
})

describe('bens que podem ser liquidados', () => {
  it('lista construções vendáveis e todos os títulos próprios sem construções no grupo', () => {
    const color = boardSpaces.find((space) => space.kind === 'property' && space.buildable)?.color
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.color === color)
    const buildingProperty = group[0]
    const company = boardSpaces.find((space) => space.company)
    const opponentProperty = boardSpaces.find((space) => space.kind === 'property' && space.buildable && space.color !== color)
    if (!buildingProperty || !company || !opponentProperty) throw new Error('Tabuleiro sem propriedades para o teste.')

    const holdings = new Map([
      ...group.map((space, index) => [space.id, { ownerSessionId: 'ana', houses: index === 0 ? 1 : 0 }] as const),
      [company.id, { ownerSessionId: 'ana', houses: 0 }],
      [opponentProperty.id, { ownerSessionId: 'bia', houses: 0 }],
    ])

    expect(liquidatablePropertyIds('ana', holdings)).toEqual([buildingProperty.id, company.id].sort((a, b) => a - b))
  })

  it('não inclui títulos de outro jogador', () => {
    const property = boardSpaces.find((space) => space.kind === 'property' && space.buildable)
    if (!property) throw new Error('Tabuleiro sem propriedades para o teste.')
    const holdings = new Map([
      [property.id, { ownerSessionId: 'bia', houses: 0 }],
    ])

    expect(liquidatablePropertyIds('ana', holdings)).toEqual([])
  })
})
