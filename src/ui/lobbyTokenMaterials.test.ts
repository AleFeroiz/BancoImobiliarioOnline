import { describe, expect, it } from 'vitest'
import { getLobbyTokenColorOverride } from './lobbyTokenMaterials'

describe('cores das fichas no lobby', () => {
  it('recolore o couro do salto sem recolorir sua sola', () => {
    expect(getLobbyTokenColorOverride('highHeel', 'HighHeel_ClosedVamp', 'HighHeel_Leather', '#2b77ee')).toBe('#2b77ee')
    expect(getLobbyTokenColorOverride('highHeel', 'HighHeel_Sole', 'HighHeel_SoleDark', '#2b77ee')).toBeUndefined()
  })

  it('mantém a cor selecionada no casco do navio e em materiais OWNER_TINT', () => {
    expect(getLobbyTokenColorOverride('ship', 'Ship_Hull', 'TOKEN_BLUE', '#ff8811')).toBe('#ff8811')
    expect(getLobbyTokenColorOverride('car', 'Car_Lower_Body', 'OWNER_TINT', '#ff8811')).toBe('#ff8811')
  })
})
