/**
 * Les 20 questions de présélection de Maya.
 *
 * Chaque question appartient à une catégorie du “camembert” de compatibilité.
 * - `ordinal`     : les options vont d'un extrême à l'autre ; deux réponses proches sont compatibles.
 * - `categorical` : seules des réponses identiques (ou listées dans `matrix`) sont compatibles.
 * - `multi`       : plusieurs choix possibles ; on compare les centres d'intérêt communs.
 */

export type CategoryId = 'couple' | 'famille' | 'valeurs' | 'vie' | 'activites' | 'projets'

export interface Category {
  id: CategoryId
  label: string
  short: string
  color: string
  weight: number
}

export const CATEGORIES: Category[] = [
  { id: 'couple', label: 'Vision du couple', short: 'Couple', color: '#c8f560', weight: 25 },
  { id: 'famille', label: 'Famille & avenir à deux', short: 'Famille', color: '#7fe3b4', weight: 25 },
  { id: 'valeurs', label: 'Valeurs', short: 'Valeurs', color: '#ead68a', weight: 15 },
  { id: 'vie', label: 'Mode de vie', short: 'Mode de vie', color: '#8cc8ff', weight: 15 },
  { id: 'activites', label: 'Activités & passions', short: 'Activités', color: '#f4a07f', weight: 10 },
  { id: 'projets', label: 'Projets de vie', short: 'Projets', color: '#c9a8ff', weight: 10 },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>

export interface Question {
  id: string
  category: CategoryId
  title: string
  hint?: string
  kind: 'ordinal' | 'categorical' | 'multi'
  options: { id: string; label: string; emoji: string }[]
  /** Pour `multi` : nombre maximum de choix. */
  max?: number
  /** Compatibilités croisées pour `categorical` (0 → 1). Symétrique. */
  matrix?: Record<string, Record<string, number>>
}

export const QUESTIONS: Question[] = [
  // ——— Couple ———
  {
    id: 'recherche',
    category: 'couple',
    title: 'Qu’est-ce que tu recherches sur Maya ?',
    kind: 'ordinal',
    options: [
      { id: 'serieux', label: 'Une relation sérieuse', emoji: '💍' },
      { id: 'voir', label: 'Voir où ça mène', emoji: '🌱' },
      { id: 'leger', label: 'Des rencontres sans prise de tête', emoji: '✨' },
    ],
  },
  {
    id: 'independance',
    category: 'couple',
    title: 'En couple, tu as plutôt besoin…',
    kind: 'ordinal',
    options: [
      { id: 'fusion', label: 'De passer un maximum de temps à deux', emoji: '🫶' },
      { id: 'equilibre', label: 'D’un bon équilibre entre nous et moi', emoji: '⚖️' },
      { id: 'espace', label: 'De beaucoup d’espace et de liberté', emoji: '🕊️' },
    ],
  },
  {
    id: 'affection',
    category: 'couple',
    title: 'Comment montres-tu le plus ton affection ?',
    kind: 'categorical',
    options: [
      { id: 'mots', label: 'Par les mots', emoji: '💬' },
      { id: 'temps', label: 'En passant du temps ensemble', emoji: '⏳' },
      { id: 'gestes', label: 'Par des petites attentions', emoji: '🎁' },
      { id: 'tendresse', label: 'Par la tendresse', emoji: '🤍' },
      { id: 'services', label: 'En rendant service', emoji: '🛠️' },
    ],
  },
  {
    id: 'conflit',
    category: 'couple',
    title: 'Face à un désaccord, tu…',
    kind: 'ordinal',
    options: [
      { id: 'direct', label: 'En parles tout de suite', emoji: '🗣️' },
      { id: 'recul', label: 'Prends du recul, puis en parles', emoji: '🌬️' },
      { id: 'evite', label: 'Préfères laisser passer', emoji: '🙈' },
    ],
  },

  // ——— Famille ———
  {
    id: 'enfants',
    category: 'famille',
    title: 'Et les enfants ?',
    kind: 'categorical',
    options: [
      { id: 'veux', label: 'J’en veux un jour', emoji: '👶' },
      { id: 'ai_veux', label: 'J’en ai et j’en veux d’autres', emoji: '👨‍👩‍👧‍👦' },
      { id: 'ai', label: 'J’en ai, ça me suffit', emoji: '👨‍👧' },
      { id: 'pas', label: 'Je n’en veux pas', emoji: '🙅' },
      { id: 'sais_pas', label: 'Je ne sais pas encore', emoji: '🤔' },
    ],
    matrix: {
      veux: { veux: 1, ai_veux: 0.9, ai: 0.45, pas: 0, sais_pas: 0.6 },
      ai_veux: { ai_veux: 1, ai: 0.5, pas: 0, sais_pas: 0.55 },
      ai: { ai: 1, pas: 0.7, sais_pas: 0.6 },
      pas: { pas: 1, sais_pas: 0.45 },
      sais_pas: { sais_pas: 0.8 },
    },
  },
  {
    id: 'famille_place',
    category: 'famille',
    title: 'Quelle place a ta famille dans ta vie ?',
    kind: 'ordinal',
    options: [
      { id: 'centrale', label: 'Centrale, on se voit très souvent', emoji: '🏡' },
      { id: 'importante', label: 'Importante, mais à distance', emoji: '📞' },
      { id: 'discrete', label: 'Plutôt discrète', emoji: '🌙' },
    ],
  },
  {
    id: 'vivre_ensemble',
    category: 'famille',
    title: 'Emménager ensemble, pour toi c’est…',
    kind: 'ordinal',
    options: [
      { id: 'vite', label: 'Assez vite si c’est sérieux', emoji: '📦' },
      { id: 'temps', label: 'Après un an ou deux', emoji: '🗓️' },
      { id: 'chacun', label: 'Chacun chez soi, c’est bien aussi', emoji: '🔑' },
    ],
  },
  {
    id: 'mariage',
    category: 'famille',
    title: 'Le mariage…',
    kind: 'ordinal',
    options: [
      { id: 'essentiel', label: 'C’est important pour moi', emoji: '💒' },
      { id: 'pourquoi_pas', label: 'Pourquoi pas, avec la bonne personne', emoji: '🙂' },
      { id: 'non', label: 'Ce n’est pas pour moi', emoji: '🚫' },
    ],
  },

  // ——— Valeurs ———
  {
    id: 'spiritualite',
    category: 'valeurs',
    title: 'La religion ou la spiritualité, dans ta vie ?',
    kind: 'ordinal',
    options: [
      { id: 'tres', label: 'Très importante', emoji: '🕯️' },
      { id: 'un_peu', label: 'Un peu', emoji: '🌤️' },
      { id: 'pas', label: 'Pas du tout', emoji: '🔬' },
    ],
  },
  {
    id: 'argent',
    category: 'valeurs',
    title: 'Ton rapport à l’argent ?',
    kind: 'ordinal',
    options: [
      { id: 'econome', label: 'J’épargne et je prévois', emoji: '🐷' },
      { id: 'equilibre', label: 'Je profite, mais raisonnablement', emoji: '⚖️' },
      { id: 'depense', label: 'L’argent, c’est fait pour vivre', emoji: '💸' },
    ],
  },
  {
    id: 'engagement',
    category: 'valeurs',
    title: 'Les causes (écologie, solidarité, société)…',
    kind: 'ordinal',
    options: [
      { id: 'engage', label: 'Je m’engage activement', emoji: '✊' },
      { id: 'sensible', label: 'J’y suis sensible au quotidien', emoji: '🌍' },
      { id: 'peu', label: 'Ce n’est pas ma priorité', emoji: '🤷' },
    ],
  },

  // ——— Mode de vie ———
  {
    id: 'rythme',
    category: 'vie',
    title: 'Tu es plutôt…',
    kind: 'ordinal',
    options: [
      { id: 'matin', label: 'Du matin', emoji: '🌅' },
      { id: 'flexible', label: 'Ça dépend des jours', emoji: '🔄' },
      { id: 'soir', label: 'Oiseau de nuit', emoji: '🦉' },
    ],
  },
  {
    id: 'sorties',
    category: 'vie',
    title: 'Un vendredi soir idéal ?',
    kind: 'ordinal',
    options: [
      { id: 'dehors', label: 'Dehors, en soirée', emoji: '🍸' },
      { id: 'mix', label: 'Un dîner entre amis', emoji: '🍝' },
      { id: 'maison', label: 'Plaid, série et calme', emoji: '🛋️' },
    ],
  },
  {
    id: 'sport',
    category: 'vie',
    title: 'Le sport et toi ?',
    kind: 'ordinal',
    options: [
      { id: 'quotidien', label: 'Presque tous les jours', emoji: '🏃' },
      { id: 'regulier', label: 'Deux ou trois fois par semaine', emoji: '🚴' },
      { id: 'parfois', label: 'De temps en temps', emoji: '🚶' },
      { id: 'jamais', label: 'Très peu', emoji: '🧘' },
    ],
  },
  {
    id: 'tabac_alcool',
    category: 'vie',
    title: 'Tabac et alcool ?',
    kind: 'ordinal',
    options: [
      { id: 'aucun', label: 'Ni l’un ni l’autre', emoji: '🚫' },
      { id: 'occasion', label: 'Un verre de temps en temps', emoji: '🥂' },
      { id: 'regulier', label: 'Régulièrement', emoji: '🚬' },
    ],
  },

  // ——— Activités ———
  {
    id: 'passions',
    category: 'activites',
    title: 'Tes passions',
    hint: 'Choisis jusqu’à 3 réponses',
    kind: 'multi',
    max: 3,
    options: [
      { id: 'sport', label: 'Sport', emoji: '⚽' },
      { id: 'musique', label: 'Musique', emoji: '🎧' },
      { id: 'cinema', label: 'Cinéma & séries', emoji: '🎬' },
      { id: 'cuisine', label: 'Cuisine', emoji: '🍳' },
      { id: 'voyages', label: 'Voyages', emoji: '✈️' },
      { id: 'lecture', label: 'Lecture', emoji: '📚' },
      { id: 'art', label: 'Art & expos', emoji: '🎨' },
      { id: 'nature', label: 'Nature & rando', emoji: '🏔️' },
      { id: 'jeux', label: 'Jeux vidéo', emoji: '🎮' },
      { id: 'mode', label: 'Mode', emoji: '👗' },
    ],
  },
  {
    id: 'weekend',
    category: 'activites',
    title: 'Ton week-end parfait ?',
    kind: 'categorical',
    options: [
      { id: 'nature', label: 'Au grand air', emoji: '🌲' },
      { id: 'culture', label: 'Musées, concerts, expos', emoji: '🖼️' },
      { id: 'fete', label: 'Faire la fête avec mes amis', emoji: '🎉' },
      { id: 'cocooning', label: 'Cocooning à la maison', emoji: '☕' },
      { id: 'escapade', label: 'Une escapade improvisée', emoji: '🚗' },
    ],
    matrix: {
      nature: { escapade: 0.7, culture: 0.4, cocooning: 0.3, fete: 0.3 },
      culture: { escapade: 0.6, cocooning: 0.5, fete: 0.4 },
      fete: { escapade: 0.5, cocooning: 0.15 },
      cocooning: { escapade: 0.3 },
    },
  },
  {
    id: 'vacances',
    category: 'activites',
    title: 'En vacances, tu préfères…',
    kind: 'categorical',
    options: [
      { id: 'aventure', label: 'L’aventure et l’inconnu', emoji: '🧭' },
      { id: 'plage', label: 'La plage et le farniente', emoji: '🏖️' },
      { id: 'ville', label: 'Découvrir une ville', emoji: '🏙️' },
      { id: 'roadtrip', label: 'Un road trip', emoji: '🛣️' },
    ],
    matrix: {
      aventure: { roadtrip: 0.8, ville: 0.45, plage: 0.3 },
      plage: { roadtrip: 0.45, ville: 0.4 },
      ville: { roadtrip: 0.6 },
    },
  },

  // ——— Projets ———
  {
    id: 'cinq_ans',
    category: 'projets',
    title: 'Dans cinq ans, ta priorité ?',
    kind: 'categorical',
    options: [
      { id: 'famille', label: 'Construire une famille', emoji: '🏠' },
      { id: 'carriere', label: 'Ma carrière', emoji: '📈' },
      { id: 'voyager', label: 'Voyager, découvrir', emoji: '🌏' },
      { id: 'serenite', label: 'Une vie stable et sereine', emoji: '🌿' },
    ],
    matrix: {
      famille: { serenite: 0.8, carriere: 0.4, voyager: 0.3 },
      carriere: { voyager: 0.5, serenite: 0.5 },
      voyager: { serenite: 0.4 },
    },
  },
  {
    id: 'lieu_vie',
    category: 'projets',
    title: 'Où te vois-tu vivre ?',
    kind: 'ordinal',
    options: [
      { id: 'grande_ville', label: 'En grande ville', emoji: '🌆' },
      { id: 'ville', label: 'Dans une ville à taille humaine', emoji: '🏘️' },
      { id: 'campagne', label: 'À la campagne', emoji: '🌾' },
    ],
  },
]

export type Answers = Record<string, string | string[]>

export function isQuestionAnswered(q: Question, a: Answers): boolean {
  const v = a[q.id]
  return q.kind === 'multi' ? Array.isArray(v) && v.length > 0 : typeof v === 'string'
}
