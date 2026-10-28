import { AUCTION_MIN_BID_INCREMENT } from '../../shared/game'

export function normalizeAuctionBidInput(currentValue: string, minimumBid: number) {
  const requiredBid = minimumBid || AUCTION_MIN_BID_INCREMENT
  const currentBid = Number(currentValue)
  return Number.isFinite(currentBid) && currentBid >= requiredBid
    ? currentValue
    : String(requiredBid)
}
