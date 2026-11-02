import type { CharacterType } from '../../shared/lobby'

const REVERSED_TOKEN_TYPES = new Set<CharacterType>([
  'highHeel',
  'train',
  'piggyBank',
  'ship',
  'rubberDuck',
  'dog',
  'cat',
  'cow',
  'penguin',
])

export function getTokenForwardCorrection(characterType: CharacterType) {
  return REVERSED_TOKEN_TYPES.has(characterType) ? Math.PI : 0
}
