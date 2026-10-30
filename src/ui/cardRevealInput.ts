export type CardRevealPointerEvent = {
  preventDefault: () => void
  stopPropagation: () => void
}

export function dismissCardRevealOnPointerDown(
  event: CardRevealPointerEvent,
  isRevealVisible: boolean,
  dismiss: () => void,
) {
  if (!isRevealVisible) return false
  event.preventDefault()
  event.stopPropagation()
  dismiss()
  return true
}
