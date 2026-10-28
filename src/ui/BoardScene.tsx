import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { CanvasTexture, Fog, PerspectiveCamera, SRGBColorSpace, type Group } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { boardSpaces, positionOnBoard } from '../game/board'
import { getCameraFraming } from './cameraFraming'
import { fitSpaceLabel } from './spaceLabel'
import { getPawnStepPath } from './pawnPath'

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

function AnimatedPawn({ player, seatIndex, reducedMotion }: { player: PlayerToken; seatIndex: number; reducedMotion: boolean }) {
  const group = useRef<Group>(null)
  const previousSpace = useRef(player.position)
  const hopPath = useRef<number[]>([])
  const hopStart = useRef({ x: 0, z: 0 })
  const elapsed = useRef(0)
  const idleTime = useRef(seatIndex * 0.8)
  const offsetX = 0.13 * (seatIndex - 1.5)
  const offsetZ = 0.06
  const initial = positionOnBoard(player.position)

  useEffect(() => {
    if (player.position === previousSpace.current) return
    const path = getPawnStepPath(previousSpace.current, player.position)
    if (!path.length) return
    if (reducedMotion) {
      const destination = positionOnBoard(player.position)
      group.current?.position.set(destination.x + offsetX, 0.35, destination.z + offsetZ)
      previousSpace.current = player.position
      hopPath.current = []
      return
    }
    hopStart.current = group.current ? { x: group.current.position.x, z: group.current.position.z } : { x: initial.x + offsetX, z: initial.z + offsetZ }
    hopPath.current = path
    elapsed.current = 0
    previousSpace.current = player.position
  }, [player.position, initial.x, initial.z, offsetX, offsetZ, reducedMotion])

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

function AnimatedBuilding({ children, houses, reducedMotion }: { children: ReactNode; houses: number; reducedMotion: boolean }) {
  const group = useRef<Group>(null)
  const elapsed = useRef(0)
  const previousHouses = useRef(houses)

  useEffect(() => {
    const building = group.current
    if (!building || houses <= previousHouses.current || reducedMotion) {
      previousHouses.current = houses
      return
    }
    building.scale.setScalar(0.72)
    elapsed.current = 0
    previousHouses.current = houses
  }, [houses, reducedMotion])

  useFrame((_, delta) => {
    const building = group.current
    if (!building || reducedMotion || elapsed.current >= 0.22) return
    elapsed.current = Math.min(0.22, elapsed.current + delta)
    const progress = elapsed.current / 0.22
    building.scale.setScalar(0.72 + 0.28 * (1 - (1 - progress) ** 3))
  })

  return <group ref={group}>{children}</group>
}

function Board({ players, propertyBuildings, highlightedSpaceIds, landingPulseSpaceId, landingPulseSequence, diceRollSequence, dice, reducedMotion, onSelectSpace }: { players: PlayerToken[]; propertyBuildings: PropertyBuilding[]; highlightedSpaceIds: readonly number[]; landingPulseSpaceId: number; landingPulseSequence: number; diceRollSequence: number; dice: [number, number]; reducedMotion: boolean; onSelectSpace: (spaceId: number) => void }) {
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
            {property?.isMortgaged && (
              <mesh position={[size * 0.3, 0.12, size * 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.11, 8]} />
                <meshStandardMaterial color="#71858a" roughness={0.48} />
              </mesh>
            )}
            {property?.ownerSessionId && property.houses === 0 && (
              <mesh castShadow position={[size * 0.31, 0.16, size * 0.22]}>
                <cylinderGeometry args={[0.075, 0.075, 0.12, 8]} />
                <meshStandardMaterial color={property.ownerColor} roughness={0.42} />
              </mesh>
            )}
          </group>
        )
      })}
      {propertyBuildings.map(({ spaceId, houses, ownerColor }) => {
        if (houses < 1) return null
        const { x, z } = positionOnBoard(spaceId)
        const rotation = spaceId <= 10 || spaceId >= 30 ? 0 : Math.PI / 2
        return (
          <AnimatedBuilding key={`buildings-${spaceId}`} houses={houses} reducedMotion={reducedMotion}><group position={[x, 0.19, z]} rotation={[0, rotation, 0]}>
            {houses === 5 ? (
              <group position={[0, 0.08, 0.23]}>
                <mesh castShadow><boxGeometry args={[0.3, 0.18, 0.22]} /><meshStandardMaterial color={ownerColor} roughness={0.48} /></mesh>
                <mesh castShadow position={[0, 0.14, 0]}><coneGeometry args={[0.22, 0.16, 4]} /><meshStandardMaterial color={ownerColor} roughness={0.56} /></mesh>
              </group>
            ) : Array.from({ length: houses }, (_, index) => (
              <group key={index} position={[(index - 1.5) * 0.17, 0.07, 0.25]}>
                <mesh castShadow><boxGeometry args={[0.11, 0.11, 0.11]} /><meshStandardMaterial color="#f6ead0" roughness={0.72} /></mesh>
                <mesh castShadow position={[0, 0.09, 0]}><coneGeometry args={[0.095, 0.09, 4]} /><meshStandardMaterial color={ownerColor} roughness={0.55} /></mesh>
              </group>
            ))}
          </group></AnimatedBuilding>
        )
      })}
      {players.map((player) => <AnimatedPawn key={player.id} player={player} seatIndex={player.seatIndex} reducedMotion={reducedMotion} />)}
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

export default function BoardScene({ players, propertyBuildings, highlightedSpaceIds = [], landingPulseSpaceId = -1, landingPulseSequence = 0, diceRollSequence = 0, dice = [0, 0], reducedMotion = false, onSelectSpace }: { players: PlayerToken[]; propertyBuildings: PropertyBuilding[]; highlightedSpaceIds?: readonly number[]; landingPulseSpaceId?: number; landingPulseSequence?: number; diceRollSequence?: number; dice?: [number, number]; reducedMotion?: boolean; onSelectSpace: (spaceId: number) => void }) {
  return (
    <Canvas camera={{ position: [12.5, 15.5, 15.5], fov: 34 }} shadows dpr={[1, 1.6]}>
      <color attach="background" args={['#9bbcc1']} />
      <fog attach="fog" args={['#9bbcc1', 21, 38]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[7, 13, 5]} intensity={1.55} castShadow shadow-mapSize={[1024, 1024]} />
      <ResponsiveCamera />
      <Board players={players} propertyBuildings={propertyBuildings} highlightedSpaceIds={highlightedSpaceIds} landingPulseSpaceId={landingPulseSpaceId} landingPulseSequence={landingPulseSequence} diceRollSequence={diceRollSequence} dice={dice} reducedMotion={reducedMotion} onSelectSpace={onSelectSpace} />
      <ContactShadows position={[0, -0.46, 0]} opacity={0.25} scale={18} blur={2.5} far={5} />
    </Canvas>
  )
}
