import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { tap } from '@/lib/haptics'
import './ui.css'

type Variant = 'primary' | 'light' | 'ghost' | 'glass' | 'danger'

export function Button({
  variant = 'primary',
  block,
  size = 'lg',
  children,
  className = '',
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean; size?: 'md' | 'lg' }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${className}`}
      onClick={(e) => {
        tap()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

export function IconButton({
  children,
  label,
  className = '',
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      className={`icon-btn ${className}`}
      onClick={(e) => {
        tap()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

export function TopBar({
  title,
  back,
  right,
  onBack,
  transparent,
}: {
  title?: ReactNode
  back?: boolean
  right?: ReactNode
  onBack?: () => void
  transparent?: boolean
}) {
  const navigate = useNavigate()
  return (
    <header className={`topbar ${transparent ? 'topbar-transparent' : ''}`}>
      <div className="topbar-side">
        {back && (
          <IconButton label="Retour" className="glass" onClick={() => (onBack ? onBack() : navigate(-1))}>
            <ChevronLeft size={22} />
          </IconButton>
        )}
      </div>
      <div className="topbar-title">{title}</div>
      <div className="topbar-side topbar-right">{right}</div>
    </header>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => {
        tap()
        onChange(!checked)
      }}
    >
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 34 }} className="toggle-knob" />
    </button>
  )
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      className={`chip ${active ? 'chip-active' : ''}`}
      onClick={() => {
        tap()
        onClick?.()
      }}
    >
      {children}
    </button>
  )
}

export function Sheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="sheet-backdrop" onClick={onClose} />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            <div className="sheet-grip" />
            {title && <div className="sheet-title">{title}</div>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Confirm({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="dialog-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="sheet-backdrop" onClick={onCancel} />
          <motion.div
            className="dialog glass"
            role="alertdialog"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
          >
            <h3>{title}</h3>
            <p>{message}</p>
            <div className="dialog-actions">
              <Button variant="glass" size="md" onClick={onCancel}>
                Annuler
              </Button>
              <Button variant={danger ? 'danger' : 'primary'} size="md" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Curseur double (âge min / max) ou simple. */
export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
}: {
  min: number
  max: number
  value: [number, number] | number
  onChange: (v: [number, number] | number) => void
  step?: number
}) {
  const dual = Array.isArray(value)
  const lo = dual ? value[0] : min
  const hi = dual ? value[1] : (value as number)
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  return (
    <div className="range">
      <div className="range-track" />
      <div className="range-fill" style={{ left: `${dual ? pct(lo) : 0}%`, right: `${100 - pct(hi)}%` }} />
      {dual && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label="Minimum"
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - 1), hi])}
        />
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={hi}
        aria-label={dual ? 'Maximum' : 'Valeur'}
        onChange={(e) => onChange(dual ? [lo, Math.max(Number(e.target.value), lo + 1)] : Number(e.target.value))}
      />
    </div>
  )
}

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="toast"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 36 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
