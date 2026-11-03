import { useState } from 'react'
import { motion } from 'motion/react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, Ban, Briefcase, ChevronLeft, Flag, Heart, MapPin, MessageCircle, MoreHorizontal, X } from 'lucide-react'
import FlutedImage from '@/components/FlutedImage'
import CompatPie from '@/components/CompatPie'
import { Button, Confirm, IconButton, Sheet } from '@/components/ui'
import { PROFILE_BY_ID } from '@/data/demoProfiles'
import { QUESTIONS } from '@/data/questions'
import { useApp } from '@/store/useApp'
import { useToast } from '@/store/useToast'
import { computeCompatibility } from '@/lib/compat'
import { formatDistance } from '@/lib/geo'
import './ProfileDetail.css'

const REPORT_REASONS = [
  'Faux profil ou usurpation',
  'Contenu inapproprié',
  'Harcèlement ou propos insultants',
  'Semble avoir moins de 18 ans',
  'Arnaque ou demande d’argent',
  'Autre raison',
]

const SHOWN_ANSWERS = ['recherche', 'enfants', 'sorties', 'weekend', 'cinq_ans']

export default function ProfileDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const profile = PROFILE_BY_ID[id]
  const me = useApp((s) => s.me)
  const swipeState = useApp((s) => s.swipes[id])
  const match = useApp((s) => s.matches.find((m) => m.profileId === id))
  const hideDistance = useApp((s) => s.prefs.hideDistance)
  const swipe = useApp((s) => s.swipe)
  const block = useApp((s) => s.block)
  const report = useApp((s) => s.report)
  const toast = useToast((s) => s.show)

  const [revealing, setRevealing] = useState(false)
  const [menu, setMenu] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)

  if (!profile) return <Navigate to="/app" replace />

  const compat = computeCompatibility(me.answers, profile.answers)
  const revealed = revealing || swipeState === 'like' || !!match

  const like = () => {
    setRevealing(true)
    window.setTimeout(() => {
      const { matched } = swipe(profile.id, 'like')
      if (!matched) {
        toast(`Tu as liké ${profile.firstName}`)
        navigate(-1)
      }
    }, 1300)
  }

  const pass = () => {
    swipe(profile.id, 'pass')
    navigate(-1)
  }

  return (
    <div className="screen profile">
      <div className="scroll">
        <div className="profile-hero">
          <FlutedImage src={profile.avatarImage} revealed={revealed} strips={18} className="profile-hero-img" alt={`Avatar de ${profile.firstName}`} />
          <div className="profile-hero-shade" />
          <div className="profile-hero-bar">
            <IconButton label="Retour" className="glass profile-round" onClick={() => navigate(-1)}>
              <ChevronLeft size={22} />
            </IconButton>
            <IconButton label="Options" className="glass profile-round" onClick={() => setMenu(true)}>
              <MoreHorizontal size={22} />
            </IconButton>
          </div>
          {!revealed && <span className="profile-hint glass">Like ce profil pour dévoiler l’avatar</span>}
        </div>

        <div className="profile-body">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="profile-name">
              {profile.firstName}, <span>{profile.age}</span>
              {profile.verified && <BadgeCheck size={24} className="swipe-verified" aria-label="Profil vérifié" />}
            </h1>
            <div className="profile-facts">
              <span>
                <Briefcase size={15} /> {profile.job}
              </span>
              {!hideDistance && (
                <span>
                  <MapPin size={15} /> {formatDistance(profile.km)}
                </span>
              )}
            </div>
          </motion.div>

          <section className="profile-section glass">
            <p className="eyebrow">Votre compatibilité</p>
            <CompatPie compat={compat} />
          </section>

          {compat.highlights.length > 0 && (
            <section className="profile-section">
              <h2 className="profile-h2">Vos points communs</h2>
              <div className="profile-chips">
                {compat.highlights.map((h) => (
                  <span key={h} className="chip">
                    {h}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="profile-section">
            <h2 className="profile-h2">À propos</h2>
            <p className="profile-bio">{profile.bio}</p>
          </section>

          <section className="profile-section">
            <h2 className="profile-h2">En quelques réponses</h2>
            <ul className="profile-answers">
              {SHOWN_ANSWERS.map((qid) => {
                const q = QUESTIONS.find((x) => x.id === qid)!
                const o = q.options.find((x) => x.id === profile.answers[qid])
                if (!o) return null
                return (
                  <li key={qid}>
                    <span className="profile-answer-q">{q.title}</span>
                    <span className="profile-answer-a">
                      {o.emoji} {o.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <button className="profile-report" onClick={() => setReporting(true)}>
            <Flag size={15} /> Signaler {profile.firstName}
          </button>
        </div>
      </div>

      <div className="profile-actions">
        {match ? (
          <Button block onClick={() => navigate(`/app/messages/${match.id}`)}>
            <MessageCircle size={19} /> Envoyer un message
          </Button>
        ) : swipeState === 'like' ? (
          <p className="profile-liked">
            <Heart size={16} fill="currentColor" /> Tu as liké {profile.firstName}. Si c’est réciproque, vous serez mis en relation.
          </p>
        ) : (
          <>
            <button className="deck-btn deck-pass" aria-label="Passer" onClick={pass} disabled={revealing}>
              <X size={28} strokeWidth={2.4} />
            </button>
            <button className="deck-btn deck-like" aria-label="J’aime" onClick={like} disabled={revealing}>
              <Heart size={28} strokeWidth={2.4} fill="currentColor" />
            </button>
          </>
        )}
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)}>
        <div className="menu-list">
          <button
            onClick={() => {
              setMenu(false)
              setReporting(true)
            }}
          >
            <Flag size={19} /> Signaler
          </button>
          <button
            className="danger"
            onClick={() => {
              setMenu(false)
              setConfirmBlock(true)
            }}
          >
            <Ban size={19} /> Bloquer {profile.firstName}
          </button>
        </div>
      </Sheet>

      <Sheet open={reporting} onClose={() => setReporting(false)} title={`Pourquoi signales-tu ${profile.firstName} ?`}>
        <p className="muted sheet-sub">Ton signalement est anonyme. Notre équipe de modération l’examine sous 24 h.</p>
        <div className="menu-list">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => {
                report(profile.id)
                block(profile.id)
                setReporting(false)
                toast('Merci, signalement envoyé')
                navigate(-1)
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </Sheet>

      <Confirm
        open={confirmBlock}
        title={`Bloquer ${profile.firstName} ?`}
        message="Vous ne vous verrez plus sur Maya et votre conversation éventuelle sera supprimée. Tu peux débloquer depuis tes paramètres."
        confirmLabel="Bloquer"
        danger
        onCancel={() => setConfirmBlock(false)}
        onConfirm={() => {
          block(profile.id)
          setConfirmBlock(false)
          toast(`${profile.firstName} a été bloqué·e`)
          navigate('/app', { replace: true })
        }}
      />
    </div>
  )
}
