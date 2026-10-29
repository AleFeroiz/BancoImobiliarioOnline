import { describe, expect, it } from 'vitest'
import { getTurnActivityLabel, shouldShowTurnCard } from './turnActivity.js'

describe('atividade do jogador da vez', () => {
  it('descreve cada fase para os outros participantes', () => {
    expect(getTurnActivityLabel('rolling')).toBe('Girando os dados')
    expect(getTurnActivityLabel('moving')).toBe('Movendo o peão')
    expect(getTurnActivityLabel('purchase')).toBe('Decidindo a compra')
    expect(getTurnActivityLabel('debt')).toBe('Resolvendo dívida')
  })

  it('não mostra balão depois que a partida termina', () => {
    expect(getTurnActivityLabel('ended')).toBe('')
  })

  it('reserva o cartão de ação para a pessoa da vez e para o resultado final', () => {
    expect(shouldShowTurnCard(true, 'purchase')).toBe(true)
    expect(shouldShowTurnCard(false, 'purchase')).toBe(false)
    expect(shouldShowTurnCard(false, 'rolling')).toBe(false)
    expect(shouldShowTurnCard(false, 'ended')).toBe(true)
  })
})
