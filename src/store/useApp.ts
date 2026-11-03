import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Answers } from '@/data/questions'
import { DEMO_PROFILES, DEMO_REPLIES, PROFILE_BY_ID, type Gender, type Profile } from '@/data/demoProfiles'
import { approximate, type LatLng } from '@/lib/geo'
import { uid } from '@/lib/random'

/**
 * État de l'application.
 *
 * Étape 1 (démo) : tout est simulé et stocké sur l'appareil.
 * Étape 2 : chaque action ici (signIn, swipe, sendMessage…) sera branchée sur le serveur (Supabase)
 * sans changer les écrans.
 */

export type AuthMethod = 'email' | 'phone' | 'google' | 'apple'
export type LookingFor = 'femmes' | 'hommes' | 'tous'

export interface AvatarLook {
  hair: string
  outfit: string
  /** -1 (plus clair) → 1 (plus mat) */
  skin: number
  background: string
  /** Rendu JPEG de l'avatar (data URL) pour les vignettes. */
  snapshot?: string
}

export interface Me {
  firstName: string
  birthDate: string
  gender: Gender | null
  lookingFor: LookingFor | null
  job: string
  bio: string
  answers: Answers
  avatar: AvatarLook | null
  position: LatLng | null
  positionIsReal: boolean
}

export interface Prefs {
  ageMin: number
  ageMax: number
  maxKm: number
  notifMatches: boolean
  notifMessages: boolean
  notifLikes: boolean
  hideDistance: boolean
  incognito: boolean
}

export interface Match {
  id: string
  profileId: string
  createdAt: number
  unread: boolean
}

export interface Message {
  id: string
  from: 'me' | 'them'
  text: string
  at: number
}

interface Session {
  method: AuthMethod
  identifier: string
  createdAt: number
}

interface State {
  session: Session | null
  onboarded: boolean
  me: Me
  prefs: Prefs
  swipes: Record<string, 'like' | 'pass'>
  matches: Match[]
  messages: Record<string, Message[]>
  blocked: string[]
  reported: string[]
  typing: Record<string, boolean>
  /** Match tout juste créé : affiche l'écran « C'est un match ». */
  pendingMatch: string | null

  signIn: (method: AuthMethod, identifier: string) => void
  signOut: () => void
  deleteAccount: () => void
  updateMe: (patch: Partial<Me>) => void
  setAnswer: (questionId: string, value: string | string[]) => void
  setAvatar: (look: AvatarLook) => void
  setPosition: (p: LatLng, real: boolean) => void
  completeOnboarding: () => void
  updatePrefs: (patch: Partial<Prefs>) => void
  swipe: (profileId: string, dir: 'like' | 'pass') => { matched: boolean }
  dismissPendingMatch: () => void
  sendMessage: (matchId: string, text: string) => void
  markRead: (matchId: string) => void
  unmatch: (matchId: string) => void
  block: (profileId: string) => void
  unblock: (profileId: string) => void
  report: (profileId: string) => void
  resetPasses: () => void
  fillDemo: () => void
}

const emptyMe: Me = {
  firstName: '',
  birthDate: '',
  gender: null,
  lookingFor: null,
  job: '',
  bio: '',
  answers: {},
  avatar: null,
  position: null,
  positionIsReal: false,
}

const defaultPrefs: Prefs = {
  ageMin: 21,
  ageMax: 40,
  maxKm: 25,
  notifMatches: true,
  notifMessages: true,
  notifLikes: true,
  hideDistance: false,
  incognito: false,
}

