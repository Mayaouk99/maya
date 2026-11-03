import { lazy, Suspense, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { LockKeyhole, MapPin, Sparkles } from 'lucide-react'
import { Button, Confirm, TopBar } from '@/components/ui'
import Questionnaire from './Questionnaire'
import { QUESTIONS, isQuestionAnswered } from '@/data/questions'
import { useApp, type LookingFor } from '@/store/useApp'
import type { Gender } from '@/data/demoProfiles'
import { ageFrom } from '@/lib/format'
import { DEFAULT_POSITION, getCurrentPosition } from '@/lib/geo'
import './Onboarding.css'

const AvatarStudio = lazy(() => import('./AvatarStudio'))

const STEPS = ['name', 'birth', 'gender', 'looking', 'quizIntro', 'quiz', 'avatar', 'about', 'location', 'done'] as const
type Step = (typeof STEPS)[number]

function firstIncompleteStep(me: ReturnType<typeof useApp.getState>['me']): Step {
  if (!me.firstName) return 'name'
  if (!me.birthDate) return 'birth'
  if (!me.gender) return 'gender'
  if (!me.lookingFor) return 'looking'
  if (!QUESTIONS.every((q) => isQuestionAnswered(q, me.answers))) return 'quizIntro'
  if (!me.avatar) return 'avatar'
  return 'about'
}

function Choice<T extends string>({ value, options, onChange }: { value: T | null; options: { id: T; label: string; emoji: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="ob-choices">
      {options.map((o) => (
        <button key={o.id} className={`ob-choice ${value === o.id ? 'on' : ''}`} onClick={() => onChange(o.id)}>
          <span className="ob-choice-emoji">{o.emoji}</span>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const me = useApp((s) => s.me)
  const updateMe = useApp((s) => s.updateMe)
  const setAnswer = useApp((s) => s.setAnswer)
  const setPosition = useApp((s) => s.setPosition)
  const completeOnboarding = useApp((s) => s.completeOnboarding)
  const signOut = useApp((s) => s.signOut)

  const [step, setStep] = useState<Step>(() => firstIncompleteStep(useApp.getState().me))
  const [quizIndex, setQuizIndex] = useState(() => {
    const i = QUESTIONS.findIndex((q) => !isQuestionAnswered(q, useApp.getState().me.answers))
    return i < 0 ? 0 : i
  })
  const [locating, setLocating] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)

  const idx = STEPS.indexOf(step)
  const go = (s: Step) => setStep(s)
  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, idx + 1)])

  const back = () => {
    if (step === 'quiz' && quizIndex > 0) return setQuizIndex(quizIndex - 1)
    if (idx === 0) return setConfirmQuit(true)
    setStep(STEPS[idx - 1])
  }

  // Progression : le questionnaire compte pour une large part du parcours.
  const progress = step === 'quiz' ? (5 + (quizIndex / QUESTIONS.length) * 1) / (STEPS.length - 1) : idx / (STEPS.length - 1)

  const age = me.birthDate ? ageFrom(me.birthDate) : null
  const tooYoung = age != null && age < 18
  const maxDate = new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().slice(0, 10)

  const locate = async () => {
    setLocating(true)
    try {
      const p = await getCurrentPosition()
      setPosition(p, true)
    } catch {
      setPosition(DEFAULT_POSITION, false)
    } finally {
      setLocating(false)
      next()
    }
  }

  const finish = () => {
    completeOnboarding()
    navigate('/app', { replace: true })
  }

  const showHeader = step !== 'done'

  return (
    <div className="screen onboarding">
      {showHeader && (
        <>
          <TopBar back onBack={back} title={step === 'quiz' ? 'Compatibilité' : undefined} />
          <div className="ob-progress">
            <motion.span animate={{ width: `${Math.max(4, progress * 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          </div>
        </>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          className="ob-step"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 'name' && (
            <form
              className="ob-form"
              onSubmit={(e) => {
                e.preventDefault()
                if (me.firstName.trim().length >= 2) next()
              }}
            >
              <h1 className="h1">Comment tu t’appelles ?</h1>
              <p className="ob-lead">Seul ton prénom sera visible sur ton profil.</p>
              <input
                className="ob-big-input"
                autoFocus
                autoComplete="given-name"
                placeholder="Ton prénom"
                maxLength={24}
                value={me.firstName}
                onChange={(e) => updateMe({ firstName: e.target.value.replace(/\s{2,}/g, ' ') })}
              />
              <div className="ob-footer">
                <Button block type="submit" disabled={me.firstName.trim().length < 2}>
                  Continuer
                </Button>
              </div>
            </form>
          )}

          {step === 'birth' && (
            <div className="ob-form">
              <h1 className="h1">Ta date de naissance</h1>
              <p className="ob-lead">Seul ton âge sera affiché. Maya est réservée aux personnes majeures.</p>
              <input className="ob-big-input ob-date" type="date" max={maxDate} min="1940-01-01" value={me.birthDate} onChange={(e) => updateMe({ birthDate: e.target.value })} />
              {age != null && !tooYoung && <p className="ob-age">Tu as {age} ans</p>}
              {tooYoung && <p className="field-error">Tu dois avoir au moins 18 ans pour utiliser Maya.</p>}
              <div className="ob-footer">
                <Button block onClick={next} disabled={!me.birthDate || tooYoung}>
                  Continuer
                </Button>
              </div>
            </div>
          )}

          {step === 'gender' && (
            <div className="ob-form">
              <h1 className="h1">Tu es…</h1>
              <Choice<Gender>
                value={me.gender}
                onChange={(gender) => {
                  updateMe({ gender })
                  window.setTimeout(next, 220)
                }}
                options={[
                  { id: 'femme', label: 'Une femme', emoji: '👩' },
                  { id: 'homme', label: 'Un homme', emoji: '👨' },
                  { id: 'nonbinaire', label: 'Non-binaire', emoji: '🌈' },
                ]}
              />
            </div>
          )}

          {step === 'looking' && (
            <div className="ob-form">
              <h1 className="h1">Tu aimerais rencontrer…</h1>
              <Choice<LookingFor>
                value={me.lookingFor}
                onChange={(lookingFor) => {
                  updateMe({ lookingFor })
                  window.setTimeout(next, 220)
                }}
                options={[
                  { id: 'hommes', label: 'Des hommes', emoji: '👨' },
                  { id: 'femmes', label: 'Des femmes', emoji: '👩' },
                  { id: 'tous', label: 'Tout le monde', emoji: '✨' },
                ]}
              />
            </div>
          )}

          {step === 'quizIntro' && (
            <div className="ob-form ob-center">
              <div className="ob-hero-icon">
                <Sparkles size={34} />
              </div>
              <h1 className="h1">
                20 questions <span className="serif ob-serif">pour te connaître</span>
              </h1>
              <p className="ob-lead">
                Couple, famille, valeurs, mode de vie, passions, projets. Tes réponses servent à calculer ta compatibilité avec chaque personne. Elles ne sont jamais affichées telles quelles.
              </p>
              <p className="ob-lead ob-small">Environ 3 minutes · modifiable à tout moment</p>
              <div className="ob-footer">
                <Button block onClick={() => go('quiz')}>
                  C’est parti
                </Button>
              </div>
            </div>
          )}

          {step === 'quiz' && (
            <Questionnaire index={quizIndex} answers={me.answers} onAnswer={setAnswer} onIndexChange={setQuizIndex} onFinish={() => go('avatar')} />
          )}

          {step === 'avatar' && (
            <Suspense fallback={<div className="ob-loading">Chargement du studio 3D…</div>}>
              <AvatarStudio mode="onboarding" onDone={next} />
            </Suspense>
          )}

          {step === 'about' && (
            <div className="ob-form">
              <h1 className="h1">Quelques mots sur toi</h1>
              <p className="ob-lead">Facultatif, mais les profils avec une description reçoivent bien plus de likes.</p>
              <label className="field">
                <span>Ce que tu fais</span>
                <input placeholder="Ex. Architecte, étudiante en droit…" maxLength={40} value={me.job} onChange={(e) => updateMe({ job: e.target.value })} />
              </label>
              <label className="field">
                <span>Ta bio</span>
                <textarea placeholder="Ce qui te fait vibrer, ce que tu cherches…" maxLength={300} value={me.bio} onChange={(e) => updateMe({ bio: e.target.value })} />
              </label>
              <p className="ob-counter">{me.bio.length} / 300</p>
              <div className="ob-footer">
                <Button block onClick={next}>
                  {me.bio || me.job ? 'Continuer' : 'Passer cette étape'}
                </Button>
              </div>
            </div>
          )}

          {step === 'location' && (
            <div className="ob-form ob-center">
              <div className="ob-hero-icon ob-pulse">
                <MapPin size={34} />
              </div>
              <h1 className="h1">Qui est autour de toi ?</h1>
              <p className="ob-lead">Maya utilise ta position pour te proposer des personnes proches et afficher la carte.</p>
              <div className="ob-privacy glass">
                <LockKeyhole size={18} />
                <p>Ta position exacte n’est jamais partagée : elle est arrondie à environ 1 km, et tu peux masquer ta distance.</p>
              </div>
              <div className="ob-footer">
                <Button block onClick={locate} disabled={locating}>
                  {locating ? 'Localisation…' : 'Activer la localisation'}
                </Button>
                <Button
                  block
                  variant="ghost"
                  onClick={() => {
                    setPosition(DEFAULT_POSITION, false)
                    next()
                  }}
                >
                  Plus tard
                </Button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="ob-form ob-center ob-done">
              <motion.div
                className="ob-done-avatar"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              >
                {me.avatar?.snapshot ? <img src={me.avatar.snapshot} alt="Ton avatar" /> : <span>{me.firstName[0]}</span>}
              </motion.div>
              <h1 className="h1">
                Tout est prêt, <span className="serif ob-serif">{me.firstName}</span>
              </h1>
              <p className="ob-lead">
                Les profils sont floutés : glisse à droite pour liker et découvrir l’avatar. Glisse à gauche pour passer.
              </p>
              <div className="ob-footer">
                <Button block onClick={finish}>
                  Découvrir les profils
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Confirm
        open={confirmQuit}
        title="Quitter l’inscription ?"
        message="Tes réponses sont gardées sur cet appareil, tu pourras reprendre plus tard."
        confirmLabel="Quitter"
        onCancel={() => setConfirmQuit(false)}
        onConfirm={() => {
          signOut()
          navigate('/bienvenue', { replace: true })
        }}
      />
    </div>
  )
}
