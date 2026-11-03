import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button, TopBar } from '@/components/ui'
import { useApp } from '@/store/useApp'
import { useToast } from '@/store/useToast'
import './auth.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function EmailAuth() {
  const navigate = useNavigate()
  const signIn = useApp((s) => s.signIn)
  const toast = useToast((s) => s.show)
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  const emailOk = EMAIL_RE.test(email.trim())
  const pwdOk = password.length >= 8
  const valid = emailOk && pwdOk

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    setLoading(true)
    window.setTimeout(() => {
      signIn('email', email.trim().toLowerCase())
      navigate('/onboarding', { replace: true })
    }, 700)
  }

  return (
    <div className="screen auth">
      <TopBar back />
      <form className="auth-body" onSubmit={submit} noValidate>
        <div>
          <h1 className="h1">{mode === 'signup' ? 'Crée ton compte' : 'Content de te revoir'}</h1>
          <p className="auth-lead">{mode === 'signup' ? 'Ton e-mail reste privé, il ne sera jamais affiché.' : 'Connecte-toi avec ton e-mail.'}</p>
        </div>

        <div className="auth-segment" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>
            Inscription
          </button>
          <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'on' : ''} onClick={() => setMode('signin')}>
            Connexion
          </button>
        </div>

        <div className="field-group">
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="toi@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {touched && !emailOk && <p className="field-error">Cette adresse e-mail ne semble pas valide.</p>}

          <label className="field">
            <span>Mot de passe</span>
            <div className="field-row">
              <input
                type={show ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="8 caractères minimum"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="field-eye" aria-label={show ? 'Masquer' : 'Afficher'} onClick={() => setShow(!show)}>
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </label>
          {touched && !pwdOk && <p className="field-error">Le mot de passe doit contenir au moins 8 caractères.</p>}

          {mode === 'signin' && (
            <button type="button" className="auth-forgot" onClick={() => toast(emailOk ? 'Lien de réinitialisation envoyé' : 'Indique d’abord ton e-mail')}>
              Mot de passe oublié ?
            </button>
          )}
        </div>

        <div className="auth-footer">
          <Button block type="submit" disabled={loading}>
            {loading ? 'Un instant…' : mode === 'signup' ? 'Créer mon compte' : 'Me connecter'}
          </Button>
        </div>
      </form>
    </div>
  )
}
