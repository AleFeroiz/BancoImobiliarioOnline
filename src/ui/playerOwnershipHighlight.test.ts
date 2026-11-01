import { describe, expect, it } from 'vitest'
import { getOwnedCitySpaceIds } from './playerOwnershipHighlight'

describe('destaque das cidades por jogador', () => {
  const holdings = [
    { spaceId: 18, ownerSessionId: 'player-a', isCity: true },
    { spaceId: 4, ownerSessionId: 'player-a', isCity: true },
    { spaceId: 24, ownerSessionId: 'player-a', isCity: false },
    { spaceId: 7, ownerSessionId: 'player-b', isCity: true },
    { spaceId: 9, ownerSessionId: '', isCity: true },
  ]

  it('retorna em ordem somente as cidades do jogador selecionado', () => {
    expect(getOwnedCitySpaceIds('player-a', holdings)).toEqual([4, 18])
  })

  it('não destaca cidades sem dono selecionado', () => {
    expect(getOwnedCitySpaceIds('', holdings)).toEqual([])
  })
})
