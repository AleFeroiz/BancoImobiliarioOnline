import { describe, expect, it } from 'vitest'
import { formatCashDelta, getGameSound } from './gameFeedback'

describe('feedback da partida', () => {
  it('escolhe sons curtos de acordo com a jogada', () => {
    expect(getGameSound('Porto Dourado comprada por 160.000.')).toBe('purchase')
    expect(getGameSound('Aluguel: 40.000 pagos a Ana.')).toBe('money')
    expect(getGameSound('Bia venceu o leilão por 200.000.')).toBe('auction')
    expect(getGameSound('Objetivo cumprido!')).toBe('milestone')
    expect(getGameSound('Você escolheu não comprar.')).toBe('dice')
  })

  it('formata ganhos e perdas sem exibir zero', () => {
    expect(formatCashDelta(50_000)).toContain('+')
    expect(formatCashDelta(-75_000)).toContain('−')
    expect(formatCashDelta(0)).toBe('')
  })
})
