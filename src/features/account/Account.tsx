import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  ListChecks,
  LogOut,
  PenLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Confirm, Toggle } from '@/components/ui'
import { useApp } from '@/store/useApp'
import { QUESTIONS, isQuestionAnswered } from '@/data/questions'
import { ageFrom } from '@/lib/format'
import '../likes/Likes.css'
import './Account.css'

export function Row({
  icon,
  label,
  hint,
  onClick,
  right,
  danger,
}: {
  icon?: ReactNode
  label: string
  hint?: string
  onClick?: () => void
  right?: ReactNode
  danger?: boolean
}) {
  const content = (
    <>
      {icon && <span className="row-icon">{icon}</span>}
      <span className="row-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      {right ?? (onClick && <ChevronRight size={18} className="row-chevron" />)}
    </>
  )
  return onClick ? (
    <button className={`row ${danger ? 'row-danger' : ''}`} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="row">{content}</div>
  )
}

export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="group">
      {title && <h2 className="group-title">{title}</h2>}
      <div className="group-card glass">{children}</div>
    </section>
  )
}

export default function Account() {
  const navigate = useNavigate()
  const me = useApp((s) => s.me)
  const prefs = useApp((s) => s.prefs)
  const session = useApp((s) => s.session)
  const updatePrefs = useApp((s) => s.updatePrefs)
  const signOut = useApp((s) => s.signOut)
  const deleteAccount = useApp((s) => s.deleteAccount)
  const [confirm, setConfirm] = useState<null | 'logout' | 'delete'>(null)

  const answered = QUESTIONS.filter((q) => isQuestionAnswered(q, me.answers)).length
  const completion = Math.round(
    ([me.firstName, me.birthDate, me.gender, me.lookingFor, me.avatar, me.job, me.bio].filter(Boolean).length / 7) * 60 +
      (answered / QUESTIONS.length) * 40,
  )

  const methodLabel = { email: 'E-mail', phone: 'Téléphone', google: 'Google', apple: 'Apple' }[session?.method ?? 'email']

  return (
    <div className="screen tab-screen">
      <div className="scroll">
        <header className="acc-hero">
          <button className="acc-avatar" onClick={() => navigate('/app/compte/avatar')} aria-label="Modifier mon avatar">
            {me.avatar?.snapshot ? <img src={me.avatar.snapshot} alt="Mon avatar" /> : <span>{me.firstName[0] ?? '?'}</span>}
            <i className="acc-avatar-edit">
              <PenLine size={14} />
            </i>
          </button>
          <h1 className="acc-name">
            {me.firstName}
            {me.birthDate && <span>, {ageFrom(me.birthDate)}</span>}
          </h1>
          {me.job && <p className="muted">{me.job}</p>}

          <div className="acc-progress glass">
            <div className="acc-progress-top">
              <span>Profil complété</span>
              <strong>{completion} %</strong>
            </div>
            <div className="acc-bar">
              <span style={{ width: `${completion}%` }} />
            </div>
            {completion < 100 && (
              <button className="acc-progress-cta" onClick={() => navigate('/app/compte/profil')}>
                Compléter mon profil <ChevronRight size={15} />
              </button>
            )}
          </div>
        </header>

        <div className="acc-groups">
          <Group title="Mon profil">
            <Row icon={<UserRound size={19} />} label="Modifier mon profil" hint="Prénom, métier, bio" onClick={() => navigate('/app/compte/profil')} />
            <Row icon={<Sparkles size={19} />} label="Mon avatar 3D" hint="Coiffure, tenue, teint" onClick={() => navigate('/app/compte/avatar')} />
            <Row
              icon={<ListChecks size={19} />}
              label="Mes réponses"
              hint={`${answered} / ${QUESTIONS.length} questions de compatibilité`}
              onClick={() => navigate('/app/compte/questionnaire')}
            />
          </Group>

          <Group title="Rencontres">
            <Row
              icon={<SlidersHorizontal size={19} />}
              label="Préférences de recherche"
              hint={`${prefs.ageMin}–${prefs.ageMax} ans · ${prefs.maxKm} km`}
              onClick={() => navigate('/app/compte/preferences')}
            />
          </Group>

          <Group title="Notifications">
            <Row icon={<Bell size={19} />} label="Nouveaux matchs" right={<Toggle label="Nouveaux matchs" checked={prefs.notifMatches} onChange={(v) => updatePrefs({ notifMatches: v })} />} />
            <Row icon={<Bell size={19} />} label="Messages" right={<Toggle label="Messages" checked={prefs.notifMessages} onChange={(v) => updatePrefs({ notifMessages: v })} />} />
            <Row icon={<Bell size={19} />} label="Likes reçus" right={<Toggle label="Likes reçus" checked={prefs.notifLikes} onChange={(v) => updatePrefs({ notifLikes: v })} />} />
          </Group>

          <Group title="Compte">
            <Row icon={<ShieldCheck size={19} />} label="Confidentialité et sécurité" hint="Distance, mode incognito, blocages" onClick={() => navigate('/app/compte/confidentialite')} />
            <Row icon={<HelpCircle size={19} />} label="Aide et contact" onClick={() => navigate('/app/compte/aide')} />
            <Row icon={<FileText size={19} />} label="Conditions d’utilisation" onClick={() => navigate('/legal/cgu')} />
            <Row icon={<FileText size={19} />} label="Politique de confidentialité" onClick={() => navigate('/legal/confidentialite')} />
          </Group>

          <Group>
            <Row icon={<LogOut size={19} />} label="Se déconnecter" hint={`Connecté·e via ${methodLabel}`} onClick={() => setConfirm('logout')} />
            <Row icon={<Trash2 size={19} />} label="Supprimer mon compte" danger onClick={() => setConfirm('delete')} />
          </Group>

          <p className="acc-version">Maya · version 0.1 (démo)</p>
        </div>
      </div>

      <Confirm
        open={confirm === 'logout'}
        title="Se déconnecter ?"
        message="Tu pourras te reconnecter à tout moment."
        confirmLabel="Me déconnecter"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          signOut()
          navigate('/bienvenue', { replace: true })
        }}
      />
      <Confirm
        open={confirm === 'delete'}
        title="Supprimer ton compte ?"
        message="Ton profil, ton avatar, tes matchs et tes messages seront définitivement effacés. Cette action est irréversible."
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          deleteAccount()
          navigate('/bienvenue', { replace: true })
        }}
      />
    </div>
  )
}
