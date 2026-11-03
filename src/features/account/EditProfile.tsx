import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Chip, TopBar } from '@/components/ui'
import { useApp } from '@/store/useApp'
import { useToast } from '@/store/useToast'
import type { Gender } from '@/data/demoProfiles'
import { ageFrom } from '@/lib/format'
import './Account.css'

export default function EditProfile() {
  const navigate = useNavigate()
  const me = useApp((s) => s.me)
  const updateMe = useApp((s) => s.updateMe)
  const toast = useToast((s) => s.show)
  const [draft, setDraft] = useState({ firstName: me.firstName, job: me.job, bio: me.bio, gender: me.gender })

  const valid = draft.firstName.trim().length >= 2
  const save = () => {
    updateMe({ ...draft, firstName: draft.firstName.trim(), job: draft.job.trim(), bio: draft.bio.trim() })
    toast('Profil mis à jour')
    navigate(-1)
  }

  return (
    <div className="screen">
      <TopBar back title="Mon profil" />
      <div className="scroll sub-body">
        <label className="field">
          <span>Prénom</span>
          <input value={draft.firstName} maxLength={24} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} />
        </label>
        <label className="field">
          <span>Âge</span>
          <input value={me.birthDate ? `${ageFrom(me.birthDate)} ans` : ''} disabled />
        </label>
        <div className="field">
          <span>Je suis</span>
          <div className="pref-chips">
            {(
              [
                ['femme', 'Une femme'],
                ['homme', 'Un homme'],
                ['nonbinaire', 'Non-binaire'],
              ] as [Gender, string][]
            ).map(([id, label]) => (
              <Chip key={id} active={draft.gender === id} onClick={() => setDraft({ ...draft, gender: id })}>
                {label}
              </Chip>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Ce que je fais</span>
          <input value={draft.job} maxLength={40} placeholder="Ex. Architecte" onChange={(e) => setDraft({ ...draft, job: e.target.value })} />
        </label>
        <label className="field">
          <span>Bio</span>
          <textarea value={draft.bio} maxLength={300} placeholder="Quelques mots sur toi…" onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
        </label>
        <p className="ob-counter">{draft.bio.length} / 300</p>
      </div>
      <div className="sub-footer">
        <Button block onClick={save} disabled={!valid}>
          Enregistrer
        </Button>
      </div>
    </div>
  )
}
