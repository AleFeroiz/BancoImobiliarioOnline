import { describe, expect, it } from 'vitest'
import { getWealthHeadwear } from './wealthHeadwear'

const players = [
  { id: 'first', seatIndex: 0, cash: 2_000_000 },
  { id: 'second', seatIndex: 1, cash: 2_000_000 },
  { id: 'third', seatIndex: 2, cash: 2_000_000 },
]

describe('acessórios de patrimônio', () => {
  it('não atribui rico ou pobre quando todos possuem o mesmo patrimônio', () => {
    expect(getWealthHeadwear(players, [])).toEqual({ richestId: null, poorestId: null })
  })

  it('usa saldo, títulos e construções para trocar os acessórios durante a partida', () => {
    const properties = [{ spaceId: 1, ownerSessionId: 'second', houses: 2 }]
    expect(getWealthHeadwear(players, properties)).toEqual({ richestId: 'second', poorestId: 'first' })
    expect(getWealthHeadwear(players.map((player) => player.id === 'third' ? { ...player, cash: 2_500_000 } : player), properties))
      .toEqual({ richestId: 'third', poorestId: 'first' })
  })

  it('considera o valor de venda das casas ao comparar patrimônios próximos', () => {
    const nearTie = [
      { id: 'cash', seatIndex: 0, cash: 2_000_000 },
      { id: 'owner', seatIndex: 1, cash: 1_930_000 },
    ]
    expect(getWealthHeadwear(nearTie, [{ spaceId: 1, ownerSessionId: 'owner', houses: 0 }]))
      .toEqual({ richestId: 'cash', poorestId: 'owner' })
    expect(getWealthHeadwear(nearTie, [{ spaceId: 1, ownerSessionId: 'owner', houses: 1 }]))
      .toEqual({ richestId: 'owner', poorestId: 'cash' })
  })

  it('desconsidera participantes removidos e desempata pela cadeira', () => {
    const contestants = [
      { id: 'later', seatIndex: 2, cash: 900_000 },
      { id: 'earlier', seatIndex: 0, cash: 900_000 },
      { id: 'poor', seatIndex: 1, cash: 100_000 },
    ]
    expect(getWealthHeadwear(contestants, [])).toEqual({ richestId: 'earlier', poorestId: 'poor' })
    expect(getWealthHeadwear(contestants.filter((player) => player.id !== 'poor'), []))
      .toEqual({ richestId: null, poorestId: null })
  })
})
