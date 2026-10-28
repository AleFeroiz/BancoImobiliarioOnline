export type EventCard = {
  id: string
  title: string
  description: string
  effect:
    | { kind: 'cash'; amount: number }
    | { kind: 'move'; spaces: number }
    | { kind: 'jail' }
}

export const EVENT_CARDS: readonly EventCard[] = [
  { id: 'public-dividend', title: 'Dividendo público', description: 'Você recebeu R$ 100.000 de participação nos lucros da cidade.', effect: { kind: 'cash', amount: 100_000 } },
  { id: 'community-prize', title: 'Prêmio comunitário', description: 'Sua praça venceu o concurso de conservação. Receba R$ 150.000.', effect: { kind: 'cash', amount: 150_000 } },
  { id: 'energy-refund', title: 'Reembolso de energia', description: 'A companhia corrigiu uma cobrança. Receba R$ 50.000.', effect: { kind: 'cash', amount: 50_000 } },
  { id: 'traffic-fine', title: 'Multa de trânsito', description: 'Pague R$ 50.000 pela infração registrada no centro.', effect: { kind: 'cash', amount: -50_000 } },
  { id: 'building-repair', title: 'Reparo emergencial', description: 'Um reparo inesperado custa R$ 100.000.', effect: { kind: 'cash', amount: -100_000 } },
  { id: 'city-assessment', title: 'Contribuição urbana', description: 'A nova iluminação pública custa R$ 150.000.', effect: { kind: 'cash', amount: -150_000 } },
  { id: 'shortcut', title: 'Atalho pela cidade', description: 'Avance três casas e resolva onde parar.', effect: { kind: 'move', spaces: 3 } },
  { id: 'court-summons', title: 'Convocação judicial', description: 'Vá direto para a prisão. Sua vez termina ao chegar.', effect: { kind: 'jail' } },
]

export function applyCardCashEffect(cash: number, amount: number) {
  return Math.max(0, cash + amount)
}
