import { boardSpaces } from '../game/board'

export type GameSound = 'none' | 'dice' | 'pawn-step' | 'purchase' | 'money-in' | 'money-out' | 'auction' | 'milestone' | 'construction' | 'demolition' | 'ownership' | 'mortgage' | 'redemption' | 'airplane-pass' | 'police-siren' | 'crowd-cheer'
export type PropertyVisualState = { ownerSessionId: string; houses: number; isMortgaged?: boolean }
export type PropertyVisualChange = 'placed' | 'built' | 'demolished' | 'ownership' | 'released' | 'mortgaged' | 'redeemed'

export function getPropertyVisualChange(previous: PropertyVisualState | undefined, next: PropertyVisualState): PropertyVisualChange | null {
  if (!previous) return next.ownerSessionId ? 'placed' : null
  if (previous.ownerSessionId !== next.ownerSessionId) {
    if (!previous.ownerSessionId && next.ownerSessionId) return 'placed'
    return next.ownerSessionId ? 'ownership' : previous.ownerSessionId ? 'released' : null
  }
  if (previous.houses !== next.houses) return next.houses > previous.houses ? 'built' : 'demolished'
  if (Boolean(previous.isMortgaged) !== Boolean(next.isMortgaged)) return next.isMortgaged ? 'mortgaged' : 'redeemed'
  return null
}

export function getPropertyChangeSound(change: PropertyVisualChange): GameSound {
  switch (change) {
    case 'placed': return 'purchase'
    case 'built': return 'construction'
    case 'demolished': return 'demolition'
    case 'ownership':
    case 'released': return 'ownership'
    case 'mortgaged': return 'mortgage'
    case 'redeemed': return 'redemption'
  }
}

export function getGameSound(description: string): GameSound {
  const text = description.toLocaleLowerCase('pt-BR')
  if (text.includes('jogue o dado para definir o aluguel')) return 'none'
  if (text.includes('construção vendida') || text.includes('hotel devolvido')) return 'demolition'
  if (text.includes('construída') || text.includes('construido')) return 'construction'
  if (text.includes('hipotecada')) return 'mortgage'
  if (text.includes('resgatada')) return 'redemption'
  if (text.includes('transferidos') || text.includes('transferida') || text.includes('aceitou a troca')) return 'ownership'
  if (text.includes('leilão') || text.includes('leilao') || text.includes('lance')) return 'auction'
  if (text.includes('comprad') || text.includes('propriedade') && text.includes('compr')) return 'purchase'
  if (text.includes('objetivo') && (text.includes('cumpr') || text.includes('conclu'))) return 'milestone'
  if (text.includes('recebeu')) return 'money-in'
  if (text.includes('aluguel') || text.includes('dívida') || text.includes('pagos')) return 'money-out'
  return 'dice'
}

export function formatCashDelta(delta: number) {
  if (delta === 0) return ''
  const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Math.abs(delta))
  return `${delta > 0 ? '+' : '−'}${amount}`
}

export function getCashChangeTone(delta: number): 'gain' | 'loss' | null {
  if (delta > 0) return 'gain'
  if (delta < 0) return 'loss'
  return null
}

export function getCashToastPlacement(seatIndex: number): 'below' | 'above' {
  return seatIndex < 2 ? 'below' : 'above'
}

export function getLandingSpecialSound(spaceId: number): GameSound | null {
  const kind = boardSpaces[spaceId]?.kind
  if (kind === 'world-tour') return 'airplane-pass'
  if (kind === 'prison') return 'police-siren'
  if (kind === 'world-cup') return 'crowd-cheer'
  return null
}
