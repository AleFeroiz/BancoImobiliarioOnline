export type GameSound = 'dice' | 'purchase' | 'money' | 'auction' | 'milestone'

export function getGameSound(description: string): GameSound {
  const text = description.toLocaleLowerCase('pt-BR')
  if (text.includes('leilão') || text.includes('leilao') || text.includes('lance')) return 'auction'
  if (text.includes('comprad') || text.includes('propriedade') && text.includes('compr')) return 'purchase'
  if (text.includes('objetivo') && (text.includes('cumpr') || text.includes('conclu'))) return 'milestone'
  if (text.includes('aluguel') || text.includes('dívida') || text.includes('hipotec') || text.includes('recebeu') || text.includes('pagos')) return 'money'
  return 'dice'
}

export function formatCashDelta(delta: number) {
  if (delta === 0) return ''
  const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Math.abs(delta))
  return `${delta > 0 ? '+' : '−'}${amount}`
}
