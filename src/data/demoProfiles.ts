import { QUESTIONS, type Answers } from './questions'
import { rng } from '@/lib/random'

export type Gender = 'femme' | 'homme' | 'nonbinaire'

export interface Profile {
  id: string
  firstName: string
  age: number
  gender: Gender
  /** Rendu 2D de l'avatar (en démo : un portrait d'exemple). */
  avatarImage: string
  job: string
  bio: string
  answers: Answers
  /** A déjà liké l'utilisateur : un like en retour crée un match. */
  likedMe: boolean
  verified: boolean
  /** Position relative à l'utilisateur, utilisée pour placer le profil autour de lui. */
  km: number
  bearing: number
  lastActiveMin: number
}

const WOMEN = [
  ['Léa', 5], ['Camille', 9], ['Inès', 16], ['Chloé', 19], ['Manon', 20], ['Jade', 21], ['Sarah', 23],
  ['Louise', 24], ['Zoé', 25], ['Clara', 26], ['Lina', 27], ['Emma', 28], ['Alice', 30], ['Juliette', 31],
  ['Margaux', 32], ['Anaïs', 34], ['Nora', 36], ['Lucie', 38], ['Yasmine', 44], ['Maëlys', 45], ['Salomé', 47],
  ['Rose', 48],
] as const

const MEN = [
  ['Hugo', 3], ['Thomas', 8], ['Lucas', 11], ['Antoine', 12], ['Mathis', 13], ['Nathan', 14], ['Julien', 18],
  ['Adam', 33], ['Karim', 51], ['Louis', 52], ['Gabriel', 53], ['Raphaël', 54], ['Maxime', 57], ['Yanis', 59],
  ['Arthur', 60], ['Samuel', 61], ['Victor', 68],
] as const

/** Métiers au masculin / au féminin. */
const JOBS: [string, string][] = [
  ['Architecte d’intérieur', 'Architecte d’intérieur'], ['Infirmier', 'Infirmière'], ['Développeur', 'Développeuse'],
  ['Avocat', 'Avocate'], ['Chef de projet', 'Cheffe de projet'], ['Photographe', 'Photographe'],
  ['Professeur des écoles', 'Professeure des écoles'], ['Kinésithérapeute', 'Kinésithérapeute'], ['Designer produit', 'Designer produit'],
  ['Journaliste', 'Journaliste'], ['Pharmacien', 'Pharmacienne'], ['Ingénieur', 'Ingénieure'], ['Restaurateur', 'Restauratrice'],
  ['Consultant', 'Consultante'], ['Musicien', 'Musicienne'], ['Médecin', 'Médecin'], ['Entrepreneur', 'Entrepreneuse'],
  ['Chargé de communication', 'Chargée de communication'],
]

const BIOS = [
  'Amoureuse des petits cafés, des longues marches et des conversations qui finissent à 2 h du matin.',
  'Je cuisine mieux que je ne chante, mais je chante quand même. Cherche quelqu’un pour goûter (et supporter).',
  'Sportif le matin, cinéphile le soir. Ton film préféré en dit long sur toi.',
  'Toujours partant·e pour un week-end improvisé. Mon sac est prêt en 10 minutes.',
  'Calme en surface, très curieux·se en dessous. Les musées le dimanche, c’est mon truc.',
  'Je crois aux premiers rendez-vous simples : une terrasse, un verre, du temps.',
  'Fan de randonnée, de vinyles et de croissants (dans cet ordre, ou pas).',
  'Je cherche quelqu’un avec qui construire, rire et partager les petites choses.',
  'Grand cœur, humour un peu nul, très bon public pour le tien.',
  'Lecteur·rice compulsif·ve. Dis-moi ton dernier livre, je te dirai si on match.',
  'J’aime les gens qui savent ce qu’ils veulent… et ceux qui cherchent encore.',
  'Entre deux voyages, je cherche un port d’attache.',
]

function randomAnswers(r: ReturnType<typeof rng>): Answers {
  const a: Answers = {}
  for (const q of QUESTIONS) {
    if (q.kind === 'multi') {
      const pool = [...q.options]
      const n = r.int(2, q.max ?? 3)
      const picked: string[] = []
      for (let i = 0; i < n; i++) picked.push(pool.splice(r.int(0, pool.length - 1), 1)[0].id)
      a[q.id] = picked
    } else {
      // Légère tendance vers les premières options pour des profils plus “réalistes”.
      const i = Math.min(q.options.length - 1, Math.floor(r.next() ** 1.25 * q.options.length))
      a[q.id] = q.options[i].id
    }
  }
  return a
}

function build(list: readonly (readonly [string, number])[], gender: Gender, prefix: 'f' | 'm', seed: number): Profile[] {
  return list.map(([name, img], i) => {
    const r = rng(seed + i * 97)
    return {
      id: `${prefix}${img}`,
      firstName: name,
      age: r.int(22, 37),
      gender,
      avatarImage: `/people/${prefix}${img}.jpg`,
      job: r.pick(JOBS)[gender === 'femme' ? 1 : 0],
      bio: r.pick(BIOS),
      answers: randomAnswers(r),
      likedMe: r.chance(0.42),
      verified: r.chance(0.7),
      km: Math.round((0.4 + r.next() ** 1.6 * 24) * 10) / 10,
      bearing: r.int(0, 359),
      lastActiveMin: r.chance(0.35) ? r.int(1, 25) : r.int(40, 60 * 30),
    }
  })
}

export const DEMO_PROFILES: Profile[] = [...build(WOMEN, 'femme', 'f', 1337), ...build(MEN, 'homme', 'm', 4242)]

export const PROFILE_BY_ID: Record<string, Profile> = Object.fromEntries(DEMO_PROFILES.map((p) => [p.id, p]))

/** Réponses automatiques utilisées par la démo du chat. */
export const DEMO_REPLIES = [
  'Haha, j’adore ! Et toi, tu fais quoi de beau ce week-end ?',
  'C’est trop drôle, j’allais te poser exactement la même question 😄',
  'Bonne question… je dirais un petit resto italien, une balade, et voir où la soirée nous mène.',
  'J’avoue que ton profil m’a intriguée 🙂',
  'Tu as l’air d’aimer voyager, c’est quoi ton plus beau souvenir ?',
  'Je suis plutôt du genre café le matin et grandes discussions le soir.',
  'On a pas mal de points communs d’après Maya 😏',
]
