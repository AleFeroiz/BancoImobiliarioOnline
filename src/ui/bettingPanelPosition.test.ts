import { describe, expect, it } from 'vitest'
import { getBettingPanelPosition } from './bettingPanelPosition'

describe('posicionamento do painel de apostas', () => {
  it('mantém o painel e sua largura dentro de uma viewport móvel estreita', () => {
    const position = getBettingPanelPosition(
      { left: 250, right: 298, top: 280 },
      { width: 390, height: 700 },
      { width: 320, height: 568 },
      true,
    )

    expect(position.left).toBe(12)
    expect(position.top).toBeCloseTo(147.04)
    expect(position.width).toBe(296)
    expect(position.maxHeight).toBeCloseTo(408.96)
    expect(position.left + position.width).toBeLessThanOrEqual(308)
    expect(position.top + position.maxHeight).toBeLessThanOrEqual(556)
  })

  it('abre ao lado do botão em desktop e limita a posição nas bordas', () => {
    const position = getBettingPanelPosition(
      { left: 1200, right: 1250, top: 690 },
      { width: 390, height: 500 },
      { width: 1280, height: 720 },
      false,
    )

    expect(position).toEqual({ left: 798, top: 208, width: 390, maxHeight: 620 })
  })

  it('considera deslocamento e tamanho da viewport visual do celular', () => {
    const position = getBettingPanelPosition(
      { left: 20, right: 60, top: 40 },
      { width: 300, height: 240 },
      { width: 375, height: 500, offsetLeft: 0, offsetTop: 25 },
      true,
    )

    expect(position).toEqual({ left: 12, top: 273, width: 351, maxHeight: 360 })
  })
})
