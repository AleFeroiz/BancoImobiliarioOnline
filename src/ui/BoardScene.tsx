import { Canvas } from '@react-three/fiber'
import { Billboard, Html, OrbitControls, Text } from '@react-three/drei'
import { memo, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BackSide, Box3, CanvasTexture, DoubleSide, Path, PerspectiveCamera, Shape, ShapeGeometry, SRGBColorSpace, Vector3, type Group, type Mesh, type Object3D } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { boardSpaces, positionOnBoard } from '../game/board'
import { getCameraFraming } from './cameraFraming'
import { getCameraZoomLimits } from './cameraZoom'
import { getCameraTargetShift } from './cameraTarget'
import { applyTokenForwardCorrection } from './tokenOrientation'
import { BUILDING_GROUP_Y, getBoardSpaceDecoration, getPropertyModelYOffset } from './boardDecoration'
import { getBoardTileTheme } from './boardTileTheme'
import { getFestivalBannerPlacement } from './festivalBanner'
import { getPawnStackIndices, getPawnTilePosition } from './pawnPlacement'
import { getWealthHeadwear, type WealthHeadwear } from './wealthHeadwear'
import { fitSpaceLabel, shouldRenderSpaceLabel } from './spaceLabel'
import { getPawnStepPath } from './pawnPath'
import { getPropertyDisplayHouses, getPropertyVisualChange } from './gameFeedback'
import { DICE_PRESENTATION_POSITIONS, DICE_RESULT_BADGE_POSITION, DICE_VISUAL_SCALE, getDiceRollBounce, getDiceRollRotation } from './dicePresentation'
import { getRouletteFloorSectors } from './rouletteFloor'
import { shouldStartCameraDrag } from './cameraDrag'
import { BUILDING_ANIMATION_DURATION_MS, DICE_ANIMATION_DURATION_MS, LANDING_PULSE_DURATION_MS, PAWN_STEP_ANIMATION_DURATION_MS, PAWN_TELEPORT_ANIMATION_DURATION_MS, PROPERTY_HOTEL_LEVEL, getAnimationDuration, type AnimationSpeed } from '../../shared/game'
import type { FrameRateAccumulator } from './fpsMeter'
import { recordRenderedFrame } from './fpsMeter'
import { applySelectionContrast, createTokenOutlineMaterial, createUnlitMaterial, getOwnerTintOverride } from './sceneMaterials'
import { getBuildingEdgeOffset, getBuildingRentLabelPosition, getCenteredModelPlacement, getModelEdgeFootprint } from './modelPlacement'
import { getPropertyBoardLabel } from './propertyRentLabel'
import { playGameSound } from './gameAudio'
import { scheduleSceneRenderWake, subscribeSceneContextRecovery, subscribeSceneResumeWake } from './sceneRenderWake'
import { getGraphicsDprRange, getLowerGraphicsQuality, type GraphicsQuality } from './graphicsQuality'
import { getGameBackgroundColor } from './nightMode'
import { getPlayerEmoteSymbol, type PlayerEmote } from '../../shared/playerEmotes'
import { THROW_PROJECTILE_DURATION_MS, type ThrowableObject } from '../../shared/throwables'
import { advanceThrowableElapsed, getThrowableAimPoint, getThrowableFlightPoint, type ThrowablePoint } from './throwableTrajectory'
import type { CharacterType } from '../../shared/lobby'

type PropertyBuilding = { spaceId: number; ownerSessionId: string; houses: number; blackoutTurns?: number; protectionTurns?: number; ownerColor: string }
type PlayerToken = { id: string; position: number; color: string; seatIndex: number; cash: number; characterType: CharacterType; activity?: string; emote?: { emote: PlayerEmote; sequence: number } }
type ThrowableEvent = { id: number; fromSessionId: string; toSessionId: string; object: ThrowableObject }
type EarthquakeEvent = { id: number; spaceId: number; houses: number; ownerColor: string }
type CityEffectEvent = { id: number; spaceId: number; effect: 'blackout' | 'protection' | 'world-cup' | 'earthquake' | 'generous' }

type CameraOrbitControls = {
  enabled: boolean
  minDistance: number
  maxDistance: number
  target: Vector3
  getAzimuthalAngle: () => number
  getPolarAngle: () => number
  setAzimuthalAngle: (angle: number) => void
  setPolarAngle: (angle: number) => void
  update: () => void
}

const skipRaycast = () => {}
const tileTrimGeometryCache = new Map<number, ShapeGeometry>()

function makeSceneMaterialsUnlit(root: Object3D, dimmed = false, ownerColor?: string) {
  root.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map((material) => createUnlitMaterial(material, getOwnerTintOverride(mesh.name, material.name, ownerColor), dimmed))
      : createUnlitMaterial(mesh.material, getOwnerTintOverride(mesh.name, mesh.material.name, ownerColor), dimmed)
  })
}

function SelectionContrast({ dimmed, children }: { dimmed: boolean; children: ReactNode }) {
  const group = useRef<Group>(null)
  useLayoutEffect(() => {
    if (group.current) applySelectionContrast(group.current, dimmed)
  }, [dimmed])
  return <group ref={group}>{children}</group>
}

function getTileTrimGeometry(size: number) {
  const cached = tileTrimGeometryCache.get(size)
  if (cached) return cached
  const outer = size * 0.472
  const inner = outer - 0.035
  const shape = new Shape()
  shape.moveTo(-outer, -outer)
  shape.lineTo(outer, -outer)
  shape.lineTo(outer, outer)
  shape.lineTo(-outer, outer)
  shape.closePath()
  const hole = new Path()
  hole.moveTo(-inner, -inner)
  hole.lineTo(-inner, inner)
  hole.lineTo(inner, inner)
  hole.lineTo(inner, -inner)
  hole.closePath()
  shape.holes.push(hole)
  const geometry = new ShapeGeometry(shape)
  tileTrimGeometryCache.set(size, geometry)
  return geometry
}

function CameraDragAnywhere({ enabled }: { enabled: boolean }) {
  const { controls, gl } = useThree((state) => ({ controls: state.controls, gl: state.gl }))
  const drag = useRef<{ pointerId: number; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!enabled) return
    const interactiveSelector = 'button, a, input, select, textarea, summary, [role="button"], [data-camera-drag="off"], .game-modal-backdrop, .game-event-card, .turn-card, .space-inspector, .player-profile-panel, .game-options-panel, .game-settings-backdrop, .emote-picker'
    const isInteractive = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest(interactiveSelector))
    const orbit = controls as CameraOrbitControls | null
    const onPointerDown = (event: PointerEvent) => {
      if (!shouldStartCameraDrag({ button: event.button, isCanvasTarget: event.target === gl.domElement, isInteractiveTarget: isInteractive(event.target) })) return
      if (!orbit?.enabled) return
      drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
      event.preventDefault()
    }
    const onPointerMove = (event: PointerEvent) => {
      const previous = drag.current
      if (!previous || previous.pointerId !== event.pointerId || !orbit?.enabled) return
      const deltaX = event.clientX - previous.x
      const deltaY = event.clientY - previous.y
      previous.x = event.clientX
      previous.y = event.clientY
      orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() - deltaX * 0.006)
      orbit.setPolarAngle(orbit.getPolarAngle() - deltaY * 0.005)
      orbit.update()
      event.preventDefault()
    }
    const finishDrag = (event: PointerEvent) => {
      if (drag.current?.pointerId === event.pointerId) drag.current = null
    }
    window.addEventListener('pointerdown', onPointerDown, { passive: false })
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
      drag.current = null
    }
  }, [controls, enabled, gl.domElement])

  return null
}

function ResponsiveCamera({ tilt, horizontal }: { tilt: number; horizontal: number }) {
  const { camera, size } = useThree()
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return
    const framing = getCameraFraming(size.width, size.height, tilt, horizontal)
    camera.position.set(...framing.position)
    // Keep the world-up axis stable so OrbitControls does not roll the board.
    camera.up.set(...framing.up)
    camera.lookAt(0, 0, 0)
    camera.fov = framing.fov
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height, tilt, horizontal])
  return null
}

function CameraZoomBounds() {
  const { controls, size } = useThree((state) => ({ controls: state.controls, size: state.size }))
  useEffect(() => {
    const orbit = controls as CameraOrbitControls | null
    if (!orbit) return
    const framing = getCameraFraming(size.width, size.height, 16, 45)
    const limits = getCameraZoomLimits(framing.distance)
    orbit.minDistance = limits.minDistance
    orbit.maxDistance = limits.maxDistance
    orbit.update()
  }, [controls, size.width, size.height])
  return null
}

