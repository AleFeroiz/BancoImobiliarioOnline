import { describe, expect, it } from 'vitest'
import { finalScoreMetrics, rankFinalScore, scoreCriteria } from './scoreCriteria'

describe('descrição dos critérios do placar', () => {
  it('descreve o patrimônio liquidado como critério Clássico', () => {
    expect(scoreCriteria('classic')).toBe('Critério: patrimônio após liquidação · desempate: dados.')
  })
})

describe('classificação e métricas do placar final', () => {
  const players = [
    { sessionId: 'a', finalCash: 200, finalNetWorth: 900, tieBreakRoll: 4 },
    { sessionId: 'b', finalCash: 500, finalNetWorth: 700, tieBreakRoll: 8 },
    { sessionId: 'c', finalCash: 500, finalNetWorth: 800, tieBreakRoll: 2 },
  ]

  it('mostra patrimônio como métrica principal no Clássico', () => {
    expect(finalScoreMetrics('classic')).toEqual({ primaryLabel: 'Patrimônio final', secondaryLabel: 'Saldo final' })
    expect(rankFinalScore(players, 'classic', 'a').map(({ sessionId }) => sessionId)).toEqual(['a', 'c', 'b'])
  })

  it('preserva o desempate por dados depois do patrimônio', () => {
    const tiedPlayers = [
      { sessionId: 'a', finalCash: 300, finalNetWorth: 600, tieBreakRoll: 5 },
      { sessionId: 'b', finalCash: 300, finalNetWorth: 600, tieBreakRoll: 9 },
    ]
    expect(rankFinalScore(tiedPlayers, 'classic', '').map(({ sessionId }) => sessionId)).toEqual(['b', 'a'])
  })
})
