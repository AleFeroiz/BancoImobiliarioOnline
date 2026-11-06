import type { GameMode } from '../../../shared/lobby.js'
import { AUCTION_MIN_BID_INCREMENT } from '../../../shared/game.js'

export function shouldBotBuyProperty(price: number, cash: number, completesGroup: boolean, mode: GameMode) {
  void mode
  if (cash < price) return false
  const reserve = completesGroup ? 50_000 : 150_000
  return cash - price >= reserve
}

export function shouldBotBuyback(price: number, cash: number, completesGroup: boolean) {
  if (cash < price) return false
  const reserve = completesGroup ? 50_000 : 150_000
  return cash - price >= reserve
}

export function chooseBotAuctionBid({
  price,
  bankReturnValue: _bankReturnValue,
  isBuildable,
  completesGroup,
  improvementValue = 0,
  blocksImmediateWin = false,
  startingBid,
  highestBid,
  cash,
}: {
  price: number
  bankReturnValue: number
  isBuildable: boolean
  completesGroup: boolean
  improvementValue?: number
  blocksImmediateWin?: boolean
  startingBid: number
  highestBid: number
  cash: number
}) {
  const maxFactor = completesGroup ? 1.2 : isBuildable ? 0.75 : 0.8
  const maxValue = Math.floor((price * maxFactor + improvementValue * 0.65) * (blocksImmediateWin ? 1.2 : 1))
  const nextBid = highestBid > 0 ? highestBid + AUCTION_MIN_BID_INCREMENT : startingBid
  const reserve = completesGroup || blocksImmediateWin ? 50_000 : 150_000
  return nextBid <= maxValue && cash - nextBid >= reserve ? nextBid : null
}

export function shouldBotAcceptAuctionRequest({ offer, price, improvementValue = 0, completesGroup = false }: { offer: number; price: number; improvementValue?: number; completesGroup?: boolean }) {
  const requiredValue = price + improvementValue * 0.75 + (completesGroup ? price * 0.25 : 0)
  return offer >= requiredValue
}
