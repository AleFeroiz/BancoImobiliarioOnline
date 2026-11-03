import { describe, expect, it } from 'vitest'
import { boardSpaces } from './board.js'
import { ANIMATION_SPEEDS, DEFAULT_ANIMATION_SPEED, DICE_ANIMATION_DURATION_MS, FESTIVAL_CITY_COUNT, MATCH_DURATIONS, PAWN_STEP_ANIMATION_DURATION_MS, TURN_DECISION_SECONDS, applyRentMultiplier, areDiceDoubles, calculateCompanyRent, calculateNetWorth, calculateRent, canBuildLevelAfterFirstLap, chooseFestivalCityIds, constructionCost, divideBalances, forcedBuybackCost, getAnimationDuration, getMatchEndSummary, getMonopolyWinReason, getWorldCupRentMultiplier, hasWinningMonopoly, isAnimationSpeed, isMatchDuration, liquidatablePropertyIds } from './game.js'

describe('tentativas para sair da prisão', () => {
  it('reconhece dois dados iguais como duplas', () => {
    expect(areDiceDoubles([4, 4])).toBe(true)
    expect(areDiceDoubles([4, 5])).toBe(false)
  })
})

describe('limite de construção da primeira volta', () => {
  it('libera a terceira casa e o hotel somente após a primeira volta', () => {
    expect(canBuildLevelAfterFirstLap(false, 2)).toBe(true)
    expect(canBuildLevelAfterFirstLap(false, 3)).toBe(false)
    expect(canBuildLevelAfterFirstLap(false, 4)).toBe(false)
    expect(canBuildLevelAfterFirstLap(true, 3)).toBe(true)
    expect(canBuildLevelAfterFirstLap(true, 4)).toBe(true)
  })
})

describe('multiplicadores do próximo aluguel', () => {
  it('aplica os efeitos acumulados ao aluguel final e arredonda para baixo', () => {
    expect(applyRentMultiplier(125_000, 2)).toBe(250_000)
    expect(applyRentMultiplier(125_000, 0.5)).toBe(62_500)
    expect(applyRentMultiplier(125_000, 2 * 0.5)).toBe(125_000)
    expect(applyRentMultiplier(1, 0.5)).toBe(0)
  })
})

describe('Comunismo e Copa do Mundo', () => {
  it('divide todo o saldo sem criar ou perder dinheiro, inclusive quando o total é ímpar', () => {
    expect(divideBalances(5, 15)).toEqual([10, 10])
    expect(divideBalances(5, 14)).toEqual([10, 9])
    expect(divideBalances(14, 5)).toEqual([9, 10])
  })

  it('aumenta o aluguel da sede em 0,25× por edição', () => {
    const city = boardSpaces.find((space) => space.buildable)!
    const ownership = new Map([[city.id, 'ana']])
    const baseRent = calculateRent(city.id, ownership)
    expect([0, 1, 2, 3].map(getWorldCupRentMultiplier)).toEqual([1, 2, 2.25, 2.5])
    expect(calculateRent(city.id, ownership, 0, city.id, new Set(), getWorldCupRentMultiplier(3))).toBe(baseRent * 2.5)
  })
})

describe('duração da partida', () => {
  it('inclui a opção sem limite sem aceitar durações arbitrárias', () => {
    expect(MATCH_DURATIONS).toContain(0)
    expect(isMatchDuration(0)).toBe(true)
    expect(isMatchDuration(900)).toBe(true)
    expect(isMatchDuration(1200)).toBe(false)
  })
})

