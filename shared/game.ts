import { boardSpaces } from './board.js'

export type DiceRoll = readonly [number, number]

export const STARTING_CASH = 1_500_000
export const START_BONUS = 200_000
export const AUCTION_SECONDS = 20
export const AUCTION_MIN_INCREMENT = 10_000
export const PROPERTY_BUILD_LEVELS = 5
export const JAIL_FINE = 50_000
export const MAX_JAIL_ATTEMPTS = 3

export type PropertyHolding = { ownerSessionId: string; houses: number }

export type JailAttemptResult = {
  isJailed: boolean
  jailTurns: number
  cash: number
  move: boolean
  outcome: 'doubles' | 'failed' | 'forced-release'
  finePaid: number
}

export function resolveJailAttempt(dice: DiceRoll, jailTurns: number, cash: number): JailAttemptResult {
  if (dice[0] === dice[1]) return { isJailed: false, jailTurns: 0, cash, move: true, outcome: 'doubles', finePaid: 0 }
  const nextAttempt = jailTurns + 1
  if (nextAttempt < MAX_JAIL_ATTEMPTS) return { isJailed: true, jailTurns: nextAttempt, cash, move: false, outcome: 'failed', finePaid: 0 }
  const finePaid = Math.min(cash, JAIL_FINE)
  return { isJailed: false, jailTurns: 0, cash: cash - finePaid, move: true, outcome: 'forced-release', finePaid }
}

export function movePosition(position: number, dice: DiceRoll) {
  const spaces = boardSpaces.length
  return (position + dice[0] + dice[1]) % spaces
}

export function describeLanding(spaceId: number) {
  const space = boardSpaces[spaceId]
  if (!space) throw new RangeError(`Casa inválida: ${spaceId}`)
  const descriptions = {
    start: 'Você chegou à Partida.',
    property: 'Você parou em uma propriedade.',
    event: 'Você parou em uma casa de evento.',
    tax: 'Você parou em uma casa de taxa.',
    rest: 'Você parou em uma casa de descanso.',
    prison: 'Você está visitando a prisão.',
    'go-to-prison': 'Você parou na casa Vá para a prisão.',
  } satisfies Record<typeof space.kind, string>
  return `${space.name}. ${descriptions[space.kind]}`
}

export function calculateRent(spaceId: number, ownership: ReadonlyMap<number, string>, houses = 0) {
  const space = boardSpaces[spaceId]
  if (!space || space.kind !== 'property' || typeof space.price !== 'number') return 0
  const groupSpaces = boardSpaces.filter((candidate) => candidate.kind === 'property' && candidate.buildable && candidate.color === space.color)
  const groupIsComplete = groupSpaces.length > 1 && groupSpaces.every((candidate) => ownership.get(candidate.id) === ownership.get(spaceId))
  const baseRent = Math.max(10_000, Math.floor(space.price * 0.1))
  return baseRent * (groupIsComplete ? 2 : 1) + houses * Math.floor(space.price * 0.1)
}

export function constructionCost(spaceId: number) {
  const space = boardSpaces[spaceId]
  return space?.kind === 'property' && space.buildable && typeof space.price === 'number'
    ? Math.floor(space.price * 0.5)
    : 0
}

export function canBuildProperty(
  spaceId: number,
  ownerSessionId: string,
  holdings: ReadonlyMap<number, PropertyHolding>,
  cash: number,
) {
  const space = boardSpaces[spaceId]
  const holding = holdings.get(spaceId)
  if (!space || space.kind !== 'property' || !space.buildable || !holding || holding.ownerSessionId !== ownerSessionId) return false
  if (holding.houses >= PROPERTY_BUILD_LEVELS || cash < constructionCost(spaceId)) return false
  const groupSpaces = boardSpaces.filter((candidate) => candidate.kind === 'property' && candidate.buildable && candidate.color === space.color)
  if (groupSpaces.length < 2 || !groupSpaces.every((candidate) => holdings.get(candidate.id)?.ownerSessionId === ownerSessionId)) return false
  const lowestLevel = Math.min(...groupSpaces.map((candidate) => holdings.get(candidate.id)?.houses ?? 0))
  return holding.houses <= lowestLevel
}

export function taxForSpace(spaceId: number) {
  const taxes: Record<number, number> = { 4: 50_000, 18: 75_000, 28: 100_000, 38: 125_000 }
  return taxes[spaceId] ?? 0
}
