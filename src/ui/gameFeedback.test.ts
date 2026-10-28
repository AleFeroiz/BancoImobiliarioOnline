import { describe, expect, it } from 'vitest'
import { formatCashDelta, getGameSound, getPropertyChangeSound, getPropertyVisualChange } from './gameFeedback'

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

  it('classifica construção, demolição, hipoteca e troca de dono para animações e sons', () => {
    const ownerA = { ownerSessionId: 'a', houses: 0, isMortgaged: false }
    expect(getPropertyVisualChange(undefined, ownerA)).toBe('placed')
    expect(getPropertyChangeSound(getPropertyVisualChange(undefined, ownerA)!)).toBe('purchase')
    expect(getPropertyVisualChange(ownerA, { ...ownerA, houses: 1 })).toBe('built')
    expect(getPropertyChangeSound(getPropertyVisualChange(ownerA, { ...ownerA, houses: 1 })!)).toBe('construction')
    expect(getPropertyVisualChange({ ...ownerA, houses: 1 }, ownerA)).toBe('demolished')
    expect(getPropertyChangeSound(getPropertyVisualChange({ ...ownerA, houses: 1 }, ownerA)!)).toBe('demolition')
    expect(getPropertyVisualChange(ownerA, { ...ownerA, isMortgaged: true })).toBe('mortgaged')
    expect(getPropertyChangeSound(getPropertyVisualChange(ownerA, { ...ownerA, isMortgaged: true })!)).toBe('mortgage')
    expect(getPropertyVisualChange({ ...ownerA, isMortgaged: true }, ownerA)).toBe('redeemed')
    expect(getPropertyVisualChange(ownerA, { ...ownerA, ownerSessionId: 'b' })).toBe('ownership')
    expect(getPropertyChangeSound('ownership')).toBe('ownership')
  })

  it('mapeia o texto sincronizado de venda, hipoteca e transferência aos efeitos adequados', () => {
    expect(getGameSound('Construção vendida em Vila Nova.')).toBe('demolition')
    expect(getGameSound('Hotel devolvido a quatro casas.')).toBe('demolition')
    expect(getGameSound('Rua das Flores hipotecada.')).toBe('mortgage')
    expect(getGameSound('Hipoteca resgatada.')).toBe('redemption')
    expect(getGameSound('Ana aceitou a troca proposta por Bia.')).toBe('ownership')
  })
})
