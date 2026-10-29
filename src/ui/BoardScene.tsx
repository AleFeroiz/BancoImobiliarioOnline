import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasTexture, Fog, PerspectiveCamera, SRGBColorSpace, type Group } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { boardSpaces, positionOnBoard } from '../game/board'
import { getCameraFraming } from './cameraFraming'
import { fitSpaceLabel } from './spaceLabel'
import { getPawnStepPath } from './pawnPath'
import { getPropertyVisualChange } from './gameFeedback'

type PropertyBuilding = { spaceId: number; ownerSessionId: string; houses: number; isMortgaged: boolean; ownerColor: string }
type PlayerToken = { id: string; position: number; color: string; seatIndex: number }

function ResponsiveCamera() {
  const { camera, scene, size } = useThree()
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return
    const framing = getCameraFraming(size.width, size.height)
    camera.position.set(...framing.position)
    camera.lookAt(0, 0, 0)
    camera.fov = framing.fov
    camera.updateProjectionMatrix()
    if (scene.fog instanceof Fog) {
      scene.fog.near = 21 * framing.fogScale
      scene.fog.far = 38 * framing.fogScale
    }
  }, [camera, scene, size.width, size.height])
  return null
}

function SpaceLabel({ name, size }: { name: string; size: number }) {
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
      context.fillStyle = '#2f4536'
      context.strokeStyle = '#fffaf1'
      context.lineJoin = 'round'
      context.lineWidth = 24
      const fitted = fitSpaceLabel(name, 900, (text, fontSize) => {
        context.font = `700 ${fontSize}px system-ui, sans-serif`
        return context.measureText(text).width
      })
      context.font = `700 ${fitted.fontSize}px system-ui, sans-serif`
      const { lines } = fitted
      const lineSpacing = lines.length > 1 ? 142 : 0
      const firstLineY = lines.length > 2 ? 112 : lines.length > 1 ? 185 : 256
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
  }, [gl, name])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={[0, 0.085, size * 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size * 0.96, size * 0.86]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

function AnimatedPawn({ player, seatIndex, reducedMotion, movementEnabled, onMovementComplete }: { player: PlayerToken; seatIndex: number; reducedMotion: boolean; movementEnabled: boolean; onMovementComplete: () => void }) {
  const group = useRef<Group>(null)
  const previousSpace = useRef(player.position)
  const hopPath = useRef<number[]>([])
  const hopStart = useRef({ x: 0, z: 0 })
  const elapsed = useRef(0)
  const idleTime = useRef(seatIndex * 0.8)
  const onMovementCompleteRef = useRef(onMovementComplete)
  onMovementCompleteRef.current = onMovementComplete
  const offsetX = 0.13 * (seatIndex - 1.5)
  const offsetZ = 0.06
  const initial = positionOnBoard(player.position)

  useEffect(() => {
    if (player.position === previousSpace.current) return
    if (!movementEnabled && !reducedMotion) return
    const path = getPawnStepPath(previousSpace.current, player.position)
    if (!path.length) return
    if (reducedMotion) {
      const destination = positionOnBoard(player.position)
      group.current?.position.set(destination.x + offsetX, 0.35, destination.z + offsetZ)
      previousSpace.current = player.position
      hopPath.current = []
      onMovementCompleteRef.current()
      return
    }
    hopStart.current = group.current ? { x: group.current.position.x, z: group.current.position.z } : { x: initial.x + offsetX, z: initial.z + offsetZ }
    hopPath.current = path
    elapsed.current = 0
    previousSpace.current = player.position
  }, [player.position, initial.x, initial.z, offsetX, offsetZ, reducedMotion, movementEnabled])

  useFrame((_, delta) => {
    const pawn = group.current
    if (!pawn) return
    if (reducedMotion) return
    idleTime.current += delta
    const path = hopPath.current
    if (path.length) {
      const hopDuration = 0.14
      elapsed.current += delta
      const hopIndex = Math.floor(elapsed.current / hopDuration)
      if (hopIndex >= path.length) {
        const destination = positionOnBoard(path[path.length - 1] ?? player.position)
        pawn.position.set(destination.x + offsetX, 0.35, destination.z + offsetZ)
        pawn.rotation.z = 0
        hopPath.current = []
        onMovementCompleteRef.current()
        return
      }
      const progress = Math.min((elapsed.current - hopIndex * hopDuration) / hopDuration, 1)
      const from = hopIndex === 0 ? hopStart.current : positionOnBoard(path[hopIndex - 1] ?? player.position)
      const to = positionOnBoard(path[hopIndex] ?? player.position)
      const fromX = hopIndex === 0 ? from.x : from.x + offsetX
      const fromZ = hopIndex === 0 ? from.z : from.z + offsetZ
      pawn.position.set(fromX + (to.x + offsetX - fromX) * progress, 0.35 + Math.sin(progress * Math.PI) * 0.24, fromZ + (to.z + offsetZ - fromZ) * progress)
      pawn.rotation.z = Math.sin(progress * Math.PI) * 0.14
      return
    }
    pawn.position.y = 0.35 + (Math.sin(idleTime.current * 3.8) + 1) * 0.025
    pawn.rotation.y = Math.sin(idleTime.current * 1.2) * 0.08
  })

  return (
    <group ref={group} position={[initial.x + offsetX, 0.35, initial.z + offsetZ]}>
      <mesh castShadow position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.16, 0.23, 0.25, 7]} />
        <meshStandardMaterial color={player.color} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0, 0.39, 0]}>
        <sphereGeometry args={[0.16, 14, 12]} />
        <meshStandardMaterial color={player.color} roughness={0.35} />
      </mesh>
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

