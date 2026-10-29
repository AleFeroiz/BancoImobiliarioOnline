type ActivityPhase = 'roll' | 'rolling' | 'moving' | 'resolve' | 'purchase' | 'jail' | 'debt' | 'ended'

export function shouldShowTurnCard(isMyTurn: boolean, phase: ActivityPhase) {
  return isMyTurn || phase === 'ended'
}

export function getTurnActivityLabel(phase: ActivityPhase) {
  switch (phase) {
    case 'roll': return 'Aguardando a jogada'
    case 'rolling': return 'Girando os dados'
    case 'moving': return 'Movendo o peão'
    case 'purchase': return 'Decidindo a compra'
    case 'jail': return 'Decidindo na prisão'
    case 'debt': return 'Resolvendo dívida'
    case 'resolve': return 'Concluindo a jogada'
    case 'ended': return ''
  }
}
