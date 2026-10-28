import type { GameMode } from '../../../shared/lobby.js'
import { AUCTION_MIN_BID_INCREMENT, JAIL_FINE } from '../../../shared/game.js'

export type BotJailChoice = 'pay' | 'roll'

export function shouldBotBuyProperty(price: number, cash: number, completesGroup: boolean, mode: GameMode) {
  if (cash < price) return false
  const reserve = completesGroup ? 50_000 : mode === 'express' ? 75_000 : 150_000
  return cash - price >= reserve
}

export function chooseBotJailAction(cash: number, jailTurns: number): BotJailChoice {
  if (jailTurns >= 2) return 'roll'
  return cash >= JAIL_FINE + 100_000 ? 'pay' : 'roll'
}

export function chooseBotAuctionBid({
  price,
  mortgageValue,
  isBuildable,
  completesGroup,
  startingBid,
  highestBid,
  cash,
}: {
  price: number
  mortgageValue: number
  isBuildable: boolean
  completesGroup: boolean
  startingBid: number
  highestBid: number
  cash: number
}) {
  const maxFactor = isBuildable && completesGroup ? 1.2 : isBuildable ? 0.75 : 0.8
  const maxValue = Math.floor((price - mortgageValue) * maxFactor)
  const nextBid = highestBid > 0 ? highestBid + AUCTION_MIN_BID_INCREMENT : startingBid
  return nextBid <= maxValue && cash >= nextBid + 100_000 ? nextBid : null
}
