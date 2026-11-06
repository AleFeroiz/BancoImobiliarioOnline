import type { CharacterType } from '../../shared/lobby'
import { getOwnerTintOverride } from './sceneMaterials'

const primaryMaterials: Partial<Record<CharacterType, string>> = { piggyBank: 'TOKEN_PINK', cat: 'TOKEN_CREAM', cow: 'TOKEN_WHITE', dog: 'TOKEN_CREAM', highHeel: 'HighHeel_Leather', penguin: 'TOKEN_DARK', rubberDuck: 'TOKEN_YELLOW', ship: 'TOKEN_BLUE', topHat: 'TOKEN_DARK', train: 'TOKEN_RED' }

export function getLobbyTokenColorOverride(type: CharacterType, meshName: string, materialName: string, color: string) {
  return materialName === primaryMaterials[type] ? color : getOwnerTintOverride(meshName, materialName, color)
}
