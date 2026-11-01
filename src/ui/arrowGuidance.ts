export function getDiceDestinationSpaceId(
  phase: string,
  playerPosition: number,
  dice: readonly [number, number],
  landingDescription: string,
  boardLength = 40,
): number | null {
  if (phase === 'moving') return Number.isInteger(playerPosition) && playerPosition >= 0 && playerPosition < boardLength ? playerPosition : null
  const normalizedLandingDescription = landingDescription.toLocaleLowerCase('pt-BR')
  if (phase !== 'rolling' || normalizedLandingDescription.includes('três vezes seguidas') || normalizedLandingDescription.startsWith('não saiu duplas')) return null
  if (!Number.isInteger(playerPosition) || playerPosition < 0 || playerPosition >= boardLength
    || !dice.every((value) => Number.isInteger(value) && value >= 1 && value <= 6)) return null
  return (playerPosition + dice[0] + dice[1]) % boardLength
}
