import { describe, expect, it } from 'vitest'
import { boardSpaces } from '../game/board'
import { getPropertyLiquidationLabel, getPropertyRentLabel } from './propertyRentLabel'
import { PROPERTY_HOTEL_LEVEL, bankReturnValue, buildingSaleValue } from '../../shared/game'

describe('rótulos 3D de aluguel', () => {
  it('mostra o aluguel base, grupo completo e construções da propriedade', () => {
    const first = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const group = boardSpaces.filter((space) => space.kind === 'property' && space.buildable && space.region === first.region)
    expect(getPropertyRentLabel(first.id, [])).toBeNull()
    expect(getPropertyRentLabel(first.id, [{ spaceId: first.id, ownerSessionId: 'ana', houses: 0 }])).toBe(`R$\u00a0${first.rentAdditions![0]!.toLocaleString('pt-BR')}`)
    const owned = group.map((space) => ({ spaceId: space.id, ownerSessionId: 'ana', houses: space.id === first.id ? 2 : 0 }))
    const expected = first.rentAdditions!.slice(0, 3).reduce((sum, value) => sum + value, 0) * 2
    expect(getPropertyRentLabel(first.id, owned)).toBe(`R$\u00a0${expected.toLocaleString('pt-BR')}`)
  })

  it('mostra aluguel de companhia crescente com a quantidade de companhias próprias', () => {
    const company = boardSpaces.find((space) => space.company)!
    const otherCompanies = boardSpaces.filter((space) => space.company && space.id !== company.id).slice(0, 2)
    const owned = [company, ...otherCompanies].map((space) => ({ spaceId: space.id, ownerSessionId: 'ana', houses: 0 }))
    expect(getPropertyRentLabel(company.id, owned)).toBe('R$ 150.000 × D6')
    expect(getPropertyRentLabel(company.id, owned, company.id)).toBe('R$ 300.000 × D6')
  })

  it('exibe aluguel zero durante apagão e mantém a exceção de hotel', () => {
    const property = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    const holding = { spaceId: property.id, ownerSessionId: 'ana', houses: 0, blackoutTurns: 2 }
    expect(getPropertyRentLabel(property.id, [holding])).toBe('R$ 0')
    expect(getPropertyRentLabel(property.id, [{ ...holding, houses: 4 }])).not.toBe('R$ 0')
  })

  it('mostra quanto rende a liquidação do terreno ou do nível construído', () => {
    const property = boardSpaces.find((space) => space.kind === 'property' && space.buildable)!
    expect(getPropertyLiquidationLabel(property.id, [])).toBeNull()
    expect(getPropertyLiquidationLabel(property.id, [{ spaceId: property.id, ownerSessionId: 'ana', houses: 0 }])).toBe(`R$ ${bankReturnValue(property.id).toLocaleString('pt-BR')}`)
    expect(getPropertyLiquidationLabel(property.id, [{ spaceId: property.id, ownerSessionId: 'ana', houses: 2 }])).toBe(`R$ ${buildingSaleValue(property.id, 2).toLocaleString('pt-BR')}`)
    expect(getPropertyLiquidationLabel(property.id, [{ spaceId: property.id, ownerSessionId: 'ana', houses: PROPERTY_HOTEL_LEVEL }])).toBe(`R$ ${buildingSaleValue(property.id, PROPERTY_HOTEL_LEVEL).toLocaleString('pt-BR')}`)
  })
})
