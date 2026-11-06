import { describe, expect, it } from 'vitest'
import { adjustAuctionStartingBid, getAuctionStartBlockReason, normalizeAuctionBidInput, normalizeAuctionStartingBid } from './auctionActions'

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

  it('arredonda preços de tabela para o próximo incremento válido', () => {
    expect(normalizeAuctionStartingBid(275_000)).toBe(280_000)
    expect(normalizeAuctionStartingBid(280_000)).toBe(280_000)
    expect(getAuctionStartBlockReason(275_000, false)).toContain('múltiplo')
  })

  it('aumenta e diminui o lance pelos botões, respeitando o mínimo', () => {
    expect(adjustAuctionStartingBid('400000', 1, 10_000)).toBe('410000')
    expect(adjustAuctionStartingBid('400000', -1, 10_000)).toBe('390000')
    expect(adjustAuctionStartingBid('10000', -1, 10_000)).toBe('10000')
  })

  it('permite anunciar fora da vez mesmo com construções e valida só disputa aberta ou lance inicial', () => {
    expect(getAuctionStartBlockReason(500_000, false)).toBeNull()
    expect(getAuctionStartBlockReason(0, false)).toContain('pelo menos 10.000')
    expect(getAuctionStartBlockReason(500_000, true)).toContain('Já existe um leilão')
  })
})
