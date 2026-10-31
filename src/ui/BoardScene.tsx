import { Canvas } from '@react-three/fiber'
import { Billboard, Html, OrbitControls, Text } from '@react-three/drei'
import { memo, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BackSide, Box3, CanvasTexture, DoubleSide, Path, PerspectiveCamera, Shape, ShapeGeometry, SRGBColorSpace, type Group, type Mesh, type Object3D } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { boardSpaces, positionOnBoard } from '../game/board'
import { getCameraFraming } from './cameraFraming'
import { getCameraZoomLimits } from './cameraZoom'
import { BUILDING_GROUP_Y, BUILDING_MODEL_Y_OFFSET, getBoardSpaceDecoration } from './boardDecoration'
import { getBoardTileTheme } from './boardTileTheme'
import { fitSpaceLabel, shouldRenderSpaceLabel } from './spaceLabel'
import { getPawnStepPath } from './pawnPath'
import { getPropertyVisualChange } from './gameFeedback'
import { DICE_PRESENTATION_POSITIONS, DICE_RESULT_BADGE_POSITION, DICE_ROLL_BOUNCE_HEIGHT, DICE_VISUAL_SCALE, getDiceRollRotation } from './dicePresentation'
import { getRouletteFloorSectors } from './rouletteFloor'
import { shouldStartCameraDrag } from './cameraDrag'
import { BUILDING_ANIMATION_DURATION_MS, DICE_ANIMATION_DURATION_MS, LANDING_PULSE_DURATION_MS, PAWN_STEP_ANIMATION_DURATION_MS, PAWN_TELEPORT_ANIMATION_DURATION_MS, PROPERTY_HOTEL_LEVEL, getAnimationDuration, type AnimationSpeed } from '../../shared/game'
import type { FrameRateAccumulator } from './fpsMeter'
import { recordRenderedFrame } from './fpsMeter'
import { applySelectionContrast, createTokenOutlineMaterial, createUnlitMaterial, getOwnerTintOverride } from './sceneMaterials'
import { getBuildingInnerEdgeOffset, getBuildingRentLabelPosition, getCenteredModelPlacement, getModelFootprintDepth } from './modelPlacement'
import { getPropertyRentLabel } from './propertyRentLabel'
import { playGameSound } from './gameAudio'
import { getGraphicsDprRange, type GraphicsQuality } from './graphicsQuality'
import { getGameBackgroundColor } from './nightMode'
import { getPlayerEmoteSymbol, type PlayerEmote } from '../../shared/playerEmotes'

type PropertyBuilding = { spaceId: number; ownerSessionId: string; houses: number; blackoutTurns?: number; protectionTurns?: number; ownerColor: string }
type PlayerToken = { id: string; position: number; color: string; seatIndex: number; cash: number; characterType: 'pawn' | 'car' | 'motorcycle' | 'airplane'; activity?: string; emote?: { emote: PlayerEmote; sequence: number } }

