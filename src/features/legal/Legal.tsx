import { Navigate, useParams } from 'react-router-dom'
import { TopBar } from '@/components/ui'
import '../account/Account.css'
import './Legal.css'

/**
 * ⚠️ Textes provisoires : à faire relire par un juriste avant la publication sur les stores.
 */
const DOCS: Record<string, { title: string; sections: [string, string][] }> = {
  cgu: {
    title: 'Conditions d’utilisation',
    sections: [
      ['1. Objet', 'Maya est un service de rencontres qui met en relation des personnes majeures sur la base de leur compatibilité.'],
      ['2. Conditions d’accès', 'Le service est strictement réservé aux personnes âgées de 18 ans ou plus. Un seul compte par personne est autorisé.'],
      ['3. Comportement', 'Sont interdits : le harcèlement, les propos haineux, les contenus sexuels non sollicités, les arnaques, l’usurpation d’identité et toute sollicitation commerciale.'],
      ['4. Modération', 'Chaque utilisateur peut signaler ou bloquer un profil. Maya peut suspendre ou supprimer tout compte qui ne respecte pas ces règles.'],
      ['5. Suppression du compte', 'Tu peux supprimer ton compte à tout moment depuis l’application. Tes données sont alors effacées.'],
    ],
  },
  confidentialite: {
    title: 'Politique de confidentialité',
    sections: [
      ['Données collectées', 'Prénom, date de naissance, genre, préférences, réponses au questionnaire, avatar 3D, position approximative, messages.'],
      ['Selfie', 'Ta photo sert uniquement à générer ton avatar 3D. Elle n’est jamais affichée aux autres utilisateurs et est supprimée après la génération.'],
      ['Localisation', 'Ta position est arrondie à environ 1 km avant d’être enregistrée. Elle sert à te proposer des personnes proches.'],
      ['Tes droits (RGPD)', 'Tu peux accéder à tes données, les rectifier, les exporter ou les supprimer à tout moment depuis l’application ou en écrivant à contact@maya-rencontres.fr.'],
      ['Conservation', 'Les données sont conservées tant que ton compte est actif, puis supprimées.'],
    ],
  },
}

export default function Legal() {
  const { doc = '' } = useParams()
  const d = DOCS[doc]
  if (!d) return <Navigate to="/" replace />
  return (
    <div className="screen">
      <TopBar back title={d.title} />
      <div className="scroll sub-body legal">
        <p className="legal-draft">Version provisoire · dernière mise à jour : novembre 2026</p>
        {d.sections.map(([h, p]) => (
          <section key={h}>
            <h2>{h}</h2>
            <p>{p}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
