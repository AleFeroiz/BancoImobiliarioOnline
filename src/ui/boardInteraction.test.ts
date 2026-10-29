import { describe, expect, it } from 'vitest'
import { getBoardSpaceInteraction } from './boardInteraction'

describe('interação com casas do tabuleiro', () => {
  it('abre os detalhes da casa durante uma jogada normal', () => {
    expect(getBoardSpaceInteraction('inspect', false, 7, [])).toEqual({ type: 'inspect', spaceId: 7 })
  })

  it('seleciona diretamente uma propriedade iluminada para a Copa', () => {
    expect(getBoardSpaceInteraction('world-cup', true, 12, [2, 7, 12])).toEqual({ type: 'choose-world-cup', spaceId: 12 })
  })

  it('seleciona diretamente um destino válido da Volta ao Mundo', () => {
    expect(getBoardSpaceInteraction('world-tour', true, 34, [3, 20, 34])).toEqual({ type: 'choose-world-tour', spaceId: 34 })
  })

  it('ignora casas apagadas e cliques de quem não está na vez', () => {
    expect(getBoardSpaceInteraction('world-tour', true, 9, [4, 20])).toEqual({ type: 'ignore' })
    expect(getBoardSpaceInteraction('world-cup', false, 12, [12])).toEqual({ type: 'ignore' })
  })
})
