import { describe, expect, it } from 'vitest'
import { boardSpaces } from './board.js'
import { calculateNetWorth } from './game.js'

describe('patrimônio final', () => {
  it('soma apenas os imóveis da pessoa, desconta hipoteca e inclui valor de liquidação das construções', () => {
    const holdings = new Map([
      [1, { ownerSessionId: 'ana', houses: 2, isMortgaged: true }],
      [3, { ownerSessionId: 'bia', houses: 0, isMortgaged: false }],
    ])

    expect(calculateNetWorth('ana', 500_000, holdings)).toBe(560_000)
    expect(calculateNetWorth('bia', 500_000, holdings)).toBe(500_000 + (boardSpaces[3]?.price ?? 0))
  })

  it('ignora saldo e títulos negativos ou inválidos na avaliação', () => {
    const holdings = new Map([
      [2, { ownerSessionId: 'ana', houses: 5, isMortgaged: false }],
      [999, { ownerSessionId: 'ana', houses: 2, isMortgaged: false }],
    ])

    expect(calculateNetWorth('ana', -10, holdings)).toBe(0)
  })
})
