import { describe, expect, it } from 'vitest'
import { Object3D, Vector3 } from 'three'
import { applyTokenForwardCorrection } from './tokenOrientation'

describe('applyTokenForwardCorrection', () => {
  it.each(['highHeel', 'train', 'piggyBank', 'ship', 'rubberDuck', 'dog', 'cat', 'cow', 'penguin'] as const)(
    'vira %s para a frente sem tombar o modelo',
    (characterType) => {
      const model = new Object3D()
      model.rotation.x = Math.PI / 2
      const upBefore = new Vector3(0, 0, -1).applyQuaternion(model.quaternion)
      const forwardBefore = new Vector3(0, 1, 0).applyQuaternion(model.quaternion)

      applyTokenForwardCorrection(model, characterType)

      const upAfter = new Vector3(0, 0, -1).applyQuaternion(model.quaternion)
      const forwardAfter = new Vector3(0, 1, 0).applyQuaternion(model.quaternion)
      expect(upBefore.y).toBeGreaterThan(0.99)
      expect(upAfter.y).toBeGreaterThan(0.99)
      expect(upAfter.distanceTo(upBefore)).toBeLessThan(1e-10)
      expect(forwardAfter.distanceTo(forwardBefore.negate())).toBeLessThan(1e-10)
    },
  )

  it.each(['pawn', 'car', 'motorcycle', 'airplane', 'topHat'] as const)(
    'preserva a orientação de %s',
    (characterType) => {
      const model = new Object3D()
      model.rotation.x = Math.PI / 2
      const before = model.quaternion.clone()
      applyTokenForwardCorrection(model, characterType)
      expect(model.quaternion.angleTo(before)).toBe(0)
    },
  )
})