type CameraOrbitControls = {
  enabled: boolean
  minDistance: number
  maxDistance: number
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

function AnimatedPawn({ player, seatIndex, reducedMotion, movementEnabled, moveMode, presentationSpeed, pawnStepSoundEnabled, onMovementComplete }: { player: PlayerToken; seatIndex: number; reducedMotion: boolean; movementEnabled: boolean; moveMode: 'walk' | 'teleport'; presentationSpeed: AnimationSpeed; pawnStepSoundEnabled: boolean; onMovementComplete: () => void }) {
  const group = useRef<Group>(null)
  const { invalidate } = useThree()
  const { scene: tokenScene } = useGLTF('/assets/player-tokens.glb')
  const visualSpace = useRef(player.position)
  const hopPath = useRef<number[]>([])
  const hopStart = useRef({ x: 0, z: 0 })
  const elapsed = useRef(0)
  const lastStepSoundIndex = useRef(-1)
  const hopDuration = useRef(getAnimationDuration(PAWN_STEP_ANIMATION_DURATION_MS, presentationSpeed) / 1000)
  const onMovementCompleteRef = useRef(onMovementComplete)
  onMovementCompleteRef.current = onMovementComplete
  const vehicleOffsets = [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]] as const
  const offsetX = player.characterType === 'pawn' ? 0.13 * (seatIndex - 1.5) : vehicleOffsets[seatIndex]?.[0] ?? 0
  const offsetZ = player.characterType === 'pawn' ? 0.06 : vehicleOffsets[seatIndex]?.[1] ?? 0
  const baseY = player.characterType === 'pawn' ? 0.35 : 0.16
  const initial = positionOnBoard(visualSpace.current)
  const model = useMemo(() => {
    if (player.characterType === 'pawn') return null
    const source = tokenScene.getObjectByName(({ car: 'Token_Car', motorcycle: 'Token_Motorcycle', airplane: 'Token_Airplane' } as const)[player.characterType])
    if (!source) return null
    const clone = source.clone(true)
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
  useEffect(() => () => model?.outline.traverse((object) => {
    const mesh = object as Mesh
    if (mesh.isMesh) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => material.dispose())
  }), [model])

  useEffect(() => {
    if (player.position === visualSpace.current) return
    if (!movementEnabled && !reducedMotion) return
    const path = moveMode === 'teleport' ? [player.position] : getPawnStepPath(visualSpace.current, player.position)
    if (!path.length) return
    if (reducedMotion) {
      const destination = positionOnBoard(player.position)
      group.current?.position.set(destination.x + offsetX, baseY, destination.z + offsetZ)
      visualSpace.current = player.position
      hopPath.current = []
      onMovementCompleteRef.current()
      return
    }
    hopStart.current = group.current ? { x: group.current.position.x, z: group.current.position.z } : { x: initial.x + offsetX, z: initial.z + offsetZ }
    hopPath.current = path
    lastStepSoundIndex.current = -1
    hopDuration.current = getAnimationDuration(moveMode === 'teleport' ? PAWN_TELEPORT_ANIMATION_DURATION_MS : PAWN_STEP_ANIMATION_DURATION_MS, presentationSpeed) / 1000
    elapsed.current = 0
  }, [player.position, initial.x, initial.z, offsetX, offsetZ, presentationSpeed, reducedMotion, movementEnabled, moveMode])

  useFrame((_, delta) => {
    const pawn = group.current
    if (!pawn) return
    if (reducedMotion) return
    const path = hopPath.current
    if (path.length) {
      elapsed.current += delta
      const hopIndex = Math.floor(elapsed.current / hopDuration.current)
      if (hopIndex >= path.length) {
        const destination = positionOnBoard(path[path.length - 1] ?? player.position)
        pawn.position.set(destination.x + offsetX, baseY, destination.z + offsetZ)
        pawn.rotation.z = 0
        hopPath.current = []
        visualSpace.current = player.position
        onMovementCompleteRef.current()
        return
      }
      invalidate()
      if (moveMode === 'walk' && pawnStepSoundEnabled && hopIndex !== lastStepSoundIndex.current) {
        lastStepSoundIndex.current = hopIndex
        playGameSound('pawn-step')
      }
      const progress = Math.min((elapsed.current - hopIndex * hopDuration.current) / hopDuration.current, 1)
      const from = hopIndex === 0 ? hopStart.current : positionOnBoard(path[hopIndex - 1] ?? player.position)
      const to = positionOnBoard(path[hopIndex] ?? player.position)
      const fromX = hopIndex === 0 ? from.x : from.x + offsetX
      const fromZ = hopIndex === 0 ? from.z : from.z + offsetZ
      pawn.position.set(fromX + (to.x + offsetX - fromX) * progress, baseY + Math.sin(progress * Math.PI) * 0.24, fromZ + (to.z + offsetZ - fromZ) * progress)
      if (player.characterType !== 'pawn') pawn.rotation.y = Math.atan2(to.x - from.x, to.z - from.z)
      pawn.rotation.z = Math.sin(progress * Math.PI) * 0.14
      return
    }
  })

  return (
    <group ref={group} position={[initial.x + offsetX, baseY, initial.z + offsetZ]} rotation={[0, player.position <= 10 ? Math.PI / 2 : player.position <= 20 ? Math.PI : player.position <= 30 ? -Math.PI / 2 : 0, 0]}>
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
      {player.activity && <Html position={[0, player.characterType === 'pawn' ? 0.86 : 0.66, 0]} center distanceFactor={12} zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}><div className="turn-activity-bubble" role="status" aria-live="polite">{player.activity}</div></Html>}
      {player.emote && <Html key={player.emote.sequence} position={[0, player.characterType === 'pawn' ? 1.08 : 0.9, 0]} center distanceFactor={10} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}><div className="player-emote-bubble" aria-label="Emote do jogador">{getPlayerEmoteSymbol(player.emote.emote)}</div></Html>}
    </group>
  )
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
    die.position.y = position[1] + Math.sin(progress * Math.PI) * DICE_ROLL_BOUNCE_HEIGHT
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

