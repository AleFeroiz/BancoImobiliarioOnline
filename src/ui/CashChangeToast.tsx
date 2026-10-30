import { useEffect, useRef, useState } from 'react'
import { formatCashDelta, getCashChangeTone } from './gameFeedback'

type CashChangeToastProps = { cash: number; playerName: string; placement: 'below' | 'above' }
type CashChange = { id: number; delta: number }

export function CashChangeToast({ cash, playerName, placement }: CashChangeToastProps) {
  const previousCash = useRef(cash)
  const nextId = useRef(0)
  const [queue, setQueue] = useState<CashChange[]>([])
  const current = queue[0]

  useEffect(() => {
    const delta = cash - previousCash.current
    previousCash.current = cash
    if (delta !== 0) {
      nextId.current += 1
      setQueue((items) => [...items, { id: nextId.current, delta }])
    }
  }, [cash])

  useEffect(() => {
    if (!current) return
    const timeout = window.setTimeout(() => setQueue((items) => items.slice(1)), 1250)
    return () => window.clearTimeout(timeout)
  }, [current?.id])

  if (!current) return null
  const tone = getCashChangeTone(current.delta)
  if (!tone) return null
  const amount = formatCashDelta(current.delta)

  return <span key={current.id} className={`cash-change-toast cash-change-${tone} cash-change-${placement}`} role="status" aria-label={`${playerName} ${tone === 'gain' ? 'ganhou' : 'perdeu'} ${amount.replace(/^[+−]/, '')}`}>{amount}</span>
}
