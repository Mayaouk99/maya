import { TopBar, Chip, RangeSlider } from '@/components/ui'
import { useApp, type LookingFor } from '@/store/useApp'
import './Account.css'

export default function Preferences() {
  const me = useApp((s) => s.me)
  const prefs = useApp((s) => s.prefs)
  const updatePrefs = useApp((s) => s.updatePrefs)
  const updateMe = useApp((s) => s.updateMe)

  return (
    <div className="screen">
      <TopBar back title="Préférences" />
      <div className="scroll sub-body">
        <div className="pref-block glass">
          <div className="pref-head">
            <span>Je souhaite rencontrer</span>
          </div>
          <div className="pref-chips">
            {(
              [
                ['hommes', 'Des hommes'],
                ['femmes', 'Des femmes'],
                ['tous', 'Tout le monde'],
              ] as [LookingFor, string][]
            ).map(([id, label]) => (
              <Chip key={id} active={me.lookingFor === id} onClick={() => updateMe({ lookingFor: id })}>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="pref-block glass">
          <div className="pref-head">
            <span>Tranche d’âge</span>
            <strong>
              {prefs.ageMin} – {prefs.ageMax}
              {prefs.ageMax >= 70 ? '+' : ''} ans
            </strong>
          </div>
          <RangeSlider
            min={18}
            max={70}
            value={[prefs.ageMin, prefs.ageMax]}
            onChange={(v) => {
              const [ageMin, ageMax] = v as [number, number]
              updatePrefs({ ageMin, ageMax })
            }}
          />
        </div>

        <div className="pref-block glass">
          <div className="pref-head">
            <span>Distance maximale</span>
            <strong>{prefs.maxKm} km</strong>
          </div>
          <RangeSlider min={1} max={100} value={prefs.maxKm} onChange={(v) => updatePrefs({ maxKm: v as number })} />
        </div>

        <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.5, padding: '0 4px' }}>
          Les profils sont ensuite classés par compatibilité : les personnes qui te correspondent le mieux apparaissent en premier.
        </p>
      </div>
    </div>
  )
}
