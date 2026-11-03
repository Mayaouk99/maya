import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Camera, ImageUp, RefreshCw, Sparkles } from 'lucide-react'
import Avatar3D, { type Framing } from '@/three/Avatar3D'
import { Button, RangeSlider, TopBar } from '@/components/ui'
import { useApp, type AvatarLook } from '@/store/useApp'
import { useToast } from '@/store/useToast'
import { tap } from '@/lib/haptics'
import './AvatarStudio.css'

const HAIR = [
  { id: null, label: 'Naturel', swatch: 'conic-gradient(#3b2a20, #6b4a32, #3b2a20)' },
  { id: '#17120f', label: 'Noir', swatch: '#17120f' },
  { id: '#4a2f20', label: 'Brun', swatch: '#4a2f20' },
  { id: '#7d5534', label: 'Châtain', swatch: '#7d5534' },
  { id: '#c9a066', label: 'Blond', swatch: '#c9a066' },
  { id: '#e6d6b8', label: 'Platine', swatch: '#e6d6b8' },
  { id: '#a3472a', label: 'Roux', swatch: '#a3472a' },
  { id: '#a6a6a2', label: 'Gris', swatch: '#a6a6a2' },
]

const OUTFIT = [
  { id: null, label: 'Original', swatch: 'conic-gradient(#555, #888, #555)' },
  { id: '#1e2120', label: 'Noir', swatch: '#1e2120' },
  { id: '#ecebe6', label: 'Blanc', swatch: '#ecebe6' },
  { id: '#8fa596', label: 'Sauge', swatch: '#8fa596' },
  { id: '#26344d', label: 'Marine', swatch: '#26344d' },
  { id: '#5e1f2b', label: 'Bordeaux', swatch: '#5e1f2b' },
  { id: '#b3875a', label: 'Camel', swatch: '#b3875a' },
  { id: '#c8f560', label: 'Citron', swatch: '#c8f560' },
]

const BACKGROUNDS = ['#24302a', '#33403a', '#3e3a33', '#1d242b', '#4a3b3f', '#cfd6ce']

type Tab = 'hair' | 'outfit' | 'skin' | 'bg'
type Phase = 'capture' | 'generating' | 'edit'

const GEN_STEPS = ['Analyse de ton visage', 'Modélisation 3D de la tête', 'Texture de la peau et des yeux', 'Assemblage de ton avatar']

