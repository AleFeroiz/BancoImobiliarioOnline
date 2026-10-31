import { describe, expect, it } from 'vitest'
import { getBoardSpaceInteraction } from './boardInteraction'

describe('interação com casas do tabuleiro', () => {
  it('abre os detalhes da casa durante uma jogada normal', () => {
    expect(getBoardSpaceInteraction('inspect', false, 7, [])).toEqual({ type: 'inspect', spaceId: 7 })
  })

  it('seleciona diretamente uma propriedade iluminada para a Copa', () => {
    expect(getBoardSpaceInteraction('world-cup', true, 12, [2, 7, 12])).toEqual({ type: 'choose-world-cup', spaceId: 12 })
  })

  it('seleciona diretamente um destino válido da Volta ao Brasil', () => {
    expect(getBoardSpaceInteraction('world-tour', true, 34, [3, 20, 34])).toEqual({ type: 'choose-world-tour', spaceId: 34 })
  })

  it('ignora casas apagadas e cliques de quem não está na vez', () => {
    expect(getBoardSpaceInteraction('world-tour', true, 9, [4, 20])).toEqual({ type: 'ignore' })
    expect(getBoardSpaceInteraction('world-cup', false, 12, [12])).toEqual({ type: 'ignore' })
  })

  it('usa casas válidas do tabuleiro para alvos de carta e liquidação de dívida', () => {
    expect(getBoardSpaceInteraction('card-property', true, 12, [12, 16])).toEqual({ type: 'choose-card-property', spaceId: 12 })
    expect(getBoardSpaceInteraction('debt-property', true, 16, [12, 16])).toEqual({ type: 'choose-debt-property', spaceId: 16 })
    expect(getBoardSpaceInteraction('card-property', true, 20, [12, 16])).toEqual({ type: 'ignore' })
    expect(getBoardSpaceInteraction('debt-property', false, 12, [12, 16])).toEqual({ type: 'ignore' })
  })

  it('seleciona títulos de troca no tabuleiro mesmo fora da própria vez', () => {
    expect(getBoardSpaceInteraction('trade-offer', false, 4, [4, 8])).toEqual({ type: 'toggle-trade-offer', spaceId: 4 })
    expect(getBoardSpaceInteraction('trade-request', false, 8, [4, 8])).toEqual({ type: 'toggle-trade-request', spaceId: 8 })
    expect(getBoardSpaceInteraction('trade-request', false, 12, [4, 8])).toEqual({ type: 'ignore' })
  })

  it('abre o gerenciamento somente para propriedades próprias iluminadas', () => {
    expect(getBoardSpaceInteraction('manage-property', false, 6, [6, 9])).toEqual({ type: 'choose-managed-property', spaceId: 6 })
    expect(getBoardSpaceInteraction('manage-property', false, 10, [6, 9])).toEqual({ type: 'ignore' })
  })
})