function AnimatedDie({ position, rotation, sequence, value, reducedMotion }: { position: [number, number, number]; rotation: [number, number, number]; sequence: number; value: number; reducedMotion: boolean }) {
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
    if (!die || sequence === 0 || reducedMotion || elapsed.current >= 0.72) return
    elapsed.current = Math.min(0.72, elapsed.current + delta)
    const progress = elapsed.current / 0.72
    const ease = 1 - (1 - progress) ** 3
    die.rotation.set(
      startRotation.current[0] + (rotation[0] + Math.PI * 4) * ease,
      startRotation.current[1] + (rotation[1] + Math.PI * 4) * ease,
      startRotation.current[2] + rotation[2] * ease,
    )
    die.position.y = position[1] + Math.sin(progress * Math.PI) * 0.48
  })

  return (
    <group ref={group} position={position} rotation={rotation}>
      <mesh castShadow><boxGeometry args={[0.45, 0.42, 0.45]} /><meshStandardMaterial color="#fffaf0" roughness={0.22} /></mesh>
      {(dicePips[value] ?? dicePips[1]!).map(([x, z], index) => <mesh key={index} position={[x, 0.212, z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.035, 10]} /><meshBasicMaterial color="#c76550" /></mesh>)}
    </group>
  )
}

function AnimatedBuilding({ spaceId, houses, ownerColor, ownerSessionId, reducedMotion }: { spaceId: number; houses: number; ownerColor: string; ownerSessionId: string; reducedMotion: boolean }) {
  const group = useRef<Group>(null)
  const elapsed = useRef(0)
  const [displayHouses, setDisplayHouses] = useState(0)
  const [displayColor, setDisplayColor] = useState(ownerColor)
  const previous = useRef({ ownerSessionId, houses: 0 })
  const transition = useRef<'build' | 'demolish' | 'ownership' | null>(houses > 0 ? 'build' : null)

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
    const progress = Math.min(elapsed.current / (transition.current === 'demolish' ? 0.46 : 0.42), 1)
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
  return <group ref={group} position={[x, 0.19, z]} rotation={[0, rotation, 0]}>{displayHouses > 0 && ownerSessionId ? (
    displayHouses === 5 ? (
      <group position={[0, 0.08, 0.23]}>
        <mesh castShadow><boxGeometry args={[0.3, 0.18, 0.22]} /><meshStandardMaterial color={displayColor} roughness={0.48} /></mesh>
        <mesh castShadow position={[0, 0.14, 0]}><coneGeometry args={[0.22, 0.16, 4]} /><meshStandardMaterial color={displayColor} roughness={0.56} /></mesh>
      </group>
    ) : Array.from({ length: displayHouses }, (_, index) => (
      <group key={index} position={[(index - 1.5) * 0.17, 0.07, 0.25]}>
        <mesh castShadow><boxGeometry args={[0.11, 0.11, 0.11]} /><meshStandardMaterial color="#f6ead0" roughness={0.72} /></mesh>
        <mesh castShadow position={[0, 0.09, 0]}><coneGeometry args={[0.095, 0.09, 4]} /><meshStandardMaterial color={displayColor} roughness={0.55} /></mesh>
      </group>
    ))
  ) : null}</group>
}

