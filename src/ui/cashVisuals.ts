import { Box3, Vector3, type Object3D } from 'three'
export { CASH_VISUAL_DENOMINATIONS, getCashHudPieceCounts, getCashVisualBreakdown, representedCashValue } from './cashValues'
export type { CashVisualBreakdown } from './cashValues'

export function fitCashModelRoot<T extends Object3D>(model: T, targetHeight: number, rotation: [number, number, number] = [0, 0, 0]) {
  model.position.set(0, 0, 0)
  model.rotation.set(...rotation)
  model.scale.set(1, 1, 1)
  model.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(model)
  if (bounds.isEmpty()) return model
  const size = bounds.getSize(new Vector3())
  if (size.y <= 0) return model
  const center = bounds.getCenter(new Vector3())
  const scale = targetHeight / size.y
  model.scale.setScalar(scale)
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
  model.updateMatrixWorld(true)
  return model
}
