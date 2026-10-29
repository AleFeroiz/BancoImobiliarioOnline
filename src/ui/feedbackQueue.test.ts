import { describe, expect, it } from 'vitest'
import { appendGameFeedback, type GameFeedbackItem } from './feedbackQueue'

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
})