function AnimatedOwnerMarker({ position, ownerSessionId, ownerColor, visible, reducedMotion }: { position: [number, number, number]; ownerSessionId: string; ownerColor: string; visible: boolean; reducedMotion: boolean }) {
  const group = useRef<Group>(null)
  const elapsed = useRef(0)
  const [displayColor, setDisplayColor] = useState(ownerColor)
  const previousOwner = useRef(ownerSessionId)
  const previousVisible = useRef(visible)
  const animation = useRef<'place' | 'transfer' | 'release' | null>('place')
  useEffect(() => {
    if (ownerSessionId !== previousOwner.current) {
      animation.current = ownerSessionId ? 'transfer' : 'release'
      elapsed.current = 0
    } else if (visible !== previousVisible.current) {
      animation.current = visible ? 'place' : 'release'
      elapsed.current = 0
    } else if (animation.current === 'place' && group.current && visible && !reducedMotion) {
      group.current.scale.setScalar(0.45)
    }
    if (reducedMotion) {
      setDisplayColor(ownerColor)
      animation.current = null
      group.current?.scale.setScalar(visible ? 1 : 0)
      if (group.current) group.current.position.y = position[1]
    }
    previousOwner.current = ownerSessionId
    previousVisible.current = visible
  }, [ownerSessionId, ownerColor, position[0], position[1], position[2], reducedMotion, visible])
  useFrame((_, delta) => {
    const marker = group.current
    if (!marker || reducedMotion || !animation.current) return
    elapsed.current += delta
    const progress = Math.min(elapsed.current / 0.48, 1)
    if (animation.current === 'release') marker.scale.setScalar(1 - progress)
    else {
      marker.scale.setScalar(animation.current === 'place' ? 0.45 + progress * 0.55 : 1)
      marker.position.y = position[1] + Math.sin(progress * Math.PI) * (animation.current === 'place' ? 0.12 : 0.28)
      marker.rotation.y = Math.sin(progress * Math.PI) * 0.16
      if (animation.current === 'transfer' && progress >= 0.78) setDisplayColor(ownerColor)
    }
    if (progress >= 1) {
      marker.scale.setScalar(visible ? 1 : 0)
      marker.position.y = position[1]
      marker.rotation.y = 0
      setDisplayColor(ownerColor)
      animation.current = null
    }
  })
  return <group ref={group} position={position} scale={visible ? 1 : 0}><mesh castShadow><cylinderGeometry args={[0.075, 0.075, 0.12, 8]} /><meshStandardMaterial color={displayColor} roughness={0.42} /></mesh></group>
}

function AnimatedMortgageBadge({ position, mortgaged, reducedMotion }: { position: [number, number, number]; mortgaged: boolean; reducedMotion: boolean }) {
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
    elapsed.current = Math.min(0.3, elapsed.current + delta)
    const progress = elapsed.current / 0.3
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

function Board({ players, propertyBuildings, highlightedSpaceIds, landingPulseSpaceId, landingPulseSequence, diceRollSequence, dice, reducedMotion, pawnMovementEnabled, onMovementComplete, onSelectSpace }: { players: PlayerToken[]; propertyBuildings: PropertyBuilding[]; highlightedSpaceIds: readonly number[]; landingPulseSpaceId: number; landingPulseSequence: number; diceRollSequence: number; dice: [number, number]; reducedMotion: boolean; pawnMovementEnabled: boolean; onMovementComplete: () => void; onSelectSpace: (spaceId: number) => void }) {
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
        return (
          <group key={space.id} position={[x, 0.08, z]} rotation={[0, rotation, 0]} onClick={(event) => { event.stopPropagation(); onSelectSpace(space.id) }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[size, 0.16, size]} />
              <meshStandardMaterial color={corner ? '#f6e8c8' : '#fffaf1'} roughness={0.78} />
            </mesh>
            <mesh position={[0, 0.09, -size * 0.39]}>
              <boxGeometry args={[size * 0.82, 0.045, size * 0.19]} />
              <meshStandardMaterial color={space.color} roughness={0.7} />
            </mesh>
            <SpaceLabel name={space.name} size={size} />
            {highlightedSpaceIds.includes(space.id) && (
              <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[size * 0.38, size * 0.47, 40]} />
                <meshBasicMaterial color="#e5af3f" transparent opacity={0.96} toneMapped={false} />
              </mesh>
            )}
            {landingPulseSpaceId === space.id && <LandingPulse sequence={landingPulseSequence} reducedMotion={reducedMotion} size={size} />}
            {corner && (
              <mesh position={[0, 0.19, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.32, 0.08, 0.32]} />
                <meshStandardMaterial color="#d5a956" roughness={0.48} />
              </mesh>
            )}
            {property && <AnimatedMortgageBadge position={[size * 0.3, 0.12, size * 0.2]} mortgaged={property.isMortgaged} reducedMotion={reducedMotion} />}
            {property && <AnimatedOwnerMarker position={[size * 0.31, 0.16, size * 0.22]} ownerSessionId={property.ownerSessionId} ownerColor={property.ownerColor} visible={Boolean(property.ownerSessionId) && property.houses === 0} reducedMotion={reducedMotion} />}
          </group>
        )
      })}
      {propertyBuildings.map(({ spaceId, houses, ownerColor, ownerSessionId }) => <AnimatedBuilding key={`buildings-${spaceId}`} spaceId={spaceId} houses={houses} ownerColor={ownerColor} ownerSessionId={ownerSessionId} reducedMotion={reducedMotion} />)}
      {players.map((player) => <AnimatedPawn key={player.id} player={player} seatIndex={player.seatIndex} reducedMotion={reducedMotion} movementEnabled={pawnMovementEnabled} onMovementComplete={onMovementComplete} />)}
      <AnimatedDie position={[-0.34, 0.23, -0.23]} rotation={[0.12, 0.25, 0.25]} sequence={diceRollSequence} value={dice[0] || 1} reducedMotion={reducedMotion} />
      <AnimatedDie position={[0.38, 0.23, 0.2]} rotation={[-0.18, 0.3, -0.2]} sequence={diceRollSequence} value={dice[1] || 1} reducedMotion={reducedMotion} />
    </group>
  )
}

