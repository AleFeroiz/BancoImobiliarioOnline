import { describe, expect, it } from 'vitest'
import { getCameraFraming } from './cameraFraming'

describe('enquadramento da câmera do tabuleiro', () => {
  it('alinha as bordas no celular em pé para dar mais largura às casas', () => {
    const framing = getCameraFraming(390, 844)

    expect(framing.position[0]).toBe(0)
    expect(framing.position[1] / framing.position[2]).toBeCloseTo(23 / 24)
    expect(framing.fov).toBe(49)
  })

  it('mantém a vista diagonal em telas desktop', () => {
    const framing = getCameraFraming(1440, 900)

    expect(framing.position).toEqual([10.5, 22.5, 10.5])
    expect(framing.fov).toBe(34)
  })

  it('preserva o enquadramento compacto de tablets e janelas estreitas', () => {
    const framing = getCameraFraming(800, 900)

    expect(framing.position[0]).toBeCloseTo(12.075)
    expect(framing.position[1]).toBeCloseTo(25.875)
    expect(framing.position[2]).toBeCloseTo(12.075)
    expect(framing).toMatchObject({ fov: 40, fogScale: 1.15 })
  })
})