function CameraFollowTarget({ mode, localPlayerSessionId, pawnGroups }: { mode: 'board' | 'player'; localPlayerSessionId: string; pawnGroups: Map<string, Group> }) {
  const { camera, controls, invalidate } = useThree((state) => ({ camera: state.camera, controls: state.controls, invalidate: state.invalidate }))
  const lastMode = useRef(mode)

  useFrame(() => {
    const orbit = controls as CameraOrbitControls | null
    if (!orbit) return
    const pawn = mode === 'player' ? pawnGroups.get(localPlayerSessionId) : null
    const target = pawn ? [pawn.position.x, pawn.position.y + 0.35, pawn.position.z] as const : mode === 'board' ? [0, 0, 0] as const : null
    if (!target) return
    if (mode === 'player' || lastMode.current !== mode) {
      const shift = getCameraTargetShift([orbit.target.x, orbit.target.y, orbit.target.z], target)
      if (Math.abs(shift[0]) + Math.abs(shift[1]) + Math.abs(shift[2]) > 0.0001) {
        camera.position.x += shift[0]
        camera.position.y += shift[1]
        camera.position.z += shift[2]
        orbit.target.set(...target)
        orbit.update()
        invalidate()
      }
    }
    lastMode.current = mode
  })

  return null
}

function TokenHighlight({ color, baseY }: { color: string; baseY: number }) {
  return (
    <group position={[0, 0.025 - baseY, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={skipRaycast}>
      <mesh raycast={skipRaycast}><torusGeometry args={[0.3, 0.04, 5, 24]} /><meshBasicMaterial color="#fff8e4" /></mesh>
      <mesh raycast={skipRaycast}><torusGeometry args={[0.3, 0.023, 5, 24]} /><meshBasicMaterial color={color} /></mesh>
    </group>
  )
}

function SpaceLabel({ name, size, ink, outline, outwardRotation }: { name: string; size: number; ink: string; outline: string; outwardRotation: number }) {
  const { gl } = useThree()
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = ink
      context.strokeStyle = outline
      context.lineJoin = 'round'
      context.lineWidth = 7
      const fitted = fitSpaceLabel(name, 410, (text, fontSize) => {
        context.font = `700 ${fontSize}px system-ui, sans-serif`
        return context.measureText(text).width
      }, 84, 52)
      context.font = `700 ${fitted.fontSize}px system-ui, sans-serif`
      const { lines } = fitted
      const lineSpacing = lines.length > 1 ? 59 : 0
      const firstLineY = lines.length > 2 ? 69 : lines.length > 1 ? 99 : 128
      lines.forEach((line, index) => {
        const y = firstLineY + lineSpacing * index
        context.strokeText(line, 256, y, 450)
        context.fillText(line, 256, y, 450)
      })
    }
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    map.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
    map.needsUpdate = true
    return map
  }, [gl, ink, name, outline])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group position={[0, 0.085, size * 0.12]} rotation={[0, outwardRotation, 0]} raycast={skipRaycast}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={skipRaycast}>
        <planeGeometry args={[size * 0.84, size * 0.66]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  )
}

function HeadwearModel({ kind, baseY }: { kind: 'crown' | 'jester'; baseY: number }) {
  const { scene } = useGLTF('/assets/wealth-headwear.glb')
  const model = useMemo(() => {
    const source = scene.getObjectByName(kind === 'crown' ? 'Headwear_Crown' : 'Headwear_Jester')
    if (!source) return null
    const clone = source.clone(true)
    const bounds = new Box3().setFromObject(clone)
    const placement = getCenteredModelPlacement(bounds)
    clone.position.set(...placement)
    makeSceneMaterialsUnlit(clone)
    clone.traverse((obj) => {
      const mesh = obj as Mesh
      if (mesh.isMesh) mesh.raycast = skipRaycast
    })
    return clone
  }, [kind, scene])
  return model && <group position={[0, baseY, 0]} raycast={skipRaycast}><primitive object={model} /></group>
}

function AnimatedPawn({ player, headwear, stackIndex, pawnGroups, reducedMotion, movementEnabled, moveMode, presentationSpeed, pawnStepSoundEnabled, isActive, onMovementComplete }: { player: PlayerToken; headwear: 'crown' | 'jester' | null; stackIndex: number; pawnGroups: Map<string, Group>; reducedMotion: boolean; movementEnabled: boolean; moveMode: 'walk' | 'teleport'; presentationSpeed: AnimationSpeed; pawnStepSoundEnabled: boolean; isActive: boolean; onMovementComplete: () => void }) {
  const group = useRef<Group>(null)
  const { invalidate } = useThree()
  const { scene: tokenScene } = useGLTF('/assets/player-tokens.glb')
  const visualSpace = useRef(player.position)
  const visualStackIndex = useRef(stackIndex)
  const hopPath = useRef<number[]>([])
  const hopStart = useRef({ x: 0, y: 0, z: 0 })
  const elapsed = useRef(0)
  const lastStepSoundIndex = useRef(-1)
  const hopDuration = useRef(getAnimationDuration(PAWN_STEP_ANIMATION_DURATION_MS, presentationSpeed) / 1000)
  const onMovementCompleteRef = useRef(onMovementComplete)
  onMovementCompleteRef.current = onMovementComplete
  const registerPawnGroup = useCallback((node: Group | null) => {
    group.current = node
    if (node) pawnGroups.set(player.id, node)
    else pawnGroups.delete(player.id)
  }, [pawnGroups, player.id])
  const baseY = player.characterType === 'pawn' ? 0.35 : 0.16
  const initial = getPawnTilePosition(visualSpace.current, baseY, visualStackIndex.current)
  const model = useMemo(() => {
    if (player.characterType === 'pawn') return null
    const tokenRoots: Partial<Record<CharacterType, string>> = { car: 'Token_Car', motorcycle: 'Token_Motorcycle', airplane: 'Token_Airplane', highHeel: 'Token_HighHeel', train: 'Token_Train', topHat: 'Token_TopHat', piggyBank: 'Token_PiggyBank', ship: 'Token_Ship', rubberDuck: 'Token_RubberDuck', dog: 'Token_Dog', cat: 'Token_Cat', cow: 'Token_Cow', penguin: 'Token_Penguin' }
    const sourceName = tokenRoots[player.characterType]
    const source = sourceName ? tokenScene.getObjectByName(sourceName) : null
    if (!source) return null
    const clone = source.clone(true)
    applyTokenForwardCorrection(clone, player.characterType)
    const bounds = new Box3().setFromObject(clone)
    const placement = getCenteredModelPlacement(bounds)
    clone.position.x += placement[0]
    clone.position.y += placement[1]
    clone.position.z += placement[2]
    clone.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      mesh.raycast = skipRaycast
    })
    makeSceneMaterialsUnlit(clone, false, player.color)
    const outline = clone.clone(true)
    outline.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      mesh.raycast = skipRaycast
      const blackShell = createTokenOutlineMaterial
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(blackShell) : blackShell()
    })
    return { object: clone, outline }
  }, [player.characterType, player.color, tokenScene])
  const headwearY = player.characterType === 'pawn' ? 0.60 : model ? new Box3().setFromObject(model.object).getSize(new Vector3()).y * 0.56 - 0.02 : 0.53
  useEffect(() => () => model?.outline.traverse((object) => {
    const mesh = object as Mesh
    if (mesh.isMesh) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => material.dispose())
  }), [model])

  useEffect(() => {
    if (player.position === visualSpace.current) {
      if (stackIndex !== visualStackIndex.current) {
        const position = getPawnTilePosition(player.position, baseY, stackIndex)
        group.current?.position.set(position.x, position.y, position.z)
        visualStackIndex.current = stackIndex
      }
      return
    }
    if (!movementEnabled && !reducedMotion) return
    const path = moveMode === 'teleport' ? [player.position] : getPawnStepPath(visualSpace.current, player.position)
    if (!path.length) return
    if (reducedMotion) {
      const destination = getPawnTilePosition(player.position, baseY, stackIndex)
      group.current?.position.set(destination.x, destination.y, destination.z)
      visualSpace.current = player.position
      visualStackIndex.current = stackIndex
      hopPath.current = []
      onMovementCompleteRef.current()
      return
    }
    hopStart.current = group.current
      ? { x: group.current.position.x, y: group.current.position.y, z: group.current.position.z }
      : { x: initial.x, y: initial.y, z: initial.z }
    hopPath.current = path
    lastStepSoundIndex.current = -1
    hopDuration.current = getAnimationDuration(moveMode === 'teleport' ? PAWN_TELEPORT_ANIMATION_DURATION_MS : PAWN_STEP_ANIMATION_DURATION_MS, presentationSpeed) / 1000
    elapsed.current = 0
  }, [player.position, stackIndex, baseY, initial.x, initial.y, initial.z, presentationSpeed, reducedMotion, movementEnabled, moveMode])

  useFrame((_, delta) => {
    const pawn = group.current
    if (!pawn) return
    if (reducedMotion) return
    const path = hopPath.current
    if (path.length) {
      elapsed.current += delta
      const hopIndex = Math.floor(elapsed.current / hopDuration.current)
      if (hopIndex >= path.length) {
        const destination = getPawnTilePosition(path[path.length - 1] ?? player.position, baseY, stackIndex)
        pawn.position.set(destination.x, destination.y, destination.z)
        pawn.rotation.z = 0
        hopPath.current = []
        visualSpace.current = player.position
        visualStackIndex.current = stackIndex
        onMovementCompleteRef.current()
        return
      }
      invalidate()
      if (moveMode === 'walk' && pawnStepSoundEnabled && hopIndex !== lastStepSoundIndex.current) {
        lastStepSoundIndex.current = hopIndex
        playGameSound('pawn-step')
      }
      const progress = Math.min((elapsed.current - hopIndex * hopDuration.current) / hopDuration.current, 1)
      const from = hopIndex === 0 ? hopStart.current : getPawnTilePosition(path[hopIndex - 1] ?? player.position, baseY)
      const isFinalStep = hopIndex === path.length - 1
      const to = getPawnTilePosition(path[hopIndex] ?? player.position, baseY, isFinalStep ? stackIndex : 0)
      pawn.position.set(from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress + Math.sin(progress * Math.PI) * 0.24, from.z + (to.z - from.z) * progress)
      if (player.characterType !== 'pawn') pawn.rotation.y = Math.atan2(to.x - from.x, to.z - from.z)
      pawn.rotation.z = Math.sin(progress * Math.PI) * 0.14
      return
    }
  })

  return (
    <group ref={registerPawnGroup} position={[initial.x, initial.y, initial.z]} rotation={[0, player.position <= 10 ? Math.PI / 2 : player.position <= 20 ? Math.PI : player.position <= 30 ? -Math.PI / 2 : 0, 0]}>
      <TokenHighlight color={player.color} baseY={baseY} />
      {player.characterType === 'pawn' ? <>
        <group scale={1.24}>
          <mesh position={[0, 0.17, 0]} raycast={skipRaycast}>
            <cylinderGeometry args={[0.16, 0.23, 0.25, 7]} />
            <meshBasicMaterial color="#26352f" side={BackSide} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.39, 0]} raycast={skipRaycast}>
            <sphereGeometry args={[0.16, 14, 12]} />
            <meshBasicMaterial color="#26352f" side={BackSide} toneMapped={false} />
          </mesh>
        </group>
        <group scale={1.12}>
          <mesh position={[0, 0.17, 0]} raycast={skipRaycast}>
            <cylinderGeometry args={[0.16, 0.23, 0.25, 7]} />
            <meshBasicMaterial color={player.color} />
          </mesh>
          <mesh position={[0, 0.39, 0]} raycast={skipRaycast}>
            <sphereGeometry args={[0.16, 14, 12]} />
            <meshBasicMaterial color={player.color} />
          </mesh>
        </group>
      </> : model && <><primitive object={model.outline} scale={0.61} /><primitive object={model.object} scale={0.56} /></>}
      {headwear && <Suspense fallback={null}><HeadwearModel kind={headwear} baseY={headwearY} /></Suspense>}
      {player.activity && <Html position={[0, player.characterType === 'pawn' ? 0.86 : 0.66, 0]} center distanceFactor={12} zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}><div className="turn-activity-bubble" role="status" aria-live="polite">{player.activity}</div></Html>}
      {player.emote && <Html key={player.emote.sequence} position={[0, player.characterType === 'pawn' ? 1.08 : 0.9, 0]} center distanceFactor={10} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}><div className="player-emote-bubble" aria-label="Emote do jogador">{getPlayerEmoteSymbol(player.emote.emote)}</div></Html>}
      {isActive && <group position={[0, 1.05, 0]}><FloatingPointingArrow color={player.color} size={1.05} baseY={0} /></group>}
    </group>
  )
}

