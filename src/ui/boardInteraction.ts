export type BoardChoicePhase = 'world-cup' | 'world-tour' | 'card-property' | 'debt-property' | 'manage-property' | 'trade-offer' | 'trade-request' | 'inspect'

export type BoardSpaceInteraction =
  | { type: 'choose-world-cup'; spaceId: number }
  | { type: 'choose-world-tour'; spaceId: number }
  | { type: 'choose-card-property'; spaceId: number }
  | { type: 'choose-debt-property'; spaceId: number }
  | { type: 'choose-managed-property'; spaceId: number }
  | { type: 'toggle-trade-offer'; spaceId: number }
  | { type: 'toggle-trade-request'; spaceId: number }
  | { type: 'inspect'; spaceId: number }
  | { type: 'ignore' }

export function getBoardSpaceInteraction(
  phase: BoardChoicePhase,
  isMyTurn: boolean,
  spaceId: number,
  selectableSpaceIds: readonly number[],
): BoardSpaceInteraction {
  if (phase === 'inspect') return { type: 'inspect', spaceId }
  const canSelectOutOfTurn = phase === 'trade-offer' || phase === 'trade-request' || phase === 'manage-property'
  if ((!canSelectOutOfTurn && !isMyTurn) || !selectableSpaceIds.includes(spaceId)) return { type: 'ignore' }
  switch (phase) {
    case 'world-cup': return { type: 'choose-world-cup', spaceId }
    case 'world-tour': return { type: 'choose-world-tour', spaceId }
    case 'card-property': return { type: 'choose-card-property', spaceId }
    case 'debt-property': return { type: 'choose-debt-property', spaceId }
    case 'manage-property': return { type: 'choose-managed-property', spaceId }
    case 'trade-offer': return { type: 'toggle-trade-offer', spaceId }
    case 'trade-request': return { type: 'toggle-trade-request', spaceId }
  }
}
