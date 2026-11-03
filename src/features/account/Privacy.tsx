import { EyeOff, MapPinOff, Download } from 'lucide-react'
import { Button, Toggle, TopBar } from '@/components/ui'
import { useApp } from '@/store/useApp'
import { useToast } from '@/store/useToast'
import { PROFILE_BY_ID } from '@/data/demoProfiles'
import { Group, Row } from './Account'
import './Account.css'

export default function Privacy() {
  const prefs = useApp((s) => s.prefs)
  const blocked = useApp((s) => s.blocked)
  const updatePrefs = useApp((s) => s.updatePrefs)
  const unblock = useApp((s) => s.unblock)
  const toast = useToast((s) => s.show)

  return (
    <div className="screen">
      <TopBar back title="Confidentialité" />
      <div className="scroll sub-body">
        <Group title="Visibilité">
          <Row
            icon={<MapPinOff size={19} />}
            label="Masquer ma distance"
            hint="Les autres ne verront pas à combien de km tu es"
            right={<Toggle label="Masquer ma distance" checked={prefs.hideDistance} onChange={(v) => updatePrefs({ hideDistance: v })} />}
          />
          <Row
            icon={<EyeOff size={19} />}
            label="Mode incognito"
            hint="Seules les personnes que tu likes peuvent te voir"
            right={<Toggle label="Mode incognito" checked={prefs.incognito} onChange={(v) => updatePrefs({ incognito: v })} />}
          />
        </Group>

        <Group title={`Personnes bloquées (${blocked.length})`}>
          {blocked.length === 0 ? (
            <Row label="Aucune personne bloquée" />
          ) : (
            blocked.map((id) => {
              const p = PROFILE_BY_ID[id]
              if (!p) return null
              return (
                <div key={id} className="blocked-item row">
                  <img src={p.avatarImage} alt="" />
                  <span>{p.firstName}</span>
                  <Button
                    variant="glass"
                    size="md"
                    onClick={() => {
                      unblock(id)
                      toast(`${p.firstName} débloqué·e`)
                    }}
                  >
                    Débloquer
                  </Button>
                </div>
              )
            })
          )}
        </Group>

        <Group title="Mes données">
          <Row icon={<Download size={19} />} label="Télécharger mes données" hint="Export RGPD envoyé par e-mail" onClick={() => toast('Demande enregistrée : export envoyé sous 48 h')} />
        </Group>
      </div>
    </div>
  )
}
