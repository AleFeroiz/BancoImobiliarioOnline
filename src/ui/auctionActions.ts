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

export function getAuctionStartBlockReason(canAuctionNow: boolean, groupHasBuildings: boolean, startingBid: number, minimumBid = AUCTION_MIN_BID_INCREMENT) {
  if (groupHasBuildings) return 'Venda todas as casas e hotéis do grupo antes de leiloar uma cidade dele.'
  if (!canAuctionNow) return 'O leilão só pode começar durante seu turno, depois da animação e fora de outra ação.'
  if (!Number.isSafeInteger(startingBid) || startingBid < minimumBid) return `O lance inicial mínimo é ${minimumBid.toLocaleString('pt-BR')}.`
  return null
}
