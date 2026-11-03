import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Ban, CalendarHeart, ChevronLeft, Flag, HeartCrack, MoreHorizontal, SendHorizontal } from 'lucide-react'
import { Confirm, IconButton, Sheet } from '@/components/ui'
import { useApp } from '@/store/useApp'
import { useToast } from '@/store/useToast'
import { PROFILE_BY_ID } from '@/data/demoProfiles'
import { computeCompatibility } from '@/lib/compat'
import { relativeLabel } from '@/lib/format'
import './Chat.css'

export default function Chat() {
  const { matchId = '' } = useParams()
  const navigate = useNavigate()
  const match = useApp((s) => s.matches.find((m) => m.id === matchId))
  const messages = useApp((s) => s.messages[matchId]) ?? []
  const typing = useApp((s) => s.typing[matchId])
  const myAnswers = useApp((s) => s.me.answers)
  const sendMessage = useApp((s) => s.sendMessage)
  const markRead = useApp((s) => s.markRead)
  const unmatch = useApp((s) => s.unmatch)
  const block = useApp((s) => s.block)
  const report = useApp((s) => s.report)
  const toast = useToast((s) => s.show)
  const [text, setText] = useState('')
  const [menu, setMenu] = useState(false)
  const [confirm, setConfirm] = useState<null | 'unmatch' | 'block'>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const profile = match ? PROFILE_BY_ID[match.profileId] : null

  useEffect(() => {
    if (match?.unread) markRead(match.id)
  }, [match, messages.length, markRead])

  useLayoutEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, typing])

  if (!match || !profile) return <Navigate to="/app/messages" replace />

  const compat = computeCompatibility(myAnswers, profile.answers)
  const icebreakers = [
    `Salut ${profile.firstName} ! Maya dit qu’on est compatibles à ${compat.total} %, tu y crois ? 😄`,
    compat.highlights[0] ? `J’ai vu qu’on avait un point commun : ${compat.highlights[0].replace(/^\S+\s/, '').toLowerCase()} !` : 'Ton week-end idéal, ça ressemble à quoi ?',
    'Quel est le meilleur endroit où tu sois allé·e cette année ?',
  ]

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const t = text.trim()
    if (!t) return
    sendMessage(match.id, t)
    setText('')
  }

  return (
    <div className="screen chat">
      <header className="chat-header">
        <IconButton label="Retour" onClick={() => navigate('/app/messages')}>
          <ChevronLeft size={24} />
        </IconButton>
        <button className="chat-person" onClick={() => navigate(`/app/profil/${profile.id}`)}>
          <img src={profile.avatarImage} alt="" />
          <span>
            <strong>{profile.firstName}</strong>
            <small>{typing ? 'écrit…' : profile.lastActiveMin < 30 ? 'En ligne' : `${compat.total} % compatibles`}</small>
          </span>
        </button>
        <button className="chat-date" disabled aria-disabled="true" title="Bientôt disponible">
          <CalendarHeart size={17} />
          Faire un date
          <span className="chat-soon">Bientôt</span>
        </button>
        <IconButton label="Options" onClick={() => setMenu(true)}>
          <MoreHorizontal size={22} />
        </IconButton>
      </header>

      <div className="chat-list scroll" ref={listRef}>
        <div className="chat-intro">
          <img src={profile.avatarImage} alt="" />
          <p>
            Vous avez matché {relativeLabel(match.createdAt)}
            <br />
            <strong>Compatibles à {compat.total} %</strong>
          </p>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const prev = messages[i - 1]
            const grouped = prev && prev.from === m.from && m.at - prev.at < 120000
            return (
              <motion.div
                key={m.id}
                className={`bubble-row ${m.from === 'me' ? 'is-me' : ''} ${grouped ? 'is-grouped' : ''}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              >
                <p className="bubble">{m.text}</p>
              </motion.div>
            )
          })}
          {typing && (
            <motion.div key="typing" className="bubble-row" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="bubble bubble-typing">
                <span />
                <span />
                <span />
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length === 0 && (
          <div className="chat-icebreakers">
            <p className="eyebrow">Pour briser la glace</p>
            {icebreakers.map((ib) => (
              <button key={ib} onClick={() => setText(ib)}>
                {ib}
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="chat-input" onSubmit={submit}>
        <input
          placeholder={`Écris à ${profile.firstName}…`}
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          enterKeyHint="send"
        />
        <button type="submit" className="chat-send" aria-label="Envoyer" disabled={!text.trim()}>
          <SendHorizontal size={20} />
        </button>
      </form>

      <Sheet open={menu} onClose={() => setMenu(false)}>
        <div className="menu-list">
          <button
            onClick={() => {
              setMenu(false)
              setConfirm('unmatch')
            }}
          >
            <HeartCrack size={19} /> Annuler le match
          </button>
          <button
            onClick={() => {
              report(profile.id)
              setMenu(false)
              toast('Merci, signalement envoyé')
            }}
          >
            <Flag size={19} /> Signaler
          </button>
          <button
            className="danger"
            onClick={() => {
              setMenu(false)
              setConfirm('block')
            }}
          >
            <Ban size={19} /> Bloquer {profile.firstName}
          </button>
        </div>
      </Sheet>

      <Confirm
        open={!!confirm}
        title={confirm === 'block' ? `Bloquer ${profile.firstName} ?` : 'Annuler ce match ?'}
        message={
          confirm === 'block'
            ? 'Vous ne vous verrez plus sur Maya et cette conversation sera supprimée.'
            : 'La conversation sera supprimée pour vous deux. Cette action est définitive.'
        }
        confirmLabel={confirm === 'block' ? 'Bloquer' : 'Annuler le match'}
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === 'block') block(profile.id)
          else unmatch(match.id)
          setConfirm(null)
          navigate('/app/messages', { replace: true })
        }}
      />
    </div>
  )
}
