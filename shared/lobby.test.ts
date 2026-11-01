import { describe, expect, it } from 'vitest'
import { CHARACTER_OPTIONS, isCharacterType } from './lobby.js'

describe('fichas do lobby', () => {
  it('expõe as quatro opções visuais da partida', () => {
    expect(CHARACTER_OPTIONS.map(({ id }) => id)).toEqual(['pawn', 'car', 'motorcycle', 'airplane', 'highHeel', 'train', 'topHat', 'piggyBank', 'ship', 'rubberDuck', 'dog', 'cat', 'cow', 'penguin'])
  })

  it('aceita apenas os identificadores de ficha conhecidos', () => {
    for (const { id } of CHARACTER_OPTIONS) expect(isCharacterType(id)).toBe(true)
    for (const value of ['boat', 'CAR', '', null, 1, undefined]) expect(isCharacterType(value)).toBe(false)
  })
})
