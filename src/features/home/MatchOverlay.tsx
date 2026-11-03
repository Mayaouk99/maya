import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useApp } from '@/store/useApp'
import { PROFILE_BY_ID } from '@/data/demoProfiles'
import { computeCompatibility } from '@/lib/compat'
import { Button } from '@/components/ui'
import './MatchOverlay.css'

export default function MatchOverlay() {
  const navigate = useNavigate()
  const pending = useApp((s) => s.pendingMatch)
  const match = useApp((s) => s.matches.find((m) => m.id === s.pendingMatch))
  const me = useApp((s) => s.me)
  const dismiss = useApp((s) => s.dismissPendingMatch)
  const profile = match ? PROFILE_BY_ID[match.profileId] : null
  const compat = profile ? computeCompatibility(me.answers, profile.answers).total : 0

  return (
    <AnimatePresence>
      {pending && profile && match && (
        <motion.div className="match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          <div className="match-bg" style={{ backgroundImage: `url(${profile.avatarImage})` }} />
          <div className="match-content">
            <motion.p className="eyebrow match-eyebrow" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              Vous vous êtes likés
            </motion.p>
            <motion.h1 className="match-title serif" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 14 }}>
              C’est un match
            </motion.h1>

            <div className="match-avatars">
              <motion.div className="match-avatar" initial={{ x: -120, rotate: -20, opacity: 0 }} animate={{ x: 14, rotate: -8, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 180, damping: 16 }}>
                {me.avatar?.snapshot ? <img src={me.avatar.snapshot} alt="Toi" /> : <span>{me.firstName[0]}</span>}
              </motion.div>
              <motion.div className="match-avatar" initial={{ x: 120, rotate: 20, opacity: 0 }} animate={{ x: -14, rotate: 8, opacity: 1 }} transition={{ delay: 0.38, type: 'spring', stiffness: 180, damping: 16 }}>
                <img src={profile.avatarImage} alt={profile.firstName} />
              </motion.div>
              <motion.div className="match-score" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: 'spring', stiffness: 400, damping: 14 }}>
                {compat}%
              </motion.div>
            </div>

            <p className="match-text">
              Toi et {profile.firstName} êtes compatibles à {compat} %. Lance la conversation !
            </p>

            <div className="match-actions">
              <Button
                block
                onClick={() => {
                  dismiss()
                  navigate(`/app/messages/${match.id}`)
                }}
              >
                <MessageCircle size={19} /> Envoyer un message
              </Button>
              <Button block variant="ghost" onClick={dismiss}>
                Continuer à découvrir
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
