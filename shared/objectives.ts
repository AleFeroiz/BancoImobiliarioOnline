import { boardSpaces } from './board.js'

export type ExpressObjectiveId =
  | 'own-one-property'
  | 'own-three-properties'
  | 'own-five-properties'
  | 'complete-color-group'
  | 'build-one-level'
  | 'build-three-levels'
  | 'build-hotel'
  | 'own-two-stations'

export type ExpressObjectiveDefinition = {
  id: ExpressObjectiveId
  title: string
  description: string
  target: number
  reward: number
}

export type ExpressObjectiveUpdate = ExpressObjectiveDefinition & {
  progress: number
  completed: boolean
  rewardAwarded: number
}

export type ObjectiveHolding = { ownerSessionId: string; houses: number }

const residentialGroups = Array.from(
  boardSpaces.filter((space) => space.kind === 'property' && space.buildable).reduce((groups, space) => {
    const group = groups.get(space.color) ?? []
    group.push(space.id)
    groups.set(space.color, group)
    return groups
  }, new Map<string, number[]>()),
  ([color, spaces]) => ({ color, spaces }),
).sort((first, second) => first.spaces.length - second.spaces.length || first.color.localeCompare(second.color))

const easiestColorGroup = residentialGroups[0]

export const EXPRESS_OBJECTIVES: readonly ExpressObjectiveDefinition[] = [
  { id: 'own-one-property', title: 'Primeira escritura', description: 'Tenha pelo menos um imóvel ou estação.', target: 1, reward: 50_000 },
  { id: 'own-three-properties', title: 'Pequeno portfólio', description: 'Tenha três imóveis ou estações.', target: 3, reward: 100_000 },
  { id: 'own-five-properties', title: 'Expansão urbana', description: 'Tenha cinco imóveis ou estações.', target: 5, reward: 150_000 },
  { id: 'complete-color-group', title: 'Feche um grupo de cor', description: 'Tenha todas as propriedades do grupo de cor com duas ruas.', target: easiestColorGroup?.spaces.length ?? 2, reward: 150_000 },
  { id: 'build-one-level', title: 'Uma casa para chamar de sua', description: 'Construa ao menos um nível em uma propriedade residencial.', target: 1, reward: 75_000 },
  { id: 'build-three-levels', title: 'Bairro em crescimento', description: 'Some três níveis de construção nas suas propriedades.', target: 3, reward: 150_000 },
  { id: 'build-hotel', title: 'Hospedagem completa', description: 'Construa um hotel em uma propriedade residencial.', target: 1, reward: 200_000 },
  { id: 'own-two-stations', title: 'Conexão entre bairros', description: 'Tenha duas estações.', target: 2, reward: 125_000 },
]

export function getExpressObjectiveProgress(
  objectiveId: ExpressObjectiveId,
  ownerSessionId: string,
  holdings: ReadonlyMap<number, ObjectiveHolding>,
) {
  const ownedProperties = boardSpaces.filter((space) => space.kind === 'property'
    && holdings.get(space.id)?.ownerSessionId === ownerSessionId)

  switch (objectiveId) {
    case 'own-one-property':
    case 'own-three-properties':
    case 'own-five-properties':
      return ownedProperties.length
    case 'complete-color-group': {
      if (!easiestColorGroup) return 0
      return easiestColorGroup.spaces.filter((spaceId) => holdings.get(spaceId)?.ownerSessionId === ownerSessionId).length
    }
    case 'build-one-level':
    case 'build-three-levels':
      return ownedProperties.reduce((total, space) => total + (holdings.get(space.id)?.houses ?? 0), 0)
    case 'build-hotel':
      return ownedProperties.some((space) => (holdings.get(space.id)?.houses ?? 0) >= 5) ? 1 : 0
    case 'own-two-stations':
      return ownedProperties.filter((space) => !space.buildable).length
  }
}
