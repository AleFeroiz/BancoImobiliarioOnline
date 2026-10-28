import { describe, expect, it } from 'vitest'
import { getLobbyPlayerEntries } from './lobbySnapshot'

describe('estado inicial da sala', () => {
  it('aguarda o mapa de jogadores antes de renderizar o lobby', () => {
    expect(getLobbyPlayerEntries(undefined)).toBeNull()
    expect(getLobbyPlayerEntries({})).toBeNull()
    expect(getLobbyPlayerEntries({ players: undefined })).toBeNull()
  })

  it('lê as entradas quando o mapa de jogadores estiver disponível', () => {
    const players = new Map([['session-1', { name: 'Pessoa' }]])

    expect(getLobbyPlayerEntries<{ name: string }>({ players })).toEqual([
      ['session-1', { name: 'Pessoa' }],
    ])
  })
})
