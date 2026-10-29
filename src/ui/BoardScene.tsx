import { Canvas } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { CanvasTexture, DoubleSide, PerspectiveCamera, Shape, ShapeGeometry, SRGBColorSpace, type Group, type Material, type Mesh, type MeshStandardMaterial } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { boardSpaces, positionOnBoard } from '../game/board'
import { getCameraFraming } from './cameraFraming'
import { getBoardTileTheme } from './boardTileTheme'
import { fitSpaceLabel } from './spaceLabel'
import { getPawnStepPath } from './pawnPath'
import { getPropertyVisualChange } from './gameFeedback'
import { getDiceRollRotation } from './dicePresentation'
import { getRouletteFloorSectors } from './rouletteFloor'
import { BUILDING_ANIMATION_DURATION_MS, DICE_ANIMATION_DURATION_MS, LANDING_PULSE_DURATION_MS, PAWN_STEP_ANIMATION_DURATION_MS, PAWN_TELEPORT_ANIMATION_DURATION_MS, PROPERTY_HOTEL_LEVEL, getAnimationDuration, type AnimationSpeed } from '../../shared/game'

type PropertyBuilding = { spaceId: number; ownerSessionId: string; houses: number; isMortgaged: boolean; ownerColor: string }
type PlayerToken = { id: string; position: number; color: string; seatIndex: number; cash: number; characterType: 'pawn' | 'car' | 'motorcycle' | 'airplane'; activity?: string }

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

function SpaceLabel({ name, size, ink, outline }: { name: string; size: number; ink: string; outline: string }) {
  const { gl } = useThree()
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const context = canvas.getContext('2d')
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = ink
      context.strokeStyle = outline
      context.lineJoin = 'round'
      context.lineWidth = 14
      const fitted = fitSpaceLabel(name, 820, (text, fontSize) => {
        context.font = `700 ${fontSize}px system-ui, sans-serif`
        return context.measureText(text).width
      })
      context.font = `700 ${fitted.fontSize}px system-ui, sans-serif`
      const { lines } = fitted
      const lineSpacing = lines.length > 1 ? 118 : 0
      const firstLineY = lines.length > 2 ? 138 : lines.length > 1 ? 198 : 256
      lines.forEach((line, index) => {
        const y = firstLineY + lineSpacing * index
        context.strokeText(line, 512, y, 900)
        context.fillText(line, 512, y, 900)
      })
    }
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    map.anisotropy = gl.capabilities.getMaxAnisotropy()
    map.needsUpdate = true
    return map
  }, [gl, ink, name, outline])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={[0, 0.085, size * 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size * 0.84, size * 0.66]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

function AnimatedPawn({ player, seatIndex, reducedMotion, movementEnabled, moveMode, presentationSpeed, onMovementComplete }: { player: PlayerToken; seatIndex: number; reducedMotion: boolean; movementEnabled: boolean; moveMode: 'walk' | 'teleport'; presentationSpeed: AnimationSpeed; onMovementComplete: () => void }) {
  const group = useRef<Group>(null)
  const { scene: tokenScene } = useGLTF('/assets/player-tokens.glb')
  const visualSpace = useRef(player.position)
  const hopPath = useRef<number[]>([])
  const hopStart = useRef({ x: 0, z: 0 })
  const elapsed = useRef(0)
  const hopDuration = useRef(getAnimationDuration(PAWN_STEP_ANIMATION_DURATION_MS, presentationSpeed) / 1000)
  const idleTime = useRef(seatIndex * 0.8)
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
    clone.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const recolor = (material: Material): Material => {
        const instance = material.clone()
        if (instance.name.startsWith('OWNER_TINT') && 'color' in instance) (instance as MeshStandardMaterial).color.set(player.color)
        return instance
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(recolor) : recolor(mesh.material)
    })
    return clone
  }, [player.characterType, player.color, tokenScene])

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
    hopDuration.current = getAnimationDuration(moveMode === 'teleport' ? PAWN_TELEPORT_ANIMATION_DURATION_MS : PAWN_STEP_ANIMATION_DURATION_MS, presentationSpeed) / 1000
    elapsed.current = 0
  }, [player.position, initial.x, initial.z, offsetX, offsetZ, presentationSpeed, reducedMotion, movementEnabled, moveMode])

  useFrame((_, delta) => {
    const pawn = group.current
    if (!pawn) return
    if (reducedMotion) return
    idleTime.current += delta
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
    pawn.position.y = baseY + (Math.sin(idleTime.current * 3.8) + 1) * 0.025
    if (player.characterType === 'pawn') pawn.rotation.y = Math.sin(idleTime.current * 1.2) * 0.08
  })

  return (
    <group ref={group} position={[initial.x + offsetX, baseY, initial.z + offsetZ]} rotation={[0, player.position <= 10 ? Math.PI / 2 : player.position <= 20 ? Math.PI : player.position <= 30 ? -Math.PI / 2 : 0, 0]}>
      {player.characterType === 'pawn' ? <>
        <mesh castShadow position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.16, 0.23, 0.25, 7]} />
          <meshStandardMaterial color={player.color} roughness={0.42} />
        </mesh>
        <mesh castShadow position={[0, 0.39, 0]}>
          <sphereGeometry args={[0.16, 14, 12]} />
          <meshStandardMaterial color={player.color} roughness={0.35} />
        </mesh>
      </> : model && <primitive object={model} scale={0.48} />}
      {player.activity && <Html position={[0, player.characterType === 'pawn' ? 0.86 : 0.66, 0]} center distanceFactor={12} zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}><div className="turn-activity-bubble" role="status" aria-live="polite">{player.activity}</div></Html>}
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
      {sectors.map((geometry, index) => <mesh key={index} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}><meshBasicMaterial color={rouletteColors[index % rouletteColors.length]} side={DoubleSide} /></mesh>)}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[size * 0.095, 16]} /><meshStandardMaterial color={trim} roughness={0.38} /></mesh>
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[size * 0.043, 12]} /><meshStandardMaterial color="#fff3cf" roughness={0.38} /></mesh>
    </group>
  )
}

