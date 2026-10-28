import { describe, expect, it } from 'vitest'
import { boardSpaces } from './board.js'
import { EMPTY_OBJECTIVE_ACTIVITY, EXPRESS_OBJECTIVES, getExpressObjectiveProgress, type ObjectiveActivity, type ObjectiveHolding } from './objectives.js'

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
    ['own-four-properties', 4],
  ] as const)('conta propriedades próprias para %s', (objectiveId, expected) => {
    const holdings = new Map<number, ObjectiveHolding>()
    boardSpaces.filter((space) => space.kind === 'property').slice(0, expected).forEach((space) => {
      holdings.set(space.id, { ownerSessionId: 'ana', houses: 0 })
    })

    expect(getExpressObjectiveProgress(objectiveId, 'ana', holdings)).toBe(expected)
    expect(getExpressObjectiveProgress(objectiveId, 'bia', holdings)).toBe(0)
  })

  it('conta estações sem incluir imóveis residenciais', () => {
    const residential = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const stations = boardSpaces.filter((space) => space.kind === 'property' && !space.buildable).slice(0, 2)
    const holdings = new Map<number, ObjectiveHolding>([
      [residential.id, { ownerSessionId: 'ana', houses: 0 }],
      ...stations.map((space) => [space.id, { ownerSessionId: 'ana', houses: 0 }] as const),
    ])

    expect(getExpressObjectiveProgress('own-one-station', 'ana', holdings)).toBe(2)
    expect(getExpressObjectiveProgress('own-one-station', 'bia', holdings)).toBe(0)
  })

  it.each([
    ['receive-rent', 'rentReceived'],
    ['pay-rent', 'rentPaid'],
    ['draw-event-card', 'eventCardsDrawn'],
    ['pass-start', 'startCrossings'],
  ] as const)('usa a atividade privada para %s', (objectiveId, activityKey) => {
    const activity: ObjectiveActivity = { ...EMPTY_OBJECTIVE_ACTIVITY, [activityKey]: 2 }
    const objective = EXPRESS_OBJECTIVES.find((candidate) => candidate.id === objectiveId)!

    expect(getExpressObjectiveProgress(objectiveId, 'ana', new Map(), activity)).toBe(2)
    expect(getExpressObjectiveProgress(objectiveId, 'ana', new Map())).toBe(0)
    expect(objective.target).toBe(1)
  })
})
