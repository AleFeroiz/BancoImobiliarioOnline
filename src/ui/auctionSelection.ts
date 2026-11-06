export function selectedAuctionProperty(spaceId: number, selecting: boolean, selectableSpaceIds: readonly number[]) {
  return selecting && selectableSpaceIds.includes(spaceId) ? spaceId : null
}
