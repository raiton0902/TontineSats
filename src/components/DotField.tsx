import { useEffect, useRef } from 'react'
import { useApp } from '../store/AppStore'

type Dot = { x: number; y: number; r: number; color: number }

const COLOR_NAMES = ['--dot-ink', '--dot-sky', '--dot-sand', '--dot-emerald']

export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { settings, theme } = useApp()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = settings.reduceMotion
    const styles = getComputedStyle(canvas)
    const colors = COLOR_NAMES.map((name) => styles.getPropertyValue(name).trim()).filter(Boolean)
    if (!colors.length) return

    let width = 0
    let height = 0
    let dots: Dot[] = []
    let raf = 0
    let resizeRaf = 0
    let idleTimer = 0

    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, i: 0, ti: 0 }
    const radius = 160
    const radius2 = radius * radius

    const build = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const pitch = width < 640 ? 15 : 20
      const cols = Math.ceil(width / pitch) + 1
      const rows = Math.ceil(height / pitch) + 1
      const ox = (width - (cols - 1) * pitch) / 2
      const oy = (height - (rows - 1) * pitch) / 2

      dots = []
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const seed = row * 997 + col * 131
          const hash = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1
          const color = hash < 0.08 ? 1 : hash < 0.15 ? 2 : hash < 0.22 ? 3 : 0
          dots.push({
            x: ox + col * pitch + (hash - 0.5) * 2.2,
            y: oy + row * pitch + (hash * 3 - 1.5),
            r: color === 0 ? 0.7 + hash * 0.6 : 1 + hash * 0.9,
            color,
          })
        }
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      const active = pointer.i > 0.01

      for (let color = 0; color < colors.length; color += 1) {
        ctx.fillStyle = colors[color]
        ctx.beginPath()
        for (const dot of dots) {
          if (dot.color !== color) continue
          let x = dot.x
          let y = dot.y
          let r = dot.r
          if (active) {
            const dx = dot.x - pointer.x
            const dy = dot.y - pointer.y
            const dist2 = dx * dx + dy * dy
            if (dist2 < radius2) {
              const dist = Math.sqrt(dist2) || 1
              const falloff = 1 - dist / radius
              const lift = falloff * falloff * (3 - 2 * falloff) * pointer.i
              r *= 1 + 0.9 * lift
              x += (dx / dist) * 8 * lift
              y += (dy / dist) * 8 * lift
            }
          }
          ctx.moveTo(x + r, y)
          ctx.arc(x, y, r, 0, Math.PI * 2)
        }
        ctx.fill()
      }
    }

    const settled = () =>
      Math.abs(pointer.x - pointer.tx) < 0.1 &&
      Math.abs(pointer.y - pointer.ty) < 0.1 &&
      Math.abs(pointer.i - pointer.ti) < 0.002

    const frame = () => {
      pointer.x += (pointer.tx - pointer.x) * 0.16
      pointer.y += (pointer.ty - pointer.y) * 0.16
      pointer.i += (pointer.ti - pointer.i) * 0.12
      if (settled()) {
        pointer.x = pointer.tx
        pointer.y = pointer.ty
        pointer.i = pointer.ti
      }
      render()
      raf = settled() ? 0 : requestAnimationFrame(frame)
    }

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const overContent = (x: number, y: number) =>
      Boolean(document.elementFromPoint(x, y)?.closest('[data-dot-damp]'))

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if (pointer.x < -1000) {
        pointer.x = event.clientX
        pointer.y = event.clientY
      }
      pointer.tx = event.clientX
      pointer.ty = event.clientY
      pointer.ti = overContent(event.clientX, event.clientY) ? 0 : 1
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        pointer.ti = 0
        kick()
      }, 2500)
      kick()
    }

    const onLeave = () => {
      window.clearTimeout(idleTimer)
      pointer.ti = 0
      kick()
    }

    build()
    render()

    if (!reduce) {
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('blur', onLeave)
      document.documentElement.addEventListener('mouseleave', onLeave)
    }

    const onResize = () => {
      cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(() => {
        build()
        render()
      })
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('blur', onLeave)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(resizeRaf)
      window.clearTimeout(idleTimer)
    }
  }, [settings.reduceMotion, theme])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}
