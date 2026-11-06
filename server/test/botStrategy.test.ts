import { describe, expect, it } from 'vitest'
import { chooseBotAuctionBid, shouldBotAcceptAuctionRequest, shouldBotBuyback, shouldBotBuyProperty } from '../src/rooms/botStrategy.js'

describe('estratégia básica de bots', () => {
  it('compra com reserva e aceita uma compra barata que completa grupo', () => {
    expect(shouldBotBuyProperty(500_000, 700_000, false, 'classic')).toBe(true)
    expect(shouldBotBuyProperty(500_000, 600_000, false, 'classic')).toBe(false)
    expect(shouldBotBuyProperty(500_000, 550_000, true, 'classic')).toBe(true)
  })

  it('dá lance apenas dentro do teto de valor e mantém uma reserva de caixa', () => {
    expect(chooseBotAuctionBid({ price: 300_000, bankReturnValue: 0, isBuildable: true, completesGroup: false, startingBid: 100_000, highestBid: 0, cash: 300_000 })).toBe(100_000)
    expect(chooseBotAuctionBid({ price: 300_000, bankReturnValue: 0, isBuildable: true, completesGroup: false, startingBid: 250_000, highestBid: 0, cash: 500_000 })).toBeNull()
    expect(chooseBotAuctionBid({ price: 300_000, bankReturnValue: 0, isBuildable: true, completesGroup: true, startingBid: 300_000, highestBid: 0, cash: 500_000 })).toBe(300_000)
  })

  it('aceita recomprar quando consegue manter uma reserva e prioriza completar um grupo', () => {
    expect(shouldBotBuyback(400_000, 2_000_000, false)).toBe(true)
    expect(shouldBotBuyback(400_000, 450_000, false)).toBe(false)
    expect(shouldBotBuyback(400_000, 450_000, true)).toBe(true)
  })

  it('avalia pedidos recebidos pelo bot conforme o valor oferecido', () => {
    expect(shouldBotAcceptAuctionRequest({ offer: 200_000, price: 200_000 })).toBe(true)
    expect(shouldBotAcceptAuctionRequest({ offer: 150_000, price: 200_000 })).toBe(false)
    expect(shouldBotAcceptAuctionRequest({ offer: 300_000, price: 200_000, improvementValue: 200_000 })).toBe(false)
  })
})
