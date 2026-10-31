import { describe, expect, it } from 'vitest'
import { formatCashDelta, getCashChangeTone, getCashToastPlacement, getGameSound, getLandingSpecialSound, getPropertyChangeSound, getPropertyVisualChange } from './gameFeedback'

describe('feedback da partida', () => {
  it('associa efeitos de chegada à Volta ao Brasil, Prisão e Copa', () => {
    expect(getLandingSpecialSound(30)).toBe('airplane-pass')
    expect(getLandingSpecialSound(10)).toBe('police-siren')
    expect(getLandingSpecialSound(20)).toBe('crowd-cheer')
    expect(getLandingSpecialSound(5)).toBeNull()
  })

  it('escolhe sons curtos de acordo com a jogada', () => {
    expect(getGameSound('Porto Dourado comprada por 160.000.')).toBe('purchase')
    expect(getGameSound('Aluguel: 40.000 pagos a Ana.')).toBe('money-out')
    expect(getGameSound('Bia venceu o leilão por 200.000.')).toBe('auction')
    expect(getGameSound('Objetivo cumprido!')).toBe('milestone')
    expect(getGameSound('Você escolheu não comprar.')).toBe('dice')
    expect(getGameSound('Jogue o dado para definir o aluguel desta estação.')).toBe('none')
  })

  it('formata ganhos e perdas sem exibir zero', () => {
    expect(formatCashDelta(50_000)).toContain('+')
    expect(formatCashDelta(-75_000)).toContain('−')
    expect(formatCashDelta(0)).toBe('')
  })

  it('classifica o destaque de saldo por direção da mudança', () => {
    expect(getCashChangeTone(1)).toBe('gain')
    expect(getCashChangeTone(-1)).toBe('loss')
    expect(getCashChangeTone(0)).toBeNull()
  })

  it('posiciona o retorno do saldo para dentro da tela nos quatro cartões', () => {
    expect([0, 1, 2, 3].map(getCashToastPlacement)).toEqual(['below', 'below', 'above', 'above'])
  })

  it('classifica construção, demolição e troca de dono para animações e sons', () => {
    const ownerA = { ownerSessionId: 'a', houses: 0 }
    expect(getPropertyVisualChange(undefined, ownerA)).toBe('placed')
    expect(getPropertyChangeSound(getPropertyVisualChange(undefined, ownerA)!)).toBe('purchase')
    expect(getPropertyVisualChange(ownerA, { ...ownerA, houses: 1 })).toBe('built')
    expect(getPropertyChangeSound(getPropertyVisualChange(ownerA, { ...ownerA, houses: 1 })!)).toBe('construction')
    expect(getPropertyVisualChange({ ...ownerA, houses: 1 }, ownerA)).toBe('demolished')
    expect(getPropertyChangeSound(getPropertyVisualChange({ ...ownerA, houses: 1 }, ownerA)!)).toBe('demolition')
    expect(getPropertyVisualChange(ownerA, { ...ownerA, ownerSessionId: 'b' })).toBe('ownership')
    expect(getPropertyChangeSound('ownership')).toBe('ownership')
  })

  it('mapeia o texto sincronizado de venda e transferência aos efeitos adequados', () => {
    expect(getGameSound('Construção vendida em Vila Nova.')).toBe('demolition')
    expect(getGameSound('Hotel devolvido a quatro casas.')).toBe('demolition')
    expect(getGameSound('Ana aceitou a troca proposta por Bia.')).toBe('ownership')
  })
})
