export function getLobbyPlayerEntries<T>(state: unknown): Array<[string, T]> | null {
  if (state === null || typeof state !== 'object') return null

  const players = (state as { players?: unknown }).players
  if (players === null || typeof players !== 'object') return null

  const entries = (players as { entries?: unknown }).entries
  if (typeof entries !== 'function') return null

  return Array.from((entries as () => Iterable<[string, T]>).call(players))
}
