import { describe, expect, it } from 'vitest'
import { normalizeAuctionBidInput } from './auctionActions'

describe('lance de leilão', () => {
  it('avança o valor sugerido quando outro lance eleva o mínimo', () => {
    expect(normalizeAuctionBidInput('120000', 130_000)).toBe('130000')
  })

  it('preserva um lance digitado que já cobre o novo mínimo', () => {
    expect(normalizeAuctionBidInput('200000', 130_000)).toBe('200000')
  })

  it('usa o lance mínimo do jogo quando o campo está vazio', () => {
    expect(normalizeAuctionBidInput('', 0)).toBe('10000')
  })
})