/* ——— 1. Selfie ——— */
function Capture({ onPhoto }: { onPhoto: (dataUrl: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const [camState, setCamState] = useState<'loading' | 'on' | 'off'>('loading')

  useEffect(() => {
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState('off')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1440 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        stream.current = s
        if (video.current) {
          video.current.srcObject = s
          void video.current.play()
        }
        setCamState('on')
      })
      .catch(() => !cancelled && setCamState('off'))
    return () => {
      cancelled = true
      stream.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const shoot = () => {
    const v = video.current
    if (!v || !v.videoWidth) return
    tap(20)
    const c = document.createElement('canvas')
    const size = Math.min(v.videoWidth, v.videoHeight)
    c.width = 720
    c.height = 900
    const ctx = c.getContext('2d')!
    ctx.translate(c.width, 0)
    ctx.scale(-1, 1) // effet miroir, comme à l'écran
    const sw = size * 0.8
    const sh = sw * 1.25
    ctx.drawImage(v, (v.videoWidth - sw) / 2, Math.max(0, (v.videoHeight - sh) / 2), sw, Math.min(sh, v.videoHeight), 0, 0, c.width, c.height)
    stream.current?.getTracks().forEach((t) => t.stop())
    onPhoto(c.toDataURL('image/jpeg', 0.9))
  }

  const onFile = (f?: File) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      stream.current?.getTracks().forEach((t) => t.stop())
      onPhoto(String(reader.result))
    }
    reader.readAsDataURL(f)
  }

  return (
    <div className="studio-capture">
      <div className="studio-frame">
        <video ref={video} playsInline muted className={`studio-video ${camState === 'on' ? 'is-on' : ''}`} />
        {camState !== 'on' && (
          <div className="studio-nocam">
            <Camera size={34} />
            <p>{camState === 'loading' ? 'Ouverture de la caméra…' : 'Caméra indisponible : importe une photo de ton visage.'}</p>
          </div>
        )}
        <div className="studio-oval" />
      </div>

      <ul className="studio-tips">
        <li>Visage bien de face, regard vers l’objectif</li>
        <li>Lumière douce, sans lunettes de soleil</li>
        <li>Cheveux dégagés du visage</li>
      </ul>

      <div className="studio-capture-actions">
        <button className="studio-import" onClick={() => file.current?.click()}>
          <ImageUp size={20} />
          Importer
        </button>
        <button className="studio-shutter" aria-label="Prendre la photo" onClick={shoot} disabled={camState !== 'on'}>
          <span />
        </button>
        <span style={{ width: 76 }} />
      </div>
      <input ref={file} type="file" accept="image/*" capture="user" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  )
}

/* ——— 2. Génération ——— */
function Generating({ photo, onDone }: { photo: string; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const total = 5200
    let raf = 0
    const loop = (now: number) => {
      const k = Math.min(1, (now - start) / total)
      setPct(Math.round(k * 100))
      setStep(Math.min(GEN_STEPS.length - 1, Math.floor(k * GEN_STEPS.length)))
      if (k < 1) raf = requestAnimationFrame(loop)
      else window.setTimeout(onDone, 350)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [onDone])

  return (
    <div className="studio-gen">
      <div className="studio-gen-photo">
        <img src={photo} alt="Ta photo" />
        <div className="studio-gen-mesh" />
        <div className="studio-gen-scan" />
      </div>
      <div className="studio-gen-info">
        <p className="eyebrow">
          <Sparkles size={13} /> Création de ton avatar 3D
        </p>
        <AnimatePresence mode="wait">
          <motion.h2 key={step} className="h2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {GEN_STEPS[step]}…
          </motion.h2>
        </AnimatePresence>
        <div className="studio-gen-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="muted studio-gen-pct">{pct} %</p>
      </div>
    </div>
  )
}

/* ——— 3. Éditeur ——— */
export default function AvatarStudio({ mode, onDone }: { mode: 'onboarding' | 'edit'; onDone?: () => void }) {
  const navigate = useNavigate()
  const saved = useApp((s) => s.me.avatar)
  const setAvatar = useApp((s) => s.setAvatar)
  const toast = useToast((s) => s.show)

  const [phase, setPhase] = useState<Phase>(mode === 'edit' && saved ? 'edit' : 'capture')
  const [photo, setPhoto] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('hair')
  const [framing, setFraming] = useState<Framing>('face')
  const [saving, setSaving] = useState(false)
  const [look, setLook] = useState<{ hair: string | null; outfit: string | null; skin: number; background: string }>({
    hair: saved?.hair && saved.hair !== 'natural' ? saved.hair : null,
    outfit: saved?.outfit && saved.outfit !== 'natural' ? saved.outfit : null,
    skin: saved?.skin ?? 0,
    background: saved?.background ?? BACKGROUNDS[0],
  })
  const capture = useRef<(() => string | null) | null>(null)
  const onGenerated = useCallback(() => setPhase('edit'), [])

  const save = () => {
    setSaving(true)
    setFraming('bust')
    // Laisse la caméra se replacer avant de prendre la vignette.
    window.setTimeout(() => {
      const snapshot = capture.current?.() ?? undefined
      const result: AvatarLook = {
        hair: look.hair ?? 'natural',
        outfit: look.outfit ?? 'natural',
        skin: look.skin,
        background: look.background,
        snapshot,
      }
      setAvatar(result)
      setSaving(false)
      if (onDone) onDone()
      else {
        toast('Avatar enregistré')
        navigate(-1)
      }
    }, 900)
  }

  const title = phase === 'capture' ? 'Ton selfie' : phase === 'generating' ? '' : 'Ton avatar'

  return (
    <div className={mode === 'edit' ? 'screen studio' : 'studio studio-embedded'}>
      {mode === 'edit' && <TopBar back title={title} />}

      {phase === 'capture' && (
        <>
          {mode === 'onboarding' && (
            <div className="studio-intro">
              <h1 className="h2">Crée ton avatar 3D</h1>
              <p className="muted">Prends un selfie : Maya en fait un avatar ultra-réaliste. Ton vrai visage n’est jamais montré aux autres.</p>
            </div>
          )}
          <Capture
            onPhoto={(p) => {
              setPhoto(p)
              setPhase('generating')
            }}
          />
        </>
      )}

      {phase === 'generating' && photo && <Generating photo={photo} onDone={onGenerated} />}

      {phase === 'edit' && (
        <motion.div className="studio-edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <div className="studio-stage">
            <Avatar3D
              look={look}
              framing={framing}
              onCaptureReady={(fn) => {
                capture.current = fn
              }}
            />
            <div className="studio-framing glass">
              {(['face', 'bust', 'body'] as Framing[]).map((f) => (
                <button key={f} className={framing === f ? 'on' : ''} onClick={() => setFraming(f)}>
                  {f === 'face' ? 'Visage' : f === 'bust' ? 'Buste' : 'Corps'}
                </button>
              ))}
            </div>
            <p className="studio-demo-note">Aperçu de démonstration · modèle d’exemple</p>
          </div>

          <div className="studio-panel">
            <div className="studio-tabs" role="tablist">
              {(
                [
                  ['hair', 'Cheveux'],
                  ['outfit', 'Tenue'],
                  ['skin', 'Teint'],
                  ['bg', 'Fond'],
                ] as [Tab, string][]
              ).map(([id, label]) => (
                <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </div>

            <div className="studio-options">
              {tab === 'hair' && (
                <div className="swatches">
                  {HAIR.map((h) => (
                    <button key={h.label} className={`swatch ${look.hair === h.id ? 'on' : ''}`} onClick={() => setLook({ ...look, hair: h.id })}>
                      <span style={{ background: h.swatch }} />
                      {h.label}
                    </button>
                  ))}
                </div>
              )}
              {tab === 'outfit' && (
                <div className="swatches">
                  {OUTFIT.map((o) => (
                    <button key={o.label} className={`swatch ${look.outfit === o.id ? 'on' : ''}`} onClick={() => setLook({ ...look, outfit: o.id })}>
                      <span style={{ background: o.swatch }} />
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {tab === 'skin' && (
                <div className="studio-skin">
                  <div className="studio-skin-labels">
                    <span>Plus clair</span>
                    <span>Plus mat</span>
                  </div>
                  <RangeSlider min={-100} max={100} value={Math.round(look.skin * 100)} onChange={(v) => setLook({ ...look, skin: (v as number) / 100 })} />
                </div>
              )}
              {tab === 'bg' && (
                <div className="swatches">
                  {BACKGROUNDS.map((b) => (
                    <button key={b} className={`swatch ${look.background === b ? 'on' : ''}`} onClick={() => setLook({ ...look, background: b })} aria-label={`Fond ${b}`}>
                      <span style={{ background: b }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="studio-actions">
              <Button variant="glass" size="md" onClick={() => setPhase('capture')} aria-label="Reprendre une photo">
                <RefreshCw size={17} />
              </Button>
              <Button block onClick={save} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Valider mon avatar'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
