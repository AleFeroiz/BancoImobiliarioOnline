import { boardSpaces, companyIds, getLineTitleIds, type RegionId } from './board.js'

export type DiceRoll = readonly [number, number]
export type MatchEndReason = 'timeout' | 'bankruptcy' | 'no-solvent-players' | 'monopoly-line' | 'double-regional-monopoly' | 'all-companies'

export const STARTING_CASH = 2_000_000
export const START_BONUS = 300_000
export const FESTIVAL_CITY_COUNT = 3
export const FESTIVAL_RENT_MULTIPLIER = 2
export const WORLD_CUP_RENT_MULTIPLIER = 2
export const COMPANY_RENT_PER_OWNED = 50_000
export const PROPERTY_BUILD_LEVELS = 3
export const PROPERTY_HOTEL_LEVEL = 4
export const DICE_ANIMATION_DURATION_MS = 2_800
export const PAWN_STEP_ANIMATION_DURATION_MS = 375
export const PAWN_TELEPORT_ANIMATION_DURATION_MS = 1_800
export const BUILDING_ANIMATION_DURATION_MS = 1_400
export const ANIMATION_SPEEDS = [0.5, 1, 2] as const
export type AnimationSpeed = (typeof ANIMATION_SPEEDS)[number]
export const DEFAULT_ANIMATION_SPEED: AnimationSpeed = 1

export function isAnimationSpeed(value: unknown): value is AnimationSpeed {
  return typeof value === 'number' && ANIMATION_SPEEDS.some((speed) => speed === value)
}

export function getAnimationDuration(durationMs: number, speed: number) {
  const validSpeed = isAnimationSpeed(speed) ? speed : DEFAULT_ANIMATION_SPEED
  return Math.max(1, Math.round(durationMs * DEFAULT_ANIMATION_SPEED / (validSpeed * 2)))
}

export const LANDING_PULSE_DURATION_MS = 2_200
export const JAIL_TURNS = 3
export const MATCH_DURATIONS = [15 * 60, 30 * 60, 60 * 60, 0] as const
export type MatchDuration = (typeof MATCH_DURATIONS)[number]
export const CLASSIC_MATCH_SECONDS: MatchDuration = 30 * 60
export const TURN_ROLL_SECONDS = 20
export const TURN_DECISION_SECONDS = 15
export const AUCTION_DURATION_SECONDS = 20
export const AUCTION_MIN_BID_INCREMENT = 10_000

export function isMatchDuration(value: unknown): value is MatchDuration {
  return typeof value === 'number' && MATCH_DURATIONS.some((duration) => duration === value)
}

export type PropertyHolding = { ownerSessionId: string; houses: number; blackoutTurns?: number; protectionTurns?: number }

export function calculateNetWorth(ownerSessionId: string, cash: number, holdings: ReadonlyMap<number, PropertyHolding>) {
  return Array.from(holdings.entries()).reduce((netWorth, [spaceId, holding]) => {
    const space = boardSpaces[spaceId]
    if (!space || space.kind !== 'property' || typeof space.price !== 'number' || holding.ownerSessionId !== ownerSessionId) return netWorth
    const propertyValue = space.price
    const buildingsValue = holding.houses === PROPERTY_HOTEL_LEVEL
      ? Math.floor(hotelConstructionCost(spaceId) / 2)
      : Math.max(0, holding.houses) * buildingSaleValue(spaceId)
    return netWorth + propertyValue + buildingsValue
  }, Math.max(0, cash))
}

export function movePosition(position: number, dice: DiceRoll) {
  const spaces = boardSpaces.length
  return (position + dice[0] + dice[1]) % spaces
}

export function canBuildLevelAfterFirstLap(hasCompletedFirstLap: boolean, targetHouses: number) {
  return hasCompletedFirstLap || targetHouses < PROPERTY_BUILD_LEVELS
}

export function applyRentMultiplier(amount: number, multiplier: number) {
  if (!Number.isFinite(amount) || !Number.isFinite(multiplier) || amount <= 0 || multiplier <= 0) return 0
  return Math.floor(amount * multiplier)
}

export function chooseFestivalCityIds(random: () => number = Math.random) {
  const candidates = boardSpaces.filter((space) => space.kind === 'property' && space.buildable).map((space) => space.id)
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))))
    ;[candidates[index], candidates[swapIndex]] = [candidates[swapIndex]!, candidates[index]!]
  }
  return candidates.slice(0, FESTIVAL_CITY_COUNT)
}

export function areDiceDoubles(dice: DiceRoll) {
  return dice[0] === dice[1]
}

export function describeLanding(spaceId: number) {
  const space = boardSpaces[spaceId]
  if (!space) throw new RangeError(`Casa inválida: ${spaceId}`)
  const descriptions = {
    start: 'Você chegou à Partida.',
    property: 'Você parou em uma propriedade.',
    event: 'Você parou em uma casa de evento.',
    tax: 'Você parou em uma casa de taxa.',
    prison: 'Você caiu na prisão. Aguarde, tente duplas ou pague R$ 200.000 para sair.',
    'world-cup': 'Escolha uma propriedade para sediar a Copa do Mundo; o aluguel dela dobra.',
    'world-tour': 'Escolha uma propriedade sua, livre ou casa especial para visitar.',
  } satisfies Record<typeof space.kind, string>
  return `${space.name}. ${descriptions[space.kind]}`
}

