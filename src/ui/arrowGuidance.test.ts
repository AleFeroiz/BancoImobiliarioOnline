import { describe, expect, it } from 'vitest'
import { getDiceDestinationSpaceId } from './arrowGuidance'

describe('orientação do destino do dado', () => {
  it('marca o destino da rolagem e respeita a volta do tabuleiro', () => {
    expect(getDiceDestinationSpaceId('rolling', 4, [2, 3], '')).toBe(9)
    expect(getDiceDestinationSpaceId('rolling', 38, [2, 3], '')).toBe(3)
  })

  it('mantém o marcador durante o movimento e oculta quando a rolagem não avança', () => {
    expect(getDiceDestinationSpaceId('moving', 11, [2, 3], '')).toBe(11)
    expect(getDiceDestinationSpaceId('rolling', 11, [2, 2], 'Não saiu duplas. Você continua preso.')).toBeNull()
    expect(getDiceDestinationSpaceId('rolling', 11, [6, 6], 'Três vezes seguidas e vai direto para a Prisão.')).toBeNull()
    expect(getDiceDestinationSpaceId('resolve', 11, [2, 3], '')).toBeNull()
  })
})
