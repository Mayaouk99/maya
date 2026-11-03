export interface LatLng {
  lat: number
  lng: number
}

/** Position par défaut si l'utilisateur refuse la géolocalisation : Paris centre. */
export const DEFAULT_POSITION: LatLng = { lat: 48.8566, lng: 2.3522 }

const R = 6371

export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Cap en degrés (0 = nord, 90 = est). */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Point situé à `km` kilomètres dans la direction `deg`. */
export function offset(from: LatLng, km: number, deg: number): LatLng {
  const δ = km / R
  const θ = (deg * Math.PI) / 180
  const φ1 = (from.lat * Math.PI) / 180
  const λ1 = (from.lng * Math.PI) / 180
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))
  return { lat: (φ2 * 180) / Math.PI, lng: (λ2 * 180) / Math.PI }
}

/**
 * Confidentialité : on ne partage jamais la position exacte.
 * On arrondit à une grille d'environ 1 km avant tout stockage ou affichage.
 */
export function approximate(p: LatLng): LatLng {
  const step = 0.01
  return { lat: Math.round(p.lat / step) * step, lng: Math.round(p.lng / step) * step }
}

export function formatDistance(km: number): string {
  if (km < 1) return 'à moins d’1 km'
  if (km < 10) return `à ${Math.round(km)} km`
  return `à ${Math.round(km / 5) * 5} km`
}

export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('unsupported'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    )
  })
}