export function calculateRent(spaceId: number, ownership: ReadonlyMap<number, string>, houses = 0, worldCupSpaceId = -1, festivalSpaceIds: ReadonlySet<number> = new Set()) {
  const space = boardSpaces[spaceId]
  if (!space || space.kind !== 'property' || typeof space.price !== 'number' || space.company) return 0
  const groupSpaces = boardSpaces.filter((candidate) => candidate.region === space.region)
  const groupIsComplete = groupSpaces.length > 1 && groupSpaces.every((candidate) => ownership.get(candidate.id) === ownership.get(spaceId))
  const level = Math.max(0, Math.min(4, houses))
  const rent = (space.rentAdditions ?? []).slice(0, level + 1).reduce((total, addition) => total + addition, 0)
  const multiplier = (groupIsComplete ? 2 : 1) * (festivalSpaceIds.has(spaceId) ? FESTIVAL_RENT_MULTIPLIER : 1) * (spaceId === worldCupSpaceId ? WORLD_CUP_RENT_MULTIPLIER : 1)
  return rent * multiplier
}

export function calculateCompanyRent(ownership: ReadonlyMap<number, string>, ownerSessionId: string, dieRoll = 1) {
  const ownedCount = companyIds.filter((spaceId) => ownership.get(spaceId) === ownerSessionId).length
  return ownedCount * COMPANY_RENT_PER_OWNED * Math.max(0, Math.min(6, Math.trunc(dieRoll)))
}

export function getMonopolyWinReason(ownership: ReadonlyMap<number, string>, ownerSessionId: string): MatchEndReason | null {
  const completeRegion = (region: RegionId) => boardSpaces
    .filter((space) => space.region === region)
    .every((space) => ownership.get(space.id) === ownerSessionId)
  const regionIds: RegionId[] = ['north', 'center-west', 'northeast', 'south', 'southeast']
  const completedRegions = regionIds.filter(completeRegion).length
  const completeLine = [0, 1, 2, 3].some((side) => getLineTitleIds(side).every((spaceId) => ownership.get(spaceId) === ownerSessionId))
  const allCompanies = companyIds.every((spaceId) => ownership.get(spaceId) === ownerSessionId)
  if (completeLine) return 'monopoly-line'
  if (completedRegions >= 2) return 'double-regional-monopoly'
  if (allCompanies) return 'all-companies'
  return null
}

export function hasWinningMonopoly(ownership: ReadonlyMap<number, string>, ownerSessionId: string) {
  return getMonopolyWinReason(ownership, ownerSessionId) !== null
}

export function getMatchEndSummary(reason: MatchEndReason | '') {
  const summaries: Record<MatchEndReason, string> = {
    timeout: 'Tempo esgotado: resultado definido pelo patrimônio final.',
    bankruptcy: 'Vitória após a falência do último adversário solvente.',
    'no-solvent-players': 'A partida terminou sem participantes solventes.',
    'monopoly-line': 'Vitória por Monopólio em Linha.',
    'double-regional-monopoly': 'Vitória por Monopólio Duplo Regional.',
    'all-companies': 'Vitória pelas quatro companhias.',
  }
  return reason ? summaries[reason] : 'Partida encerrada.'
}

export function constructionCost(spaceId: number) {
  const space = boardSpaces[spaceId]
  return space?.kind === 'property' && space.buildable && typeof space.price === 'number'
    ? space.constructionCost ?? Math.floor(space.price * 0.5)
    : 0
}

export function buildingSaleValue(spaceId: number, houses = 0) {
  if (houses === PROPERTY_HOTEL_LEVEL) return Math.floor(hotelConstructionCost(spaceId) / 2)
  return Math.floor(constructionCost(spaceId) * 0.5)
}

export function hotelConstructionCost(spaceId: number) {
  const space = boardSpaces[spaceId]
  return space?.kind === 'property' && space.buildable ? space.hotelCost ?? constructionCost(spaceId) * 3 : 0
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
      canSellBuilding(spaceId, ownerSessionId, holdings) || canReturnPropertyToBank(spaceId, ownerSessionId, holdings),
    )
    .sort((first, second) => first - second)
}

export function bankReturnValue(spaceId: number) {
  const space = boardSpaces[spaceId]
  return space?.kind === 'property' && typeof space.price === 'number'
    ? Math.floor(space.price * 0.5)
    : 0
}

export function forcedBuybackCost(spaceId: number, houses = 0) {
  const space = boardSpaces[spaceId]
  if (!space || space.kind !== 'property' || typeof space.price !== 'number' || houses === PROPERTY_HOTEL_LEVEL) return 0
  if (!Number.isInteger(houses) || houses < 0 || houses > PROPERTY_BUILD_LEVELS) return 0
  return (space.price + houses * constructionCost(spaceId)) * 2
}

export function canReturnPropertyToBank(
  spaceId: number,
  ownerSessionId: string,
  holdings: ReadonlyMap<number, PropertyHolding>,
) {
  const space = boardSpaces[spaceId]
  const holding = holdings.get(spaceId)
  if (!space || space.kind !== 'property' || !holding || holding.ownerSessionId !== ownerSessionId) return false
  if (!space.buildable) return true
  return !boardSpaces.some((candidate) => {
    if (candidate.kind !== 'property' || !candidate.buildable || candidate.color !== space.color) return false
    const groupHolding = holdings.get(candidate.id)
    return groupHolding?.ownerSessionId === ownerSessionId && groupHolding.houses > 0
  })
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
  if (targetHouses <= holding.houses || targetHouses > PROPERTY_BUILD_LEVELS || cash < (targetHouses - holding.houses) * constructionCost(spaceId)) return false
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
  if (!space || space.kind !== 'property' || !space.buildable || !holding || holding.ownerSessionId !== ownerSessionId || holding.houses !== PROPERTY_BUILD_LEVELS) return false
  return cash >= hotelConstructionCost(spaceId)
}

export function taxForSpace(spaceId: number, holdingsCount = 1) {
  const rate = boardSpaces[spaceId]?.taxAmount ?? 0
  return rate * Math.max(0, holdingsCount)
}