function ThrowableProjectile({ event, pawnGroups }: { event: ThrowableEvent; pawnGroups: Map<string, Group> }) {
  const projectile = useRef<Group>(null)
  const elapsed = useRef(0)
  const start = useRef<ThrowablePoint>([0, 0.9, 0])
  const hasStarted = useRef(false)
  const { invalidate } = useThree()

  useLayoutEffect(() => {
    elapsed.current = 0
    hasStarted.current = false
    start.current = [0, 0.9, 0]
    projectile.current?.position.set(0, 0.9, 0)
    projectile.current?.rotation.set(0, 0, 0)
    invalidate()
  }, [event.id, invalidate])

  useFrame((_, delta) => {
    if (!projectile.current || elapsed.current >= THROW_PROJECTILE_DURATION_MS / 1000) return
    const thrower = pawnGroups.get(event.fromSessionId)
    const target = pawnGroups.get(event.toSessionId)
    if (!thrower || !target) {
      invalidate()
      return
    }
    if (!hasStarted.current) {
      start.current = getThrowableAimPoint([thrower.position.x, thrower.position.y, thrower.position.z])
      hasStarted.current = true
    }
    elapsed.current = advanceThrowableElapsed(elapsed.current, delta, THROW_PROJECTILE_DURATION_MS / 1000)
    const progress = Math.min(elapsed.current / (THROW_PROJECTILE_DURATION_MS / 1000), 1)
    const end = getThrowableAimPoint([target.position.x, target.position.y, target.position.z])
    projectile.current.position.set(...getThrowableFlightPoint(start.current, end, progress))
    projectile.current.rotation.set(progress * Math.PI * 5, progress * Math.PI * 7, progress * Math.PI * 4)
    if (progress < 1) invalidate()
  })

  return <group ref={projectile} position={[0, 0.9, 0]} scale={0.15} raycast={skipRaycast}>
    {event.object === 'tomato' && <group><mesh><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color="#e43a31" /></mesh><mesh position={[0, 0.94, 0]}><coneGeometry args={[0.16, 0.3, 5]} /><meshBasicMaterial color="#398345" /></mesh><mesh position={[0.22, 0.88, 0]} rotation={[0, 0, -0.45]}><sphereGeometry args={[0.22, 5, 3]} /><meshBasicMaterial color="#4f9b51" /></mesh></group>}
    {event.object === 'egg' && <mesh scale={[0.72, 1, 0.7]}><sphereGeometry args={[1, 10, 7]} /><meshBasicMaterial color="#fff1cf" /></mesh>}
    {event.object === 'mud' && <group><mesh><icosahedronGeometry args={[0.72, 1]} /><meshBasicMaterial color="#795033" /></mesh><mesh position={[0.48, 0.12, 0.08]} scale={0.62}><icosahedronGeometry args={[0.62, 0]} /><meshBasicMaterial color="#8c6040" /></mesh><mesh position={[-0.34, 0.25, 0.25]} scale={0.47}><icosahedronGeometry args={[0.62, 0]} /><meshBasicMaterial color="#62402d" /></mesh></group>}
    {event.object === 'flour' && <group><mesh scale={0.8}><sphereGeometry args={[0.72, 8, 6]} /><meshBasicMaterial color="#fff9e9" transparent opacity={0.88} /></mesh><mesh position={[0.48, 0.08, 0.08]} scale={0.56}><sphereGeometry args={[0.64, 8, 5]} /><meshBasicMaterial color="#f3ead5" transparent opacity={0.8} /></mesh><mesh position={[-0.4, 0.1, 0]} scale={0.48}><sphereGeometry args={[0.66, 8, 5]} /><meshBasicMaterial color="#fffdf4" transparent opacity={0.8} /></mesh></group>}
  </group>
}

const dicePips: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-0.1, -0.1], [0.1, 0.1]],
  3: [[-0.1, -0.1], [0, 0], [0.1, 0.1]],
  4: [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]],
  5: [[-0.1, -0.1], [0.1, -0.1], [0, 0], [-0.1, 0.1], [0.1, 0.1]],
  6: [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0], [0.1, 0], [-0.1, 0.1], [0.1, 0.1]],
}

const rouletteColors = ['#e95768', '#f1c747', '#4ea981', '#4da9c4', '#7d71bd', '#ed8a43', '#d85f97', '#86a444']

function ChanceRoulette({ size, trim }: { size: number; trim: string }) {
  const sectors = useMemo(() => getRouletteFloorSectors(size).map((sector) => {
    const shape = new Shape()
    sector.forEach(([x, z], index) => index === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z))
    shape.closePath()
    return new ShapeGeometry(shape)
  }), [size])
  return (
    <group position={[0, 0.084, 0]}>
      {sectors.map((geometry, index) => <mesh key={index} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} raycast={skipRaycast}><meshBasicMaterial color={rouletteColors[index % rouletteColors.length]} side={DoubleSide} /></mesh>)}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={skipRaycast}><circleGeometry args={[size * 0.095, 16]} /><meshBasicMaterial color={trim} /></mesh>
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={skipRaycast}><circleGeometry args={[size * 0.043, 12]} /><meshBasicMaterial color="#fff3cf" /></mesh>
    </group>
  )
}

