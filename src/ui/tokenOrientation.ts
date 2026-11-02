import type { CharacterType } from '../../shared/lobby'
import { Vector3, type Object3D } from 'three'

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

export function applyTokenForwardCorrection(model: Object3D, characterType: CharacterType) {
  if (REVERSED_TOKEN_TYPES.has(characterType)) model.rotateOnWorldAxis(new Vector3(0, 1, 0), Math.PI)
}
