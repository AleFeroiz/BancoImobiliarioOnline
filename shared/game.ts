import { boardSpaces } from './board.js'

export type DiceRoll = readonly [number, number]

export const STARTING_CASH = 1_500_000
export const START_BONUS = 200_000
export const PROPERTY_BUILD_LEVELS = 3
export const PROPERTY_HOTEL_LEVEL = 4
export const DICE_ANIMATION_DURATION_MS = 2_800
export const PAWN_STEP_ANIMATION_DURATION_MS = 750
export const PAWN_TELEPORT_ANIMATION_DURATION_MS = 1_800
export const BUILDING_ANIMATION_DURATION_MS = 1_400
export const LANDING_PULSE_DURATION_MS = 2_200
export const JAIL_FINE = 50_000
export const MAX_JAIL_ATTEMPTS = 3
export const MORTGAGE_RATIO = 0.5
export const CLASSIC_MATCH_SECONDS = 30 * 60
export const EXPRESS_ROUNDS = 6
export const EXPRESS_PHASE_SECONDS = 40
export const TURN_ROLL_SECONDS = 20
export const TURN_DECISION_SECONDS = 10
export const AUCTION_DURATION_SECONDS = 20
export const AUCTION_MIN_BID_INCREMENT = 10_000

export type PropertyHolding = { ownerSessionId: string; houses: number; isMortgaged?: boolean }

export function calculateNetWorth(ownerSessionId: string, cash: number, holdings: ReadonlyMap<number, PropertyHolding>) {
  return Array.from(holdings.entries()).reduce((netWorth, [spaceId, holding]) => {
    const space = boardSpaces[spaceId]
    if (!space || space.kind !== 'property' || typeof space.price !== 'number' || holding.ownerSessionId !== ownerSessionId) return netWorth
    const propertyValue = space.price - (holding.isMortgaged ? mortgageValue(spaceId) : 0)
    const buildingsValue = holding.houses === PROPERTY_HOTEL_LEVEL
      ? Math.floor(hotelConstructionCost(spaceId) / 2)
      : Math.max(0, holding.houses) * buildingSaleValue(spaceId)
    return netWorth + propertyValue + buildingsValue
  }, Math.max(0, cash))
}

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

export function calculateRent(spaceId: number, ownership: ReadonlyMap<number, string>, houses = 0, isMortgaged = false) {
  const space = boardSpaces[spaceId]
  if (!space || space.kind !== 'property' || typeof space.price !== 'number' || isMortgaged) return 0
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

export function buildingSaleValue(spaceId: number, houses = 0) {
  if (houses === PROPERTY_HOTEL_LEVEL) return Math.floor(hotelConstructionCost(spaceId) / 2)
  return Math.floor(constructionCost(spaceId) * 0.5)
}

export function hotelConstructionCost(spaceId: number) {
  return constructionCost(spaceId) * 3
}

export function canSellBuilding(
  spaceId: number,
  ownerSessionId: string,
  holdings: ReadonlyMap<number, PropertyHolding>,
) {
  const space = boardSpaces[spaceId]
  const holding = holdings.get(spaceId)
  return Boolean(space && space.kind === 'property' && space.buildable && holding && holding.ownerSessionId === ownerSessionId && holding.houses > 0)
}

export function hasLiquidatableAssets(
  ownerSessionId: string,
  holdings: ReadonlyMap<number, PropertyHolding>,
) {
  return liquidatablePropertyIds(ownerSessionId, holdings).length > 0
}

export function liquidatablePropertyIds(
  ownerSessionId: string,
  holdings: ReadonlyMap<number, PropertyHolding>,
) {
  return Array.from(holdings.keys())
    .filter((spaceId) =>
      canSellBuilding(spaceId, ownerSessionId, holdings) || canMortgageProperty(spaceId, ownerSessionId, holdings),
    )
    .sort((first, second) => first - second)
}

export function mortgageValue(spaceId: number) {
  const space = boardSpaces[spaceId]
  return space?.kind === 'property' && typeof space.price === 'number'
    ? Math.floor(space.price * MORTGAGE_RATIO)
    : 0
}

export function mortgageRedemptionCost(spaceId: number) {
  return Math.ceil(mortgageValue(spaceId) * 11 / 10)
}

export function canMortgageProperty(
  spaceId: number,
  ownerSessionId: string,
  holdings: ReadonlyMap<number, PropertyHolding>,
) {
  const space = boardSpaces[spaceId]
  const holding = holdings.get(spaceId)
  if (!space || space.kind !== 'property' || !holding || holding.ownerSessionId !== ownerSessionId || holding.isMortgaged) return false
  if (!space.buildable) return true
  return !boardSpaces.some((candidate) => {
    if (candidate.kind !== 'property' || !candidate.buildable || candidate.color !== space.color) return false
    const groupHolding = holdings.get(candidate.id)
    return groupHolding?.ownerSessionId === ownerSessionId && groupHolding.houses > 0
  })
}

export function canRedeemMortgage(
  spaceId: number,
  ownerSessionId: string,
  holdings: ReadonlyMap<number, PropertyHolding>,
  cash: number,
) {
  const holding = holdings.get(spaceId)
  return holding?.ownerSessionId === ownerSessionId && holding.isMortgaged === true && cash >= mortgageRedemptionCost(spaceId)
}

export function canBuildProperty(
  spaceId: number,
  ownerSessionId: string,
  holdings: ReadonlyMap<number, PropertyHolding>,
  cash: number,
  targetHouses = (holdings.get(spaceId)?.houses ?? 0) + 1,
) {
  const space = boardSpaces[spaceId]
  const holding = holdings.get(spaceId)
  if (!space || space.kind !== 'property' || !space.buildable || !holding || holding.ownerSessionId !== ownerSessionId) return false
  if (holding.isMortgaged) return false
  if (targetHouses <= holding.houses || targetHouses > PROPERTY_BUILD_LEVELS || cash < (targetHouses - holding.houses) * constructionCost(spaceId)) return false
  const groupSpaces = boardSpaces.filter((candidate) => candidate.kind === 'property' && candidate.buildable && candidate.color === space.color)
  if (groupSpaces.some((candidate) => holdings.get(candidate.id)?.isMortgaged)) return false
  return true
}

export function canBuildHotel(
  spaceId: number,
  ownerSessionId: string,
  holdings: ReadonlyMap<number, PropertyHolding>,
  cash: number,
) {
  const space = boardSpaces[spaceId]
  const holding = holdings.get(spaceId)
  if (!space || space.kind !== 'property' || !space.buildable || !holding || holding.ownerSessionId !== ownerSessionId || holding.isMortgaged || holding.houses !== PROPERTY_BUILD_LEVELS) return false
  const groupSpaces = boardSpaces.filter((candidate) => candidate.kind === 'property' && candidate.buildable && candidate.color === space.color)
  return !groupSpaces.some((candidate) => holdings.get(candidate.id)?.isMortgaged) && cash >= hotelConstructionCost(spaceId)
}

export function taxForSpace(spaceId: number) {
  const taxes: Record<number, number> = { 4: 50_000, 18: 75_000, 28: 100_000, 38: 125_000 }
  return taxes[spaceId] ?? 0
}
