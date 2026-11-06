import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Box3, Mesh, Vector3 } from 'three'
import type { CharacterType } from '../../shared/lobby'
import { createUnlitMaterial } from './sceneMaterials'
import { getLobbyTokenColorOverride } from './lobbyTokenMaterials'
import { PawnGeometry } from './PawnGeometry'

const roots: Partial<Record<CharacterType, string>> = { car: 'Token_Car', motorcycle: 'Token_Motorcycle', airplane: 'Token_Airplane', highHeel: 'Token_HighHeel', train: 'Token_Train', topHat: 'Token_TopHat', piggyBank: 'Token_PiggyBank', ship: 'Token_Ship', rubberDuck: 'Token_RubberDuck', dog: 'Token_Dog', cat: 'Token_Cat', cow: 'Token_Cow', penguin: 'Token_Penguin' }

function Token({ type, color }: { type: CharacterType; color: string }) {
  const { scene } = useGLTF('/assets/player-tokens.glb')
  const model = useMemo(() => {
    const source = scene.getObjectByName(roots[type] ?? '')
    if (!source || type === 'pawn') return null
    const clone = source.clone(true)
    const box = new Box3().setFromObject(clone)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    clone.position.sub(center)
    const scale = 1.25 / Math.max(size.x, size.y, size.z)
    clone.scale.setScalar(scale)
    clone.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      const recolor = (material: import('three').Material) => createUnlitMaterial(material, getLobbyTokenColorOverride(type, mesh.name, material.name, color))
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(recolor) : recolor(mesh.material)
    })
    return clone
  }, [scene, type, color])
  if (type === 'pawn') return <group position={[0, -0.48, 0]} scale={1.8}><mesh><PawnGeometry /><meshBasicMaterial color={color} /></mesh></group>
  return model ? <primitive object={model} /> : null
}

export default function LobbyToken({ type, color }: { type: CharacterType; color: string }) {
  return <div className="lobby-token" aria-hidden="true"><Canvas frameloop="demand" camera={{ position: [2, 1.5, 3], fov: 32 }} gl={{ alpha: true, antialias: true }}><Suspense fallback={null}><Token type={type} color={color} /></Suspense></Canvas></div>
}

