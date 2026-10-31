import { describe, expect, it } from 'vitest'
import { getTurnActivityLabel, shouldShowTurnCard, shouldSuppressTurnCardForFeedback, shouldSuppressTurnCardForSpaceSelection } from './turnActivity.js'

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

  it('prioriza o resultado final sobre carta ativa e animação que ficaram pendentes', () => {
    expect(shouldShowTurnCard(false, 'ended', true, true)).toBe(true)
    expect(shouldSuppressTurnCardForFeedback(true, 'ended')).toBe(false)
    expect(shouldShowTurnCard(true, 'purchase', true, false)).toBe(false)
    expect(shouldShowTurnCard(true, 'purchase', false, true)).toBe(false)
  })

  it('mantém decisões que precisam de ação visíveis enquanto avisos transitórios estão na fila', () => {
    expect(shouldSuppressTurnCardForFeedback(true, 'purchase')).toBe(false)
    expect(shouldSuppressTurnCardForFeedback(true, 'jail')).toBe(false)
    expect(shouldSuppressTurnCardForFeedback(true, 'debt')).toBe(false)
    expect(shouldSuppressTurnCardForFeedback(true, 'roll')).toBe(true)
  })

  it('não deixa uma inspeção antiga esconder o painel de compra, mesmo sem saldo suficiente', () => {
    expect(shouldSuppressTurnCardForSpaceSelection(true, 'purchase', false, false, false)).toBe(false)
    expect(shouldSuppressTurnCardForSpaceSelection(true, 'resolve', false, false, false)).toBe(true)
  })
})
