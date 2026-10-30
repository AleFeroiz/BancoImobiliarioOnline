import { describe, expect, it } from 'vitest'
import { getBoardSpaceDecoration } from './boardDecoration'

describe('orientação das casas do tabuleiro', () => {
  it('coloca construções na borda interna em cada lado', () => {
    expect(getBoardSpaceDecoration(5).buildingOffset).toEqual([0, -0.34])
    expect(getBoardSpaceDecoration(15).buildingOffset).toEqual([-0.34, 0])
    expect(getBoardSpaceDecoration(25).buildingOffset).toEqual([0, 0.34])
    expect(getBoardSpaceDecoration(35).buildingOffset).toEqual([0.34, 0])
  })

  it('gira os rótulos para fora mantendo as rotações atuais dos pisos', () => {
    expect(getBoardSpaceDecoration(5)).toMatchObject({ tileRotation: 0, labelRotation: Math.PI })
    expect(getBoardSpaceDecoration(15)).toMatchObject({ tileRotation: Math.PI / 2, labelRotation: Math.PI })
    expect(getBoardSpaceDecoration(25)).toMatchObject({ tileRotation: Math.PI / 2, labelRotation: -Math.PI / 2 })
    expect(getBoardSpaceDecoration(35)).toMatchObject({ tileRotation: 0, labelRotation: Math.PI / 2 })
  })

  it('rejeita índices fora do tabuleiro', () => {
    expect(() => getBoardSpaceDecoration(-1)).toThrow(RangeError)
    expect(() => getBoardSpaceDecoration(40)).toThrow(RangeError)
  })
})
