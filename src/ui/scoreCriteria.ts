import type { GameMode } from '../../shared/lobby'

export type FinalScorePlayer = {
  sessionId: string
  finalCash: number
  finalNetWorth: number
  tieBreakRoll: number
}

export function finalScoreMetrics(mode: GameMode) {
  return mode === 'classic'
    ? { primaryLabel: 'Patrimônio final', secondaryLabel: 'Saldo final' }
    : { primaryLabel: 'Saldo final', secondaryLabel: 'Patrimônio final' }
}

export function rankFinalScore<T extends FinalScorePlayer>(players: T[], mode: GameMode, winnerSessionId: string) {
  return [...players].sort((first, second) => {
    if (first.sessionId === winnerSessionId) return -1
    if (second.sessionId === winnerSessionId) return 1
    const primary = mode === 'classic' ? second.finalNetWorth - first.finalNetWorth : second.finalCash - first.finalCash
    return primary || second.finalNetWorth - first.finalNetWorth || second.tieBreakRoll - first.tieBreakRoll
  })
}

export function scoreCriteria(mode: GameMode) {
  return mode === 'classic'
    ? 'Critério: patrimônio após liquidação · desempate: dados.'
    : 'Critério: saldo final · desempates: patrimônio e dados.'
}
