import { describe, expect, it } from 'vitest'
import { boardSpaces } from './board.js'
import { isWorldCupVenue } from './worldCup.js'

describe('sede da Copa do Mundo', () => {
  it('permite cidades e exclui companhias e casas que não são propriedades', () => {
    const city = boardSpaces.find((space) => space.buildable)
    const company = boardSpaces.find((space) => space.company)
    const specialSpace = boardSpaces.find((space) => space.kind === 'world-cup')

    expect(isWorldCupVenue(city)).toBe(true)
    expect(isWorldCupVenue(company)).toBe(false)
    expect(isWorldCupVenue(specialSpace)).toBe(false)
    expect(isWorldCupVenue(undefined)).toBe(false)
  })
})
