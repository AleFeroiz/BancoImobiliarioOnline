import { AUCTION_MIN_BID_INCREMENT } from '../../shared/game'

export function normalizeAuctionStartingBid(value: number, minimumBid = AUCTION_MIN_BID_INCREMENT) {
  return Math.max(minimumBid, Math.ceil(value / minimumBid) * minimumBid)
}

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
  const current = Number.isFinite(parsed) ? normalizeAuctionStartingBid(parsed, minimumBid) : minimumBid
  return String(Math.max(minimumBid, current + direction * step))
}

export function getAuctionStartBlockReason(startingBid: number, auctionAlreadyOpen: boolean, minimumBid = AUCTION_MIN_BID_INCREMENT) {
  if (auctionAlreadyOpen) return 'Já existe um leilão aberto nesta partida.'
  if (!Number.isSafeInteger(startingBid) || startingBid < minimumBid || startingBid % minimumBid !== 0) return `O lance inicial deve ser de pelo menos ${minimumBid.toLocaleString('pt-BR')} e múltiplo desse valor.`
  return null
}
