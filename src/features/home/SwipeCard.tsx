import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { BadgeCheck, Info, MapPin } from 'lucide-react'
import FlutedImage from '@/components/FlutedImage'
import { CompatRing } from '@/components/CompatPie'
import type { Profile } from '@/data/demoProfiles'
import { formatDistance } from '@/lib/geo'
import { tap } from '@/lib/haptics'

export type Decision = 'like' | 'pass'
export interface Command {
  dir: Decision
  nonce: number
}

const THRESHOLD = 110
const REVEAL_MS = 1050

export default function SwipeCard({
  profile,
  compat,
  isTop,
  depth,
  command,
  hideDistance,
  onDecision,
  onOpen,
}: {
  profile: Profile
  compat: number
  isTop: boolean
  depth: number
  command: Command | null
  hideDistance: boolean
  onDecision: (dir: Decision) => void
  onOpen: () => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 0, 260], [-14, 0, 14])
  const likeOpacity = useTransform(x, [20, THRESHOLD], [0, 1])
  const passOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0])
  const [revealed, setRevealed] = useState(false)
  const busy = useRef(false)
  const lastNonce = useRef<number | null>(null)

  const like = () => {
    if (busy.current) return
    busy.current = true
    tap(18)
    setRevealed(true)
    // Le flou se lève, on laisse le temps de découvrir l'avatar, puis la carte part à droite.
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 26 })
    window.setTimeout(() => {
      animate(x, 520, { duration: 0.42, ease: [0.4, 0, 1, 1] }).then(() => onDecision('like'))
    }, REVEAL_MS)
  }

  const pass = () => {
    if (busy.current) return
    busy.current = true
    tap(8)
    animate(x, -520, { duration: 0.36, ease: [0.4, 0, 1, 1] }).then(() => onDecision('pass'))
  }

  useEffect(() => {
    if (!isTop || !command || command.nonce === lastNonce.current) return
    lastNonce.current = command.nonce
    if (command.dir === 'like') like()
    else pass()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command, isTop])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > THRESHOLD || info.velocity.x > 700) like()
    else if (info.offset.x < -THRESHOLD || info.velocity.x < -700) pass()
    else animate(x, 0, { type: 'spring', stiffness: 420, damping: 30 })
  }

  return (
    <motion.article
      className={`swipe-card ${isTop ? 'is-top' : ''}`}
      style={{ x, rotate, zIndex: 10 - depth }}
      initial={false}
      animate={{ scale: 1 - depth * 0.045, y: depth * 16, opacity: depth > 2 ? 0 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      drag={isTop && !revealed ? 'x' : false}
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      onTap={() => isTop && !busy.current && onOpen()}
      aria-label={`${profile.firstName}, ${profile.age} ans`}
    >
      <FlutedImage src={profile.avatarImage} revealed={revealed} strips={isTop ? 18 : 12} className="swipe-img" alt={`Avatar de ${profile.firstName}`} />

      <div className="swipe-shade" />

      <motion.span className="swipe-stamp stamp-like" style={{ opacity: revealed ? 1 : likeOpacity }}>
        J’aime
      </motion.span>
      <motion.span className="swipe-stamp stamp-pass" style={{ opacity: passOpacity }}>
        Non merci
      </motion.span>

      <div className="swipe-top">
        <span className="swipe-chip glass">{revealed ? 'Avatar dévoilé ✨' : 'Avatar flouté'}</span>
        <CompatRing value={compat} />
      </div>

      <div className="swipe-info">
        <div>
          <h2>
            {profile.firstName}, <span>{profile.age}</span>
            {profile.verified && <BadgeCheck className="swipe-verified" size={22} aria-label="Profil vérifié" />}
          </h2>
          <p className="swipe-job">{profile.job}</p>
          <div className="swipe-meta">
            {!hideDistance && (
              <span>
                <MapPin size={14} /> {formatDistance(profile.km)}
              </span>
            )}
            {profile.lastActiveMin < 30 && (
              <span>
                <i className="online-dot" /> En ligne
              </span>
            )}
          </div>
        </div>
        <button
          className="swipe-more glass"
          aria-label="Voir le profil"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
        >
          <Info size={20} />
        </button>
      </div>
    </motion.article>
  )
}
