import { useEffect, useState } from 'react'
import { useApp } from '../store/AppStore'

// One eased 0→1 clock. Callers drive both the arc and the number from it,
// so the two always finish together.
export function useProgress(duration = 700, resetKey?: unknown) {
  const { settings } = useApp()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (settings.reduceMotion) {
      setProgress(1)
      return
    }
    setProgress(0)
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setProgress(1 - Math.pow(1 - t, 3))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, settings.reduceMotion, resetKey])

  return settings.reduceMotion ? 1 : progress
}
