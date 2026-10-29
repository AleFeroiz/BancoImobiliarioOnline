import { useEffect, useState } from 'react'
import type { FrameRateAccumulator, FrameRateDisplay } from './fpsMeter'
import { readFrameRate } from './fpsMeter'

type FpsMeterProps = { samples: { current: FrameRateAccumulator } }

export function FpsMeter({ samples }: FpsMeterProps) {
  const [display, setDisplay] = useState<FrameRateDisplay>({ state: 'measuring' })

  useEffect(() => {
    const update = () => {
      const next = readFrameRate(samples.current, performance.now())
      setDisplay((previous) => previous.state === next.state
        && (previous.state !== 'active' || (next.state === 'active' && previous.fps === next.fps && previous.frameTimeMs === next.frameTimeMs))
        ? previous
        : next)
    }
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [samples])

  return <div className="fps-meter" role="status" aria-live="off" title="FPS renderizado pela cena 3D e tempo médio por quadro">
    <span>FPS</span>
    <strong>{display.state === 'active' ? display.fps : '—'}</strong>
    <small>{display.state === 'active' ? `${display.frameTimeMs.toFixed(1)} ms` : display.state === 'idle' ? 'ocioso' : 'medindo'}</small>
  </div>
}
