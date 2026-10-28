import { describe, expect, it } from 'vitest'
import { getCameraFraming } from './cameraFraming'

describe('enquadramento da câmera do tabuleiro', () => {
  it('alinha as bordas no celular em pé para dar mais largura às casas', () => {
    const framing = getCameraFraming(390, 844)

    expect(framing.position[0]).toBe(0)
    expect(framing.position[1] / framing.position[2]).toBeCloseTo(19 / 24)
    expect(framing.fov).toBe(49)
  })

  it('mantém a vista diagonal em telas desktop', () => {
    const framing = getCameraFraming(1440, 900)

    expect(framing.position).toEqual([12.5, 15.5, 15.5])
    expect(framing.fov).toBe(34)
  })

  it('preserva o enquadramento compacto de tablets e janelas estreitas', () => {
    const framing = getCameraFraming(800, 900)

    expect(framing.position[0]).toBeCloseTo(14.375)
    expect(framing.position[1]).toBeCloseTo(17.825)
    expect(framing.position[2]).toBeCloseTo(17.825)
    expect(framing).toMatchObject({ fov: 40, fogScale: 1.15 })
  })
})
