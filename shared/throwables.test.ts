import { describe, expect, it } from 'vitest'
import { getThrowableLabel, getThrowableSymbol, isThrowableObject, THROWABLES, THROW_COOLDOWN_MS, THROW_IMPACT_DURATION_MS } from './throwables.js'

describe('objetos arremessáveis', () => {
  it('expõe as quatro opções previstas para o jogo', () => {
    expect(THROWABLES.map(({ id }) => id)).toEqual(['tomato', 'egg', 'mud', 'flour'])
  })

  it('valida tipos e fornece rótulos e símbolos para a interface', () => {
    expect(isThrowableObject('tomato')).toBe(true)
    expect(isThrowableObject('banana')).toBe(false)
    expect(isThrowableObject(undefined)).toBe(false)
    expect(getThrowableLabel('egg')).toBe('Ovo')
    expect(getThrowableSymbol('flour')).toBe('🌫️')
    expect(THROW_COOLDOWN_MS).toBe(5_000)
    expect(THROW_IMPACT_DURATION_MS).toBe(3_000)
  })
})
