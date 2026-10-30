import { describe, expect, it } from 'vitest'
import { boardSpaces } from '../game/board'
import { getPropertyRentLabel } from './propertyRentLabel'

describe('rótulos 3D de aluguel', () => {
  it('mostra o aluguel base, grupo completo e construções da propriedade', () => {
    const first = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.color === first.color)
    expect(getPropertyRentLabel(first.id, [])).toBeNull()
    expect(getPropertyRentLabel(first.id, [{ spaceId: first.id, ownerSessionId: 'ana', houses: 0, isMortgaged: false }])).toBe('R$\u00a010.000')
    const owned = group.map((space) => ({ spaceId: space.id, ownerSessionId: 'ana', houses: space.id === first.id ? 2 : 0, isMortgaged: false }))
    expect(getPropertyRentLabel(first.id, owned)).toBe('R$\u00a032.000')
    expect(getPropertyRentLabel(first.id, [{ spaceId: first.id, ownerSessionId: 'ana', houses: 0, isMortgaged: true }])).toBe('HIPOTECADA')
  })

  it('mostra faixa das estações e triplica a faixa da sede da Copa', () => {
    const station = boardSpaces.find((space) => space.kind === 'property' && !space.buildable)!
    expect(getPropertyRentLabel(station.id, [])).toBeNull()
    const owned = [{ spaceId: station.id, ownerSessionId: 'ana', houses: 0, isMortgaged: false }]
    expect(getPropertyRentLabel(station.id, owned)).toBe('R$ 50.000–R$ 300.000')
    expect(getPropertyRentLabel(station.id, owned, station.id)).toBe('R$ 150.000–R$ 900.000')
  })
})
