import type { GameMode } from '../../shared/lobby'

export type FinalScorePlayer = {
  sessionId: string
  finalCash: number
  finalNetWorth: number
  tieBreakRoll: number
}

export function finalScoreMetrics(mode: GameMode) {
  void mode
  return { primaryLabel: 'Patrimônio final', secondaryLabel: 'Saldo final' }
}

export function rankFinalScore<T extends FinalScorePlayer>(players: T[], mode: GameMode, winnerSessionId: string) {
  return [...players].sort((first, second) => {
    if (first.sessionId === winnerSessionId) return -1
    if (second.sessionId === winnerSessionId) return 1
    void mode
    const primary = second.finalNetWorth - first.finalNetWorth
    return primary || second.finalNetWorth - first.finalNetWorth || second.tieBreakRoll - first.tieBreakRoll
  })
}

export function scoreCriteria(mode: GameMode) {
  void mode
  return 'Critério: patrimônio após liquidação · desempate: dados.'
}
