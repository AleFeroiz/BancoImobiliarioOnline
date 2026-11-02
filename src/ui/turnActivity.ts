type ActivityPhase = 'roll' | 'rolling' | 'moving' | 'resolve' | 'purchase' | 'buyback' | 'start-upgrade' | 'company-roll' | 'jail' | 'world-cup' | 'world-tour' | 'card-target' | 'debt' | 'ended'

export function isBoardSelectionGuidanceActive(hasBoardChoice: boolean, showingCardReveal: boolean) {
  return hasBoardChoice && !showingCardReveal
}

export function shouldShowTurnCard(isMyTurn: boolean, phase: ActivityPhase, hasActiveCardTitle = false, isPresentationAnimating = false) {
  if (phase === 'ended') return true
  return isMyTurn && !isPresentationAnimating && !['roll', 'company-roll', 'resolve', 'world-cup', 'world-tour'].includes(phase) && (!hasActiveCardTitle || phase === 'card-target' || phase === 'start-upgrade')
}

export function shouldSuppressTurnCardForFeedback(feedbackPending: boolean, phase: ActivityPhase) {
  return phase !== 'ended' && feedbackPending && !['purchase', 'buyback', 'start-upgrade', 'jail', 'debt'].includes(phase)
}

export function shouldSuppressTurnCardForSpaceSelection(hasSelectedSpace: boolean, phase: ActivityPhase, ownPropertyLanding: boolean, showPropertyPanel: boolean, showObjectivePanel: boolean) {
  return hasSelectedSpace && phase !== 'ended' && phase !== 'purchase' && phase !== 'buyback' && phase !== 'start-upgrade' && !ownPropertyLanding && !showPropertyPanel && !showObjectivePanel
}

export function getTurnActivityLabel(phase: ActivityPhase) {
  switch (phase) {
    case 'roll': return 'Aguardando a jogada'
    case 'rolling': return 'Girando os dados'
    case 'moving': return 'Movendo o peão'
    case 'purchase': return 'Decidindo a compra'
    case 'buyback': return 'Decidindo a recompra'
    case 'company-roll': return 'Girando o D6 da companhia'
    case 'start-upgrade': return 'Melhoria da Partida'
    case 'jail': return 'Decidindo na prisão'
    case 'world-cup': return 'Escolhendo a sede da Copa'
    case 'world-tour': return 'Escolhendo o destino'
    case 'card-target': return 'Escolhendo o alvo da carta'
    case 'debt': return 'Resolvendo dívida'
    case 'resolve': return 'Concluindo a jogada'
    case 'ended': return ''
  }
}
