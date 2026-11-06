export type BettingPanelAnchor = { left: number; right: number; top: number }
export type BettingPanelSize = { width: number; height: number }
export type BettingPanelViewport = { width: number; height: number; offsetLeft?: number; offsetTop?: number }
export type BettingPanelPosition = { left: number; top: number; width: number; maxHeight: number }

export function getBettingPanelPosition(
  anchor: BettingPanelAnchor,
  panel: BettingPanelSize,
  viewport: BettingPanelViewport,
  mobile: boolean,
  gutter = 12,
): BettingPanelPosition {
  const width = Math.max(0, Math.min(390, viewport.width - gutter * 2))
  const maxHeight = Math.max(0, Math.min(mobile ? viewport.height * 0.72 : viewport.height - gutter * 2, 620))
  const height = Math.min(panel.height, maxHeight)
  const minLeft = (viewport.offsetLeft ?? 0) + gutter
  const maxLeft = Math.max(minLeft, (viewport.offsetLeft ?? 0) + viewport.width - width - gutter)
  const minTop = (viewport.offsetTop ?? 0) + gutter
  const maxTop = Math.max(minTop, (viewport.offsetTop ?? 0) + viewport.height - height - gutter)

  if (mobile) {
    return {
      left: minLeft,
      top: Math.max(minTop, maxTop),
      width,
      maxHeight,
    }
  }

  const leftBesideTrigger = anchor.left - width - gutter
  const preferredLeft = leftBesideTrigger >= minLeft ? leftBesideTrigger : anchor.right + gutter

  return {
    left: Math.min(maxLeft, Math.max(minLeft, preferredLeft)),
    top: Math.min(maxTop, Math.max(minTop, anchor.top)),
    width,
    maxHeight,
  }
}