function AnimatedDie({ position, rotation, sequence, value, reducedMotion, visible, presentationSpeed }: { position: [number, number, number]; rotation: [number, number, number]; sequence: number; value: number; reducedMotion: boolean; visible: boolean; presentationSpeed: AnimationSpeed }) {
  const group = useRef<Group>(null)
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
    elapsed.current = Math.min(duration, elapsed.current + delta)
    const progress = elapsed.current / duration
    die.rotation.set(...getDiceRollRotation(startRotation.current as [number, number, number], progress))
    die.position.y = position[1] + Math.sin(progress * Math.PI) * 0.48
    if (progress >= 1) {
      die.rotation.set(0, 0, 0)
      die.position.y = position[1]
    }
  })

  return (
    <group ref={group} position={position} rotation={rotation} visible={visible}>
      <mesh castShadow><boxGeometry args={[0.45, 0.42, 0.45]} /><meshStandardMaterial color="#fffaf0" roughness={0.22} /></mesh>
      {(dicePips[value] ?? dicePips[1]!).map(([x, z], index) => <mesh key={index} position={[x, 0.212, z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.035, 10]} /><meshBasicMaterial color="#c76550" /></mesh>)}
    </group>
  )
}

function AnimatedBuilding({ spaceId, houses, ownerColor, ownerSessionId, reducedMotion, presentationSpeed }: { spaceId: number; houses: number; ownerColor: string; ownerSessionId: string; reducedMotion: boolean; presentationSpeed: AnimationSpeed }) {
  const group = useRef<Group>(null)
  const elapsed = useRef(0)
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
      building.rotation.set(0, 0, 0)
      if (transition.current !== 'ownership') setDisplayHouses(houses)
      setDisplayColor(ownerColor)
      transition.current = null
    }
  })

  const { x, z } = positionOnBoard(spaceId)
  const rotation = spaceId <= 10 || spaceId >= 30 ? 0 : Math.PI / 2
  const variantName = displayHouses === 0 ? 'Board_Land' : displayHouses === PROPERTY_HOTEL_LEVEL ? 'Board_Hotel' : `Board_House_${displayHouses}`
  const model = useMemo(() => {
    if (!ownerSessionId) return null
    const source = scene.getObjectByName(variantName)
    if (!source) return null
    const clone = source.clone(true)
    clone.position.set(0, 0, 0)
    clone.rotation.set(0, 0, 0)
    clone.scale.set(1, 1, 1)
    clone.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const recolor = (material: Material): Material => {
        const instance = material.clone()
        if (instance.name.startsWith('OWNER_TINT') && 'color' in instance) (instance as MeshStandardMaterial).color.set(displayColor)
        return instance
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(recolor) : recolor(mesh.material)
    })
    return clone
  }, [displayColor, ownerSessionId, scene, variantName])
  return (
    <group ref={group} position={[x, 0.038, z + 0.22]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.128, 0]} receiveShadow><boxGeometry args={[0.96, 0.016, 0.72]} /><meshStandardMaterial color={displayColor} roughness={0.76} /></mesh>
      {model && <primitive object={model} scale={1.16} />}
    </group>
  )
}

