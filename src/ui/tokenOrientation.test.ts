import { describe, expect, it } from 'vitest'
import { getTokenForwardCorrection } from './tokenOrientation'

describe('getTokenForwardCorrection', () => {
  it.each(['highHeel', 'train', 'piggyBank', 'ship', 'rubberDuck', 'dog', 'cat', 'cow', 'penguin'] as const)(
    'gira %s para a direção de avanço',
    (characterType) => expect(getTokenForwardCorrection(characterType)).toBe(Math.PI),
  )

  it.each(['pawn', 'car', 'motorcycle', 'airplane', 'topHat'] as const)(
    'preserva a orientação de %s',
    (characterType) => expect(getTokenForwardCorrection(characterType)).toBe(0),
  )
})