describe('velocidade da apresentação', () => {
  it('começa em 1x e aplica 0,5x e 2x proporcionalmente', () => {
    expect(DEFAULT_ANIMATION_SPEED).toBe(1)
    expect(ANIMATION_SPEEDS).toEqual([0.5, 1, 2])
    expect(getAnimationDuration(DICE_ANIMATION_DURATION_MS, 0.5)).toBe(3_600)
    expect(getAnimationDuration(DICE_ANIMATION_DURATION_MS, 1)).toBe(1_800)
    expect(getAnimationDuration(DICE_ANIMATION_DURATION_MS, 2)).toBe(900)
    expect(PAWN_STEP_ANIMATION_DURATION_MS).toBe(375)
    expect(getAnimationDuration(PAWN_STEP_ANIMATION_DURATION_MS, 0.5)).toBe(375)
    expect(getAnimationDuration(PAWN_STEP_ANIMATION_DURATION_MS, 1)).toBe(188)
    expect(getAnimationDuration(PAWN_STEP_ANIMATION_DURATION_MS, 2)).toBe(94)
    expect(getAnimationDuration(DICE_ANIMATION_DURATION_MS, 0.75)).toBe(1_800)
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
    expect(getMonopolyWinReason(ownership, 'ana')).toBe('monopoly-line')
    expect(hasWinningMonopoly(ownership, 'bia')).toBe(false)
  })

  it('vence ao completar duas regiões e escala o aluguel de companhia', () => {
    const regionalTitles = boardSpaces.filter((space) => space.buildable && (space.region === 'north' || space.region === 'center-west'))
    const ownership = new Map(regionalTitles.map((space) => [space.id, 'ana']))
    const companyTitles = boardSpaces.filter((space) => space.company).slice(0, 3)
    companyTitles.forEach((space) => ownership.set(space.id, 'ana'))
    expect(hasWinningMonopoly(ownership, 'ana')).toBe(true)
    expect(getMonopolyWinReason(ownership, 'ana')).toBe('monopoly-line')
    expect(calculateCompanyRent(ownership, 'ana', 3)).toBe(450_000)
  })

  it('vence ao possuir as quatro companhias', () => {
    const ownership = new Map(boardSpaces.filter((space) => space.company).map((space) => [space.id, 'ana']))
    expect(hasWinningMonopoly(ownership, 'ana')).toBe(true)
    expect(getMonopolyWinReason(ownership, 'ana')).toBe('all-companies')
    expect(calculateCompanyRent(ownership, 'ana', 3)).toBe(600_000)
  })

  it('descreve a causa da partida no resultado final', () => {
    expect(getMatchEndSummary('timeout')).toContain('Tempo esgotado')
    expect(getMatchEndSummary('bankruptcy')).toContain('falência')
    expect(getMatchEndSummary('double-regional-monopoly')).toContain('Monopólio Duplo Regional')
    expect(getMatchEndSummary('all-companies')).toContain('quatro companhias')
  })
})

describe('aluguéis de cidades', () => {
  it('soma os valores incrementais de terreno e casas observados na curva', () => {
    const belem = boardSpaces.find((space) => space.name === 'Belém')
    if (!belem) throw new Error('Belém não foi configurada no tabuleiro.')

    const ownership = new Map([[belem.id, 'ana']])
    expect(calculateRent(belem.id, ownership, 3)).toBe(belem.rentAdditions!.slice(0, 4).reduce((sum, addition) => sum + addition, 0))
  })

  it('sorteia três cidades de festival sem repetição e dobra seu aluguel', () => {
    const festivals = chooseFestivalCityIds(() => 0)
    const property = boardSpaces.find((space) => space.id === festivals[0])!
    const ownership = new Map([[property.id, 'ana']])
    const baseRent = calculateRent(property.id, ownership)
    expect(FESTIVAL_CITY_COUNT).toBe(3)
    expect(festivals).toHaveLength(3)
    expect(new Set(festivals).size).toBe(3)
    expect(festivals.every((id) => boardSpaces[id]?.buildable)).toBe(true)
    expect(calculateRent(property.id, ownership, 0, -1, new Set([property.id]))).toBe(baseRent * 2)
  })
})

describe('tempo para decisões', () => {
  it('dá 15 segundos para decisões após o movimento', () => {
    expect(TURN_DECISION_SECONDS).toBe(15)
  })
})

describe('recompra forçada', () => {
  it('cobra 2× o investimento na cidade e nas construções, mas protege hotéis e companhias', () => {
    const city = boardSpaces.find((space) => space.buildable)
    const company = boardSpaces.find((space) => space.company)
    if (!city || !company) throw new Error('Tabuleiro sem cidade ou companhia.')
    expect(forcedBuybackCost(city.id)).toBe((city.price ?? 0) * 2)
    expect(forcedBuybackCost(city.id, 2)).toBe(((city.price ?? 0) + 2 * constructionCost(city.id)) * 2)
    expect(forcedBuybackCost(company.id)).toBe(0)
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

    expect(calculateNetWorth('ana', 500_000, holdings)).toBe(500_000 + (boardSpaces[1]?.price ?? 0) + 2 * (boardSpaces[1] ? Math.floor(constructionCost(1) / 2) : 0))
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
