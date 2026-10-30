import { AUCTION_MIN_BID_INCREMENT } from '../../shared/game'

export function normalizeAuctionBidInput(currentValue: string, minimumBid: number) {
  const requiredBid = minimumBid || AUCTION_MIN_BID_INCREMENT
  const currentBid = Number(currentValue)
  return Number.isFinite(currentBid) && currentBid >= requiredBid
    ? currentValue
    : String(requiredBid)
}

export function adjustAuctionStartingBid(currentValue: string, direction: -1 | 1, minimumBid: number) {
  const step = AUCTION_MIN_BID_INCREMENT
  const parsed = Number(currentValue)
  const current = Number.isFinite(parsed) ? parsed : minimumBid
  return String(Math.max(minimumBid, current + direction * step))
}
