import { useLayoutEffect, useRef, useState } from 'react'
import './FlutedImage.css'

/**
 * Effet « verre cannelé » : l'avatar est vu à travers des lamelles de verre verticales.
 * Chaque lamelle montre une portion compressée de l'image, ce qui la rend méconnaissable
 * tout en gardant les couleurs et la silhouette.
 *
 * `revealed` : les lamelles s'alignent puis disparaissent (déclenché par le like).
 */
export default function FlutedImage({
  src,
  alt = '',
  revealed = false,
  strips = 16,
  strength = 1,
  className = '',
  position = '50% 30%',
}: {
  src: string
  alt?: string
  revealed?: boolean
  strips?: number
  /** 0 → très léger, 1 → normal */
  strength?: number
  className?: string
  position?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const sw = w / strips
  const squeeze = 1 - 0.62 * strength
  const blur = 3 + 5 * strength

  return (
    <div ref={ref} className={`fluted ${revealed ? 'is-revealed' : ''} ${className}`} role="img" aria-label={alt}>
      <img
        className="fluted-base"
        src={src}
        alt=""
        draggable={false}
        style={{ objectPosition: position, filter: revealed ? 'none' : `blur(${10 + 8 * strength}px) saturate(1.15)` }}
      />
      {w > 0 && (
        <div className="fluted-strips" aria-hidden>
          {Array.from({ length: strips }, (_, i) => (
            <div key={i} className="flute" style={{ left: i * sw, width: sw + 1 }}>
              <img
                src={src}
                alt=""
                draggable={false}
                style={{
                  width: w,
                  left: -i * sw,
                  objectPosition: position,
                  transformOrigin: `${i * sw + sw / 2}px 50%`,
                  transform: revealed ? 'scaleX(1)' : `scaleX(${squeeze})`,
                  filter: revealed ? 'none' : `blur(${blur}px)`,
                }}
              />
              <span className="flute-shade" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
