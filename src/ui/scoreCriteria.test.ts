import { describe, expect, it } from 'vitest'
import { scoreCriteria } from './scoreCriteria'

describe('descrição dos critérios do placar', () => {
  it('descreve o saldo como critério Express sem afirmar que houve empate', () => {
    expect(scoreCriteria('express')).toBe('Critério: saldo final · desempates: patrimônio e dados.')
  })

  it('descreve o patrimônio liquidado como critério Clássico', () => {
    expect(scoreCriteria('classic')).toBe('Critério: patrimônio após liquidação · desempate: dados.')
  })
})
