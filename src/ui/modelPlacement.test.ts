import { describe, expect, it } from 'vitest'
import { getBuildingEdgeOffset, getBuildingRentLabelPosition, getCenteredModelPlacement, getModelEdgeFootprint } from './modelPlacement'

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

  it('mantém os modelos no piso e os afasta do centro em direção à borda externa', () => {
    const offsets = [5, 15, 25, 35].map((spaceId) => getBuildingEdgeOffset(spaceId, 0.98, 0.6, 1.16, 0.04))
    expect(offsets[0]?.[1]).toBeGreaterThan(0)
    expect(offsets[1]?.[0]).toBeGreaterThan(0)
    expect(offsets[2]?.[1]).toBeLessThan(0)
    expect(offsets[3]?.[0]).toBeLessThan(0)
    for (const [x, z] of offsets) {
      const centerOffset = Math.hypot(x, z)
      expect(centerOffset + 0.6 * 1.16 / 2).toBeCloseTo(0.98 / 2 - 0.04)
    }
    expect(getBuildingEdgeOffset(15, 0.98, 0.8, 1.16)[0]).toBeCloseTo(0)
  })

  it('posiciona o rótulo do aluguel acima da construção e no mesmo alinhamento da borda externa', () => {
    const bounds = { min: { x: -0.3, y: -0.1, z: -0.3 }, max: { x: 0.3, y: 0.7, z: 0.3 } }
    const position = getBuildingRentLabelPosition(15, bounds)
    expect(position[0]).toBeGreaterThan(0)
    expect(position[1]).toBeCloseTo(0.16 + 0.8 * 1.25 + 0.2)
    expect(position[2]).toBe(0)
    expect(position[1]).toBeGreaterThan(1)
  })

  it('usa a dimensão realmente voltada para a borda depois de girar o modelo nas laterais', () => {
    const bounds = { min: { x: -0.3, y: 0, z: -0.2 }, max: { x: 0.3, y: 0.8, z: 0.2 } }
    expect(getModelEdgeFootprint(bounds, 5)).toBeCloseTo(0.4)
    expect(getModelEdgeFootprint(bounds, 15)).toBeCloseTo(0.6)
    expect(getModelEdgeFootprint(bounds, 25)).toBeCloseTo(0.4)
    expect(getModelEdgeFootprint(bounds, 35)).toBeCloseTo(0.6)

    const sideOffset = getBuildingEdgeOffset(15, 0.98, getModelEdgeFootprint(bounds, 15), 1.25, 0.04)
    expect(sideOffset[0]).toBeCloseTo(0.98 / 2 - 0.6 * 1.25 / 2 - 0.04)
  })

})