function AnimatedDie({ position, rotation, sequence, value, reducedMotion, visible, presentationSpeed }: { position: [number, number, number]; rotation: [number, number, number]; sequence: number; value: number; reducedMotion: boolean; visible: boolean; presentationSpeed: AnimationSpeed }) {
  const group = useRef<Group>(null)
  const { invalidate } = useThree()
  const elapsed = useRef(0)
  const startRotation = useRef([rotation[0], rotation[1], rotation[2]])

  useEffect(() => {
    const die = group.current
    if (!die || sequence === 0 || reducedMotion) return
    startRotation.current = [die.rotation.x, die.rotation.y, die.rotation.z]
    elapsed.current = 0
  }, [sequence, reducedMotion])

  useFrame((_, delta) => {
    const die = group.current
    const duration = getAnimationDuration(DICE_ANIMATION_DURATION_MS, presentationSpeed) / 1000
    if (!die || !visible || sequence === 0 || reducedMotion || elapsed.current >= duration) return
    invalidate()
    elapsed.current = Math.min(duration, elapsed.current + delta)
    const progress = elapsed.current / duration
    die.rotation.set(...getDiceRollRotation(startRotation.current as [number, number, number], progress))
    die.position.y = position[1] + getDiceRollBounce(progress)
    if (progress >= 1) {
      die.rotation.set(0, 0, 0)
      die.position.y = position[1]
    }
  })

  return (
    <group ref={group} position={position} rotation={rotation} scale={DICE_VISUAL_SCALE} visible={visible}>
      <mesh raycast={skipRaycast}><boxGeometry args={[0.45, 0.42, 0.45]} /><meshBasicMaterial color="#fffaf0" /></mesh>
      {(dicePips[value] ?? dicePips[1]!).map(([x, z], index) => <mesh key={index} position={[x, 0.212, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={skipRaycast}><circleGeometry args={[0.035, 10]} /><meshBasicMaterial color="#c76550" /></mesh>)}
    </group>
  )
}

function FloatingPointingArrow({ color, size = 1, baseY = 1.18 }: { color: string; size?: number; baseY?: number }) {
  const ref = useRef<Group>(null)
  const elapsed = useRef(0)
  const { invalidate } = useThree()
  useFrame((_, delta) => {
    if (!ref.current) return
    elapsed.current += Math.min(delta, 0.05)
    ref.current.position.y = baseY + Math.sin(elapsed.current * 2.4) * 0.045
    ref.current.rotation.y = Math.sin(elapsed.current * 1.7) * 0.1
    invalidate()
  })
  return <group ref={ref} position={[0, baseY, 0]} scale={size} raycast={skipRaycast}>
    <mesh position={[0, 0.38, 0]} renderOrder={20} raycast={skipRaycast}><cylinderGeometry args={[0.055, 0.055, 0.42, 7]} /><meshBasicMaterial color={color} toneMapped={false} depthTest={false} depthWrite={false} /></mesh>
    <mesh position={[0, 0.12, 0]} rotation={[Math.PI, 0, 0]} renderOrder={20} raycast={skipRaycast}><coneGeometry args={[0.18, 0.24, 7]} /><meshBasicMaterial color={color} toneMapped={false} depthTest={false} depthWrite={false} /></mesh>
  </group>
}

function AnimatedBuilding({ spaceId, houses, ownerColor, ownerSessionId, reducedMotion, presentationSpeed, dimmed, blackoutTurns = 0, protectionTurns = 0 }: { spaceId: number; houses: number; ownerColor: string; ownerSessionId: string; reducedMotion: boolean; presentationSpeed: AnimationSpeed; dimmed: boolean; blackoutTurns?: number; protectionTurns?: number }) {
  const group = useRef<Group>(null)
  const { invalidate } = useThree()
  const elapsed = useRef(0)
  const buildingRotationRef = useRef(0)
  const [displayHouses, setDisplayHouses] = useState(houses)
  const [displayColor, setDisplayColor] = useState(ownerColor)
  const previous = useRef({ ownerSessionId, houses: 0 })
  const transition = useRef<'build' | 'demolish' | 'ownership' | null>(houses > 0 ? 'build' : null)
  const { scene } = useGLTF('/assets/board-models/board-models.glb')

  useEffect(() => {
    const building = group.current
    const change = getPropertyVisualChange({ ownerSessionId: previous.current.ownerSessionId, houses: previous.current.houses }, { ownerSessionId, houses })
    if (reducedMotion) {
      setDisplayHouses(houses)
      setDisplayColor(ownerColor)
      transition.current = null
      building?.scale.setScalar(1)
      if (building) building.position.y = 0
    } else if (change === 'ownership') {
      setDisplayHouses((currentHouses) => getPropertyDisplayHouses(change, currentHouses, houses))
      if (building) {
        building.scale.setScalar(1)
        building.position.y = 0
        building.rotation.set(0, buildingRotationRef.current, 0)
      }
      transition.current = 'ownership'
      elapsed.current = 0
    } else if (change === 'built') {
      setDisplayHouses(houses)
      transition.current = 'build'
      elapsed.current = 0
    } else if (change === 'demolished') {
      transition.current = 'demolish'
      elapsed.current = 0
    } else if (houses !== previous.current.houses) {
      setDisplayHouses(houses)
    }
    if (change !== 'ownership' && ownerColor !== displayColor) setDisplayColor(ownerColor)
    previous.current = { ownerSessionId, houses }
  }, [houses, ownerColor, ownerSessionId, reducedMotion])

  useFrame((_, delta) => {
    const building = group.current
    if (!building || !transition.current || reducedMotion) return
    invalidate()
    elapsed.current += delta
    const progress = Math.min(elapsed.current / (getAnimationDuration(BUILDING_ANIMATION_DURATION_MS, presentationSpeed) / 1000), 1)
    const eased = 1 - (1 - progress) ** 3
    if (transition.current === 'build') {
      building.scale.setScalar(0.45 + eased * 0.55)
      building.position.y = Math.sin(progress * Math.PI) * 0.07
    } else if (transition.current === 'demolish') {
      if (progress < 0.48) {
        const collapse = 1 - progress / 0.48
        building.scale.set(1, collapse, 1)
        building.rotation.z = (1 - collapse) * 0.14
      } else {
        if (displayHouses !== houses) setDisplayHouses(houses)
        const appear = (progress - 0.48) / 0.52
        building.scale.setScalar(0.35 + (1 - 0.35) * (1 - (1 - appear) ** 3))
        building.rotation.z = 0
      }
    } else {
      building.position.y = Math.sin(progress * Math.PI) * 0.3
      building.rotation.y = Math.sin(progress * Math.PI) * 0.12
      if (progress >= 0.76) setDisplayColor(ownerColor)
    }
    if (progress >= 1) {
      building.scale.setScalar(1)
      building.position.y = 0
      building.rotation.set(0, buildingRotationRef.current, 0)
      if (transition.current !== 'ownership') setDisplayHouses(houses)
      setDisplayColor(ownerColor)
      transition.current = null
    }
  })

  const { x, z } = positionOnBoard(spaceId)
  const decoration = getBoardSpaceDecoration(spaceId)
  const buildingRotation = decoration.buildingRotation
  buildingRotationRef.current = buildingRotation
  const variantName = displayHouses === 0 ? 'Board_Land' : displayHouses === PROPERTY_HOTEL_LEVEL ? 'Board_Hotel' : `Board_House_${displayHouses}`
  const modelData = useMemo(() => {
    if (!ownerSessionId) return null
    const source = scene.getObjectByName(variantName)
    if (!source) return null
    const clone = source.clone(true)
    clone.position.set(0, 0, 0)
    clone.rotation.set(0, 0, 0)
    clone.scale.set(1, 1, 1)
    const bounds = new Box3().setFromObject(clone)
    const footprintDepth = getModelEdgeFootprint(bounds, spaceId)
    clone.position.set(...getCenteredModelPlacement(bounds))
    clone.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      mesh.raycast = skipRaycast
    })
    makeSceneMaterialsUnlit(clone, dimmed || blackoutTurns > 0, displayColor)
    return { object: clone, footprintDepth }
  }, [blackoutTurns, dimmed, displayColor, ownerSessionId, scene, variantName])
  const modelScale = 1.25
  const [offsetX, offsetZ] = modelData ? getBuildingEdgeOffset(spaceId, 0.98, modelData.footprintDepth, modelScale, 0.04) : decoration.buildingOffset
  return (
    <group ref={group} position={[x + offsetX, BUILDING_GROUP_Y, z + offsetZ]} rotation={[0, buildingRotation, 0]}>
      {modelData && <primitive object={modelData.object} position={[0, getPropertyModelYOffset(displayHouses), 0]} scale={modelScale} />}
      {blackoutTurns > 0 && <Html position={[0, 1.05, 0]} center distanceFactor={11} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}><span className="property-blackout-badge">APAGÃO · {blackoutTurns} VOLTAS</span></Html>}
      {protectionTurns > 0 && <><group position={[0, 0.55, 0]} raycast={skipRaycast}><mesh><sphereGeometry args={[0.57, 20, 14]} /><meshBasicMaterial color="#8de5ff" transparent opacity={0.18} depthWrite={false} side={DoubleSide} /></mesh><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.56, 0.018, 6, 32]} /><meshBasicMaterial color="#baf3ff" transparent opacity={0.88} /></mesh><mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color="#e7fbff" /></mesh></group><Html position={[0, 1.2, 0]} center distanceFactor={11} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}><span className="property-protection-badge">PROTEÇÃO · {protectionTurns} VOLTAS</span></Html></>}
    </group>
  )
}

