import { describe, expect, it } from 'vitest'
import { boardSpaces } from './board.js'
import { EXPRESS_OBJECTIVES, getExpressObjectiveProgress, type ExpressObjectiveId, type ObjectiveHolding } from './objectives.js'

describe('objetivos do modo Express', () => {
  it('define oito objetivos diferentes com meta e bônus positivos', () => {
    expect(EXPRESS_OBJECTIVES).toHaveLength(8)
    expect(new Set(EXPRESS_OBJECTIVES.map((objective) => objective.id)).size).toBe(8)
    for (const objective of EXPRESS_OBJECTIVES) {
      expect(objective.target).toBeGreaterThan(0)
      expect(objective.reward).toBeGreaterThan(0)
    }
  })

  it.each([
    ['own-one-property', 1],
    ['own-three-properties', 3],
    ['own-five-properties', 5],
  ] as const)('conta propriedades próprias para %s', (objectiveId, expected) => {
    const holdings = new Map<number, ObjectiveHolding>()
    boardSpaces.filter((space) => space.kind === 'property').slice(0, expected).forEach((space) => {
      holdings.set(space.id, { ownerSessionId: 'ana', houses: 0 })
    })

    expect(getExpressObjectiveProgress(objectiveId, 'ana', holdings)).toBe(expected)
    expect(getExpressObjectiveProgress(objectiveId, 'bia', holdings)).toBe(0)
  })

  it('usa o grupo residencial mais barato e exige a posse de todas as ruas', () => {
    const groups = new Map<string, Array<{ id: number; price: number }>>()
    for (const space of boardSpaces.filter((entry) => entry.kind === 'property' && entry.buildable)) {
      const properties = groups.get(space.color) ?? []
      properties.push({ id: space.id, price: space.price ?? 0 })
      groups.set(space.color, properties)
    }
    const cheapestGroup = [...groups.values()].sort((first, second) =>
      first.reduce((total, property) => total + property.price, 0) - second.reduce((total, property) => total + property.price, 0),
    )[0] ?? []
    const groupObjective = EXPRESS_OBJECTIVES.find((objective) => objective.id === 'complete-color-group')!
    expect(groupObjective.target).toBe(3)
    expect(groupObjective.description).toContain('mais barato')

    const holdings = new Map<number, ObjectiveHolding>(cheapestGroup.map(({ id }) => [id, { ownerSessionId: 'ana', houses: 0 }]))
    expect(cheapestGroup).toHaveLength(groupObjective.target)
    expect(getExpressObjectiveProgress('complete-color-group', 'ana', holdings)).toBe(cheapestGroup.length)
    holdings.get(cheapestGroup[0]!.id)!.ownerSessionId = 'bia'
    expect(getExpressObjectiveProgress('complete-color-group', 'ana', holdings)).toBe(cheapestGroup.length - 1)
  })

  it('conta níveis residenciais, hotel e estações conforme seus critérios', () => {
    const residential = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const stations = boardSpaces.filter((space) => space.kind === 'property' && !space.buildable).slice(0, 2)
    const holdings = new Map<number, ObjectiveHolding>([
      [residential.id, { ownerSessionId: 'ana', houses: 3 }],
      ...stations.map((space) => [space.id, { ownerSessionId: 'ana', houses: 0 }] as const),
    ])

    expect(getExpressObjectiveProgress('build-one-level', 'ana', holdings)).toBe(3)
    expect(getExpressObjectiveProgress('build-three-levels', 'ana', holdings)).toBe(3)
    expect(getExpressObjectiveProgress('build-hotel', 'ana', holdings)).toBe(0)
    expect(getExpressObjectiveProgress('own-two-stations', 'ana', holdings)).toBe(2)

    holdings.set(residential.id, { ownerSessionId: 'ana', houses: 5 })
    expect(getExpressObjectiveProgress('build-hotel', 'ana', holdings)).toBe(1)
  })

  it('não atribui progresso a quem não é dono dos bens', () => {
    const objectiveIds: ExpressObjectiveId[] = EXPRESS_OBJECTIVES.map((objective) => objective.id)
    const holdings = new Map<number, ObjectiveHolding>([[1, { ownerSessionId: 'bia', houses: 5 }]])
    for (const objectiveId of objectiveIds) {
      expect(getExpressObjectiveProgress(objectiveId, 'ana', holdings)).toBe(0)
    }
  })
})
