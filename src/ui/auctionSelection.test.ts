import { describe, expect, it } from 'vitest'
import { selectedAuctionProperty } from './auctionSelection'

describe('seleção de propriedade para leilão', () => {
  it('associa o clique apenas a uma propriedade iluminada durante o modo de seleção', () => {
    expect(selectedAuctionProperty(7, true, [2, 7, 11])).toBe(7)
    expect(selectedAuctionProperty(8, true, [2, 7, 11])).toBeNull()
    expect(selectedAuctionProperty(7, false, [2, 7, 11])).toBeNull()
  })
})
