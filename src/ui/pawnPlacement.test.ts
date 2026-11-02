import { describe, expect, it } from 'vitest'
import { PAWN_STACK_SPACING, getPawnStackIndices, getPawnTilePosition } from './pawnPlacement'

describe('posicionamento e empilhamento das fichas', () => {
  it('coloca as fichas na borda voltada para dentro nos quatro lados do percurso', () => {
    const bottom = getPawnTilePosition(5, 0.16)
    const right = getPawnTilePosition(15, 0.16)
    const top = getPawnTilePosition(25, 0.16)
    const left = getPawnTilePosition(35, 0.16)

    expect(bottom.x).toBeCloseTo(0)
    expect(bottom.z).toBeCloseTo(5 - 0.2744)
    expect(right.x).toBeCloseTo(5 - 0.2744)
    expect(right.z).toBeCloseTo(0)
    expect(top.x).toBeCloseTo(0)
    expect(top.z).toBeCloseTo(-5 + 0.2744)
    expect(left.x).toBeCloseTo(-5 + 0.2744)
    expect(left.z).toBeCloseTo(0)
  })

  it('centraliza fichas nos quatro cantos e empilha cada ocupante acima do anterior', () => {
    for (const spaceId of [0, 10, 20, 30]) {
      const center = getPawnTilePosition(spaceId, 0.16)
      const tile = getPawnTilePosition(spaceId, 0.16, 0, 1.14)
      expect(center.x).toBeCloseTo(tile.x)
      expect(center.z).toBeCloseTo(tile.z)
      expect(getPawnTilePosition(spaceId, 0.16, 1, 1.14).y - center.y).toBeCloseTo(PAWN_STACK_SPACING)
    }
  })

  it('define uma ordem de empilhamento estável por assento quando seis pessoas dividem a casa', () => {
    const players = [5, 2, 0, 4, 1, 3].map((seatIndex) => ({
      id: `player-${seatIndex}`,
      position: 17,
      seatIndex,
    }))

    expect(getPawnStackIndices(players)).toEqual(new Map([
      ['player-0', 0],
      ['player-1', 1],
      ['player-2', 2],
      ['player-3', 3],
      ['player-4', 4],
      ['player-5', 5],
    ]))
  })

  it('reinicia a pilha em cada piso e rejeita entradas inválidas', () => {
    expect(getPawnStackIndices([
      { id: 'a', position: 2, seatIndex: 0 },
      { id: 'b', position: 2, seatIndex: 1 },
      { id: 'c', position: 3, seatIndex: 2 },
    ])).toEqual(new Map([['a', 0], ['b', 1], ['c', 0]]))
    expect(() => getPawnTilePosition(40, 0.16)).toThrow(RangeError)
    expect(() => getPawnTilePosition(4, 0.16, -1)).toThrow(RangeError)
  })
})
