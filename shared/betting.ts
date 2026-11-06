export const BET_MINIMUM = 10_000
export const BET_STEP = 10_000
export const BET_STARTING_CASH_RATIO = 0.5
export const BET_CHANCE_SCALE = 10_000

export type BetBand = 'safer' | 'balanced' | 'long-shot'
export type BetProfile = { id: string; band: BetBand; chance: number; payoutNumerator: number; payoutDenominator: number }

export const BET_PROFILES: readonly BetProfile[] = [
  { id: 'safe-60', band: 'safer', chance: 6000, payoutNumerator: 3, payoutDenominator: 2 },
  { id: 'safe-65', band: 'safer', chance: 6500, payoutNumerator: 7, payoutDenominator: 5 },
  { id: 'safe-70', band: 'safer', chance: 7000, payoutNumerator: 13, payoutDenominator: 10 },
  { id: 'balanced-35', band: 'balanced', chance: 3500, payoutNumerator: 5, payoutDenominator: 2 },
  { id: 'balanced-40', band: 'balanced', chance: 4000, payoutNumerator: 9, payoutDenominator: 4 },
  { id: 'balanced-45', band: 'balanced', chance: 4500, payoutNumerator: 2, payoutDenominator: 1 },
  { id: 'long-10', band: 'long-shot', chance: 1000, payoutNumerator: 9, payoutDenominator: 1 },
  { id: 'long-15', band: 'long-shot', chance: 1500, payoutNumerator: 6, payoutDenominator: 1 },
  { id: 'long-20', band: 'long-shot', chance: 2000, payoutNumerator: 9, payoutDenominator: 2 },
]

export type BetOffer = BetProfile & { offerId: string; lapRevision: number }

export function betLimit(startingCash: number, availableCash: number) {
  if (!Number.isSafeInteger(startingCash) || startingCash < 0 || !Number.isSafeInteger(availableCash) || availableCash < 0) return 0
  return Math.floor(Math.min(startingCash * BET_STARTING_CASH_RATIO, availableCash) / BET_STEP) * BET_STEP
}

export function betPayout(amount: number, profile: BetProfile) {
  if (!Number.isSafeInteger(amount) || amount < BET_MINIMUM || !Number.isSafeInteger(profile.payoutNumerator) || profile.payoutNumerator <= 0 || !Number.isSafeInteger(profile.payoutDenominator) || profile.payoutDenominator <= 0) return 0
  return Math.floor(amount * profile.payoutNumerator / profile.payoutDenominator)
}

export function betWon(roll: number, chance: number) {
  return Number.isInteger(roll) && roll >= 0 && roll < BET_CHANCE_SCALE && Number.isInteger(chance) && chance > 0 && chance <= BET_CHANCE_SCALE && roll < chance
}

export function chooseBetProfiles(randomIndex: (maxExclusive: number) => number) {
  const bands: BetBand[] = ['safer', 'balanced', 'long-shot']
  return bands.map((band) => {
    const candidates = BET_PROFILES.filter((profile) => profile.band === band)
    const selected = candidates[randomIndex(candidates.length)]
    if (!selected) throw new RangeError('Fonte aleatória retornou índice inválido para opções de aposta.')
    return selected
  })
}