const replyTimers = new Map<string, number>()

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      session: null,
      onboarded: false,
      me: emptyMe,
      prefs: defaultPrefs,
      swipes: {},
      matches: [],
      messages: {},
      blocked: [],
      reported: [],
      typing: {},
      pendingMatch: null,

      signIn: (method, identifier) => set({ session: { method, identifier, createdAt: Date.now() } }),

      signOut: () => set({ session: null }),

      deleteAccount: () =>
        set({
          session: null,
          onboarded: false,
          me: emptyMe,
          prefs: defaultPrefs,
          swipes: {},
          matches: [],
          messages: {},
          blocked: [],
          reported: [],
          pendingMatch: null,
        }),

      updateMe: (patch) => set((s) => ({ me: { ...s.me, ...patch } })),

      setAnswer: (questionId, value) => set((s) => ({ me: { ...s.me, answers: { ...s.me.answers, [questionId]: value } } })),

      setAvatar: (look) => set((s) => ({ me: { ...s.me, avatar: look } })),

      setPosition: (p, real) => set((s) => ({ me: { ...s.me, position: approximate(p), positionIsReal: real } })),

      completeOnboarding: () => set({ onboarded: true }),

      updatePrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),

      swipe: (profileId, dir) => {
        const profile = PROFILE_BY_ID[profileId]
        set((s) => ({ swipes: { ...s.swipes, [profileId]: dir } }))
        if (dir === 'like' && profile?.likedMe && !get().matches.some((m) => m.profileId === profileId)) {
          const match: Match = { id: uid('m_'), profileId, createdAt: Date.now(), unread: true }
          set((s) => ({ matches: [match, ...s.matches], pendingMatch: match.id }))
          return { matched: true }
        }
        return { matched: false }
      },

      dismissPendingMatch: () => set({ pendingMatch: null }),

      sendMessage: (matchId, text) => {
        const msg: Message = { id: uid('msg_'), from: 'me', text, at: Date.now() }
        set((s) => ({ messages: { ...s.messages, [matchId]: [...(s.messages[matchId] ?? []), msg] } }))

        // Démo : la personne répond après quelques secondes.
        window.clearTimeout(replyTimers.get(matchId))
        const startTyping = window.setTimeout(() => {
          set((s) => ({ typing: { ...s.typing, [matchId]: true } }))
          const reply = window.setTimeout(() => {
            const count = (get().messages[matchId] ?? []).filter((m) => m.from === 'them').length
            const answer: Message = {
              id: uid('msg_'),
              from: 'them',
              text: DEMO_REPLIES[count % DEMO_REPLIES.length],
              at: Date.now(),
            }
            set((s) => ({
              typing: { ...s.typing, [matchId]: false },
              messages: { ...s.messages, [matchId]: [...(s.messages[matchId] ?? []), answer] },
              matches: s.matches.map((m) => (m.id === matchId ? { ...m, unread: true } : m)),
            }))
          }, 1800 + Math.random() * 1500)
          replyTimers.set(matchId, reply)
        }, 1200)
        replyTimers.set(matchId, startTyping)
      },

      markRead: (matchId) =>
        set((s) => ({ matches: s.matches.map((m) => (m.id === matchId ? { ...m, unread: false } : m)) })),

      unmatch: (matchId) =>
        set((s) => {
          const messages = { ...s.messages }
          delete messages[matchId]
          return { matches: s.matches.filter((m) => m.id !== matchId), messages }
        }),

      block: (profileId) =>
        set((s) => ({
          blocked: s.blocked.includes(profileId) ? s.blocked : [...s.blocked, profileId],
          matches: s.matches.filter((m) => m.profileId !== profileId),
        })),

      unblock: (profileId) => set((s) => ({ blocked: s.blocked.filter((b) => b !== profileId) })),

      report: (profileId) =>
        set((s) => ({ reported: s.reported.includes(profileId) ? s.reported : [...s.reported, profileId] })),

      resetPasses: () =>
        set((s) => ({ swipes: Object.fromEntries(Object.entries(s.swipes).filter(([, v]) => v === 'like')) })),

      fillDemo: () =>
        set({
          session: { method: 'email', identifier: 'demo@maya.app', createdAt: Date.now() },
          onboarded: true,
          me: {
            ...emptyMe,
            firstName: 'Maya',
            birthDate: '1997-06-14',
            gender: 'femme',
            lookingFor: 'hommes',
            job: 'Directrice artistique',
            bio: 'Curieuse, un peu rêveuse, toujours partante pour un bon resto.',
            answers: DEMO_PROFILES[0].answers,
            avatar: { hair: '#3b2a20', outfit: '#2f3b35', skin: 0, background: '#24302a' },
            position: null,
            positionIsReal: false,
          },
        }),
    }),
    {
      name: 'maya-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const { typing, pendingMatch, ...rest } = s
        void typing
        void pendingMatch
        return rest
      },
    },
  ),
)

/* ——— Sélecteurs ——— */

export function isVisibleFor(me: Me, prefs: Prefs, p: Profile): boolean {
  if (me.lookingFor === 'femmes' && p.gender !== 'femme') return false
  if (me.lookingFor === 'hommes' && p.gender !== 'homme') return false
  if (p.age < prefs.ageMin || p.age > prefs.ageMax) return false
  return true
}

export function useDeck(): Profile[] {
  const me = useApp((s) => s.me)
  const prefs = useApp((s) => s.prefs)
  const swipes = useApp((s) => s.swipes)
  const blocked = useApp((s) => s.blocked)
  return DEMO_PROFILES.filter(
    (p) => !swipes[p.id] && !blocked.includes(p.id) && isVisibleFor(me, prefs, p) && p.km <= prefs.maxKm,
  )
}

export function useLikedMe(): Profile[] {
  const me = useApp((s) => s.me)
  const prefs = useApp((s) => s.prefs)
  const swipes = useApp((s) => s.swipes)
  const blocked = useApp((s) => s.blocked)
  return DEMO_PROFILES.filter(
    (p) => p.likedMe && swipes[p.id] !== 'like' && swipes[p.id] !== 'pass' && !blocked.includes(p.id) && isVisibleFor(me, { ...prefs, ageMin: 18, ageMax: 99 }, p),
  )
}
