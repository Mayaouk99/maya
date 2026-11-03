import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, TopBar } from '@/components/ui'
import { useApp } from '@/store/useApp'
import { useToast } from '@/store/useToast'
import './auth.css'

const COUNTRIES = [
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+32', flag: '🇧🇪', name: 'Belgique' },
  { code: '+41', flag: '🇨🇭', name: 'Suisse' },
  { code: '+352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' },
]

/** Code de vérification de la démo (en production : envoyé par SMS). */
const DEMO_CODE = '424242'

function formatFr(digits: string) {
  return digits.replace(/(\d{1})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})/, (_, a, b, c, d, e) => [a, b, c, d, e].filter(Boolean).join(' '))
}

export default function PhoneAuth() {
  const navigate = useNavigate()
  const signIn = useApp((s) => s.signIn)
  const toast = useToast((s) => s.show)
  const [step, setStep] = useState<'number' | 'code'>('number')
  const [country, setCountry] = useState(COUNTRIES[0].code)
  const [digits, setDigits] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  const national = digits.replace(/^0/, '')
  const numberOk = national.length >= 9

  useEffect(() => {
    if (!cooldown) return
    const t = window.setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus()
  }, [step])

  const sendCode = (e?: FormEvent) => {
    e?.preventDefault()
    if (!numberOk) return
    setStep('code')
    setCooldown(30)
    setCode('')
    setError('')
  }

  const verify = (value: string) => {
    if (value.length < 6) return
    if (value === DEMO_CODE) {
      signIn('phone', `${country} ${national}`)
      navigate('/onboarding', { replace: true })
    } else {
      setError('Code incorrect, réessaie.')
      setCode('')
    }
  }

  return (
    <div className="screen auth">
      <TopBar back onBack={() => (step === 'code' ? setStep('number') : navigate(-1))} />
      {step === 'number' ? (
        <form className="auth-body" onSubmit={sendCode}>
          <div>
            <h1 className="h1">Ton numéro</h1>
            <p className="auth-lead">On t’envoie un code par SMS pour vérifier que c’est bien toi. Il ne sera jamais visible.</p>
          </div>
          <div className="phone-row">
            <label className="field phone-country">
              <span>Pays</span>
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>Numéro</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="6 12 34 56 78"
                value={formatFr(national)}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </label>
          </div>
          <div className="auth-footer">
            <Button block type="submit" disabled={!numberOk}>
              Recevoir mon code
            </Button>
          </div>
        </form>
      ) : (
        <div className="auth-body">
          <div>
            <h1 className="h1">Code reçu ?</h1>
            <p className="auth-lead">
              Saisis le code envoyé au {country} {formatFr(national)}.
            </p>
          </div>

          <label className="otp" onClick={() => codeRef.current?.focus()}>
            <input
              ref={codeRef}
              className="otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              aria-label="Code à 6 chiffres"
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(v)
                setError('')
                verify(v)
              }}
            />
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className={`otp-box ${i === code.length ? 'is-current' : ''} ${code[i] ? 'is-filled' : ''}`}>
                {code[i] ?? ''}
              </span>
            ))}
          </label>
          {error && <p className="field-error">{error}</p>}
          <p className="auth-hint">Version de démonstration : le code est {DEMO_CODE}</p>

          <button
            className="auth-forgot"
            disabled={cooldown > 0}
            onClick={() => {
              setCooldown(30)
              toast('Nouveau code envoyé')
            }}
          >
            {cooldown > 0 ? `Renvoyer le code dans ${cooldown} s` : 'Renvoyer le code'}
          </button>
        </div>
      )}
    </div>
  )
}