function EarthquakeCollapse({ event, scene }: { event: EarthquakeEvent; scene: Object3D }) {
  const ref = useRef<Group>(null)
  const elapsed = useRef(0)
  const { invalidate } = useThree()
  const variantName = event.houses === 0 ? 'Board_Land' : event.houses === PROPERTY_HOTEL_LEVEL ? 'Board_Hotel' : `Board_House_${event.houses}`
  const model = useMemo(() => {
    const source = scene.getObjectByName(variantName)
    if (!source) return null
    const clone = source.clone(true)
    clone.position.set(0, 0, 0)
    clone.rotation.set(0, 0, 0)
    clone.scale.set(1, 1, 1)
    const bounds = new Box3().setFromObject(clone)
    const edgeFootprint = getModelEdgeFootprint(bounds, event.spaceId)
    clone.position.set(...getCenteredModelPlacement(bounds))
    makeSceneMaterialsUnlit(clone, false, event.ownerColor)
    clone.traverse((object) => { const mesh = object as Mesh; if (mesh.isMesh) mesh.raycast = skipRaycast })
    return { object: clone, edgeFootprint }
  }, [event.ownerColor, event.spaceId, scene, variantName])
  useFrame((_, delta) => {
    if (!ref.current) return
    invalidate()
    elapsed.current += delta
    const progress = Math.min(elapsed.current / 1.45, 1)
    ref.current.position.y = -progress * 1.35
    ref.current.scale.y = Math.max(0.02, 1 - progress * 0.82)
    ref.current.rotation.z = Math.sin(progress * Math.PI * 4) * (1 - progress) * 0.08
  })
  const { x, z } = positionOnBoard(event.spaceId)
  const decoration = getBoardSpaceDecoration(event.spaceId)
  const [offsetX, offsetZ] = model ? getBuildingEdgeOffset(event.spaceId, 0.98, model.edgeFootprint, 1.25, 0.04) : decoration.buildingOffset
  return <group ref={ref} position={[x + offsetX, BUILDING_GROUP_Y + getPropertyModelYOffset(event.houses), z + offsetZ]} rotation={[0, decoration.buildingRotation, 0]} scale={1.25}>{model && <primitive object={model.object} />}</group>
}

function CityEffectMarker({ event }: { event: CityEffectEvent }) {
  const ring = useRef<Mesh>(null)
  const elapsed = useRef(0)
  const { invalidate } = useThree()
  const { x, z } = positionOnBoard(event.spaceId)
  const color = event.effect === 'blackout' ? '#ffd452' : event.effect === 'protection' ? '#8de5ff' : event.effect === 'earthquake' ? '#ff715e' : event.effect === 'generous' ? '#80e5a1' : '#f5c84c'
  const title = event.effect === 'blackout' ? '⚡ APAGÃO!' : event.effect === 'protection' ? '🛡 PROTEÇÃO!' : event.effect === 'earthquake' ? '🌋 TERREMOTO!' : event.effect === 'generous' ? '🎁 PRESENTE!' : '🎉 COPA DO MUNDO!'
  useFrame((_, delta) => {
    if (!ring.current) return
    invalidate()
    elapsed.current += delta
    const pulse = (elapsed.current % 0.9) / 0.9
    ring.current.scale.setScalar(0.75 + pulse * 1.25)
    ;(ring.current.material as import('three').MeshBasicMaterial).opacity = 0.85 * (1 - pulse)
  })
  return <group position={[x, 0.22, z]} raycast={skipRaycast}>
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.42, 0.055, 6, 32]} /><meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} /></mesh>
    <Html position={[0, 1.2, 0]} center distanceFactor={8} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}><span style={{ display: 'block', whiteSpace: 'nowrap', border: `2px solid ${color}`, borderRadius: 999, padding: '5px 10px', background: '#082223', color, fontSize: 12, fontWeight: 900, letterSpacing: '.06em', boxShadow: `0 0 18px ${color}88` }}>{title}</span></Html>
    {event.effect === 'world-cup' && Array.from({ length: 14 }, (_, index) => <ConfettiPiece key={index} index={index} elapsed={elapsed} />)}
  </group>
}

function ConfettiPiece({ index, elapsed }: { index: number; elapsed: { current: number } }) {
  const ref = useRef<Mesh>(null)
  const colors = ['#ef476f', '#ffd166', '#06d6a0', '#48bfe3', '#f7f3e8']
  const phase = (index / 14) * Math.PI * 2
  useFrame(() => {
    if (!ref.current) return
    const time = elapsed.current
    ref.current.position.set(Math.cos(phase) * (0.25 + time * 0.3), 0.65 + ((time * 1.4 + index * 0.17) % 1.8), Math.sin(phase) * (0.25 + time * 0.3))
    ref.current.rotation.set(time * 4 + index, time * 3 + index, time * 2)
  })
  return <mesh ref={ref}><boxGeometry args={[0.11, 0.045, 0.025]} /><meshBasicMaterial color={colors[index % colors.length]} /></mesh>
}

function FatecLandmark() {
  const { scene } = useGLTF('/assets/fatec-itapetininga-buildings.glb')
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((object) => {
      const mesh = object as Mesh
      if (mesh.isMesh) mesh.raycast = skipRaycast
    })
    makeSceneMaterialsUnlit(clone)
    return clone
  }, [scene])
  return <group position={[0, 0.045, 0]} scale={0.48} raycast={skipRaycast}><primitive object={model} /></group>
}

function SpecialCornerModel({ kind, dimmed }: { kind: 'prison' | 'start'; dimmed: boolean }) {
  const { scene } = useGLTF('/assets/corner-signs.glb')
  const model = useMemo(() => {
    const source = scene.getObjectByName(kind === 'prison' ? 'Corner_Prison_Cage' : 'Corner_Start_Sign')
    if (!source) return null
    const clone = source.clone(true)
    makeSceneMaterialsUnlit(clone, dimmed)
    return clone
  }, [scene, kind, dimmed])
  if (!model) return null
  return <group position={[0.22, 0.16, 0.22]} raycast={skipRaycast}><primitive object={model} /></group>
}

