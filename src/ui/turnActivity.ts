type ActivityPhase = 'roll' | 'rolling' | 'station-rent' | 'station-rent-rolling' | 'moving' | 'resolve' | 'purchase' | 'jail' | 'world-cup' | 'world-tour' | 'debt' | 'ended'

export function shouldShowTurnCard(isMyTurn: boolean, phase: ActivityPhase) {
  return isMyTurn || phase === 'ended'
}

export function shouldSuppressTurnCardForFeedback(feedbackPending: boolean, phase: ActivityPhase) {
  return feedbackPending && !['purchase', 'jail', 'debt'].includes(phase)
}

export function getTurnActivityLabel(phase: ActivityPhase) {
  switch (phase) {
    case 'roll': return 'Aguardando a jogada'
    case 'rolling': return 'Girando os dados'
    case 'station-rent': return 'Definindo aluguel da estação'
    case 'station-rent-rolling': return 'Girando o dado da estação'
    case 'moving': return 'Movendo o peão'
    case 'purchase': return 'Decidindo a compra'
    case 'jail': return 'Decidindo na prisão'
    case 'world-cup': return 'Escolhendo a sede da Copa'
    case 'world-tour': return 'Escolhendo o destino'
    case 'debt': return 'Resolvendo dívida'
    case 'resolve': return 'Concluindo a jogada'
    case 'ended': return ''
  }
}
