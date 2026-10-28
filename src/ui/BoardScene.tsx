import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { CanvasTexture, Fog, PerspectiveCamera, SRGBColorSpace } from 'three'
import { useThree } from '@react-three/fiber'
import { boardSpaces, positionOnBoard } from '../game/board'
import { wrapSpaceLabel } from './spaceLabel'

const playerColors = ['#e7785f', '#54aec0', '#e7bd62', '#8775bd']

type PropertyBuilding = { spaceId: number; houses: number; isMortgaged: boolean }

function ResponsiveCamera() {
  const { camera, scene, size } = useThree()
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return
    const aspect = size.width / size.height
    const distance = aspect < 0.7 ? 1.5 : aspect < 1.1 ? 1.15 : 1
    camera.position.set(12.5 * distance, 15.5 * distance, 15.5 * distance)
    camera.lookAt(0, 0, 0)
    camera.fov = size.width < 640 ? 49 : size.width < 900 ? 40 : 34
    camera.updateProjectionMatrix()
    if (scene.fog instanceof Fog) {
      scene.fog.near = 21 * distance
      scene.fog.far = 38 * distance
    }
  }, [camera, scene, size.width, size.height])
  return null
}

function SpaceLabel({ name, price, size }: { name: string; price?: number; size: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 768
    canvas.height = 384
    const context = canvas.getContext('2d')
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = '#2f4536'
      let fontSize = 138
      context.font = `700 ${fontSize}px system-ui, sans-serif`
      let lines = wrapSpaceLabel(name, 710, (text) => context.measureText(text).width)
      while (lines.length > 2 && fontSize > 96) {
        fontSize -= 6
        context.font = `700 ${fontSize}px system-ui, sans-serif`
        lines = wrapSpaceLabel(name, 710, (text) => context.measureText(text).width)
      }
      const lineSpacing = lines.length > 1 ? 94 : 0
      const firstLineY = price
        ? lines.length > 1 ? 100 : 148
        : lines.length > 1 ? 136 : 198
      lines.forEach((line, index) => context.fillText(line, 384, firstLineY + lineSpacing * index))
      if (price) {
        context.fillStyle = '#52664c'
        context.font = '700 112px system-ui, sans-serif'
        context.fillText(`R$ ${new Intl.NumberFormat('pt-BR').format(price)}`, 384, 304)
      }
    }
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    map.needsUpdate = true
    return map
  }, [name, price])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={[0, 0.085, size * 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size * 0.94, size * 0.58]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

function Board({ playerPositions, propertyBuildings, highlightedSpaceIds }: { playerPositions: number[]; propertyBuildings: PropertyBuilding[]; highlightedSpaceIds: readonly number[] }) {
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
          <group key={space.id} position={[x, 0.08, z]} rotation={[0, rotation, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[size, 0.16, size]} />
              <meshStandardMaterial color={corner ? '#f6e8c8' : '#fffaf1'} roughness={0.78} />
            </mesh>
            <mesh position={[0, 0.09, -size * 0.39]}>
              <boxGeometry args={[size * 0.82, 0.045, size * 0.19]} />
              <meshStandardMaterial color={space.color} roughness={0.7} />
            </mesh>
            <SpaceLabel name={space.name} price={space.price} size={size} />
            {highlightedSpaceIds.includes(space.id) && (
              <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[size * 0.38, size * 0.47, 40]} />
                <meshBasicMaterial color="#e5af3f" transparent opacity={0.96} toneMapped={false} />
              </mesh>
            )}
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
          </group>
        )
      })}
      {propertyBuildings.map(({ spaceId, houses }) => {
        if (houses < 1) return null
        const { x, z } = positionOnBoard(spaceId)
        const rotation = spaceId <= 10 || spaceId >= 30 ? 0 : Math.PI / 2
        return (
          <group key={`buildings-${spaceId}`} position={[x, 0.19, z]} rotation={[0, rotation, 0]}>
            {houses === 5 ? (
              <group position={[0, 0.08, 0.23]}>
                <mesh castShadow><boxGeometry args={[0.3, 0.18, 0.22]} /><meshStandardMaterial color="#b8614e" roughness={0.56} /></mesh>
                <mesh castShadow position={[0, 0.14, 0]}><coneGeometry args={[0.22, 0.16, 4]} /><meshStandardMaterial color="#86493e" roughness={0.62} /></mesh>
              </group>
            ) : Array.from({ length: houses }, (_, index) => (
              <group key={index} position={[(index - 1.5) * 0.17, 0.07, 0.25]}>
                <mesh castShadow><boxGeometry args={[0.11, 0.11, 0.11]} /><meshStandardMaterial color="#f6ead0" roughness={0.72} /></mesh>
                <mesh castShadow position={[0, 0.09, 0]}><coneGeometry args={[0.095, 0.09, 4]} /><meshStandardMaterial color="#779675" roughness={0.62} /></mesh>
              </group>
            ))}
          </group>
        )
      })}
      {playerPositions.map((position, index) => {
        const color = playerColors[index]
        const { x, z } = positionOnBoard(position)
        return (
          <group key={color} position={[x + 0.13 * (index - 1.5), 0.35, z + 0.06]}>
            <mesh castShadow position={[0, 0.17, 0]}>
              <cylinderGeometry args={[0.16, 0.23, 0.25, 7]} />
              <meshStandardMaterial color={color} roughness={0.42} />
            </mesh>
            <mesh castShadow position={[0, 0.39, 0]}>
              <sphereGeometry args={[0.16, 14, 12]} />
              <meshStandardMaterial color={color} roughness={0.35} />
            </mesh>
          </group>
        )
      })}
      <mesh castShadow position={[-0.34, 0.23, -0.23]} rotation={[0.12, 0.25, 0.25]}>
        <boxGeometry args={[0.45, 0.42, 0.45]} />
        <meshStandardMaterial color="#fffaf0" roughness={0.22} />
      </mesh>
      <mesh castShadow position={[0.38, 0.23, 0.2]} rotation={[-0.18, 0.3, -0.2]}>
        <boxGeometry args={[0.45, 0.42, 0.45]} />
        <meshStandardMaterial color="#fffaf0" roughness={0.22} />
      </mesh>
    </group>
  )
}

export default function BoardScene({ playerPositions, propertyBuildings, highlightedSpaceIds = [] }: { playerPositions: number[]; propertyBuildings: PropertyBuilding[]; highlightedSpaceIds?: readonly number[] }) {
  return (
    <Canvas camera={{ position: [12.5, 15.5, 15.5], fov: 34 }} shadows dpr={[1, 1.6]}>
      <color attach="background" args={['#9bbcc1']} />
      <fog attach="fog" args={['#9bbcc1', 21, 38]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[7, 13, 5]} intensity={1.55} castShadow shadow-mapSize={[1024, 1024]} />
      <ResponsiveCamera />
      <Board playerPositions={playerPositions} propertyBuildings={propertyBuildings} highlightedSpaceIds={highlightedSpaceIds} />
      <ContactShadows position={[0, -0.46, 0]} opacity={0.25} scale={18} blur={2.5} far={5} />
    </Canvas>
  )
}
