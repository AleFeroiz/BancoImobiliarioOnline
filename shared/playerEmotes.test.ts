import { describe, expect, it } from 'vitest'
import { getPlayerEmoteSymbol, isPlayerEmote, PLAYER_EMOTES } from './playerEmotes.js'

describe('emotes de partida', () => {
  it('disponibiliza os seis emotes escolhidos e os símbolos correspondentes', () => {
    expect(PLAYER_EMOTES.map(({ label }) => label)).toEqual(['Joia', 'Joia invertido', 'Risada', 'Raiva', 'Dedo do meio', 'Choro'])
    expect(getPlayerEmoteSymbol('middle-finger')).toBe('🖕')
  })

  it('aceita apenas emotes da lista', () => {
    expect(isPlayerEmote('laugh')).toBe(true)
    expect(isPlayerEmote('wave')).toBe(false)
    expect(isPlayerEmote(null)).toBe(false)
  })
})
