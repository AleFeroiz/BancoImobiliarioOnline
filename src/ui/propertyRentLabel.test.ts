import { describe, expect, it } from 'vitest'
import { boardSpaces } from '../game/board'
import { getPropertyRentLabel } from './propertyRentLabel'

describe('rótulos 3D de aluguel', () => {
  it('mostra o aluguel base, grupo completo e construções da propriedade', () => {
    const first = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.region === first.region)
    expect(getPropertyRentLabel(first.id, [])).toBeNull()
    expect(getPropertyRentLabel(first.id, [{ spaceId: first.id, ownerSessionId: 'ana', houses: 0 }])).toBe('R$\u00a020.000')
    const owned = group.map((space) => ({ spaceId: space.id, ownerSessionId: 'ana', houses: space.id === first.id ? 2 : 0 }))
    expect(getPropertyRentLabel(first.id, owned)).toBe('R$\u00a0160.000')
  })

  it('mostra aluguel de companhia crescente com a quantidade de companhias próprias', () => {
    const company = boardSpaces.find((space) => space.company)!
    const otherCompanies = boardSpaces.filter((space) => space.company && space.id !== company.id).slice(0, 2)
    const owned = [company, ...otherCompanies].map((space) => ({ spaceId: space.id, ownerSessionId: 'ana', houses: 0 }))
    expect(getPropertyRentLabel(company.id, owned)).toBe('R$ 450.000')
    expect(getPropertyRentLabel(company.id, owned, company.id)).toBe('R$ 1.350.000')
  })
})
