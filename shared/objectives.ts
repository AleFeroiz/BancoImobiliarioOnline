import { boardSpaces } from './board.js'

export type ExpressObjectiveId =
  | 'own-one-property'
  | 'own-three-properties'
  | 'own-four-properties'
  | 'own-one-station'
  | 'receive-rent'
  | 'pay-rent'
  | 'draw-event-card'
  | 'pass-start'

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

export type ObjectiveActivity = {
  rentReceived: number
  rentPaid: number
  eventCardsDrawn: number
  startCrossings: number
}

export const EMPTY_OBJECTIVE_ACTIVITY: Readonly<ObjectiveActivity> = {
  rentReceived: 0,
  rentPaid: 0,
  eventCardsDrawn: 0,
  startCrossings: 0,
}

export const EXPRESS_OBJECTIVES: readonly ExpressObjectiveDefinition[] = [
  { id: 'own-one-property', title: 'Primeira escritura', description: 'Tenha pelo menos um imóvel ou estação.', target: 1, reward: 50_000 },
  { id: 'own-three-properties', title: 'Pequeno portfólio', description: 'Tenha três imóveis ou estações.', target: 3, reward: 100_000 },
  { id: 'own-four-properties', title: 'Expansão urbana', description: 'Tenha quatro imóveis ou estações.', target: 4, reward: 150_000 },
  { id: 'own-one-station', title: 'Conexão entre bairros', description: 'Tenha uma estação.', target: 1, reward: 75_000 },
  { id: 'receive-rent', title: 'Renda de aluguel', description: 'Receba aluguel de outro jogador uma vez.', target: 1, reward: 100_000 },
  { id: 'pay-rent', title: 'Pé na cidade', description: 'Pague aluguel a outro jogador uma vez.', target: 1, reward: 75_000 },
  { id: 'draw-event-card', title: 'Notícias da cidade', description: 'Tire uma carta Sorte ou Revés.', target: 1, reward: 75_000 },
  { id: 'pass-start', title: 'Volta completa', description: 'Passe pela Partida uma vez.', target: 1, reward: 75_000 },
]

export function getExpressObjectiveProgress(
  objectiveId: ExpressObjectiveId,
  ownerSessionId: string,
  holdings: ReadonlyMap<number, ObjectiveHolding>,
  activity: Readonly<ObjectiveActivity> = EMPTY_OBJECTIVE_ACTIVITY,
) {
  const ownedProperties = boardSpaces.filter((space) => space.kind === 'property'
    && holdings.get(space.id)?.ownerSessionId === ownerSessionId)

  switch (objectiveId) {
    case 'own-one-property':
    case 'own-three-properties':
    case 'own-four-properties':
      return ownedProperties.length
    case 'own-one-station':
      return ownedProperties.filter((space) => !space.buildable).length
    case 'receive-rent':
      return activity.rentReceived
    case 'pay-rent':
      return activity.rentPaid
    case 'draw-event-card':
      return activity.eventCardsDrawn
    case 'pass-start':
      return activity.startCrossings
  }
}