function AnimatedMortgageBadge({ position, mortgaged, reducedMotion, presentationSpeed }: { position: [number, number, number]; mortgaged: boolean; reducedMotion: boolean; presentationSpeed: AnimationSpeed }) {
  const group = useRef<Group>(null)
  const elapsed = useRef(0)
  const previous = useRef(mortgaged)
  const active = useRef(false)
  useEffect(() => {
    if (previous.current !== mortgaged) {
      elapsed.current = 0
      active.current = !reducedMotion
      if (group.current && !reducedMotion && mortgaged) group.current.scale.setScalar(0.2)
      previous.current = mortgaged
    }
    if (reducedMotion) {
      group.current?.scale.setScalar(mortgaged ? 1 : 0)
      active.current = false
    }
  }, [mortgaged, reducedMotion])
  useFrame((_, delta) => {
    if (!group.current || reducedMotion || !active.current) return
    const duration = getAnimationDuration(300, presentationSpeed) / 1000
    elapsed.current = Math.min(duration, elapsed.current + delta)
    const progress = elapsed.current / duration
    group.current.scale.setScalar(mortgaged ? 0.2 + 0.8 * progress : 1 - progress)
    group.current.position.y = position[1] + (mortgaged ? 0.08 : -0.08) * Math.sin(progress * Math.PI)
    if (progress >= 1) {
      group.current.scale.setScalar(mortgaged ? 1 : 0)
      group.current.position.y = position[1]
      active.current = false
    }
  })
  return <group ref={group} position={position} scale={mortgaged ? 1 : 0}><mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.11, 8]} /><meshStandardMaterial color="#71858a" roughness={0.48} /></mesh></group>
}

