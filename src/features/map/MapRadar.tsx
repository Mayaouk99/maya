import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Crosshair, Navigation } from 'lucide-react'
import { RangeSlider, Sheet, TopBar, Button, IconButton } from '@/components/ui'
import { CompatRing } from '@/components/CompatPie'
import { DEMO_PROFILES, type Profile } from '@/data/demoProfiles'
import { useApp, isVisibleFor } from '@/store/useApp'
import { useToast } from '@/store/useToast'
import { computeCompatibility } from '@/lib/compat'
import { formatDistance, getCurrentPosition } from '@/lib/geo'
import './MapRadar.css'

export default function MapRadar() {
  const navigate = useNavigate()
  const me = useApp((s) => s.me)
  const prefs = useApp((s) => s.prefs)
  const swipes = useApp((s) => s.swipes)
  const matches = useApp((s) => s.matches)
  const blocked = useApp((s) => s.blocked)
  const setPosition = useApp((s) => s.setPosition)
  const toast = useToast((s) => s.show)
  const [radius, setRadius] = useState(Math.min(10, prefs.maxKm))
  const [selected, setSelected] = useState<Profile | null>(null)
  const [locating, setLocating] = useState(false)
  const field = useRef<HTMLDivElement>(null)
  const [side, setSide] = useState(0)

  useLayoutEffect(() => {
    const el = field.current
    if (!el) return
    const update = () => setSide(Math.min(el.clientWidth, el.clientHeight))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const people = useMemo(
    () =>
      DEMO_PROFILES.filter((p) => !blocked.includes(p.id) && swipes[p.id] !== 'pass' && isVisibleFor(me, prefs, p) && p.km <= radius),
    [blocked, swipes, me, prefs, radius],
  )

  const revealedIds = new Set([...Object.entries(swipes).filter(([, v]) => v === 'like').map(([k]) => k), ...matches.map((m) => m.profileId)])

  const relocate = async () => {
    setLocating(true)
    try {
      setPosition(await getCurrentPosition(), true)
      toast('Position mise à jour')
    } catch {
      toast('Localisation refusée ou indisponible')
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="screen radar">
      <div className="radar-bg" />
      <TopBar
        back
        title="Autour de moi"
        right={
          <IconButton label="Me relocaliser" className="glass" onClick={relocate} disabled={locating}>
            <Crosshair size={19} className={locating ? 'spin' : ''} />
          </IconButton>
        }
      />
      <p className="radar-status">
        <Navigation size={12} /> {me.positionIsReal ? 'Ta position · arrondie à ~1 km' : 'Position par défaut (Paris) · active la localisation'}
      </p>

      <div className="radar-field" ref={field}>
        <div className="radar-square" style={{ width: side, height: side }}>
        <div className="radar-rings">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} style={{ inset: `${(i * 100) / 14}%` }} />
          ))}
          <div className="radar-sweep" />
        </div>

        <div className="radar-me">{me.avatar?.snapshot ? <img src={me.avatar.snapshot} alt="Toi" /> : <span>{me.firstName[0]}</span>}</div>

        <AnimatePresence>
          {people.map((p) => {
            const r = (p.km / radius) * 44 // % du rayon du radar
            const a = ((p.bearing - 90) * Math.PI) / 180
            const left = 50 + r * Math.cos(a)
            const top = 50 + r * Math.sin(a)
            const revealed = revealedIds.has(p.id)
            return (
              <motion.button
                key={p.id}
                className="radar-pin"
                style={{ left: `${left}%`, top: `${top}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                onClick={() => setSelected(p)}
                aria-label={`${p.firstName}, ${formatDistance(p.km)}`}
              >
                <span className="radar-pin-head">
                  <img src={p.avatarImage} alt="" className={revealed ? '' : 'is-blurred'} />
                </span>
                <span className="radar-pin-tail" />
              </motion.button>
            )
          })}
        </AnimatePresence>
        </div>
      </div>

      <div className="radar-panel glass">
        <div className="radar-tooltip" style={{ left: `calc(20px + (100% - 40px) * ${Math.min(0.86, Math.max(0.14, (radius - 1) / 49))})` }}>
          <strong>{radius} km</strong>
          <span>
            {people.length} personne{people.length > 1 ? 's' : ''}
          </span>
        </div>
        <RangeSlider min={1} max={50} value={radius} onChange={(v) => setRadius(v as number)} />
      </div>

      <Sheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="radar-sheet">
            <div className="radar-sheet-head">
              <img src={selected.avatarImage} alt="" className={revealedIds.has(selected.id) ? '' : 'is-blurred'} />
              <div>
                <h3>
                  {selected.firstName}, {selected.age}
                </h3>
                <p className="muted">
                  {selected.job} · {formatDistance(selected.km)}
                </p>
              </div>
              <CompatRing value={computeCompatibility(me.answers, selected.answers).total} size={52} />
            </div>
            <p className="radar-sheet-bio">{selected.bio}</p>
            <Button block onClick={() => navigate(`/app/profil/${selected.id}`)}>
              Voir le profil
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
