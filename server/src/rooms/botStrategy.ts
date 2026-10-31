import type { GameMode } from '../../../shared/lobby.js'
import { AUCTION_MIN_BID_INCREMENT } from '../../../shared/game.js'

export function shouldBotBuyProperty(price: number, cash: number, completesGroup: boolean, mode: GameMode) {
  void mode
  if (cash < price) return false
  const reserve = completesGroup ? 50_000 : 150_000
  return cash - price >= reserve
}

export function chooseBotAuctionBid({
  price,
  bankReturnValue,
  isBuildable,
  completesGroup,
  startingBid,
  highestBid,
  cash,
}: {
  price: number
  bankReturnValue: number
  isBuildable: boolean
  completesGroup: boolean
  startingBid: number
  highestBid: number
  cash: number
}) {
  const maxFactor = isBuildable && completesGroup ? 1.2 : isBuildable ? 0.75 : 0.8
  const maxValue = Math.floor((price - bankReturnValue) * maxFactor)
  const nextBid = highestBid > 0 ? highestBid + AUCTION_MIN_BID_INCREMENT : startingBid
  return nextBid <= maxValue && cash >= nextBid + 100_000 ? nextBid : null
}