function Board({ players, propertyBuildings, highlightedSpaceIds, selectionMode, landingPulseSpaceId, landingPulseSequence, diceRollSequence, dice, diceVisible, diceResultVisible, presentationSpeed, reducedMotion, pawnMovementEnabled, pawnMoveMode, onMovementComplete, onSelectSpace }: { players: PlayerToken[]; propertyBuildings: PropertyBuilding[]; highlightedSpaceIds: readonly number[]; selectionMode: boolean; landingPulseSpaceId: number; landingPulseSequence: number; dice: [number, number]; diceVisible: boolean; diceResultVisible: boolean; diceRollSequence: number; presentationSpeed: AnimationSpeed; reducedMotion: boolean; pawnMovementEnabled: boolean; pawnMoveMode: 'walk' | 'teleport'; onMovementComplete: () => void; onSelectSpace: (spaceId: number) => void }) {
  return (
    <group>
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[12.1, 0.34, 12.1]} />
        <meshStandardMaterial color="#a9794f" roughness={0.82} />
      </mesh>
      <mesh position={[0, -0.055, 0]} receiveShadow>
        <boxGeometry args={[11.85, 0.1, 11.85]} />
        <meshStandardMaterial color="#f1e8d6" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[9.8, 0.04, 9.8]} />
        <meshStandardMaterial color="#829e6d" roughness={1} />
      </mesh>
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <cylinderGeometry args={[1.42, 1.42, 0.045, 48]} />
        <meshStandardMaterial color="#b2c980" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.072, 0]} receiveShadow>
        <cylinderGeometry args={[1.22, 1.22, 0.025, 48]} />
        <meshStandardMaterial color="#76965f" roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.087, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.26, 1.34, 48]} />
        <meshBasicMaterial color="#b79b58" transparent opacity={0.8} />
      </mesh>
      {[[-0.82, -0.76], [0.82, -0.76], [-0.82, 0.76], [0.82, 0.76]].map(([x, z], index) => (
        <group key={`park-tree-${index}`} position={[x, 0.1, z]}>
          <mesh castShadow position={[0, 0.1, 0]}><cylinderGeometry args={[0.045, 0.06, 0.2, 6]} /><meshStandardMaterial color="#9b7751" roughness={0.84} /></mesh>
          <mesh castShadow position={[0, 0.26, 0]}><coneGeometry args={[0.18, 0.28, 7]} /><meshStandardMaterial color="#66885f" roughness={0.76} /></mesh>
        </group>
      ))}
      {boardSpaces.map((space) => {
        const { x, z } = positionOnBoard(space.id)
        const corner = space.id % 10 === 0
        const size = corner ? 1.14 : 0.98
        const rotation = space.id <= 10 || space.id >= 30 ? 0 : Math.PI / 2
        const property = propertyBuildings.find((building) => building.spaceId === space.id)
        const theme = getBoardTileTheme(space, corner)
        const selectable = highlightedSpaceIds.includes(space.id)
        return (
          <group key={space.id} position={[x, 0.08, z]} rotation={[0, rotation, 0]} onClick={(event) => { event.stopPropagation(); if (!selectionMode || selectable) onSelectSpace(space.id) }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = selectionMode && !selectable ? 'not-allowed' : 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[size, 0.16, size]} />
              <meshStandardMaterial color={theme.floor} roughness={0.78} />
            </mesh>
            {[-1, 1].flatMap((side) => [
              <mesh key={`trim-x-${side}`} position={[side * size * 0.455, 0.095, 0]}>
                <boxGeometry args={[0.035, 0.018, size * 0.91]} />
                <meshStandardMaterial color={theme.trim} roughness={0.65} />
              </mesh>,
              <mesh key={`trim-z-${side}`} position={[0, 0.095, side * size * 0.455]}>
                <boxGeometry args={[size * 0.91, 0.018, 0.035]} />
                <meshStandardMaterial color={theme.trim} roughness={0.65} />
              </mesh>,
            ])}
            {space.kind === 'tax' && <mesh position={[size * 0.31, 0.112, size * 0.3]}><cylinderGeometry args={[0.075, 0.075, 0.025, 8]} /><meshStandardMaterial color={theme.trim} roughness={0.48} /></mesh>}
            {space.kind === 'event' && <ChanceRoulette size={size} trim={theme.trim} />}
            {space.kind === 'prison' && <group position={[size * 0.3, 0.11, size * 0.3]}><mesh position={[0, 0, 0]}><boxGeometry args={[0.25, 0.025, 0.22]} /><meshStandardMaterial color="#536c7d" roughness={0.7} /></mesh>{[-1, 0, 1].map((offset) => <mesh key={offset} castShadow position={[offset * 0.085, 0.12, 0.105]}><boxGeometry args={[0.025, 0.22, 0.025]} /><meshStandardMaterial color={theme.trim} metalness={0.25} roughness={0.48} /></mesh>)}{[-1, 1].map((offset) => <mesh key={`bar-${offset}`} position={[0, offset * 0.07, 0.105]}><boxGeometry args={[0.2, 0.025, 0.025]} /><meshStandardMaterial color={theme.trim} metalness={0.25} roughness={0.48} /></mesh>)}</group>}
            {space.kind === 'world-cup' && <Suspense fallback={null}><CornerLandmark type="stadium" position={[0, 0.15, 0]} /></Suspense>}
            {space.kind === 'world-tour' && <Suspense fallback={null}><CornerLandmark type="airport" position={[0, 0.15, 0]} /></Suspense>}
            {space.kind === 'rest' && <mesh position={[size * 0.31, 0.11, size * 0.3]}><cylinderGeometry args={[0.07, 0.09, 0.035, 6]} /><meshStandardMaterial color={theme.trim} roughness={0.62} /></mesh>}
            {space.kind === 'start' && <mesh position={[size * 0.31, 0.13, size * 0.3]} rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[0.14, 0.045, 0.14]} /><meshStandardMaterial color={theme.trim} roughness={0.52} /></mesh>}
            <SpaceLabel name={space.name} size={size} ink={theme.ink} outline={theme.outline} />
            {highlightedSpaceIds.includes(space.id) && (
              <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[size * 0.38, size * 0.47, 40]} />
                <meshBasicMaterial color="#e5af3f" transparent opacity={0.96} toneMapped={false} />
              </mesh>
            )}
            {selectionMode && !selectable && <mesh position={[0, 0.205, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[size * 0.98, size * 0.98]} /><meshBasicMaterial color="#1a241d" transparent opacity={0.68} depthWrite={false} /></mesh>}
            {landingPulseSpaceId === space.id && <LandingPulse sequence={landingPulseSequence} reducedMotion={reducedMotion} size={size} presentationSpeed={presentationSpeed} />}
            {corner && space.kind !== 'world-cup' && space.kind !== 'world-tour' && (
              <mesh position={[0, 0.19, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.32, 0.08, 0.32]} />
                <meshStandardMaterial color="#d5a956" roughness={0.48} />
              </mesh>
            )}
            {property && <AnimatedMortgageBadge position={[size * 0.3, 0.12, size * 0.2]} mortgaged={property.isMortgaged} reducedMotion={reducedMotion} presentationSpeed={presentationSpeed} />}
          </group>
        )
      })}
      <Suspense fallback={null}>
        {propertyBuildings.filter(({ ownerSessionId }) => Boolean(ownerSessionId)).map(({ spaceId, houses, ownerColor, ownerSessionId }) => <AnimatedBuilding key={`buildings-${spaceId}`} spaceId={spaceId} houses={houses} ownerColor={ownerColor} ownerSessionId={ownerSessionId} reducedMotion={reducedMotion} presentationSpeed={presentationSpeed} />)}
      </Suspense>
      {players.map((player) => <AnimatedPawn key={player.id} player={player} seatIndex={player.seatIndex} reducedMotion={reducedMotion} movementEnabled={pawnMovementEnabled} moveMode={pawnMoveMode} presentationSpeed={presentationSpeed} onMovementComplete={onMovementComplete} />)}
      {diceVisible && <>
        <AnimatedDie position={[-0.34, 0.23, -0.23]} rotation={[0.12, 0.25, 0.25]} sequence={diceRollSequence} value={dice[0] || 1} reducedMotion={reducedMotion} visible={diceVisible} presentationSpeed={presentationSpeed} />
        <AnimatedDie position={[0.38, 0.23, 0.2]} rotation={[-0.18, 0.3, -0.2]} sequence={diceRollSequence} value={dice[1] || 1} reducedMotion={reducedMotion} visible={diceVisible} presentationSpeed={presentationSpeed} />
        {diceResultVisible && <Html position={[0.02, 1.05, -0.02]} center distanceFactor={9} zIndexRange={[6, 6]}><div className="dice-result-badge" role="status" aria-live="polite"><small>TOTAL</small><strong>{dice[0] + dice[1]}</strong></div></Html>}
      </>}
    </group>
  )
}

