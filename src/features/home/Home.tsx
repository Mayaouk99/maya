import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Heart, Map, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import SwipeCard, { type Command, type Decision } from './SwipeCard'
import { IconButton } from '@/components/ui'
import { useApp, useDeck } from '@/store/useApp'
import { computeCompatibility } from '@/lib/compat'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const deck = useDeck()
  const me = useApp((s) => s.me)
  const hideDistance = useApp((s) => s.prefs.hideDistance)
  const swipe = useApp((s) => s.swipe)
  const resetPasses = useApp((s) => s.resetPasses)
  const [command, setCommand] = useState<Command | null>(null)

  // Tri : les profils les plus compatibles d'abord.
  const sorted = useMemo(
    () =>
      deck
        .map((p) => ({ p, c: computeCompatibility(me.answers, p.answers).total }))
        .sort((a, b) => b.c - a.c),
    [deck, me.answers],
  )
  const visible = sorted.slice(0, 3)

  const decide = (id: string, dir: Decision) => {
    swipe(id, dir)
    setCommand(null)
  }

  return (
    <div className="screen home">
      <header className="home-header">
        <div className="home-brand">
          <span className="home-logo">M</span>
          <div>
            <p className="eyebrow">Bonjour {me.firstName || 'toi'}</p>
            <h1 className="home-title">Découvrir</h1>
          </div>
        </div>
        <div className="home-header-actions">
          <IconButton label="Préférences de recherche" className="glass" onClick={() => navigate('/app/compte/preferences')}>
            <SlidersHorizontal size={19} />
          </IconButton>
          <IconButton label="Carte des personnes autour de moi" className="home-map-btn" onClick={() => navigate('/app/carte')}>
            <Map size={20} />
          </IconButton>
        </div>
      </header>

      <div className="deck">
        <AnimatePresence>
          {visible.length === 0 && (
            <motion.div className="deck-empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="deck-empty-rings">
                <span />
                <span />
                <span />
                <div className="deck-empty-avatar">{me.avatar?.snapshot ? <img src={me.avatar.snapshot} alt="" /> : me.firstName[0]}</div>
              </div>
              <h2 className="h2">Plus personne pour l’instant</h2>
              <p className="muted">Élargis ta recherche ou reviens un peu plus tard : de nouvelles personnes arrivent chaque jour.</p>
              <div className="deck-empty-actions">
                <button className="btn btn-primary btn-md" onClick={() => navigate('/app/compte/preferences')}>
                  Élargir ma recherche
                </button>
                <button className="btn btn-glass btn-md" onClick={resetPasses}>
                  <RotateCcw size={16} /> Revoir les profils passés
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {visible
          .map(({ p, c }, i) => (
            <SwipeCard
              key={p.id}
              profile={p}
              compat={c}
              depth={i}
              isTop={i === 0}
              command={i === 0 ? command : null}
              hideDistance={hideDistance}
              onDecision={(dir) => decide(p.id, dir)}
              onOpen={() => navigate(`/app/profil/${p.id}`)}
            />
          ))
          .reverse()}
      </div>

      {visible.length > 0 && (
        <div className="deck-actions">
          <button className="deck-btn deck-pass" aria-label="Passer" onClick={() => setCommand({ dir: 'pass', nonce: Date.now() })}>
            <X size={30} strokeWidth={2.4} />
          </button>
          <button className="deck-btn deck-like" aria-label="J’aime" onClick={() => setCommand({ dir: 'like', nonce: Date.now() })}>
            <Heart size={30} strokeWidth={2.4} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  )
}
