import { describe, expect, it } from 'vitest'
import { getCameraFraming } from './cameraFraming'

describe('enquadramento da câmera do tabuleiro', () => {
  it('usa uma inclinação inicial discreta e aproxima a mesa mantendo os quatro cantos visíveis', () => {
    const framing = getCameraFraming(1440, 900)

    expect(framing.tilt).toBe(16)
    expect(framing.distance).toBeLessThan(31)
    expect(framing.position[0]).toBeCloseTo(framing.position[2])
    expect(framing.position[1]).toBeCloseTo(framing.distance * Math.cos(16 * Math.PI / 180))
  })

  it('permite vista top-down e limita a inclinação ao máximo do controle', () => {
    const topDown = getCameraFraming(1440, 900, 0)
    const shallow = getCameraFraming(1440, 900, 90)

    expect(topDown.position[1]).toBeCloseTo(topDown.distance)
    expect(topDown.position[0]).toBe(0)
    expect(topDown.position[2]).toBe(0)
    expect(topDown.tilt).toBe(0)
    expect(shallow.tilt).toBeCloseTo(75)
  })

  it('adapta o enquadramento a celular, tablet e desktop usando o giro escolhido', () => {
    const portrait = getCameraFraming(390, 844, 16)
    const tablet = getCameraFraming(800, 900, 16)
    const desktop = getCameraFraming(1440, 900, 16)

    expect(portrait.azimuth).toBe(Math.PI / 4)
    expect(tablet.azimuth).toBe(Math.PI / 4)
    expect(desktop.azimuth).toBe(Math.PI / 4)
    expect(portrait.distance).toBeGreaterThan(desktop.distance)
    expect(tablet.fov).toBe(42)
    expect(desktop.fov).toBe(38)
  })

  it('mantém os quatro cantos dentro da tela em todo o intervalo de inclinação', () => {
    for (const [width, height] of [[390, 844], [800, 900], [1440, 900], [1920, 1080]]) {
      for (const angle of [0, 16, 75]) {
       for (const horizontal of [0, 45, 90, 180, 270, 359]) {
        const framing = getCameraFraming(width, height, angle, horizontal)
        const aspect = width / height
        const verticalHalfFov = framing.fov * Math.PI / 360
        const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * aspect)
        const sinTilt = Math.sin(framing.tilt * Math.PI / 180)
        const cosTilt = Math.cos(framing.tilt * Math.PI / 180)
        const sinAzimuth = Math.sin(framing.azimuth)
        const cosAzimuth = Math.cos(framing.azimuth)

        for (const x of [-6.2, 6.2]) {
          for (const z of [-6.2, 6.2]) {
            const towardCamera = x * sinAzimuth + z * cosAzimuth
            const acrossCamera = x * cosAzimuth - z * sinAzimuth
            const depth = framing.distance - towardCamera * sinTilt
            const projectedX = acrossCamera / (depth * Math.tan(horizontalHalfFov))
            const projectedY = -towardCamera * cosTilt / (depth * Math.tan(verticalHalfFov))

            expect(Math.abs(projectedX), `${width}×${height} at ${angle}° horizontally`).toBeLessThan(1)
            expect(Math.abs(projectedY), `${width}×${height} at ${angle}° vertically`).toBeLessThan(1)
          }
        }
       }
      }
    }
  })
})