function LandingPulse({ sequence, reducedMotion, size }: { sequence: number; reducedMotion: boolean; size: number }) {
  const ring = useRef<Group>(null)
  const elapsed = useRef(0)
  useEffect(() => { elapsed.current = 0 }, [sequence])
  useFrame((_, delta) => {
    if (!ring.current || reducedMotion || elapsed.current >= 0.9) return
    elapsed.current = Math.min(0.9, elapsed.current + delta)
    const progress = elapsed.current / 0.9
    const scale = 0.72 + progress * 0.5
    ring.current.scale.setScalar(scale)
    ring.current.children.forEach((child) => {
      const material = (child as { material?: { opacity: number } }).material
      if (material) material.opacity = 0.8 * (1 - progress)
    })
  })
  return <group ref={ring} position={[0, 0.11, 0]}>{reducedMotion ? null : <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[size * 0.38, size * 0.45, 40]} /><meshBasicMaterial color="#e5af3f" transparent opacity={0.8} toneMapped={false} /></mesh>}</group>
}

export default function BoardScene({ players, propertyBuildings, highlightedSpaceIds = [], landingPulseSpaceId = -1, landingPulseSequence = 0, diceRollSequence = 0, dice = [0, 0], reducedMotion = false, pawnMovementEnabled = true, onMovementComplete, onSelectSpace }: { players: PlayerToken[]; propertyBuildings: PropertyBuilding[]; highlightedSpaceIds?: readonly number[]; landingPulseSpaceId?: number; landingPulseSequence?: number; diceRollSequence?: number; dice?: [number, number]; reducedMotion?: boolean; pawnMovementEnabled?: boolean; onMovementComplete: () => void; onSelectSpace: (spaceId: number) => void }) {
  return (
    <Canvas camera={{ position: [12.5, 15.5, 15.5], fov: 34 }} shadows dpr={[1, 1.6]}>
      <color attach="background" args={['#9bbcc1']} />
      <fog attach="fog" args={['#9bbcc1', 21, 38]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[7, 13, 5]} intensity={1.55} castShadow shadow-mapSize={[1024, 1024]} />
      <ResponsiveCamera />
      <Board players={players} propertyBuildings={propertyBuildings} highlightedSpaceIds={highlightedSpaceIds} landingPulseSpaceId={landingPulseSpaceId} landingPulseSequence={landingPulseSequence} diceRollSequence={diceRollSequence} dice={dice} reducedMotion={reducedMotion} pawnMovementEnabled={pawnMovementEnabled} onMovementComplete={onMovementComplete} onSelectSpace={onSelectSpace} />
      <ContactShadows position={[0, -0.46, 0]} opacity={0.25} scale={18} blur={2.5} far={5} />
    </Canvas>
  )
}
