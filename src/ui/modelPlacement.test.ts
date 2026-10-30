import { describe, expect, it } from 'vitest'
import { getBuildingInnerEdgeOffset, getCenteredModelPlacement } from './modelPlacement'

describe('posicionamento de modelos de canto', () => {
  it('centraliza o aeroporto e apoia a base no piso sem duplicar a posição original', () => {
    expect(getCenteredModelPlacement({
      min: { x: 0.9, y: -0.02, z: -0.5 },
      max: { x: 3.6, y: 0.62, z: 0.5 },
    })).toEqual([-2.25, 0.02, 0])
  })

  it('normaliza as origens de modelos com centros e alturas diferentes', () => {
    const placement = getCenteredModelPlacement({ min: { x: 0.8, y: -0.1, z: -0.4 }, max: { x: 1.6, y: 0.5, z: 0.2 } })
    expect(placement[0]).toBeCloseTo(-1.2)
    expect(placement[1]).toBeCloseTo(0.1)
    expect(placement[2]).toBeCloseTo(0.1)
  })

  it('apoia modelos de profundidades diferentes no limite interno do piso em qualquer lado', () => {
    const offsets = [5, 15, 25, 35].map((spaceId) => getBuildingInnerEdgeOffset(spaceId, 0.98, 0.6, 1.16, 0.02))
    expect(offsets[0]?.[1]).toBeLessThan(0)
    expect(offsets[1]?.[0]).toBeLessThan(0)
    expect(offsets[2]?.[1]).toBeGreaterThan(0)
    expect(offsets[3]?.[0]).toBeGreaterThan(0)
    for (const [x, z] of offsets) {
      const centerOffset = Math.hypot(x, z)
      expect(centerOffset - 0.6 * 1.16 / 2).toBeCloseTo(0.98 / 2 + 0.02)
    }
    expect(getBuildingInnerEdgeOffset(15, 0.98, 0.8, 1.16)[0]).toBeLessThan(0)
  })

})