function Board({ players, pawnGroups, activePlayerSessionId, destinationSpaceId, propertyBuildings, thrownObjects, earthquakeEvents, cityEffectEvents, worldCupSpaceId, worldCupMultiplier, festivalSpaceIds, highlightedSpaceIds, selectionMode, showLiquidationValues, landingPulseSpaceId, landingPulseSequence, diceRollSequence, dice, diceVisible, diceResultVisible, presentationSpeed, reducedMotion, pawnMovementEnabled, pawnMoveMode, pawnStepSoundEnabled, onMovementComplete, onSelectSpace }: { players: PlayerToken[]; pawnGroups: Map<string, Group>; activePlayerSessionId: string; destinationSpaceId: number; propertyBuildings: PropertyBuilding[]; thrownObjects: ThrowableEvent[]; earthquakeEvents: EarthquakeEvent[]; cityEffectEvents: CityEffectEvent[]; worldCupSpaceId: number; worldCupMultiplier: number; festivalSpaceIds: readonly number[]; highlightedSpaceIds: readonly number[]; selectionMode: boolean; showLiquidationValues: boolean; landingPulseSpaceId: number; landingPulseSequence: number; dice: [number, number]; diceVisible: boolean; diceResultVisible: boolean; diceRollSequence: number; presentationSpeed: AnimationSpeed; reducedMotion: boolean; pawnMovementEnabled: boolean; pawnMoveMode: 'walk' | 'teleport'; pawnStepSoundEnabled: boolean; onMovementComplete: () => void; onSelectSpace: (spaceId: number) => void }) {
  const pawnStackIndices = useMemo(() => getPawnStackIndices(players), [players])
  const wealthHeadwear: WealthHeadwear = useMemo(() => getWealthHeadwear(players, propertyBuildings), [players, propertyBuildings])
  const { scene: buildingScene } = useGLTF('/assets/board-models/board-models.glb')
  const propertyRentLabels = useMemo(() => boardSpaces
    .filter((space) => space.kind === 'property' && propertyBuildings.some((holding) => holding.spaceId === space.id && Boolean(holding.ownerSessionId)))
    .filter((space) => !selectionMode || highlightedSpaceIds.includes(space.id))
    .map((space) => {
      const holding = propertyBuildings.find((item) => item.spaceId === space.id)
      const houses = holding?.houses ?? 0
      const variantName = houses === 0 ? 'Board_Land' : houses === PROPERTY_HOTEL_LEVEL ? 'Board_Hotel' : `Board_House_${houses}`
      const model = buildingScene.getObjectByName(variantName)
      const bounds = model ? new Box3().setFromObject(model) : null
      const { x, z } = positionOnBoard(space.id)
      const local = bounds ? getBuildingRentLabelPosition(space.id, bounds, 0.98, 1.25, 0.08, 0.2, BUILDING_GROUP_Y + getPropertyModelYOffset(houses)) : [0, 0.95, 0] as [number, number, number]
      const label = getPropertyBoardLabel(space.id, propertyBuildings, worldCupSpaceId, new Set(festivalSpaceIds), showLiquidationValues, worldCupMultiplier)
      return { id: space.id, position: [x + local[0], local[1], z + local[2]] as [number, number, number], label }
    }), [buildingScene, propertyBuildings, worldCupSpaceId, worldCupMultiplier, festivalSpaceIds, showLiquidationValues, selectionMode, highlightedSpaceIds])

  return (
    <group>
      <mesh position={[0, -0.25, 0]} raycast={skipRaycast}>
        <boxGeometry args={[12.1, 0.34, 12.1]} />
        <meshBasicMaterial color="#946442" />
      </mesh>
      <mesh position={[0, -0.055, 0]} raycast={skipRaycast}>
        <boxGeometry args={[11.85, 0.1, 11.85]} />
        <meshBasicMaterial color="#f2e8d3" />
      </mesh>
      <mesh position={[0, 0.01, 0]} raycast={skipRaycast}>
        <boxGeometry args={[9.8, 0.04, 9.8]} />
        <meshBasicMaterial color="#789763" />
      </mesh>
      <Suspense fallback={null}><FatecLandmark /></Suspense>
      {boardSpaces.map((space) => {
        const { x, z } = positionOnBoard(space.id)
        const corner = space.id % 10 === 0
        const size = corner ? 1.14 : 0.98
        const decoration = getBoardSpaceDecoration(space.id)
        const rotation = decoration.tileRotation
        const theme = getBoardTileTheme(space, corner)
        const selectable = highlightedSpaceIds.includes(space.id)
        return (
          <group key={space.id} position={[x, 0.08, z]} rotation={[0, rotation, 0]} onClick={(event) => { event.stopPropagation(); if (!selectionMode || selectable) onSelectSpace(space.id) }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = selectionMode && !selectable ? 'not-allowed' : 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
            <SelectionContrast dimmed={selectionMode && !selectable}>
            <mesh>
              <boxGeometry args={[size, 0.16, size]} />
              <meshBasicMaterial color={theme.floor} />
            </mesh>
            <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={getTileTrimGeometry(size)} raycast={skipRaycast} dispose={null}><meshBasicMaterial color={theme.trim} /></mesh>
            {space.kind === 'tax' && <mesh position={[size * 0.31, 0.112, size * 0.3]} raycast={skipRaycast}><cylinderGeometry args={[0.075, 0.075, 0.025, 8]} /><meshBasicMaterial color={theme.trim} /></mesh>}
            {space.kind === 'event' && <ChanceRoulette size={size} trim={theme.trim} />}
            {space.kind === 'prison' && <Suspense fallback={null}><SpecialCornerModel kind="prison" dimmed={selectionMode && !selectable} /></Suspense>}
            {space.kind === 'world-cup' && <Suspense fallback={null}><CornerLandmark type="stadium" position={[0, 0.15, 0]} dimmed={selectionMode && !selectable} /></Suspense>}
            {space.kind === 'world-tour' && <Suspense fallback={null}><CornerLandmark type="airport" position={[0, 0.08, 0]} dimmed={selectionMode && !selectable} /></Suspense>}
            {space.kind === 'property' && space.id === worldCupSpaceId && <Html position={[size * 0.26, 0.62, size * 0.26]} center distanceFactor={10} zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}><span className="world-cup-host-flag"><b>🏆</b><small>SEDE</small></span></Html>}
            {space.kind === 'property' && festivalSpaceIds.includes(space.id) && <Suspense fallback={null}><FestivalBanner spaceId={space.id} size={size} dimmed={selectionMode && !selectable} /></Suspense>}
            {space.kind === 'start' && <Suspense fallback={null}><SpecialCornerModel kind="start" dimmed={selectionMode && !selectable} /></Suspense>}
            {shouldRenderSpaceLabel(space.kind) && <SpaceLabel name={space.name} size={size} ink={theme.ink} outline={theme.outline} outwardRotation={decoration.labelRotation} />}
            {highlightedSpaceIds.includes(space.id) && (
              <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={skipRaycast}>
                <ringGeometry args={[size * 0.38, size * 0.47, 40]} />
                <meshBasicMaterial color="#e5af3f" transparent opacity={0.96} toneMapped={false} />
              </mesh>
            )}
            {landingPulseSpaceId === space.id && <LandingPulse sequence={landingPulseSequence} reducedMotion={reducedMotion} size={size} presentationSpeed={presentationSpeed} />}
            {corner && space.kind !== 'world-cup' && space.kind !== 'world-tour' && (
              <mesh position={[0, 0.19, 0]} rotation={[0, Math.PI / 4, 0]} raycast={skipRaycast}>
                <boxGeometry args={[0.32, 0.08, 0.32]} />
                <meshBasicMaterial color="#d5a956" />
              </mesh>
            )}
            </SelectionContrast>
          </group>
        )
      })}
      {propertyRentLabels.map(({ id, position, label }) => label && <Billboard key={`rent-${id}`} position={position} follow>
        <group>
          <Text position={[0, 0.18, 0]} renderOrder={1000} material-depthTest={false} material-depthWrite={false} fontSize={0.13} lineHeight={1.1} fontWeight="bold" maxWidth={2} textAlign="center" anchorX="center" anchorY="middle" color={label.ownerColor} outlineColor="#fff9eb" outlineWidth={0.018} depthOffset={-10} raycast={skipRaycast}>{label.name}</Text>
          <Text position={[0, 0, 0]} renderOrder={1000} material-depthTest={false} material-depthWrite={false} fontSize={0.15} lineHeight={1.1} fontWeight="bold" maxWidth={2} textAlign="center" anchorX="center" anchorY="middle" color="#243b2e" outlineColor="#fff9eb" outlineWidth={0.018} depthOffset={-10} raycast={skipRaycast}>{label.rent}</Text>
          {label.liquidation && <Text position={[0, -0.18, 0]} renderOrder={1000} material-depthTest={false} material-depthWrite={false} fontSize={0.13} lineHeight={1.1} fontWeight="bold" maxWidth={2} textAlign="center" anchorX="center" anchorY="middle" color="#9a392c" outlineColor="#fff9eb" outlineWidth={0.018} depthOffset={-10} raycast={skipRaycast}>{`LIQ. ${label.liquidation}`}</Text>}
        </group>
      </Billboard>)}
      <Suspense fallback={null}>
        {propertyBuildings.filter(({ ownerSessionId }) => Boolean(ownerSessionId)).map(({ spaceId, houses, blackoutTurns = 0, protectionTurns = 0, ownerColor, ownerSessionId }) => <AnimatedBuilding key={`buildings-${spaceId}`} spaceId={spaceId} houses={houses} blackoutTurns={blackoutTurns} protectionTurns={protectionTurns} ownerColor={ownerColor} ownerSessionId={ownerSessionId} reducedMotion={reducedMotion} presentationSpeed={presentationSpeed} dimmed={selectionMode && !highlightedSpaceIds.includes(spaceId)} />)}
      </Suspense>
      {destinationSpaceId >= 0 && (() => { const target = positionOnBoard(destinationSpaceId); return <group position={[target.x, 0, target.z]}><FloatingPointingArrow color="#ffe27a" size={1.3} baseY={1.5} /></group> })()}
      {players.map((player) => <AnimatedPawn key={player.id} player={player} headwear={player.id === wealthHeadwear.richestId ? 'crown' : player.id === wealthHeadwear.poorestId ? 'jester' : null} stackIndex={pawnStackIndices.get(player.id) ?? 0} pawnGroups={pawnGroups} reducedMotion={reducedMotion} movementEnabled={pawnMovementEnabled} moveMode={pawnMoveMode} presentationSpeed={presentationSpeed} pawnStepSoundEnabled={pawnStepSoundEnabled} isActive={player.id === activePlayerSessionId} onMovementComplete={onMovementComplete} />)}
      {thrownObjects.map((event) => <ThrowableProjectile key={event.id} event={event} pawnGroups={pawnGroups} />)}
      {earthquakeEvents.map((event) => <EarthquakeCollapse key={event.id} event={event} scene={buildingScene} />)}
      {cityEffectEvents.map((event) => <CityEffectMarker key={event.id} event={event} />)}
      {diceVisible && <>
        <AnimatedDie position={DICE_PRESENTATION_POSITIONS[0]!} rotation={[0.12, 0.25, 0.25]} sequence={diceRollSequence} value={dice[0] || 1} reducedMotion={reducedMotion} visible={diceVisible} presentationSpeed={presentationSpeed} />
        {dice[1] > 0 && <AnimatedDie position={DICE_PRESENTATION_POSITIONS[1]!} rotation={[-0.18, 0.3, -0.2]} sequence={diceRollSequence} value={dice[1]} reducedMotion={reducedMotion} visible={diceVisible} presentationSpeed={presentationSpeed} />}
        {diceResultVisible && <Html position={DICE_RESULT_BADGE_POSITION} center distanceFactor={9} zIndexRange={[6, 6]}><div className="dice-result-badge" role="status" aria-live="polite"><small>{dice[1] > 0 ? 'TOTAL' : 'D6'}</small><strong>{dice[1] > 0 ? dice[0] + dice[1] : dice[0]}</strong></div></Html>}
      </>}
    </group>
  )
}

