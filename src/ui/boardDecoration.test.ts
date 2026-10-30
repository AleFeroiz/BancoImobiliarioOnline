import { describe, expect, it } from 'vitest'
import { BOARD_SURFACE_Y, BUILDING_GROUP_Y, BUILDING_MODEL_Y_OFFSET, getBoardSpaceDecoration } from './boardDecoration'

describe('orientação das casas do tabuleiro', () => {
  it('coloca construções na borda interna em cada lado', () => {
    expect(getBoardSpaceDecoration(5).buildingOffset).toEqual([0, -0.58])
    expect(getBoardSpaceDecoration(15).buildingOffset).toEqual([-0.58, 0])
    expect(getBoardSpaceDecoration(25).buildingOffset).toEqual([0, 0.58])
    expect(getBoardSpaceDecoration(35).buildingOffset).toEqual([0.58, 0])
  })

  it('apoia a base do modelo no topo do piso sem afundar', () => {
    const modelBaseY = BUILDING_GROUP_Y + BUILDING_MODEL_Y_OFFSET + 0.0005 * 1.16
    expect(modelBaseY).toBeGreaterThanOrEqual(BOARD_SURFACE_Y)
  })

  it('alinha rótulos e fachadas para fora e organiza o modelo pelo eixo da borda', () => {
    expect(getBoardSpaceDecoration(5)).toMatchObject({ tileRotation: 0, labelRotation: Math.PI, buildingRotation: Math.PI })
    expect(getBoardSpaceDecoration(15)).toMatchObject({ tileRotation: Math.PI / 2, labelRotation: Math.PI, buildingRotation: -Math.PI / 2 })
    expect(getBoardSpaceDecoration(25)).toMatchObject({ tileRotation: 0, labelRotation: 0, buildingRotation: 0 })
    expect(getBoardSpaceDecoration(35)).toMatchObject({ tileRotation: Math.PI / 2, labelRotation: 0, buildingRotation: Math.PI / 2 })

    const worldLabelRotations = [5, 15, 25, 35].map((spaceId) => {
      const { tileRotation, labelRotation } = getBoardSpaceDecoration(spaceId)
      return (tileRotation + labelRotation + Math.PI * 2) % (Math.PI * 2)
    })
    expect(worldLabelRotations).toEqual([Math.PI, Math.PI * 1.5, 0, Math.PI / 2])
  })

  it('rejeita índices fora do tabuleiro', () => {
    expect(() => getBoardSpaceDecoration(-1)).toThrow(RangeError)
    expect(() => getBoardSpaceDecoration(40)).toThrow(RangeError)
  })
})
