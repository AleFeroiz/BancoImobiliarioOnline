import { describe, expect, it } from 'vitest'
import { getOwnedPropertySpaceIds } from './playerOwnershipHighlight'

describe('destaque dos títulos por jogador', () => {
  const holdings = [
    { spaceId: 18, ownerSessionId: 'player-a', isProperty: true },
    { spaceId: 4, ownerSessionId: 'player-a', isProperty: true },
    { spaceId: 14, ownerSessionId: 'player-a', isProperty: true },
    { spaceId: 24, ownerSessionId: 'player-a', isProperty: false },
    { spaceId: 7, ownerSessionId: 'player-b', isProperty: true },
    { spaceId: 9, ownerSessionId: '', isProperty: true },
  ]

  it('retorna cidades e companhias do jogador selecionado, em ordem', () => {
    expect(getOwnedPropertySpaceIds('player-a', holdings)).toEqual([4, 14, 18])
  })

  it('não destaca títulos sem dono selecionado', () => {
    expect(getOwnedPropertySpaceIds('', holdings)).toEqual([])
  })
})
