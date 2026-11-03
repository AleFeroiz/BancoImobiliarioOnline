export function shouldOpenAuctionPanel(previousAuctionId: number, currentAuctionId: number) {
  return currentAuctionId > 0 && currentAuctionId !== previousAuctionId
}
