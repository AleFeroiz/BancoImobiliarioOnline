export function toggleSelection<T>(selected: readonly T[], item: T): T[] {
  return selected.includes(item)
    ? selected.filter((current) => current !== item)
    : [...selected, item]
}
