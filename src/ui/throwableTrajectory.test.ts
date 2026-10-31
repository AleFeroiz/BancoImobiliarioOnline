import { describe, expect, it } from 'vitest'
import { getThrowableAimPoint, getThrowableFlightPoint } from './throwableTrajectory'

describe('trajetória dos objetos arremessados', () => {
  it('parte e mira na posição visual atual das fichas em movimento', () => {
    const currentThrowerPosition = [2.4, 0.52, -3.1] as const
    const currentTargetPosition = [-1.8, 0.74, 2.6] as const
    const start = getThrowableAimPoint(currentThrowerPosition)
    const target = getThrowableAimPoint(currentTargetPosition)

    expect(start).toEqual([2.4, 1.07, -3.1])
    expect(getThrowableFlightPoint(start, target, 0)).toEqual(start)
    expect(getThrowableFlightPoint(start, target, 1)).toEqual(target)
    const midpoint = getThrowableFlightPoint(start, target, 0.5)
    expect(midpoint[0]).toBeCloseTo(0.3)
    expect(midpoint[1]).toBeCloseTo(2.23)
    expect(midpoint[2]).toBeCloseTo(-0.25)
  })

  it('mantém a interpolação dentro do intervalo da animação', () => {
    expect(getThrowableFlightPoint([0, 1, 0], [4, 1, 0], -1)).toEqual([0, 1, 0])
    expect(getThrowableFlightPoint([0, 1, 0], [4, 1, 0], 2)).toEqual([4, 1, 0])
  })
})
