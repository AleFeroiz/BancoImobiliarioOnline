export type CameraDragStart = {
  button: number
  isCanvasTarget: boolean
  isInteractiveTarget: boolean
}

export function shouldStartCameraDrag({ button, isCanvasTarget, isInteractiveTarget }: CameraDragStart) {
  return button === 0 && !isCanvasTarget && !isInteractiveTarget
}
