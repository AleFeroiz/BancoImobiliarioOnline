import { describe, expect, it } from 'vitest'
import { shouldOpenAuctionPanel } from './auctionPanelState'

describe('auction panel visibility', () => {
  it('opens for every client when a new active auction arrives', () => {
    expect(shouldOpenAuctionPanel(0, 1)).toBe(true)
  })

  it('does not reopen after ordinary state updates in the same auction', () => {
    expect(shouldOpenAuctionPanel(1, 1)).toBe(false)
  })

  it('does not open when an auction closes', () => {
    expect(shouldOpenAuctionPanel(1, 0)).toBe(false)
  })

  it('opens when a different auction replaces a previous one', () => {
    expect(shouldOpenAuctionPanel(1, 2)).toBe(true)
  })
})
