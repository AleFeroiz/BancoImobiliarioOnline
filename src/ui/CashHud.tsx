import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { memo, Suspense, useEffect, useMemo, useRef } from 'react'
import { OrthographicCamera, type Group, type Object3D } from 'three'
import { fitCashModelRoot, getCashVisualBreakdown } from './cashVisuals'

type HudCashPlayer = { id: string; cash: number }

const cashModelNames = ['Cash_GoldBar', 'Cash_SilverStack', 'Cash_NoteStack'] as const

function CashHudCamera() {
  const { camera, size } = useThree()
  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return
    camera.left = 0
    camera.right = size.width
    camera.top = size.height
    camera.bottom = 0
    camera.near = 0.1
    camera.far = 200
    camera.position.set(0, 0, 100)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])
  return null
}

function CashHudStack({ player }: { player: HudCashPlayer }) {
  const group = useRef<Group>(null)
  const { scene } = useGLTF('/assets/money-models/money-models.glb')
  const breakdown = getCashVisualBreakdown(player.cash)
  const modelCounts = [
    Math.min(3, breakdown.goldBars),
    Math.min(3, breakdown.silverStacks),
    Math.min(3, breakdown.banknoteStacks + Number(breakdown.partialBanknote > 0)),
  ]
  const items = useMemo(() => modelCounts.flatMap((count, typeIndex) => {
    const name = cashModelNames[typeIndex]
    if (!name || count === 0) return []
    const source = scene.getObjectByName(name)
    if (!source) return []
    return Array.from({ length: count }, (_, stackIndex) => {
      const model = fitCashModelRoot(source.clone(true), 17, typeIndex === 0 ? [0, 0, 0] : [Math.PI / 2, 0, 0])
      const amountScale = typeIndex === 2 && stackIndex === count - 1 && breakdown.partialBanknote > 0
        ? Math.max(0.18, breakdown.partialBanknote)
        : 1
      return {
        key: `${name}-${stackIndex}`,
        model,
        position: [-18 + typeIndex * 18 + stackIndex * 1.7, -8 + stackIndex * 2.3, stackIndex * 0.6] as [number, number, number],
        scale: [amountScale, 1, 1] as [number, number, number],
      }
    })
  }), [breakdown.banknoteStacks, breakdown.goldBars, breakdown.partialBanknote, breakdown.silverStacks, modelCounts.join(','), scene])

  useFrame(({ size }) => {
    const anchor = Array.from(document.querySelectorAll<HTMLElement>('[data-cash-anchor]'))
      .find((element) => element.dataset.cashAnchor === player.id)
    if (!group.current || !anchor) {
      if (group.current) group.current.visible = false
      return
    }
    const bounds = anchor.getBoundingClientRect()
    group.current.visible = bounds.width > 0 && bounds.height > 0
    group.current.position.set(bounds.left + bounds.width / 2, size.height - bounds.top - bounds.height / 2, 0)
  })

  return <group ref={group}>{items.map((item) => <primitive key={item.key} object={item.model as Object3D} position={item.position} scale={item.scale} />)}</group>
}

function CashHudScene({ players }: { players: HudCashPlayer[] }) {
  return <>
    <CashHudCamera />
    <ambientLight intensity={2.1} />
    <directionalLight position={[-80, 100, 120]} intensity={2.4} />
    <Suspense fallback={null}>{players.map((player) => <CashHudStack key={player.id} player={player} />)}</Suspense>
  </>
}

function CashHudOverlayScene({ players }: { players: HudCashPlayer[] }) {
  if (players.length === 0) return null
  return <Canvas className="cash-hud-canvas" aria-hidden="true" orthographic dpr={[1, 1.25]} frameloop="demand" camera={{ position: [0, 0, 100], left: 0, right: 1, top: 1, bottom: 0, near: 0.1, far: 200 }} gl={{ alpha: true, antialias: true }}><CashHudScene players={players} /></Canvas>
}

export const CashHudOverlay = memo(CashHudOverlayScene, (first, second) => first.players.length === second.players.length && first.players.every((player, index) => {
  const other = second.players[index]
  return other?.id === player.id && other.cash === player.cash
}))
