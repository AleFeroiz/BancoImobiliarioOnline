type ActivityPhase = 'roll' | 'rolling' | 'moving' | 'resolve' | 'purchase' | 'buyback' | 'jail' | 'world-cup' | 'world-tour' | 'card-target' | 'debt' | 'ended'

export function shouldShowTurnCard(isMyTurn: boolean, phase: ActivityPhase) {
  return isMyTurn || phase === 'ended'
}

export function shouldSuppressTurnCardForFeedback(feedbackPending: boolean, phase: ActivityPhase) {
  return feedbackPending && !['purchase', 'buyback', 'jail', 'debt'].includes(phase)
}

export function shouldSuppressTurnCardForSpaceSelection(hasSelectedSpace: boolean, phase: ActivityPhase, ownPropertyLanding: boolean, showPropertyPanel: boolean, showObjectivePanel: boolean) {
  return hasSelectedSpace && phase !== 'ended' && phase !== 'purchase' && phase !== 'buyback' && !ownPropertyLanding && !showPropertyPanel && !showObjectivePanel
}

export function getTurnActivityLabel(phase: ActivityPhase) {
  switch (phase) {
    case 'roll': return 'Aguardando a jogada'
    case 'rolling': return 'Girando os dados'
    case 'moving': return 'Movendo o peão'
    case 'purchase': return 'Decidindo a compra'
    case 'buyback': return 'Decidindo a recompra'
    case 'jail': return 'Decidindo na prisão'
    case 'world-cup': return 'Escolhendo a sede da Copa'
    case 'world-tour': return 'Escolhendo o destino'
    case 'card-target': return 'Escolhendo o alvo da carta'
    case 'debt': return 'Resolvendo dívida'
    case 'resolve': return 'Concluindo a jogada'
    case 'ended': return ''
  }
}
