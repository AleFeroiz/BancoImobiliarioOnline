import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Room } from '@colyseus/sdk'
import { BET_MINIMUM, BET_STEP, betLimit, type BetOffer } from '../../shared/betting'
import { getBettingPanelPosition } from './bettingPanelPosition'

type BetReceipt = { requestId: string; offerId: string; amount: number; optionId: string; won: boolean; payout: number; net: number }
type Props = { room: Room; cash: number; startingCash: number; used: boolean; lapRevision: number; isInDebt: boolean; isEnded: boolean }
const formatMoney = (amount: number) => `R$ ${amount.toLocaleString('pt-BR')}`

export function BettingPanel({ room, cash, startingCash, used, lapRevision, isInDebt, isEnded }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(BET_MINIMUM)
  const [offers, setOffers] = useState<BetOffer[]>([])
  const [offerRevision, setOfferRevision] = useState(-1)
  const [receipt, setReceipt] = useState<BetReceipt | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const [panelPosition, setPanelPosition] = useState({ left: 12, top: 12, width: 300, maxHeight: 400 })
  const limit = betLimit(startingCash, cash)
  const currentReceipt = receipt && offers.some((offer) => offer.offerId === receipt.offerId) ? receipt : null

  useEffect(() => {
    const removeOffers = room.onMessage<{ lapRevision: number; offers: BetOffer[]; receipt: BetReceipt | null }>('bet:offers', (data) => {
      setOffers(data.offers)
      setOfferRevision(data.lapRevision)
      setReceipt(data.receipt)
      setError('')
    })
    const removeResult = room.onMessage<BetReceipt>('bet:result', (data) => { setReceipt(data); setPending(false); setError('') })
    const removeRejected = room.onMessage<{ message: string }>('bet:rejected', (data) => { setPending(false); setError(data.message) })
    return () => { removeOffers(); removeResult(); removeRejected() }
  }, [room])

  useEffect(() => {
    if (offerRevision !== lapRevision) { setOffers([]); setOfferRevision(-1); setReceipt(null); setPending(false) }
  }, [lapRevision, offerRevision])

  useEffect(() => { setAmount((current) => Math.min(current, Math.max(BET_MINIMUM, Math.floor(limit / BET_STEP) * BET_STEP))) }, [limit])

  const disabledReason = isEnded ? 'A partida terminou.' : isInDebt ? 'Quite sua dívida antes de apostar.' : used ? 'A aposta desta volta já foi usada.' : limit < BET_MINIMUM ? 'Você precisa ter pelo menos R$ 10.000 disponíveis.' : ''
  const displayedOffers = useMemo(() => offers, [offers])
  const changeAmount = (delta: number) => setAmount((value) => Math.max(BET_MINIMUM, Math.min(limit, Math.round((value + delta) / BET_STEP) * BET_STEP)))

  const updatePanelPosition = useCallback(() => {
    const anchor = triggerRef.current?.getBoundingClientRect()
    if (!anchor) return
    const viewport = window.visualViewport
    const width = viewport?.width ?? window.innerWidth
    const height = viewport?.height ?? window.innerHeight
    const panel = panelRef.current
    setPanelPosition(getBettingPanelPosition(
      { left: anchor.left, right: anchor.right, top: anchor.top },
      { width: panel?.offsetWidth ?? 390, height: panel?.scrollHeight ?? 500 },
      { width, height, offsetLeft: viewport?.offsetLeft ?? 0, offsetTop: viewport?.offsetTop ?? 0 },
      width <= 640,
    ))
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPosition()
    const observer = new ResizeObserver(updatePanelPosition)
    if (panelRef.current) observer.observe(panelRef.current)
    window.addEventListener('resize', updatePanelPosition)
    window.visualViewport?.addEventListener('resize', updatePanelPosition)
    window.visualViewport?.addEventListener('scroll', updatePanelPosition)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updatePanelPosition)
      window.visualViewport?.removeEventListener('resize', updatePanelPosition)
      window.visualViewport?.removeEventListener('scroll', updatePanelPosition)
    }
  }, [open, updatePanelPosition])

  if (isEnded) return null
  return <div className="betting-control">
    <button ref={triggerRef} type="button" aria-expanded={open} aria-controls="betting-panel" onClick={() => { const next = !open; setOpen(next); if (next) room.send('requestBetOffers') }}><span aria-hidden="true">◉</span><small>APOSTAS{used ? ' · USADA' : ''}</small></button>
    {open && createPortal(<section ref={panelRef} id="betting-panel" className="betting-panel" aria-label="Apostas" data-camera-drag="off" style={{ left: panelPosition.left, top: panelPosition.top, width: panelPosition.width, maxHeight: panelPosition.maxHeight }}>
      <header><strong>APOSTAS DA VOLTA</strong><button type="button" aria-label="Fechar apostas" onClick={() => setOpen(false)}>×</button></header>
      <p>Uma aposta até passar pela Partida. Limite: {formatMoney(limit)}.</p>
      <div className="bet-amount"><button type="button" aria-label="Diminuir aposta em R$ 100.000" disabled={amount <= BET_MINIMUM || pending} onClick={() => changeAmount(-100_000)}>−100 mil</button><button type="button" aria-label="Diminuir aposta em R$ 10.000" disabled={amount <= BET_MINIMUM || pending} onClick={() => changeAmount(-10_000)}>−10 mil</button><strong>{formatMoney(amount)}</strong><button type="button" aria-label="Aumentar aposta em R$ 10.000" disabled={amount >= limit || pending} onClick={() => changeAmount(10_000)}>+10 mil</button><button type="button" aria-label="Aumentar aposta em R$ 100.000" disabled={amount >= limit || pending} onClick={() => changeAmount(100_000)}>+100 mil</button></div>
      {disabledReason ? <p role="status">{disabledReason}</p> : displayedOffers.length === 0 ? <p role="status">Carregando opções…</p> : <div className="bet-offers">{displayedOffers.map((offer) => {
        const total = Math.floor(amount * offer.payoutNumerator / offer.payoutDenominator)
        const profit = total - amount
        return <button key={offer.id} type="button" disabled={pending || used || isInDebt || amount > limit || offerRevision !== lapRevision} onClick={() => {
          if (pending || used || isInDebt || amount > limit) return
          setPending(true); setError('')
          room.send('placeBet', { requestId: crypto.randomUUID(), offerId: offer.offerId, optionId: offer.id, amount })
        }}><strong>{(offer.chance / 100).toLocaleString('pt-BR')}% de chance</strong><span>Lucro {formatMoney(profit)}</span><small>Recebe {formatMoney(total)} no total · se perder, perde {formatMoney(amount)}</small><b>Apostar {formatMoney(amount)}</b></button>
      })}</div>}
      {error && <p role="alert">{error}</p>}
      {currentReceipt && <p role="status" aria-live="polite">{currentReceipt.won ? `Você ganhou! Lucro de ${formatMoney(currentReceipt.net)}.` : `Você perdeu ${formatMoney(currentReceipt.amount)}.`}</p>}
    </section>, document.body)}
  </div>
}
