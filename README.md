# Maya — application de rencontres

Application mobile (iOS + Android) de rencontres basée sur la compatibilité :
20 questions, un avatar 3D réaliste créé à partir d'un selfie, des profils floutés qui se dévoilent au like.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # vérification TypeScript + build de production
```

Version web de suivi : déployée automatiquement par Netlify à chaque push sur `main` (`netlify.toml`).

## Organisation

| Dossier | Contenu |
| --- | --- |
| `src/features/welcome` | Page d'accueil (collage, bouton « Commencer ») |
| `src/features/auth` | Connexion : Apple, Google, téléphone (SMS), e-mail |
| `src/features/onboarding` | Inscription : prénom, âge (18+), genre, recherche, **questionnaire**, **studio avatar 3D**, bio, localisation |
| `src/features/home` | Pile de profils à swiper, effet de dévoilement au like, écran « C'est un match » |
| `src/features/map` | Radar des personnes autour de moi (bouton en haut à droite de l'accueil) |
| `src/features/likes` | Personnes qui m'ont liké (floutées) |
| `src/features/messages` | Conversations, chat, bouton « Faire un date » (désactivé, bientôt) |
| `src/features/account` | Compte : profil, avatar, réponses, préférences, notifications, confidentialité, blocages, aide, suppression du compte |
| `src/features/profile` | Fiche profil avec le camembert de compatibilité, signalement, blocage |
| `src/data/questions.ts` | Les 20 questions et les 6 catégories du camembert (poids modifiables) |
| `src/lib/compat.ts` | Calcul de compatibilité |
| `src/three/Avatar3D.tsx` | Rendu de l'avatar 3D (three.js) |
| `src/store/useApp.ts` | État de l'app (aujourd'hui simulé sur l'appareil, demain branché au serveur) |

## État d'avancement

**Étape 1 — interface complète (fait)** : tous les écrans, avec de faux profils et des données simulées sur l'appareil.
Code SMS de démonstration : `424242`.

**Étape 2 — à venir**
- Serveur (Supabase) : vrais comptes, profils, likes/matchs, chat en temps réel, modération.
- Génération de l'avatar 3D à partir du selfie (prestataire type MetaPerson / Avatar SDK). En démo, un modèle d'exemple est utilisé.
- Applications natives avec Capacitor (`capacitor.config.ts`, identifiant `fr.mayarencontres.app`), puis publication App Store / Google Play.
- Textes légaux (CGU, confidentialité) à faire valider par un juriste.

## Crédits des ressources de démo
- Avatar 3D d'exemple : MetaPerson sample avatar © Itseez3D (licence BSD-3).
- Portraits des faux profils : pravatar.cc (démonstration uniquement, à retirer en production).
