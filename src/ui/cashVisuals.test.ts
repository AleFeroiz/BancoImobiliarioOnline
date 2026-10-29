import { describe, expect, it } from 'vitest'
import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { CASH_VISUAL_DENOMINATIONS, fitCashModelRoot, getCashHudPieceCounts, getCashVisualBreakdown, representedCashValue } from './cashVisuals'

describe('representação visual do dinheiro no tabuleiro', () => {
  it('usa barras de ouro, prata e maços de notas com valores fixos e decrescentes', () => {
    expect(CASH_VISUAL_DENOMINATIONS).toEqual({ goldBar: 500_000, silverStack: 50_000, banknoteStack: 10_000 })
    expect(getCashVisualBreakdown(1_220_000)).toEqual({ goldBars: 2, silverStacks: 4, banknoteStacks: 2, partialBanknote: 0 })
  })

  it.each([0, -50_000, 1_000, 9_999, 10_000, 49_999, 50_000, 499_999, 500_000, 1_220_000, 1_500_000, 9_999_999])(
    'representa o saldo %i sem perder valor', (cash) => {
      const breakdown = getCashVisualBreakdown(cash)
      expect(representedCashValue(breakdown)).toBe(Math.max(0, Math.floor(cash)))
      expect(breakdown.partialBanknote).toBeGreaterThanOrEqual(0)
      expect(breakdown.partialBanknote).toBeLessThan(1)
    },
  )

  it('trata saldo não finito como zero', () => {
    expect(getCashVisualBreakdown(Number.NaN)).toEqual({ goldBars: 0, silverStacks: 0, banknoteStacks: 0, partialBanknote: 0 })
  })

  it('mostra as denominações certas junto ao cartão e limita a composição do ícone', () => {
    expect(getCashHudPieceCounts(1_500_000)).toEqual({ gold: 3, silver: 0, note: 0 })
    expect(getCashHudPieceCounts(1_225_000)).toEqual({ gold: 2, silver: 3, note: 3 })
    expect(getCashHudPieceCounts(0)).toEqual({ gold: 0, silver: 0, note: 0 })
  })

  it('centraliza e escala cada modelo 3D para caber no espaço do cartão do jogador', () => {
    const model = new Group()
    const mesh = new Mesh(new BoxGeometry(2, 4, 1), new MeshBasicMaterial())
    mesh.position.set(8, 6, -3)
    model.add(mesh)

    fitCashModelRoot(model, 20)
    const bounds = new Box3().setFromObject(model)
    const size = bounds.getSize(new Vector3())
    const center = bounds.getCenter(new Vector3())

    expect(size.y).toBeCloseTo(20)
    expect(bounds.min.y).toBeCloseTo(0)
    expect(center.x).toBeCloseTo(0)
    expect(center.z).toBeCloseTo(0)
  })

  it('vira notas e moedas deitadas para a frente antes de dimensioná-las na HUD', () => {
    const model = new Group()
    model.add(new Mesh(new BoxGeometry(4, 0.1, 3), new MeshBasicMaterial()))

    fitCashModelRoot(model, 20, [Math.PI / 2, 0, 0])
    const bounds = new Box3().setFromObject(model)
    const size = bounds.getSize(new Vector3())

    expect(size.y).toBeCloseTo(20)
    expect(size.x).toBeCloseTo(4 * 20 / 3)
    expect(bounds.min.y).toBeCloseTo(0)
  })
})
