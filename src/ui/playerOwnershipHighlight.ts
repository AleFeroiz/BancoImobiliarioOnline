type OwnedCity = { spaceId: number; ownerSessionId: string; isCity: boolean }

export function getOwnedCitySpaceIds(playerSessionId: string, holdings: readonly OwnedCity[]) {
  if (!playerSessionId) return []
  return holdings
    .filter((holding) => holding.ownerSessionId === playerSessionId && holding.isCity)
    .map((holding) => holding.spaceId)
    .sort((first, second) => first - second)
}
