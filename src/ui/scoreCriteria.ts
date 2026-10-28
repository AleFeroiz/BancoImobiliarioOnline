import type { GameMode } from '../../shared/lobby'

export function scoreCriteria(mode: GameMode) {
  return mode === 'classic'
    ? 'Critério: patrimônio após liquidação · desempate: dados.'
    : 'Critério: saldo final · desempates: patrimônio e dados.'
}