function LandingPulse({ sequence, reducedMotion, size, presentationSpeed }: { sequence: number; reducedMotion: boolean; size: number; presentationSpeed: AnimationSpeed }) {
  const ring = useRef<Group>(null)
  const elapsed = useRef(0)
  useEffect(() => { elapsed.current = 0 }, [sequence])
  useFrame((_, delta) => {
    const duration = getAnimationDuration(LANDING_PULSE_DURATION_MS, presentationSpeed) / 1000
    if (!ring.current || reducedMotion || elapsed.current >= duration) return
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

function CornerLandmark({ type, position }: { type: 'stadium' | 'airport'; position: [number, number, number] }) {
  const path = type === 'stadium' ? '/assets/world-cup-stadium.glb' : '/assets/world-tour-airport.glb'
  const { scene } = useGLTF(path)
  const model = useMemo(() => scene.clone(), [scene])
  return <primitive object={model} position={position} scale={type === 'stadium' ? 0.64 : 0.48} />
}

export default function BoardScene({ players, propertyBuildings, highlightedSpaceIds = [], selectionMode = false, landingPulseSpaceId = -1, landingPulseSequence = 0, diceRollSequence = 0, dice = [0, 0], diceVisible = false, diceResultVisible = false, presentationSpeed = 0.5, reducedMotion = false, pawnMovementEnabled = false, pawnMoveMode = 'walk', cameraEnabled = true, onMovementComplete, onSelectSpace }: { players: PlayerToken[]; propertyBuildings: PropertyBuilding[]; highlightedSpaceIds?: readonly number[]; selectionMode?: boolean; landingPulseSpaceId?: number; landingPulseSequence?: number; diceRollSequence?: number; dice?: [number, number]; diceVisible?: boolean; diceResultVisible?: boolean; presentationSpeed?: AnimationSpeed; reducedMotion?: boolean; pawnMovementEnabled?: boolean; pawnMoveMode?: 'walk' | 'teleport'; cameraEnabled?: boolean; onMovementComplete: () => void; onSelectSpace: (spaceId: number) => void }) {
  return (
    <Canvas camera={{ position: [12.5, 15.5, 15.5], fov: 34 }} shadows dpr={[1, 1.6]}>
      <color attach="background" args={['#9bbcc1']} />
      <ambientLight intensity={0.86} />
      <directionalLight position={[7, 13, 5]} intensity={1.55} castShadow shadow-mapSize={[1024, 1024]} />
      <ResponsiveCamera tilt={16} horizontal={45} />
      <OrbitControls makeDefault enabled={cameraEnabled} enablePan={false} enableZoom={false} enableRotate minPolarAngle={Math.PI / 12} maxPolarAngle={Math.PI / 2} rotateSpeed={0.72} enableDamping dampingFactor={0.1} />
      <Board players={players} propertyBuildings={propertyBuildings} highlightedSpaceIds={highlightedSpaceIds} selectionMode={selectionMode} landingPulseSpaceId={landingPulseSpaceId} landingPulseSequence={landingPulseSequence} diceRollSequence={diceRollSequence} dice={dice} diceVisible={diceVisible} diceResultVisible={diceResultVisible} presentationSpeed={presentationSpeed} reducedMotion={reducedMotion} pawnMovementEnabled={pawnMovementEnabled} pawnMoveMode={pawnMoveMode} onMovementComplete={onMovementComplete} onSelectSpace={onSelectSpace} />
      <ContactShadows position={[0, -0.46, 0]} opacity={0.25} scale={18} blur={2.5} far={5} />
    </Canvas>
  )
}
