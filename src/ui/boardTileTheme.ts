import type { BoardSpace } from '../../shared/board'

export type BoardTileTheme = { floor: string; trim: string; ink: string; outline: string }

export function getBoardTileTheme(space: BoardSpace, corner: boolean): BoardTileTheme {
  if (corner) {
    if (space.kind === 'start') return { floor: '#e7bd53', trim: '#fff1c9', ink: '#293d42', outline: '#fff7df' }
    if (space.kind === 'prison') return { floor: '#73899b', trim: '#d5e1e4', ink: '#fffaf1', outline: '#334954' }
    if (space.kind === 'rest') return { floor: '#588d69', trim: '#d4e5b8', ink: '#fffaf1', outline: '#355541' }
    return { floor: '#cf694e', trim: '#f4d09a', ink: '#fffaf1', outline: '#713f39' }
  }
  if (space.kind === 'property') {
    if (!space.buildable) return { floor: '#587f98', trim: '#c4e4e9', ink: '#fffaf1', outline: '#294954' }
    return { floor: space.color, trim: '#fff1d4', ink: '#233941', outline: '#fff9eb' }
  }
  if (space.kind === 'event') return { floor: '#d89d3d', trim: '#fff0c2', ink: '#273b3d', outline: '#fff8df' }
  if (space.kind === 'tax') return { floor: '#bf594b', trim: '#f4d197', ink: '#fffaf1', outline: '#743c39' }
  return { floor: '#6c9973', trim: '#e1e8ba', ink: '#fffaf1', outline: '#355541' }
}
