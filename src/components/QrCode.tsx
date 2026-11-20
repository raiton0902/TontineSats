import { useMemo } from 'react'
import QRCode from 'qrcode'

export function QrCode({
  value,
  label,
}: {
  value: string
  label: string
}) {
  const matrix = useMemo(() => {
    const qr = QRCode.create(value.toUpperCase(), { errorCorrectionLevel: 'M' })
    const size = qr.modules.size
    const paths: string[] = []
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (qr.modules.get(row, col)) {
          paths.push(`M${col},${row}h1v1h-1z`)
        }
      }
    }
    return { size, d: paths.join('') }
  }, [value])

  return (
    <figure className="mx-auto w-full max-w-[204px]">
      <div className="rounded-[14px] border border-border bg-[var(--paper)] p-3">
        <svg
          viewBox={`-2 -2 ${matrix.size + 4} ${matrix.size + 4}`}
          role="img"
          aria-label={label}
          className="block h-auto w-full"
          shapeRendering="crispEdges"
        >
          <rect
            x={-2}
            y={-2}
            width={matrix.size + 4}
            height={matrix.size + 4}
            fill="var(--paper)"
          />
          <path d={matrix.d} fill="var(--ink)" />
        </svg>
      </div>
    </figure>
  )
}
