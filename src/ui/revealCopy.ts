export type RevealKind = 'event' | 'world-cup' | 'world-tour'

export function getRevealKicker(kind: RevealKind) {
  if (kind === 'world-cup') return 'COPA DO MUNDO'
  if (kind === 'world-tour') return 'VOLTA AO BRASIL'
  return 'SORTE OU REVÉS'
}
