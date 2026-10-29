import { describe, expect, it } from 'vitest'
import { BoxGeometry, Color, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { applySelectionContrast, createUnlitMaterial, reduceColorContrast } from './sceneMaterials'

describe('materiais da cena sem luzes', () => {
  it('converte materiais PBR para cores sem iluminação e preserva a cor original', () => {
    const source = new MeshStandardMaterial({ color: '#c07832', transparent: true, opacity: 0.7 })
    const unlit = createUnlitMaterial(source)

    expect(unlit).toBeInstanceOf(MeshBasicMaterial)
    expect(unlit.color.getHex()).toBe(source.color.getHex())
    expect(unlit.transparent).toBe(true)
    expect(unlit.opacity).toBeCloseTo(0.7)
  })

  it('reduz em 80% a diferença de cor e deixa casas indisponíveis apagadas', () => {
    const color = new Color('#c07832')
    const dimmed = reduceColorContrast(color)
    const luminance = (value: Color) => value.r * 0.2126 + value.g * 0.7152 + value.b * 0.0722

    expect(Math.abs(dimmed.r - dimmed.g)).toBeLessThan(Math.abs(color.r - color.g) * 0.11)
    expect(luminance(dimmed)).toBeLessThan(luminance(color))
  })

  it('restaura as cores originais ao sair da seleção', () => {
    const material = new MeshBasicMaterial({ color: '#4d9970' })
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), material)
    const group = new Group()
    group.add(mesh)
    const original = material.color.clone()

    applySelectionContrast(group, true)
    expect(material.color.equals(original)).toBe(false)
    applySelectionContrast(group, false)
    expect(material.color.equals(original)).toBe(true)
  })

  it('não aplica o contraste duas vezes a um modelo que controla seu próprio material', () => {
    const material = new MeshBasicMaterial({ color: '#4d9970' })
    const landmark = new Group()
    landmark.userData.selectionContrastManaged = true
    landmark.add(new Mesh(new BoxGeometry(1, 1, 1), material))
    const tile = new Group()
    tile.add(landmark)
    const original = material.color.clone()

    applySelectionContrast(tile, true)
    expect(material.color.equals(original)).toBe(true)
    material.color.copy(reduceColorContrast(original))
    applySelectionContrast(tile, false)
    expect(material.color.equals(reduceColorContrast(original))).toBe(true)
  })
})