function LandingPulse({ sequence, reducedMotion, size, presentationSpeed }: { sequence: number; reducedMotion: boolean; size: number; presentationSpeed: AnimationSpeed }) {
  const ring = useRef<Group>(null)
  const { invalidate } = useThree()
  const elapsed = useRef(0)
  useEffect(() => { elapsed.current = 0 }, [sequence])
  useFrame((_, delta) => {
    const duration = getAnimationDuration(LANDING_PULSE_DURATION_MS, presentationSpeed) / 1000
    if (!ring.current || reducedMotion || elapsed.current >= duration) return
    invalidate()
    elapsed.current = Math.min(duration, elapsed.current + delta)
    const progress = elapsed.current / duration
    const scale = 0.72 + progress * 0.5
    ring.current.scale.setScalar(scale)
    ring.current.children.forEach((child) => {
      const material = (child as { material?: { opacity: number } }).material
      if (material) material.opacity = 0.8 * (1 - progress)
    })
  })
  return <group ref={ring} position={[0, 0.11, 0]}>{reducedMotion ? null : <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[size * 0.38, size * 0.45, 40]} /><meshBasicMaterial color="#e5af3f" transparent opacity={0.8} toneMapped={false} /></mesh>}</group>
}

function CornerLandmark({ type, position, dimmed }: { type: 'stadium' | 'airport'; position: [number, number, number]; dimmed: boolean }) {
  const path = type === 'stadium' ? '/assets/world-cup-stadium.glb' : '/assets/world-tour-airport.glb'
  const { scene } = useGLTF(path)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.userData.selectionContrastManaged = true
    const bounds = new Box3().setFromObject(clone)
    const placement = getCenteredModelPlacement(bounds)
    clone.position.x += placement[0]
    clone.position.y += placement[1]
    clone.position.z += placement[2]
    clone.traverse((object) => {
      const mesh = object as Mesh
      if (mesh.isMesh) mesh.raycast = skipRaycast
    })
    makeSceneMaterialsUnlit(clone, dimmed)
    return clone
  }, [dimmed, scene, type])
  return <group position={position}><primitive object={model} scale={type === 'stadium' ? 0.64 : 0.36} /></group>
}

function FestivalBanner({ spaceId, size, dimmed }: { spaceId: number; size: number; dimmed: boolean }) {
  const { scene } = useGLTF('/assets/festival-banner.glb')
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.userData.selectionContrastManaged = true
    const bounds = new Box3().setFromObject(clone)
    const center = bounds.getCenter(new Vector3())
    clone.position.set(-center.x, -bounds.min.y, -center.z)
    clone.traverse((object) => {
      const mesh = object as Mesh
      if (mesh.isMesh) mesh.raycast = skipRaycast
    })
    makeSceneMaterialsUnlit(clone, dimmed)
    return clone
  }, [dimmed, scene])
  const placement = getFestivalBannerPlacement(spaceId, size)
  return <group position={placement.position} scale={placement.scale}><primitive object={model} /></group>
}

type BoardSceneProps = { nightMode: boolean; players: PlayerToken[]; activePlayerSessionId?: string; localPlayerSessionId?: string; cameraMode?: 'board' | 'player'; destinationSpaceId?: number; propertyBuildings: PropertyBuilding[]; thrownObjects: ThrowableEvent[]; earthquakeEvents?: EarthquakeEvent[]; cityEffectEvents?: CityEffectEvent[]; worldCupSpaceId?: number; worldCupMultiplier?: number; festivalSpaceIds?: readonly number[]; highlightedSpaceIds?: readonly number[]; selectionMode?: boolean; showLiquidationValues?: boolean; landingPulseSpaceId?: number; landingPulseSequence?: number; diceRollSequence?: number; renderWakeSequence?: number; dice?: [number, number]; diceVisible?: boolean; diceResultVisible?: boolean; presentationSpeed?: AnimationSpeed; reducedMotion?: boolean; pawnMovementEnabled?: boolean; pawnMoveMode?: 'walk' | 'teleport'; pawnStepSoundEnabled?: boolean; cameraEnabled?: boolean; graphicsQuality?: GraphicsQuality; fpsMeterEnabled?: boolean; fpsSamples?: { current: FrameRateAccumulator }; onMovementComplete: () => void; onSelectSpace: (spaceId: number) => void }

function SceneRenderWake({ sequence, onUnrecoveredContextLoss, onContextLost, onContextRestored }: { sequence: number; onUnrecoveredContextLoss: () => void; onContextLost: () => void; onContextRestored: () => void }) {
  const { gl, invalidate } = useThree()

  useEffect(() => scheduleSceneRenderWake(
    invalidate,
    (callback) => window.requestAnimationFrame(callback),
    (frame) => window.cancelAnimationFrame(frame),
    (callback, delayMs) => window.setTimeout(callback, delayMs),
    (timer) => window.clearTimeout(timer),
  ), [invalidate, sequence])

  useEffect(() => {
    const removeResumeListeners = subscribeSceneResumeWake(invalidate, window, document, () => document.visibilityState === 'visible')
    const removeContextListeners = subscribeSceneContextRecovery(
      gl.domElement,
      invalidate,
      onUnrecoveredContextLoss,
      (callback, delayMs) => window.setTimeout(callback, delayMs),
      (timer) => window.clearTimeout(timer),
      1800,
      onContextLost,
      onContextRestored,
    )
    return () => {
      removeResumeListeners()
      removeContextListeners()
    }
  }, [gl, invalidate, onContextLost, onContextRestored, onUnrecoveredContextLoss])

  return null
}

function FrameRateProbe({ samples }: { samples: { current: FrameRateAccumulator } }) {
  useFrame(() => {
    samples.current = recordRenderedFrame(samples.current, performance.now())
  })
  return null
}

