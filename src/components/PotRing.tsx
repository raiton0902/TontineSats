import type { ReactNode } from 'react'

const RADIUS = 104
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function PotRing({
  confirmed,
  total,
  progress = 1,
  children,
}: {
  confirmed: number
  total: number
  progress?: number
  children: ReactNode
}) {
  const safeTotal = Math.max(1, total)
  const gap = Math.min(12, (CIRCUMFERENCE / safeTotal) * 0.14)
  const seg = Math.max(8, CIRCUMFERENCE / safeTotal - gap)
  const dashArray = `${seg.toFixed(2)} ${(CIRCUMFERENCE - seg).toFixed(2)}`
  const drawn = Math.max(0, Math.min(confirmed, progress * confirmed))

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[272px]">
      <svg viewBox="0 0 240 240" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle className="ring-track" cx="120" cy="120" r={RADIUS} fill="none" strokeWidth="9" />
        {Array.from({ length: safeTotal }, (_, index) => {
          const fill = Math.max(0, Math.min(1, drawn - index))
          return (
            <circle
              key={index}
              className={index >= confirmed ? 'ring-seg is-pending' : 'ring-seg'}
              cx="120"
              cy="120"
              r={RADIUS}
              transform={`rotate(${-90 + index * (360 / safeTotal)} 120 120)`}
              style={{
                strokeDasharray: dashArray,
                ...(index < confirmed ? { strokeDashoffset: seg * (1 - fill) } : {}),
              }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-6 text-center">
        {children}
      </div>
    </div>
  )
}
