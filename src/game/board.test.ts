import { describe, expect, it } from 'vitest'
import { boardSpaces, positionOnBoard } from './board'
import { JAIL_FINE, MAX_JAIL_ATTEMPTS, STARTING_CASH, calculateRent, canBuildProperty, canMortgageProperty, canRedeemMortgage, constructionCost, describeLanding, mortgageRedemptionCost, mortgageValue, movePosition, resolveJailAttempt, taxForSpace } from '../../shared/game'
import { EVENT_CARDS, applyCardCashEffect } from '../../shared/cards'

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

  it('permite construir grupos completos de forma equilibrada até um hotel', () => {
    const first = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.color === first.color)
    const second = group[1]
    const holdings = new Map(group.map((space) => [space.id, { ownerSessionId: 'p1', houses: 0 }]))
    const cost = Math.floor((first.price ?? 0) * 0.5)

    expect(constructionCost(first.id)).toBe(cost)
    expect(canBuildProperty(first.id, 'p1', holdings, 1_000_000)).toBe(true)
    expect(canBuildProperty(first.id, 'p1', holdings, cost - 1)).toBe(false)
    expect(canBuildProperty(first.id, 'p1', new Map([[first.id, holdings.get(first.id)!]]), 1_000_000)).toBe(false)

    holdings.get(first.id)!.houses = 1
    expect(canBuildProperty(first.id, 'p1', holdings, 1_000_000)).toBe(false)
    expect(canBuildProperty(second.id, 'p1', holdings, 1_000_000)).toBe(true)

    for (const property of group) holdings.get(property.id)!.houses = 4
    expect(canBuildProperty(first.id, 'p1', holdings, 1_000_000)).toBe(true)
    holdings.get(first.id)!.houses = 5
    expect(canBuildProperty(first.id, 'p1', holdings, 1_000_000)).toBe(false)
    expect(canBuildProperty(second.id, 'p1', holdings, 1_000_000)).toBe(true)

    expect(constructionCost(15)).toBe(0)
    expect(canBuildProperty(15, 'p1', new Map([[15, { ownerSessionId: 'p1', houses: 0 }]]), 1_000_000)).toBe(false)
  })

  it('usa taxas fixas nas quatro casas de taxa', () => {
    expect([4, 18, 28, 38].map(taxForSpace)).toEqual([50_000, 75_000, 100_000, 125_000])
    expect(taxForSpace(0)).toBe(0)
  })

  it('mantém oito cartas autorais e limita cobranças ao saldo disponível', () => {
    expect(EVENT_CARDS).toHaveLength(8)
    expect(new Set(EVENT_CARDS.map((card) => card.id)).size).toBe(8)
    expect(EVENT_CARDS.filter((card) => card.effect.kind === 'cash' && card.effect.amount > 0)).toHaveLength(3)
    expect(EVENT_CARDS.filter((card) => card.effect.kind === 'cash' && card.effect.amount < 0)).toHaveLength(3)
    expect(EVENT_CARDS.filter((card) => card.effect.kind === 'move')).toHaveLength(1)
    expect(EVENT_CARDS.filter((card) => card.effect.kind === 'jail')).toHaveLength(1)
    expect(applyCardCashEffect(120_000, -150_000)).toBe(0)
    expect(applyCardCashEffect(120_000, 50_000)).toBe(170_000)
  })

  it('libera da prisão com duplas ou na terceira tentativa e cobra até a fiança', () => {
    expect(MAX_JAIL_ATTEMPTS).toBe(3)
    expect(JAIL_FINE).toBe(50_000)
    expect(resolveJailAttempt([4, 4], 0, 100_000)).toMatchObject({ isJailed: false, move: true, outcome: 'doubles', cash: 100_000 })
    expect(resolveJailAttempt([2, 5], 0, 100_000)).toMatchObject({ isJailed: true, jailTurns: 1, move: false, outcome: 'failed' })
    expect(resolveJailAttempt([1, 6], 1, 100_000)).toMatchObject({ isJailed: true, jailTurns: 2, move: false, outcome: 'failed' })
    expect(resolveJailAttempt([1, 2], 2, 20_000)).toMatchObject({ isJailed: false, jailTurns: 0, cash: 0, move: true, outcome: 'forced-release', finePaid: 20_000 })
  })

  it('calcula hipoteca e resgate, bloqueia aluguel e exige vender construções do grupo', () => {
    const first = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.color === first.color)
    const holdings = new Map(group.map((space) => [space.id, { ownerSessionId: 'p1', houses: 0, isMortgaged: false }]))
    const principal = Math.floor((first.price ?? 0) * 0.5)

    expect(mortgageValue(first.id)).toBe(principal)
    expect(mortgageRedemptionCost(first.id)).toBe(Math.ceil(principal * 1.1))
    const propertyAt220k = boardSpaces.find((space) => space.kind === 'property' && space.price === 220_000)!
    expect(mortgageValue(propertyAt220k.id)).toBe(110_000)
    expect(mortgageRedemptionCost(propertyAt220k.id)).toBe(121_000)
    expect(canMortgageProperty(first.id, 'p1', holdings)).toBe(true)
    expect(canMortgageProperty(first.id, 'p2', holdings)).toBe(false)
    expect(canRedeemMortgage(first.id, 'p1', holdings, mortgageRedemptionCost(first.id) - 1)).toBe(false)
    expect(calculateRent(first.id, new Map([[first.id, 'p1']]), 0, true)).toBe(0)

    holdings.get(group[1].id)!.houses = 1
    expect(canMortgageProperty(first.id, 'p1', holdings)).toBe(false)
    holdings.get(group[1].id)!.houses = 0
    holdings.get(first.id)!.isMortgaged = true
    expect(canMortgageProperty(first.id, 'p1', holdings)).toBe(false)
    expect(canRedeemMortgage(first.id, 'p1', holdings, mortgageRedemptionCost(first.id))).toBe(true)
    expect(canBuildProperty(first.id, 'p1', holdings, 1_000_000)).toBe(false)
  })
})
