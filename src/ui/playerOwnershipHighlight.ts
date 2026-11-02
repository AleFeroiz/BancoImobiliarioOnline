type OwnedProperty = { spaceId: number; ownerSessionId: string; isProperty: boolean }

export function getOwnedPropertySpaceIds(playerSessionId: string, holdings: readonly OwnedProperty[]) {
  if (!playerSessionId) return []
  return holdings
    .filter((holding) => holding.ownerSessionId === playerSessionId && holding.isProperty)
    .map((holding) => holding.spaceId)
    .sort((first, second) => first - second)
}
