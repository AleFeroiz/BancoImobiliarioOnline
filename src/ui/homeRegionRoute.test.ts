import { describe, expect, it } from 'vitest'
import { HOME_REGION_ROUTE } from './homeRegionRoute'

describe('percurso regional da home', () => {
  it('apresenta as cinco regiões na ordem do tabuleiro e usa as cores aprovadas', () => {
    expect(HOME_REGION_ROUTE).toEqual([
      { id: 'north', name: 'Norte', color: '#00A6A6' },
      { id: 'center-west', name: 'Centro-Oeste', color: '#E6B84B' },
      { id: 'northeast', name: 'Nordeste', color: '#D45087' },
      { id: 'south', name: 'Sul', color: '#4A9D68' },
      { id: 'southeast', name: 'Sudeste', color: '#3B65CC' },
    ])
  })
})
