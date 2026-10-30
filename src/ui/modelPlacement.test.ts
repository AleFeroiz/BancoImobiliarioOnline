import { describe, expect, it } from 'vitest'
import { getCenteredModelPlacement } from './modelPlacement'

describe('posicionamento de modelos de canto', () => {
  it('centraliza o aeroporto e apoia a base no piso sem duplicar a posição original', () => {
    expect(getCenteredModelPlacement({
      min: { x: 0.9, y: -0.02, z: -0.5 },
      max: { x: 3.6, y: 0.62, z: 0.5 },
    })).toEqual([-2.25, 0.02, 0])
  })
})
