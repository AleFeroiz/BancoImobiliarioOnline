const CHUNK_RELOAD_KEY = 'bantec:chunk-reload-at'
const CHUNK_RELOAD_COOLDOWN_MS = 30_000

export interface ChunkReloadStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function shouldReloadAfterChunkLoadError(storage: ChunkReloadStorage, now = Date.now()) {
  try {
    const previousAttempt = Number(storage.getItem(CHUNK_RELOAD_KEY))
    if (Number.isFinite(previousAttempt) && previousAttempt > 0 && now - previousAttempt < CHUNK_RELOAD_COOLDOWN_MS) return false
    storage.setItem(CHUNK_RELOAD_KEY, String(now))
  } catch {
    return false
  }

  return true
}
