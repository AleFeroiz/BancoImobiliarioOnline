import { describe, expect, it } from 'vitest'
import { boardSpaces } from '../game/board'
import { fitSpaceLabel, wrapSpaceLabel } from './spaceLabel'

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

  it('mantém os rótulos de todas as casas em até três linhas legíveis', () => {
    for (const space of boardSpaces) {
      const fitted = fitSpaceLabel(space.name, 900, (text, fontSize) => text.length * fontSize * 0.56)
      expect(fitted.lines.length, space.name).toBeLessThanOrEqual(3)
      expect(fitted.fontSize, space.name).toBeGreaterThanOrEqual(104)
    }
  })
})
