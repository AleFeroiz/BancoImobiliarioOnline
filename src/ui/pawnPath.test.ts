import { describe, expect, it } from 'vitest'
import { getPawnStepPath } from './pawnPath'

describe('caminho animado do peão no tabuleiro', () => {
  it('gera uma casa intermediária para cada passo rolado', () => {
    expect(getPawnStepPath(6, 10)).toEqual([7, 8, 9, 10])
  })

  it('contorna a Partida ao avançar do fim para o começo do tabuleiro', () => {
    expect(getPawnStepPath(38, 2)).toEqual([39, 0, 1, 2])
  })

  it('na Volta ao Brasil, percorre o circuito inteiro até uma casa atrás', () => {
    const path = getPawnStepPath(30, 29)
    expect(path).toHaveLength(39)
    expect(path.slice(0, 11)).toEqual([31, 32, 33, 34, 35, 36, 37, 38, 39, 0, 1])
    expect(path.at(-1)).toBe(29)
  })

  it('não anima quando o peão continua na mesma casa nem aceita posições inválidas', () => {
    expect(getPawnStepPath(4, 4)).toEqual([])
    expect(getPawnStepPath(40, 2)).toEqual([])
  })
})
