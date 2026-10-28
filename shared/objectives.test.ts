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

  it('só conta o grupo residencial de duas ruas quando ambas pertencem à pessoa', () => {
    const group = new Map<string, number[]>()
    for (const space of boardSpaces.filter((entry) => entry.kind === 'property' && entry.buildable)) {
      const ids = group.get(space.color) ?? []
      ids.push(space.id)
      group.set(space.color, ids)
    }
    const smallestGroup = [...group.values()].sort((first, second) => first.length - second.length)[0] ?? []
    const groupObjective = EXPRESS_OBJECTIVES.find((objective) => objective.id === 'complete-color-group')!
    expect(smallestGroup).toHaveLength(groupObjective.target)

    const holdings = new Map<number, ObjectiveHolding>(smallestGroup.map((id) => [id, { ownerSessionId: 'ana', houses: 0 }]))
    expect(getExpressObjectiveProgress('complete-color-group', 'ana', holdings)).toBe(smallestGroup.length)
    holdings.get(smallestGroup[0]!)!.ownerSessionId = 'bia'
    expect(getExpressObjectiveProgress('complete-color-group', 'ana', holdings)).toBe(smallestGroup.length - 1)
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
