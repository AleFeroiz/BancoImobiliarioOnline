import { describe, expect, it } from 'vitest'
import { wrapSpaceLabel } from './spaceLabel'

describe('quebra de nomes nas casas 3D', () => {
  const measureByCharacter = (text: string) => text.length * 10

  it('quebra nomes compridos em palavras sem cortar o texto', () => {
    expect(wrapSpaceLabel('Avenida do Horizonte', 110, measureByCharacter)).toEqual(['AVENIDA DO', 'HORIZONTE'])
  })

  it('mantém nomes curtos em uma linha e ignora espaços nas pontas', () => {
    expect(wrapSpaceLabel('  Estação Central  ', 180, measureByCharacter)).toEqual(['ESTAÇÃO CENTRAL'])
  })

  it('preserva todos os termos ao distribuir um nome por mais de duas linhas', () => {
    expect(wrapSpaceLabel('Parque Municipal das Palmeiras', 100, measureByCharacter)).toEqual([
      'PARQUE', 'MUNICIPAL', 'DAS', 'PALMEIRAS',
    ])
  })
})
