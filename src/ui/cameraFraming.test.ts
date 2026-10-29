import { describe, expect, it } from 'vitest'
import { getCameraFraming } from './cameraFraming'

describe('enquadramento da câmera do tabuleiro', () => {
  it('usa um ângulo mais alto no celular em pé para deixar o tabuleiro completo legível', () => {
    const framing = getCameraFraming(390, 844)

    expect(framing.position[0]).toBe(0)
    expect(framing.position[1] / framing.position[2]).toBeCloseTo(32 / 18)
    expect(framing.fov).toBe(42)
  })

  it('mantém a vista diagonal em telas desktop', () => {
    const framing = getCameraFraming(1440, 900)

    expect(framing.position).toEqual([10.5, 27, 10.5])
    expect(framing.fov).toBe(34)
  })

  it('preserva o enquadramento compacto de tablets e janelas estreitas', () => {
    const framing = getCameraFraming(800, 900)

    expect(framing.position[0]).toBeCloseTo(12.075)
    expect(framing.position[1]).toBeCloseTo(31.05)
    expect(framing.position[2]).toBeCloseTo(12.075)
    expect(framing).toMatchObject({ fov: 40, fogScale: 1.15 })
  })
})
