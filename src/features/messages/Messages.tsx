import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useApp } from '@/store/useApp'
import { PROFILE_BY_ID } from '@/data/demoProfiles'
import { timeLabel } from '@/lib/format'
import '../likes/Likes.css'
import './Messages.css'

export default function Messages() {
  const navigate = useNavigate()
  const matches = useApp((s) => s.matches)
  const messages = useApp((s) => s.messages)
  const typing = useApp((s) => s.typing)

  const fresh = matches.filter((m) => !(messages[m.id]?.length))
  const convos = matches
    .filter((m) => messages[m.id]?.length)
    .map((m) => ({ m, last: messages[m.id][messages[m.id].length - 1] }))
    .sort((a, b) => b.last.at - a.last.at)

  return (
    <div className="screen tab-screen">
      <header className="tab-header">
        <p className="eyebrow">Messages</p>
        <h1 className="h1">Tes conversations</h1>
      </header>

      <div className="scroll tab-scroll">
        {matches.length === 0 ? (
          <div className="tab-empty">
            <div className="tab-empty-icon">
              <MessageCircle size={30} />
            </div>
            <h2 className="h2">Aucun match pour l’instant</h2>
            <p className="muted">Quand un like est réciproque, la conversation apparaît ici.</p>
          </div>
        ) : (
          <>
            {fresh.length > 0 && (
              <section className="msg-section">
                <h2 className="msg-h2">Nouveaux matchs</h2>
                <div className="msg-fresh">
                  {fresh.map((m) => {
                    const p = PROFILE_BY_ID[m.profileId]
                    if (!p) return null
                    return (
                      <motion.button key={m.id} className="msg-fresh-item" whileTap={{ scale: 0.94 }} onClick={() => navigate(`/app/messages/${m.id}`)}>
                        <span className="msg-fresh-avatar">
                          <img src={p.avatarImage} alt="" />
                        </span>
                        {p.firstName}
                      </motion.button>
                    )
                  })}
                </div>
              </section>
            )}

            {convos.length > 0 && (
              <section className="msg-section">
                <h2 className="msg-h2">Discussions</h2>
                <ul className="msg-list">
                  {convos.map(({ m, last }) => {
                    const p = PROFILE_BY_ID[m.profileId]
                    if (!p) return null
                    return (
                      <li key={m.id}>
                        <button className={`msg-row ${m.unread ? 'is-unread' : ''}`} onClick={() => navigate(`/app/messages/${m.id}`)}>
                          <span className="msg-avatar">
                            <img src={p.avatarImage} alt="" />
                            {p.lastActiveMin < 30 && <i className="online-dot msg-online" />}
                          </span>
                          <span className="msg-text">
                            <strong>{p.firstName}</strong>
                            <span>{typing[m.id] ? 'écrit…' : `${last.from === 'me' ? 'Toi : ' : ''}${last.text}`}</span>
                          </span>
                          <span className="msg-side">
                            <span className="msg-time">{timeLabel(last.at)}</span>
                            {m.unread && <span className="msg-unread" />}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
