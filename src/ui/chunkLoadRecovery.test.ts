import { describe, expect, it } from 'vitest'
import { shouldReloadAfterChunkLoadError, type ChunkReloadStorage } from './chunkLoadRecovery'

function createStorage(): ChunkReloadStorage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
  }
}

describe('chunk load recovery', () => {
  it('allows one reload and blocks repeated reloads in the same cooldown window', () => {
    const storage = createStorage()

    expect(shouldReloadAfterChunkLoadError(storage, 1_000_000)).toBe(true)
    expect(shouldReloadAfterChunkLoadError(storage, 1_001_000)).toBe(false)
  })

  it('allows a later recovery attempt after the cooldown expires', () => {
    const storage = createStorage()

    expect(shouldReloadAfterChunkLoadError(storage, 1_000_000)).toBe(true)
    expect(shouldReloadAfterChunkLoadError(storage, 1_031_000)).toBe(true)
  })

  it('does not start a reload loop when session storage is unavailable', () => {
    const storage: ChunkReloadStorage = {
      getItem: () => { throw new Error('storage unavailable') },
      setItem: () => { throw new Error('storage unavailable') },
    }

    expect(shouldReloadAfterChunkLoadError(storage)).toBe(false)
  })
})