function BoardSceneCanvas({ nightMode, players, activePlayerSessionId = '', localPlayerSessionId = '', cameraMode = 'board', destinationSpaceId = -1, propertyBuildings, thrownObjects, earthquakeEvents = [], cityEffectEvents = [], worldCupSpaceId = 255, worldCupMultiplier = 2, festivalSpaceIds = [], highlightedSpaceIds = [], selectionMode = false, showLiquidationValues = false, landingPulseSpaceId = -1, landingPulseSequence = 0, diceRollSequence = 0, renderWakeSequence = 0, dice = [0, 0], diceVisible = false, diceResultVisible = false, presentationSpeed = 1, reducedMotion = false, pawnMovementEnabled = false, pawnMoveMode = 'walk', pawnStepSoundEnabled = false, cameraEnabled = true, graphicsQuality = 'high', fpsMeterEnabled = false, fpsSamples, onMovementComplete, onSelectSpace }: BoardSceneProps) {
  const pawnGroups = useMemo(() => new Map<string, Group>(), [])
  const [canvasGeneration, setCanvasGeneration] = useState(0)
  const [recoveryQuality, setRecoveryQuality] = useState<GraphicsQuality | null>(null)
  const [contextStatus, setContextStatus] = useState<'ready' | 'lost' | 'recovering' | 'failed'>('ready')
  const recoveryAttempts = useRef(0)
  const recoveryResetTimer = useRef<number | undefined>(undefined)
  const requestedQuality = useRef(graphicsQuality)
  const effectiveQuality = recoveryQuality ?? graphicsQuality
  const markCanvasStable = useCallback(() => {
    setContextStatus('ready')
    if (recoveryResetTimer.current !== undefined) window.clearTimeout(recoveryResetTimer.current)
    recoveryResetTimer.current = window.setTimeout(() => {
      recoveryAttempts.current = 0
      recoveryResetTimer.current = undefined
    }, 10_000)
  }, [])
  const markContextLost = useCallback(() => {
    if (recoveryResetTimer.current !== undefined) window.clearTimeout(recoveryResetTimer.current)
    recoveryResetTimer.current = undefined
    setContextStatus('lost')
  }, [])
  const markContextRestored = useCallback(() => markCanvasStable(), [markCanvasStable])
  const recoverLostContext = useCallback(() => {
    if (recoveryAttempts.current >= 1) {
      setContextStatus('failed')
      return
    }
    recoveryAttempts.current += 1
    setRecoveryQuality((current) => getLowerGraphicsQuality(current ?? graphicsQuality))
    setContextStatus('recovering')
    setCanvasGeneration((generation) => generation + 1)
  }, [graphicsQuality])
  const retryCanvas = useCallback(() => {
    recoveryAttempts.current = 0
    setContextStatus('recovering')
    setCanvasGeneration((generation) => generation + 1)
  }, [])
  useEffect(() => () => {
    if (recoveryResetTimer.current !== undefined) window.clearTimeout(recoveryResetTimer.current)
  }, [])
  useEffect(() => {
    if (requestedQuality.current === graphicsQuality) return
    requestedQuality.current = graphicsQuality
    recoveryAttempts.current = 0
    setRecoveryQuality(null)
    setContextStatus('recovering')
    setCanvasGeneration((generation) => generation + 1)
  }, [graphicsQuality])
  return (
    <>
    <Canvas key={canvasGeneration} onCreated={markCanvasStable} camera={{ position: [12.5, 15.5, 15.5], fov: 34 }} dpr={getGraphicsDprRange(effectiveQuality)} frameloop="demand" gl={{ antialias: false, powerPreference: recoveryQuality ? 'default' : 'high-performance', stencil: false }}>
      <color attach="background" args={[getGameBackgroundColor(nightMode)]} />
      <SceneRenderWake sequence={renderWakeSequence} onUnrecoveredContextLoss={recoverLostContext} onContextLost={markContextLost} onContextRestored={markContextRestored} />
      <ResponsiveCamera tilt={16} horizontal={45} />
      <OrbitControls makeDefault enabled={cameraEnabled} enablePan={false} enableZoom enableRotate minPolarAngle={Math.PI / 12} maxPolarAngle={Math.PI / 2} rotateSpeed={0.72} zoomSpeed={0.75} enableDamping dampingFactor={0.1} />
      <CameraFollowTarget mode={cameraMode} localPlayerSessionId={localPlayerSessionId} pawnGroups={pawnGroups} />
      <CameraZoomBounds />
      <CameraDragAnywhere enabled={cameraEnabled} />
      {fpsMeterEnabled && fpsSamples && <FrameRateProbe samples={fpsSamples} />}
      <Board players={players} pawnGroups={pawnGroups} activePlayerSessionId={activePlayerSessionId} destinationSpaceId={destinationSpaceId} propertyBuildings={propertyBuildings} thrownObjects={thrownObjects} earthquakeEvents={earthquakeEvents} cityEffectEvents={cityEffectEvents} worldCupSpaceId={worldCupSpaceId} worldCupMultiplier={worldCupMultiplier} festivalSpaceIds={festivalSpaceIds} highlightedSpaceIds={highlightedSpaceIds} selectionMode={selectionMode} showLiquidationValues={showLiquidationValues} landingPulseSpaceId={landingPulseSpaceId} landingPulseSequence={landingPulseSequence} diceRollSequence={diceRollSequence} dice={dice} diceVisible={diceVisible} diceResultVisible={diceResultVisible} presentationSpeed={presentationSpeed} reducedMotion={reducedMotion} pawnMovementEnabled={pawnMovementEnabled} pawnMoveMode={pawnMoveMode} pawnStepSoundEnabled={pawnStepSoundEnabled} onMovementComplete={onMovementComplete} onSelectSpace={onSelectSpace} />
    </Canvas>
    {contextStatus !== 'ready' && <div className="scene-context-recovery" role="status" aria-live="polite">
      <strong>{contextStatus === 'failed' ? 'O tabuleiro perdeu a conexão gráfica' : contextStatus === 'recovering' ? 'Restaurando o tabuleiro…' : 'Reconectando o tabuleiro…'}</strong>
      <span>{contextStatus === 'failed' ? 'A partida continua ativa. Tente restaurar a visualização para continuar acompanhando.' : 'A sala e o turno continuam ativos enquanto a cena 3D é recuperada.'}</span>
      {contextStatus === 'failed' && <button type="button" onClick={retryCanvas}>Tentar restaurar</button>}
    </div>}
    </>
  )
}

function samePlayers(first: PlayerToken[], second: PlayerToken[]) {
  return first.length === second.length && first.every((player, index) => {
    const other = second[index]
    return Boolean(other && player.id === other.id && player.position === other.position && player.color === other.color && player.seatIndex === other.seatIndex && player.cash === other.cash && player.characterType === other.characterType && player.activity === other.activity && player.emote?.sequence === other.emote?.sequence)
  })
}

function sameThrows(first: ThrowableEvent[], second: ThrowableEvent[]) {
  return first.length === second.length && first.every((event, index) => {
    const other = second[index]
    return Boolean(other && event.id === other.id && event.fromSessionId === other.fromSessionId && event.toSessionId === other.toSessionId && event.object === other.object)
  })
}

function sameEarthquakes(first: EarthquakeEvent[] = [], second: EarthquakeEvent[] = []) {
  return first.length === second.length && first.every((event, index) => {
    const other = second[index]
    return Boolean(other && event.id === other.id && event.spaceId === other.spaceId && event.houses === other.houses && event.ownerColor === other.ownerColor)
  })
}

function sameBuildings(first: PropertyBuilding[], second: PropertyBuilding[]) {
  return first.length === second.length && first.every((building, index) => {
    const other = second[index]
    return Boolean(other && building.spaceId === other.spaceId && building.ownerSessionId === other.ownerSessionId && building.houses === other.houses && building.blackoutTurns === other.blackoutTurns && building.protectionTurns === other.protectionTurns && building.ownerColor === other.ownerColor)
  })
}

function sameNumbers(first: readonly number[], second: readonly number[]) {
  return first.length === second.length && first.every((value, index) => value === second[index])
}

function areScenePropsEqual(first: BoardSceneProps, second: BoardSceneProps) {
  return first.nightMode === second.nightMode
    && samePlayers(first.players, second.players)
    && first.activePlayerSessionId === second.activePlayerSessionId
    && first.localPlayerSessionId === second.localPlayerSessionId
    && first.cameraMode === second.cameraMode
    && first.destinationSpaceId === second.destinationSpaceId
    && sameThrows(first.thrownObjects, second.thrownObjects)
    && sameEarthquakes(first.earthquakeEvents, second.earthquakeEvents)
    && JSON.stringify(first.cityEffectEvents ?? []) === JSON.stringify(second.cityEffectEvents ?? [])
    && sameBuildings(first.propertyBuildings, second.propertyBuildings)
    && first.worldCupSpaceId === second.worldCupSpaceId && first.worldCupMultiplier === second.worldCupMultiplier
    && sameNumbers(first.festivalSpaceIds ?? [], second.festivalSpaceIds ?? [])
    && sameNumbers(first.highlightedSpaceIds ?? [], second.highlightedSpaceIds ?? [])
    && first.selectionMode === second.selectionMode
    && first.showLiquidationValues === second.showLiquidationValues
    && first.landingPulseSpaceId === second.landingPulseSpaceId
    && first.landingPulseSequence === second.landingPulseSequence
    && first.diceRollSequence === second.diceRollSequence
    && first.renderWakeSequence === second.renderWakeSequence
    && first.dice?.[0] === second.dice?.[0]
    && first.dice?.[1] === second.dice?.[1]
    && first.diceVisible === second.diceVisible
    && first.diceResultVisible === second.diceResultVisible
    && first.presentationSpeed === second.presentationSpeed
    && first.reducedMotion === second.reducedMotion
    && first.pawnMovementEnabled === second.pawnMovementEnabled
    && first.pawnMoveMode === second.pawnMoveMode
    && first.pawnStepSoundEnabled === second.pawnStepSoundEnabled
    && first.cameraEnabled === second.cameraEnabled
    && first.graphicsQuality === second.graphicsQuality
    && first.fpsMeterEnabled === second.fpsMeterEnabled
    && first.fpsSamples === second.fpsSamples
}

const MemoizedBoardScene = memo(BoardSceneCanvas, areScenePropsEqual)

export default function BoardScene(props: BoardSceneProps) {
  const movementCallback = useRef(props.onMovementComplete)
  const selectCallback = useRef(props.onSelectSpace)
  movementCallback.current = props.onMovementComplete
  selectCallback.current = props.onSelectSpace
  const onMovementComplete = useCallback(() => movementCallback.current(), [])
  const onSelectSpace = useCallback((spaceId: number) => selectCallback.current(spaceId), [])
  return <MemoizedBoardScene {...props} onMovementComplete={onMovementComplete} onSelectSpace={onSelectSpace} />
}
