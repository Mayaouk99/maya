import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import FlutedImage from '@/components/FlutedImage'
import { useApp, useLikedMe } from '@/store/useApp'
import { computeCompatibility } from '@/lib/compat'
import './Likes.css'

export default function Likes() {
  const navigate = useNavigate()
  const likedMe = useLikedMe()
  const answers = useApp((s) => s.me.answers)

  return (
    <div className="screen tab-screen">
      <header className="tab-header">
        <p className="eyebrow">Likes reçus</p>
        <h1 className="h1">
          {likedMe.length > 0 ? (
            <>
              {likedMe.length} personne{likedMe.length > 1 ? 's' : ''} <span className="serif tab-serif">t’ont liké</span>
            </>
          ) : (
            'Tes likes'
          )}
        </h1>
        {likedMe.length > 0 && <p className="tab-sub">Like en retour pour dévoiler leur avatar et commencer à discuter.</p>}
      </header>

      <div className="scroll tab-scroll">
        {likedMe.length === 0 ? (
          <div className="tab-empty">
            <div className="tab-empty-icon">
              <Heart size={30} />
            </div>
            <h2 className="h2">Pas encore de like</h2>
            <p className="muted">Complète ton profil et ta bio : les profils complets reçoivent jusqu’à 3 fois plus de likes.</p>
          </div>
        ) : (
          <div className="likes-grid">
            {likedMe.map((p, i) => (
              <motion.button
                key={p.id}
                className="like-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/app/profil/${p.id}`)}
              >
                <FlutedImage src={p.avatarImage} strips={9} className="like-img" />
                <div className="like-shade" />
                <span className="like-compat">{computeCompatibility(answers, p.answers).total}%</span>
                <div className="like-info">
                  <strong>
                    {p.firstName}, {p.age}
                  </strong>
                  <span>{p.lastActiveMin < 30 ? 'En ligne' : p.job}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
