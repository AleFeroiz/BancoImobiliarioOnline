import { describe, expect, it } from 'vitest'
import { boardSpaces, positionOnBoard } from './board'
import { getLineTitleIds } from '../../shared/board'
import { JAIL_TURNS, STARTING_CASH, bankReturnValue, buildingSaleValue, calculateRent, canBuildHotel, canBuildProperty, canReturnPropertyToBank, canSellBuilding, constructionCost, describeLanding, hasLiquidatableAssets, hotelConstructionCost, movePosition, taxForSpace } from '../../shared/game'
import { EVENT_CARDS } from '../../shared/cards'

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
    expect(boardSpaces[10]).toMatchObject({ name: 'Prisão', kind: 'prison' })
    expect(boardSpaces[20]).toMatchObject({ name: 'Copa do Mundo', kind: 'world-cup' })
    expect(boardSpaces[30]).toMatchObject({ name: 'Volta ao Brasil', kind: 'world-tour' })

    const properties = boardSpaces.filter(({ kind }) => kind === 'property')
    expect(properties).toHaveLength(28)
    expect(properties.every(({ price }) => typeof price === 'number' && price > 0)).toBe(true)
    expect(boardSpaces.some((space) => space.name === 'Praça')).toBe(false)
  })

  it('mantém 24 cidades únicas em cinco monopólios regionais', () => {
    const residential = boardSpaces.filter((space) => space.kind === 'property' && space.buildable)
    const groups = new Map<string, number[]>()
    for (const space of residential) {
      const group = groups.get(space.region ?? '') ?? []
      group.push(space.id)
      groups.set(space.region ?? '', group)
    }

    expect(residential).toHaveLength(24)
    expect(new Set(residential.map((space) => space.name)).size).toBe(24)
    expect(Array.from(groups.values()).map((group) => group.length)).toEqual([5, 5, 5, 4, 5])
    expect(new Set(residential.map((space) => space.color)).size).toBe(5)
    expect([0, 1, 2, 3].map((side) => getLineTitleIds(side).length)).toEqual([7, 7, 7, 7])
  })

  it('distribui uma casa Sorte ou Revés em cada lado do tabuleiro', () => {
    expect(boardSpaces.filter((space) => space.kind === 'event').map((space) => space.id)).toEqual([6, 16, 26, 36])
  })

  it('move pelo resultado dos dados e volta ao início ao completar uma volta', () => {
    expect(movePosition(37, [2, 3])).toBe(2)
    expect(movePosition(10, [1, 1])).toBe(12)
  })

  it('descreve a casa alcançada sem aplicar efeitos econômicos ainda não definidos', () => {
    expect(describeLanding(19)).toContain('São Luís')
    expect(describeLanding(19)).toContain('Você parou em uma propriedade')
    expect(() => describeLanding(40)).toThrow(RangeError)
  })

  it('calcula aluguel base, bônus do grupo e triplicação pela Copa', () => {
    const property = boardSpaces.find((space) => space.kind === 'property')!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.color === property.color)
    const owner = new Map(group.map((space) => [space.id, 'jogador-1']))
    const base = Math.floor((property.price ?? 0) * 0.1)

    expect(STARTING_CASH).toBe(2_000_000)
    expect(calculateRent(property.id, new Map([[property.id, 'jogador-1']]))).toBe(base)
    expect(calculateRent(property.id, owner)).toBe(base * 2)
    expect(calculateRent(property.id, owner, 1)).toBe(Math.floor((property.price ?? 0) * 0.2) * 2)
    expect(calculateRent(property.id, owner, 2)).toBe(Math.floor((property.price ?? 0) * 0.4) * 2)
    expect(calculateRent(property.id, owner, 3)).toBe(Math.floor((property.price ?? 0) * 0.7) * 2)
    expect(calculateRent(property.id, owner, 4)).toBe(Math.floor((property.price ?? 0) * 1) * 2)
    expect(calculateRent(property.id, owner, 2, property.id)).toBe(Math.floor((property.price ?? 0) * 0.4) * 6)
  })

  it('permite até três casas sem grupo completo e exige visita posterior para o hotel', () => {
    const first = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.color === first.color)
    const second = group[1]
    const holdings = new Map(group.map((space) => [space.id, { ownerSessionId: 'p1', houses: 0 }]))
    const cost = Math.floor((first.price ?? 0) * 0.5)

    expect(constructionCost(first.id)).toBe(cost)
    expect(canBuildProperty(first.id, 'p1', holdings, 1_000_000)).toBe(true)
    expect(canBuildProperty(first.id, 'p1', holdings, cost - 1)).toBe(false)
    expect(canBuildProperty(first.id, 'p1', new Map([[first.id, holdings.get(first.id)!]]), 1_000_000)).toBe(true)

    holdings.get(first.id)!.houses = 1
    expect(canBuildProperty(first.id, 'p1', holdings, 1_000_000)).toBe(true)
    expect(canBuildProperty(second.id, 'p1', holdings, 1_000_000)).toBe(true)

    holdings.get(first.id)!.houses = 3
    expect(canBuildProperty(first.id, 'p1', holdings, 1_000_000)).toBe(false)
    expect(canBuildHotel(first.id, 'p1', holdings, hotelConstructionCost(first.id))).toBe(true)
    expect(canBuildHotel(first.id, 'p1', holdings, hotelConstructionCost(first.id) - 1)).toBe(false)
    holdings.get(first.id)!.houses = 4
    expect(canBuildHotel(first.id, 'p1', holdings, 1_000_000)).toBe(false)

    const company = boardSpaces.find((space) => space.company)!
    expect(constructionCost(company.id)).toBe(0)
    expect(canBuildProperty(company.id, 'p1', new Map([[company.id, { ownerSessionId: 'p1', houses: 0 }]]), 1_000_000)).toBe(false)
  })

  it('cobra taxas diferentes por imóvel em cada uma das quatro casas', () => {
    expect([2, 12, 22, 32].map((spaceId) => taxForSpace(spaceId, 1))).toEqual([10_000, 15_000, 20_000, 25_000])
    expect(taxForSpace(22, 4)).toBe(80_000)
    expect(taxForSpace(0)).toBe(0)
  })

  it('contém as doze cartas autorais aprovadas', () => {
    expect(EVENT_CARDS.map((card) => card.id)).toEqual([
      'generous', 'birthday', 'blackout', 'earthquake', 'thief', 'protection',
      'jail', 'world-tour', 'world-cup', 'swap', 'world-cup-city', 'start',
    ])
    expect(new Set(EVENT_CARDS.map((card) => card.id)).size).toBe(12)
  })

  it('define prisão por três turnos completos sem fiança', () => {
    expect(JAIL_TURNS).toBe(3)
  })

  it('calcula a devolução ao banco e exige vender construções do grupo antes de devolver', () => {
    const first = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.color === first.color)
    const holdings = new Map(group.map((space) => [space.id, { ownerSessionId: 'p1', houses: 0 }]))
    const principal = Math.floor((first.price ?? 0) * 0.5)

    expect(bankReturnValue(first.id)).toBe(principal)
    const propertyAt250k = boardSpaces.find((space) => space.kind === 'property' && space.price === 250_000)!
    expect(bankReturnValue(propertyAt250k.id)).toBe(125_000)
    expect(canReturnPropertyToBank(first.id, 'p1', holdings)).toBe(true)
    expect(canReturnPropertyToBank(first.id, 'p2', holdings)).toBe(false)

    holdings.get(group[1].id)!.houses = 1
    expect(canReturnPropertyToBank(first.id, 'p1', holdings)).toBe(false)
    holdings.get(group[1].id)!.houses = 0
    expect(canBuildProperty(first.id, 'p1', holdings, 1_000_000)).toBe(true)
  })

  it('permite vender construções pela metade do custo e identifica bens liquidáveis', () => {
    const first = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.color === first.color)
    const holdings = new Map(group.map((space) => [space.id, { ownerSessionId: 'p1', houses: 0 }]))

    expect(buildingSaleValue(first.id)).toBe(Math.floor(constructionCost(first.id) / 2))
    expect(canSellBuilding(first.id, 'p1', holdings)).toBe(false)
    expect(hasLiquidatableAssets('p1', holdings)).toBe(true)
    holdings.get(first.id)!.houses = 1
    expect(canSellBuilding(first.id, 'p1', holdings)).toBe(true)
    holdings.get(group[1].id)!.houses = 2
    expect(canSellBuilding(first.id, 'p1', holdings)).toBe(true)
    expect(canSellBuilding(group[1].id, 'p1', holdings)).toBe(true)
    expect(canSellBuilding(group[1].id, 'p2', holdings)).toBe(false)

    for (const property of group) holdings.get(property.id)!.houses = 0
    expect(hasLiquidatableAssets('p1', holdings)).toBe(true)
  })
})
