import { describe, expect, it } from 'vitest'
import { toggleSelection } from './multiSelect'

describe('seleção compacta de imóveis para negociação', () => {
  it('adiciona e remove opções sem apagar as outras escolhas', () => {
    expect(toggleSelection([2], 7)).toEqual([2, 7])
    expect(toggleSelection([2, 7], 2)).toEqual([7])
  })
})
