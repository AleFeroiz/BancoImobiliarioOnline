import { describe, expect, it } from 'vitest'
import { getPawnStepPath } from './pawnPath'

describe('caminho animado do peão no tabuleiro', () => {
  it('gera uma casa intermediária para cada passo rolado', () => {
    expect(getPawnStepPath(6, 10)).toEqual([7, 8, 9, 10])
  })

  it('contorna a Partida ao avançar do fim para o começo do tabuleiro', () => {
    expect(getPawnStepPath(38, 2)).toEqual([39, 0, 1, 2])
  })

  it('não anima quando o peão continua na mesma casa nem aceita posições inválidas', () => {
    expect(getPawnStepPath(4, 4)).toEqual([])
    expect(getPawnStepPath(40, 2)).toEqual([])
  })
})
