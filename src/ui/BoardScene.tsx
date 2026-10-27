import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { boardSpaces, positionOnBoard } from '../game/board'

const playerColors = ['#e7785f', '#54aec0', '#e7bd62', '#8775bd']

function Board({ currentSpace }: { currentSpace: number }) {
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
        <meshStandardMaterial color="#c4d5bd" roughness={1} />
      </mesh>
      <mesh position={[-0.3, 0.045, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <planeGeometry args={[5.2, 1.5]} />
        <meshBasicMaterial color="#728c76" transparent opacity={0.78} />
      </mesh>
      <mesh position={[0.55, 0.05, 0.25]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[3.7, 0.025]} />
        <meshBasicMaterial color="#e6d5a9" transparent opacity={0.85} />
      </mesh>
      {boardSpaces.map((space) => {
        const { x, z } = positionOnBoard(space.id)
        const corner = space.id % 10 === 0
        const size = corner ? 1.14 : 0.98
        const rotation = space.id <= 10 || space.id >= 30 ? 0 : Math.PI / 2
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
            {corner && (
              <mesh position={[0, 0.19, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.32, 0.08, 0.32]} />
                <meshStandardMaterial color="#d5a956" roughness={0.48} />
              </mesh>
            )}
          </group>
        )
      })}
      {playerColors.map((color, index) => {
        const { x, z } = positionOnBoard(index === 0 ? currentSpace : index * 3)
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

export default function BoardScene({ currentSpace }: { currentSpace: number }) {
  return (
    <Canvas camera={{ position: [12.5, 15.5, 15.5], fov: 34 }} shadows dpr={[1, 1.6]}>
      <color attach="background" args={['#b7d8d9']} />
      <fog attach="fog" args={['#b7d8d9', 17, 31]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[7, 13, 5]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} />
      <Board currentSpace={currentSpace} />
      <ContactShadows position={[0, -0.46, 0]} opacity={0.25} scale={18} blur={2.5} far={5} />
    </Canvas>
  )
}
