export type BoardChoicePhase = 'world-cup' | 'world-tour' | 'inspect'

export type BoardSpaceInteraction =
  | { type: 'choose-world-cup'; spaceId: number }
  | { type: 'choose-world-tour'; spaceId: number }
  | { type: 'inspect'; spaceId: number }
  | { type: 'ignore' }

export function getBoardSpaceInteraction(
  phase: BoardChoicePhase,
  isMyTurn: boolean,
  spaceId: number,
  selectableSpaceIds: readonly number[],
): BoardSpaceInteraction {
  if (phase === 'inspect') return { type: 'inspect', spaceId }
  if (!isMyTurn || !selectableSpaceIds.includes(spaceId)) return { type: 'ignore' }
  return phase === 'world-cup'
    ? { type: 'choose-world-cup', spaceId }
    : { type: 'choose-world-tour', spaceId }
}
