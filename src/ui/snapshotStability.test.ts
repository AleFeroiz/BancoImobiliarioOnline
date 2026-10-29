import { describe, expect, it } from 'vitest'
import { areNumberPairsEqual, areRecordArraysEqual, areRecordMapsEqual } from './snapshotStability'

describe('snapshot stability', () => {
  it('treats freshly decoded player rows with the same values as unchanged', () => {
    expect(areRecordArraysEqual(
      [{ sessionId: 'p1', position: 8, cash: 1_500_000 }],
      [{ sessionId: 'p1', position: 8, cash: 1_500_000 }],
    )).toBe(true)
  })

  it('detects changed, added, removed, or reordered players', () => {
    const first = [{ sessionId: 'p1', position: 8 }, { sessionId: 'p2', position: 3 }]
    expect(areRecordArraysEqual(first, [{ sessionId: 'p1', position: 9 }, first[1]!])).toBe(false)
    expect(areRecordArraysEqual(first, first.slice(0, 1))).toBe(false)
    expect(areRecordArraysEqual(first, [...first].reverse())).toBe(false)
  })

  it('keeps property map identity when decoded holdings are unchanged', () => {
    expect(areRecordMapsEqual(
      new Map([['4', { ownerSessionId: 'p1', houses: 0 }]]),
      new Map([['4', { ownerSessionId: 'p1', houses: 0 }]]),
    )).toBe(true)
    expect(areRecordMapsEqual(
      new Map([['4', { ownerSessionId: 'p1', houses: 0 }]]),
      new Map([['4', { ownerSessionId: 'p1', houses: 1 }]]),
    )).toBe(false)
  })

  it('compares dice values without allocating new pairs for unchanged rolls', () => {
    expect(areNumberPairsEqual([2, 5], [2, 5])).toBe(true)
    expect(areNumberPairsEqual([2, 5], [2, 6])).toBe(false)
  })
})
