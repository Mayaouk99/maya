import { Mail } from 'lucide-react'
import { Button, TopBar } from '@/components/ui'
import './Account.css'

const FAQ = [
  ['Pourquoi les profils sont-ils floutés ?', 'Sur Maya, on découvre d’abord la compatibilité et la personnalité. L’avatar d’une personne se dévoile quand tu la likes.'],
  ['Comment est calculée la compatibilité ?', 'À partir de tes réponses aux 20 questions, réparties en six thèmes : couple, famille, valeurs, mode de vie, activités et projets. Chaque thème a son poids, et le camembert montre le détail.'],
  ['Mon vrai visage est-il visible ?', 'Non. Ton selfie sert uniquement à générer ton avatar 3D, puis il est supprimé. Les autres ne voient que ton avatar.'],
  ['Ma position exacte est-elle partagée ?', 'Jamais. Elle est arrondie à environ 1 km, et tu peux masquer ta distance dans Confidentialité.'],
  ['Comment signaler quelqu’un ?', 'Depuis son profil ou votre conversation, touche « … » puis « Signaler ». Notre équipe traite chaque signalement sous 24 h.'],
  ['Comment supprimer mon compte ?', 'Compte → Supprimer mon compte. Toutes tes données sont effacées définitivement.'],
]

export default function Help() {
  return (
    <div className="screen">
      <TopBar back title="Aide" />
      <div className="scroll sub-body">
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <Button variant="glass" block onClick={() => (window.location.href = 'mailto:contact@maya-rencontres.fr')}>
          <Mail size={18} /> Contacter l’équipe Maya
        </Button>
      </div>
    </div>
  )
}