function AnimatedBuilding({ spaceId, houses, ownerColor, ownerSessionId, reducedMotion, presentationSpeed, dimmed }: { spaceId: number; houses: number; ownerColor: string; ownerSessionId: string; reducedMotion: boolean; presentationSpeed: AnimationSpeed; dimmed: boolean }) {
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
    const footprintDepth = getModelFootprintDepth(bounds)
    clone.position.set(...getCenteredModelPlacement(bounds))
    clone.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      mesh.raycast = skipRaycast
    })
    makeSceneMaterialsUnlit(clone, dimmed, displayColor)
    return { object: clone, footprintDepth }
  }, [dimmed, displayColor, ownerSessionId, scene, variantName])
  const modelScale = 1.25
  const [offsetX, offsetZ] = modelData ? getBuildingInnerEdgeOffset(spaceId, 0.98, modelData.footprintDepth, modelScale) : decoration.buildingOffset
  return (
    <group ref={group} position={[x + offsetX, BUILDING_GROUP_Y, z + offsetZ]} rotation={[0, buildingRotation, 0]}>
      {modelData && <primitive object={modelData.object} position={[0, BUILDING_MODEL_Y_OFFSET, 0]} scale={modelScale} />}
    </group>
  )
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

function Board({ players, propertyBuildings, worldCupSpaceId, highlightedSpaceIds, selectionMode, landingPulseSpaceId, landingPulseSequence, diceRollSequence, dice, diceVisible, diceResultVisible, presentationSpeed, reducedMotion, pawnMovementEnabled, pawnMoveMode, pawnStepSoundEnabled, onMovementComplete, onSelectSpace }: { players: PlayerToken[]; propertyBuildings: PropertyBuilding[]; worldCupSpaceId: number; highlightedSpaceIds: readonly number[]; selectionMode: boolean; landingPulseSpaceId: number; landingPulseSequence: number; dice: [number, number]; diceVisible: boolean; diceResultVisible: boolean; diceRollSequence: number; presentationSpeed: AnimationSpeed; reducedMotion: boolean; pawnMovementEnabled: boolean; pawnMoveMode: 'walk' | 'teleport'; pawnStepSoundEnabled: boolean; onMovementComplete: () => void; onSelectSpace: (spaceId: number) => void }) {
  const { scene: buildingScene } = useGLTF('/assets/board-models/board-models.glb')
  const propertyRentLabels = useMemo(() => boardSpaces
    .filter((space) => space.kind === 'property' && propertyBuildings.some((holding) => holding.spaceId === space.id && Boolean(holding.ownerSessionId)))
    .map((space) => {
      const holding = propertyBuildings.find((item) => item.spaceId === space.id)
      const houses = holding?.houses ?? 0
      const variantName = houses === 0 ? 'Board_Land' : houses === PROPERTY_HOTEL_LEVEL ? 'Board_Hotel' : `Board_House_${houses}`
      const model = buildingScene.getObjectByName(variantName)
      const bounds = model ? new Box3().setFromObject(model) : null
      const { x, z } = positionOnBoard(space.id)
      const local = bounds ? getBuildingRentLabelPosition(space.id, bounds, 0.98, 1.25, 0.02, 0.2, BUILDING_GROUP_Y) : [0, 0.95, 0] as [number, number, number]
      return { id: space.id, position: [x + local[0], local[1], z + local[2]] as [number, number, number], text: getPropertyRentLabel(space.id, propertyBuildings, worldCupSpaceId) ?? '' }
    }), [buildingScene, propertyBuildings, worldCupSpaceId])

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
            {space.kind === 'prison' && <group position={[size * 0.3, 0.11, size * 0.3]}><mesh position={[0, 0, 0]} raycast={skipRaycast}><boxGeometry args={[0.25, 0.025, 0.22]} /><meshBasicMaterial color="#536c7d" /></mesh>{[-1, 0, 1].map((offset) => <mesh key={offset} position={[offset * 0.085, 0.12, 0.105]} raycast={skipRaycast}><boxGeometry args={[0.025, 0.22, 0.025]} /><meshBasicMaterial color={theme.trim} /></mesh>)}{[-1, 1].map((offset) => <mesh key={`bar-${offset}`} position={[0, offset * 0.07, 0.105]} raycast={skipRaycast}><boxGeometry args={[0.2, 0.025, 0.025]} /><meshBasicMaterial color={theme.trim} /></mesh>)}</group>}
            {space.kind === 'world-cup' && <Suspense fallback={null}><CornerLandmark type="stadium" position={[0, 0.15, 0]} dimmed={selectionMode && !selectable} /></Suspense>}
            {space.kind === 'world-tour' && <Suspense fallback={null}><CornerLandmark type="airport" position={[0, 0.08, 0]} dimmed={selectionMode && !selectable} /></Suspense>}
            {space.kind === 'start' && <mesh position={[size * 0.31, 0.13, size * 0.3]} rotation={[0, Math.PI / 4, 0]} raycast={skipRaycast}><boxGeometry args={[0.14, 0.045, 0.14]} /><meshBasicMaterial color={theme.trim} /></mesh>}
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
      {propertyRentLabels.map(({ id, position, text }) => <Billboard key={`rent-${id}`} position={position} follow><Text fontSize={0.2} fontWeight="bold" maxWidth={1.65} textAlign="center" anchorX="center" anchorY="middle" color="#243b2e" outlineColor="#fff9eb" outlineWidth={0.022} depthOffset={-1} raycast={skipRaycast}>{text}</Text></Billboard>)}
      <Suspense fallback={null}>
        {propertyBuildings.filter(({ ownerSessionId }) => Boolean(ownerSessionId)).map(({ spaceId, houses, ownerColor, ownerSessionId }) => <AnimatedBuilding key={`buildings-${spaceId}`} spaceId={spaceId} houses={houses} ownerColor={ownerColor} ownerSessionId={ownerSessionId} reducedMotion={reducedMotion} presentationSpeed={presentationSpeed} dimmed={selectionMode && !highlightedSpaceIds.includes(spaceId)} />)}
      </Suspense>
      {players.map((player) => <AnimatedPawn key={player.id} player={player} seatIndex={player.seatIndex} reducedMotion={reducedMotion} movementEnabled={pawnMovementEnabled} moveMode={pawnMoveMode} presentationSpeed={presentationSpeed} pawnStepSoundEnabled={pawnStepSoundEnabled} onMovementComplete={onMovementComplete} />)}
      {diceVisible && <>
        <AnimatedDie position={DICE_PRESENTATION_POSITIONS[0]!} rotation={[0.12, 0.25, 0.25]} sequence={diceRollSequence} value={dice[0] || 1} reducedMotion={reducedMotion} visible={diceVisible} presentationSpeed={presentationSpeed} />
        {dice[1] > 0 && <AnimatedDie position={DICE_PRESENTATION_POSITIONS[1]!} rotation={[-0.18, 0.3, -0.2]} sequence={diceRollSequence} value={dice[1]} reducedMotion={reducedMotion} visible={diceVisible} presentationSpeed={presentationSpeed} />}
        {diceResultVisible && <Html position={DICE_RESULT_BADGE_POSITION} center distanceFactor={9} zIndexRange={[6, 6]}><div className="dice-result-badge" role="status" aria-live="polite"><small>{dice[1] > 0 ? 'TOTAL' : 'ESTAÇÃO'}</small><strong>{dice[1] > 0 ? dice[0] + dice[1] : dice[0]}</strong></div></Html>}
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

type BoardSceneProps = { nightMode: boolean; players: PlayerToken[]; propertyBuildings: PropertyBuilding[]; worldCupSpaceId?: number; highlightedSpaceIds?: readonly number[]; selectionMode?: boolean; landingPulseSpaceId?: number; landingPulseSequence?: number; diceRollSequence?: number; dice?: [number, number]; diceVisible?: boolean; diceResultVisible?: boolean; presentationSpeed?: AnimationSpeed; reducedMotion?: boolean; pawnMovementEnabled?: boolean; pawnMoveMode?: 'walk' | 'teleport'; pawnStepSoundEnabled?: boolean; cameraEnabled?: boolean; graphicsQuality?: GraphicsQuality; fpsMeterEnabled?: boolean; fpsSamples?: { current: FrameRateAccumulator }; onMovementComplete: () => void; onSelectSpace: (spaceId: number) => void }

function FrameRateProbe({ samples }: { samples: { current: FrameRateAccumulator } }) {
  useFrame(() => {
    samples.current = recordRenderedFrame(samples.current, performance.now())
  })
  return null
}

function BoardSceneCanvas({ nightMode, players, propertyBuildings, worldCupSpaceId = 255, highlightedSpaceIds = [], selectionMode = false, landingPulseSpaceId = -1, landingPulseSequence = 0, diceRollSequence = 0, dice = [0, 0], diceVisible = false, diceResultVisible = false, presentationSpeed = 1, reducedMotion = false, pawnMovementEnabled = false, pawnMoveMode = 'walk', pawnStepSoundEnabled = false, cameraEnabled = true, graphicsQuality = 'high', fpsMeterEnabled = false, fpsSamples, onMovementComplete, onSelectSpace }: BoardSceneProps) {
  return (
    <Canvas camera={{ position: [12.5, 15.5, 15.5], fov: 34 }} dpr={getGraphicsDprRange(graphicsQuality)} frameloop="demand" gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}>
      <color attach="background" args={[getGameBackgroundColor(nightMode)]} />
      <ResponsiveCamera tilt={16} horizontal={45} />
      <OrbitControls makeDefault enabled={cameraEnabled} enablePan={false} enableZoom enableRotate minPolarAngle={Math.PI / 12} maxPolarAngle={Math.PI / 2} rotateSpeed={0.72} zoomSpeed={0.75} enableDamping dampingFactor={0.1} />
      <CameraZoomBounds />
      <CameraDragAnywhere enabled={cameraEnabled} />
      {fpsMeterEnabled && fpsSamples && <FrameRateProbe samples={fpsSamples} />}
      <Board players={players} propertyBuildings={propertyBuildings} worldCupSpaceId={worldCupSpaceId} highlightedSpaceIds={highlightedSpaceIds} selectionMode={selectionMode} landingPulseSpaceId={landingPulseSpaceId} landingPulseSequence={landingPulseSequence} diceRollSequence={diceRollSequence} dice={dice} diceVisible={diceVisible} diceResultVisible={diceResultVisible} presentationSpeed={presentationSpeed} reducedMotion={reducedMotion} pawnMovementEnabled={pawnMovementEnabled} pawnMoveMode={pawnMoveMode} pawnStepSoundEnabled={pawnStepSoundEnabled} onMovementComplete={onMovementComplete} onSelectSpace={onSelectSpace} />
    </Canvas>
  )
}

function samePlayers(first: PlayerToken[], second: PlayerToken[]) {
  return first.length === second.length && first.every((player, index) => {
    const other = second[index]
    return Boolean(other && player.id === other.id && player.position === other.position && player.color === other.color && player.seatIndex === other.seatIndex && player.characterType === other.characterType && player.activity === other.activity && player.emote?.sequence === other.emote?.sequence)
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
    && sameBuildings(first.propertyBuildings, second.propertyBuildings)
    && first.worldCupSpaceId === second.worldCupSpaceId
    && sameNumbers(first.highlightedSpaceIds ?? [], second.highlightedSpaceIds ?? [])
    && first.selectionMode === second.selectionMode
    && first.landingPulseSpaceId === second.landingPulseSpaceId
    && first.landingPulseSequence === second.landingPulseSequence
    && first.diceRollSequence === second.diceRollSequence
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
