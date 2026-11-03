import { useEffect, useState } from 'react'
import { CATEGORIES } from '@/data/questions'
import type { Compatibility } from '@/lib/compat'
import './CompatPie.css'

function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const [x0, y0] = p(r1, a0)
  const [x1, y1] = p(r1, a1)
  const [x2, y2] = p(r0, a1)
  const [x3, y3] = p(r0, a0)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M${x0} ${y0} A${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${large} 0 ${x3} ${y3}Z`
}

/**
 * Camembert de compatibilité : une part par catégorie.
 * La longueur de chaque part = le score dans cette catégorie ; au centre, le score global.
 */
export default function CompatPie({
  compat,
  size = 220,
  legend = true,
  animate = true,
}: {
  compat: Compatibility
  size?: number
  legend?: boolean
  animate?: boolean
}) {
  const [t, setT] = useState(animate ? 0 : 1)

  useEffect(() => {
    if (!animate) return
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      const k = Math.min(1, (now - start) / 1100)
      setT(1 - Math.pow(1 - k, 3))
      if (k < 1) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [animate, compat.total])

  const c = size / 2
  const r0 = size * 0.19
  const R = size / 2 - 2
  const n = CATEGORIES.length
  const gap = 0.045
  const step = (Math.PI * 2) / n

  return (
    <div className="pie">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Compatibilité ${compat.total} %`}>
        {CATEGORIES.map((cat, i) => {
          const a0 = -Math.PI / 2 + i * step + gap
          const a1 = a0 + step - gap * 2
          const v = compat.byCategory[cat.id] / 100
          const r = r0 + 6 + (R - r0 - 6) * (0.08 + 0.92 * v) * t
          return (
            <g key={cat.id}>
              <path d={sector(c, c, r0 + 6, R, a0, a1)} fill="rgba(255,255,255,0.05)" />
              <path d={sector(c, c, r0 + 6, r, a0, a1)} fill={cat.color} opacity={0.92} />
            </g>
          )
        })}
        <circle cx={c} cy={c} r={r0} fill="rgba(10,14,12,0.85)" stroke="rgba(255,255,255,0.12)" />
        <text x={c} y={c + 2} textAnchor="middle" className="pie-total">
          {Math.round(compat.total * t)}
          <tspan className="pie-pct">%</tspan>
        </text>
        <text x={c} y={c + 18} textAnchor="middle" className="pie-label">
          compatibles
        </text>
      </svg>

      {legend && (
        <ul className="pie-legend">
          {CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <span className="pie-dot" style={{ background: cat.color }} />
              <span className="pie-name">{cat.short}</span>
              <span className="pie-bar">
                <span style={{ width: `${compat.byCategory[cat.id] * t}%`, background: cat.color }} />
              </span>
              <span className="pie-val">{compat.byCategory[cat.id]}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Petit anneau de score, pour les cartes. */
export function CompatRing({ value, size = 46 }: { value: number; size?: number }) {
  const r = size / 2 - 4
  const len = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth="3.5" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--accent)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(len * value) / 100} ${len}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span>{value}</span>
    </div>
  )
}
