import { describe, expect, it } from 'vitest'
import { appendGameFeedback, personalizePlayerFeedback, type GameFeedbackItem } from './feedbackQueue'

const event = (id: number, message: string): GameFeedbackItem => ({ id, message, sound: 'money-in' })

describe('fila de avisos da partida', () => {
  it('mantém a ordem em que os avisos chegam', () => {
    const first = event(1, 'Aluguel pago')
    const second = event(2, 'A estação continua sem dono')

    expect(appendGameFeedback([first], second)).toEqual([first, second])
  })

  it('não repete um aviso que já está aguardando para ser exibido', () => {
    const first = event(1, 'A estação continua sem dono')

    expect(appendGameFeedback([first], event(2, first.message))).toEqual([first])
  })

  it('mantém avisos iguais quando pertencem a participantes diferentes', () => {
    const first = { ...event(1, 'Caiu na prisão'), playerName: 'Lia' }

    expect(appendGameFeedback([first], { ...event(2, first.message), playerName: 'Bia' })).toHaveLength(2)
  })

  it('identifica a pessoa no texto do aviso em vez de usar você ou sua peça', () => {
    expect(personalizePlayerFeedback('Você caiu na prisão. Sua peça ficará presa.', 'Lia'))
      .toBe('Lia caiu na prisão. Peça de Lia ficará presa.')
  })
})
