import { describe, expect, it } from 'vitest'
import { resolveRoomServerUrl } from './roomClient'

describe('endereço do servidor de salas', () => {
  it('usa o endereço local quando não há configuração', () => {
    expect(resolveRoomServerUrl()).toBe('http://127.0.0.1:2567')
  })

  it('usa o endereço configurado e remove espaços acidentais', () => {
    expect(resolveRoomServerUrl('  https://salas.exemplo.com  ')).toBe('https://salas.exemplo.com')
  })
})
