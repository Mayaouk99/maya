import { useState } from 'react'
import { motion } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { Button, TopBar } from '@/components/ui'
import { useApp, type AuthMethod } from '@/store/useApp'
import './auth.css'

function AppleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.37 12.62c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.55.02-2.97.9-3.77 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66l.06-.03zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.58.67-1.09 1.75-.96 2.79 1.02.08 2.05-.52 2.68-1.27z" />
    </svg>
  )
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

export default function AuthChoice() {
  const navigate = useNavigate()
  const signIn = useApp((s) => s.signIn)
  const [loading, setLoading] = useState<AuthMethod | null>(null)

  const social = (method: 'apple' | 'google') => {
    setLoading(method)
    // Démo : simule l'aller-retour avec Apple / Google.
    window.setTimeout(() => {
      signIn(method, method === 'apple' ? 'utilisateur@icloud.com' : 'utilisateur@gmail.com')
      navigate('/onboarding', { replace: true })
    }, 900)
  }

  return (
    <div className="screen auth">
      <TopBar back onBack={() => navigate('/bienvenue')} />
      <div className="auth-body">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="auth-logo">M</div>
          <h1 className="h1">
            Bienvenue sur <span className="serif accent-serif">Maya</span>
          </h1>
          <p className="auth-lead">Choisis comment tu veux te connecter. On ne publie jamais rien à ta place.</p>
        </motion.div>

        <motion.div
          className="auth-buttons"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
        >
          {[
            <Button key="apple" block className="btn-apple" onClick={() => social('apple')} disabled={!!loading}>
              <AppleLogo /> {loading === 'apple' ? 'Connexion…' : 'Continuer avec Apple'}
            </Button>,
            <Button key="google" block variant="light" onClick={() => social('google')} disabled={!!loading}>
              <GoogleLogo /> {loading === 'google' ? 'Connexion…' : 'Continuer avec Google'}
            </Button>,
            <Button key="phone" block variant="glass" onClick={() => navigate('/connexion/telephone')} disabled={!!loading}>
              <Phone size={19} /> Continuer avec mon numéro
            </Button>,
            <Button key="mail" block variant="glass" onClick={() => navigate('/connexion/email')} disabled={!!loading}>
              <Mail size={19} /> Continuer avec un e-mail
            </Button>,
          ].map((btn) => (
            <motion.div key={btn.key} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
              {btn}
            </motion.div>
          ))}
        </motion.div>

        <p className="auth-legal">
          En continuant, tu confirmes avoir 18 ans ou plus et accepter nos{' '}
          <Link to="/legal/cgu">conditions d’utilisation</Link> et notre{' '}
          <Link to="/legal/confidentialite">politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  )
}
