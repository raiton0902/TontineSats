import { useEffect, useRef } from 'react'
import { useApp } from '../store/AppStore'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  vr: number
  color: string
  life: number
}

export function Confetti({ fire }: { fire: number }) {
  const { settings } = useApp()
  const canvas = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!fire || settings.reduceMotion) return
    const element = canvas.current
    if (!element) return
    const context = element.getContext('2d')
    if (!context) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    element.width = width * dpr
    element.height = height * dpr
    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    const styles = getComputedStyle(document.documentElement)
    const colors = ['--success', '--warning', '--primary', '--foreground'].map((token) =>
      styles.getPropertyValue(token).trim(),
    )
    const particles: Particle[] = Array.from({ length: 44 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.1
      const speed = 5 + Math.random() * 7
      return {
        x: width / 2,
        y: height * 0.62,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      }
    })

    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const elapsed = now - start
      context.clearRect(0, 0, width, height)
      for (const particle of particles) {
        particle.vy += 0.26
        particle.vx *= 0.99
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rot += particle.vr
        particle.life = Math.max(0, 1 - elapsed / 1100)
        context.save()
        context.globalAlpha = particle.life
        context.translate(particle.x, particle.y)
        context.rotate(particle.rot)
        context.fillStyle = particle.color
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6)
        context.restore()
      }
      if (elapsed < 1150) frame = requestAnimationFrame(tick)
      else context.clearRect(0, 0, width, height)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [fire, settings.reduceMotion])

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  )
}
