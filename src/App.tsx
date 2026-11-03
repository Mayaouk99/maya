import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useApp, useLikedMe } from '@/store/useApp'
import { useToast } from '@/store/useToast'
import BottomNav from '@/components/BottomNav'
import { Toast } from '@/components/ui'
import Welcome from '@/features/welcome/Welcome'
import AuthChoice from '@/features/auth/AuthChoice'
import EmailAuth from '@/features/auth/EmailAuth'
import PhoneAuth from '@/features/auth/PhoneAuth'
import Onboarding from '@/features/onboarding/Onboarding'
import Home from '@/features/home/Home'
import MatchOverlay from '@/features/home/MatchOverlay'
import MapRadar from '@/features/map/MapRadar'
import Likes from '@/features/likes/Likes'
import Messages from '@/features/messages/Messages'
import Chat from '@/features/messages/Chat'
import Account from '@/features/account/Account'
import EditProfile from '@/features/account/EditProfile'
import Preferences from '@/features/account/Preferences'
import Privacy from '@/features/account/Privacy'
import Help from '@/features/account/Help'
import EditAnswers from '@/features/account/EditAnswers'
import ProfileDetail from '@/features/profile/ProfileDetail'
import Legal from '@/features/legal/Legal'

const AvatarStudio = lazy(() => import('@/features/onboarding/AvatarStudio'))

function RequireAuth({ children }: { children: ReactNode }) {
  const session = useApp((s) => s.session)
  const onboarded = useApp((s) => s.onboarded)
  const { pathname } = useLocation()
  if (!session) return <Navigate to="/bienvenue" replace />
  if (!onboarded && !pathname.startsWith('/onboarding')) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: ReactNode }) {
  const session = useApp((s) => s.session)
  const onboarded = useApp((s) => s.onboarded)
  if (session) return <Navigate to={onboarded ? '/app' : '/onboarding'} replace />
  return <>{children}</>
}

function TabsLayout() {
  const matches = useApp((s) => s.matches)
  const likedMe = useLikedMe()
  const unread = matches.filter((m) => m.unread).length
  return (
    <>
      <Outlet />
      <BottomNav badges={{ '/app/likes': likedMe.length, '/app/messages': unread }} />
    </>
  )
}

function Loader() {
  return <div className="screen" style={{ display: 'grid', placeItems: 'center' }} />
}

export default function App() {
  const toast = useToast((s) => s.message)
  return (
    <div className="device">
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/bienvenue" element={<GuestOnly><Welcome /></GuestOnly>} />
          <Route path="/connexion" element={<GuestOnly><AuthChoice /></GuestOnly>} />
          <Route path="/connexion/email" element={<GuestOnly><EmailAuth /></GuestOnly>} />
          <Route path="/connexion/telephone" element={<GuestOnly><PhoneAuth /></GuestOnly>} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/legal/:doc" element={<Legal />} />

          <Route path="/app" element={<RequireAuth><TabsLayout /></RequireAuth>}>
            <Route index element={<Home />} />
            <Route path="likes" element={<Likes />} />
            <Route path="messages" element={<Messages />} />
            <Route path="compte" element={<Account />} />
          </Route>
          <Route path="/app/carte" element={<RequireAuth><MapRadar /></RequireAuth>} />
          <Route path="/app/messages/:matchId" element={<RequireAuth><Chat /></RequireAuth>} />
          <Route path="/app/profil/:id" element={<RequireAuth><ProfileDetail /></RequireAuth>} />
          <Route path="/app/compte/avatar" element={<RequireAuth><AvatarStudio mode="edit" /></RequireAuth>} />
          <Route path="/app/compte/profil" element={<RequireAuth><EditProfile /></RequireAuth>} />
          <Route path="/app/compte/preferences" element={<RequireAuth><Preferences /></RequireAuth>} />
          <Route path="/app/compte/questionnaire" element={<RequireAuth><EditAnswers /></RequireAuth>} />
          <Route path="/app/compte/confidentialite" element={<RequireAuth><Privacy /></RequireAuth>} />
          <Route path="/app/compte/aide" element={<RequireAuth><Help /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <MatchOverlay />
      <Toast message={toast} />
    </div>
  )
}
