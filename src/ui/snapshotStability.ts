export function areRecordArraysEqual<T extends object>(first: readonly T[], second: readonly T[]) {
  if (first.length !== second.length) return false
  return first.every((record, index) => {
    const other = second[index]
    if (!other) return false
    const keys = Object.keys(record) as (keyof T)[]
    return keys.length === Object.keys(other).length && keys.every((key) => record[key] === other[key])
  })
}

export function areRecordMapsEqual<T extends object>(first: ReadonlyMap<string, T>, second: ReadonlyMap<string, T>) {
  if (first.size !== second.size) return false
  for (const [key, record] of first) {
    const other = second.get(key)
    if (!other || !areRecordArraysEqual([record], [other])) return false
  }
  return true
}

export function areNumberPairsEqual(first: readonly number[], second: readonly number[]) {
  return first.length === second.length && first.every((value, index) => value === second[index])
}
