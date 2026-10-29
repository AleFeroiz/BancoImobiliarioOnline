import type { CSSProperties } from 'react'
import { getCashHudPieceCounts } from './cashValues'

export function CashHudSymbols({ cash }: { cash: number }) {
  const pieceCounts = getCashHudPieceCounts(cash)
  const groups = [
    { name: 'gold', count: pieceCounts.gold },
    { name: 'silver', count: pieceCounts.silver },
    { name: 'note', count: pieceCounts.note },
  ]
  return <span className="cash-hud-symbols">{groups.flatMap(({ name, count }) => Array.from({ length: count }, (_, index) => <i className={`cash-hud-piece cash-${name}`} key={`${name}-${index}`} style={{ '--piece-index': index } as CSSProperties}><b /><b /><b /></i>))}</span>
}
