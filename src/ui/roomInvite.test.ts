import { describe, expect, it } from 'vitest'
import { buildRoomInviteUrl, getRoomInviteCode, normalizeRoomCode } from './roomInvite'

describe('convites de sala', () => {
  it('normaliza códigos válidos sem aceitar caracteres fora do alfabeto da sala', () => {
    expect(normalizeRoomCode(' x2tvh ')).toBe('X2TVH')
    expect(normalizeRoomCode('X2T1H')).toBeNull()
    expect(normalizeRoomCode('curto')).toBeNull()
  })

  it('lê o código de sala de um link de convite', () => {
    expect(getRoomInviteCode('?room=x2tvh')).toBe('X2TVH')
    expect(getRoomInviteCode('?room=inválido')).toBeNull()
    expect(getRoomInviteCode('?outro=valor')).toBeNull()
  })

  it('gera um link de convite preservando o caminho da aplicação', () => {
    expect(buildRoomInviteUrl('https://bantec.example/jogo?tema=escuro#mesa', 'x2tvh'))
      .toBe('https://bantec.example/jogo?tema=escuro&room=X2TVH')
    expect(buildRoomInviteUrl('https://bantec.example/', 'inválido')).toBeNull()
  })
})
