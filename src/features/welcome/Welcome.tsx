import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import FlutedImage from '@/components/FlutedImage'
import { useApp } from '@/store/useApp'
import { tap } from '@/lib/haptics'
import './Welcome.css'

const TILES = [
  { src: '/people/m12.jpg', style: { top: '7%', left: '-9%', width: '52%', height: '38%', rotate: -8 }, delay: 0 },
  { src: '/people/f9.jpg', style: { top: '3%', left: '51%', width: '54%', height: '40%', rotate: 7 }, delay: 0.08 },
  { src: '/people/f27.jpg', style: { top: '44%', left: '38%', width: '58%', height: '47%', rotate: -4 }, delay: 0.16 },
  { src: '/people/m53.jpg', style: { top: '49%', left: '-12%', width: '50%', height: '40%', rotate: 9 }, delay: 0.24 },
]

export default function Welcome() {
  const navigate = useNavigate()
  const fillDemo = useApp((s) => s.fillDemo)

  return (
    <div className="screen welcome">
      <div className="welcome-collage" aria-hidden>
        {TILES.map((t, i) => (
          <motion.div
            key={t.src}
            className="welcome-tile"
            style={{ top: t.style.top, left: t.style.left, width: t.style.width, height: t.style.height }}
            initial={{ opacity: 0, y: 40, rotate: t.style.rotate * 1.6, scale: 0.9 }}
            animate={{ opacity: 1, y: [0, -6, 0], rotate: t.style.rotate, scale: 1 }}
            transition={{
              opacity: { delay: t.delay, duration: 0.6 },
              scale: { delay: t.delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
              rotate: { delay: t.delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
              y: { delay: 0.9 + i * 0.4, duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <FlutedImage src={t.src} strength={0.75} strips={12} className="welcome-img" />
          </motion.div>
        ))}
        <motion.div
          className="welcome-badge glass"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className="dot" /> 92 % compatibles
        </motion.div>
      </div>

      <motion.section
        className="welcome-card"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          className="welcome-cta"
          aria-label="Commencer"
          onClick={() => {
            tap(12)
            navigate('/connexion')
          }}
        >
          <svg className="welcome-cta-ring" viewBox="0 0 120 120" aria-hidden>
            <defs>
              <path id="circlePath" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
            </defs>
            <text>
              <textPath href="#circlePath" textLength="292" lengthAdjust="spacing">Commencer · Commencer · </textPath>
            </text>
          </svg>
          <span className="welcome-cta-core">
            <ArrowUpRight size={28} strokeWidth={2.2} />
          </span>
        </button>

        <p className="eyebrow welcome-eyebrow">Maya · rencontres</p>
        <h1 className="welcome-title">
          Trouve la personne <span className="serif">qui te correspond</span>
        </h1>
        <p className="welcome-sub">La personnalité d’abord : 20 questions, ton avatar 3D, et des rencontres guidées par la compatibilité.</p>

        <div className="welcome-links">
          <button onClick={() => navigate('/connexion')}>J’ai déjà un compte</button>
          <span>·</span>
          <button
            onClick={() => {
              fillDemo()
              navigate('/app')
            }}
          >
            Visite rapide
          </button>
        </div>
      </motion.section>
    </div>
  )
}
