import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Heart, Layers, MessageCircle, UserRound, type LucideIcon } from 'lucide-react'
import { tap } from '@/lib/haptics'
import './BottomNav.css'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  badge?: number
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/app', label: 'Accueil', icon: Layers },
  { path: '/app/likes', label: 'Likes', icon: Heart },
  { path: '/app/messages', label: 'Messages', icon: MessageCircle },
  { path: '/app/compte', label: 'Compte', icon: UserRound },
]

const TOP = 22 // hauteur réservée à la bulle au-dessus de la barre
const DIP = 30 // profondeur du creux
const HALF = 58 // demi-largeur du creux

function barPath(cx: number, w: number, h: number) {
  const t = TOP
  return [
    `M0 ${t}`,
    `L${cx - HALF} ${t}`,
    `C${cx - HALF * 0.5} ${t} ${cx - HALF * 0.62} ${t + DIP} ${cx} ${t + DIP}`,
    `C${cx + HALF * 0.62} ${t + DIP} ${cx + HALF * 0.5} ${t} ${cx + HALF} ${t}`,
    `L${w} ${t}`,
    `L${w} ${h}`,
    `L0 ${h}Z`,
  ].join(' ')
}

/**
 * Barre de navigation : barre claire avec un creux qui glisse sous l'onglet actif,
 * et une bulle qui “saute” d'un onglet à l'autre.
 */
export default function BottomNav({ badges }: { badges: Partial<Record<string, number>> }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const ref = useRef<HTMLElement>(null)
  const [w, setW] = useState(0)
  const h = 96

  const active = Math.max(
    0,
    NAV_ITEMS.findIndex((it, i) => (i === 0 ? pathname === '/app' : pathname.startsWith(it.path))),
  )

  const cx = useMotionValue(0)
  const hop = useMotionValue(0)
  const d = useTransform(cx, (v) => barPath(v, w || 1, h))
  const bubbleX = useTransform(cx, (v) => v - 27)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setW(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const first = useRef(true)
  useEffect(() => {
    if (!w) return
    const target = (w / NAV_ITEMS.length) * (active + 0.5)
    if (first.current) {
      cx.set(target)
      first.current = false
      return
    }
    animate(cx, target, { type: 'spring', stiffness: 260, damping: 26 })
    animate(hop, [0, -16, 0], { duration: 0.5, ease: ['easeOut', 'easeIn'] })
  }, [active, w, cx, hop])

  const ActiveIcon = NAV_ITEMS[active].icon

  return (
    <nav ref={ref} className="bnav" aria-label="Navigation principale">
      {w > 0 && (
        <svg className="bnav-bg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
          <defs>
            <linearGradient id="bnav-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f4f6f2" />
              <stop offset="1" stopColor="#e3e8e2" />
            </linearGradient>
          </defs>
          <motion.path d={d} fill="url(#bnav-grad)" />
        </svg>
      )}

      <motion.div className="bnav-bubble" style={{ x: bubbleX, y: hop }} aria-hidden>
        <ActiveIcon size={22} strokeWidth={2.2} />
        {!!badges[NAV_ITEMS[active].path] && <span className="bnav-badge" />}
      </motion.div>

      <ul className="bnav-items">
        {NAV_ITEMS.map((it, i) => {
          const Icon = it.icon
          const isActive = i === active
          const badge = badges[it.path]
          return (
            <li key={it.path}>
              <button
                aria-label={it.label}
                aria-current={isActive ? 'page' : undefined}
                className={`bnav-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  if (isActive) return
                  tap(10)
                  navigate(it.path)
                }}
              >
                <Icon size={23} strokeWidth={1.9} />
                {!!badge && <span className="bnav-count">{badge > 9 ? '9+' : badge}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
