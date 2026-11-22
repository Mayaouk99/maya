/**
 * POST /.netlify/functions/streamoji-token — jeton (30 min) pour l'éditeur d'avatar Streamoji.
 *
 * Le Client-Secret reste ici (variables d'environnement Netlify STREAMOJI_CLIENT_ID / STREAMOJI_CLIENT_SECRET),
 * jamais dans l'app. Avec un vrai compte (jeton Supabase dans Authorization), l'avatar Streamoji est rattaché
 * à l'identifiant Maya de la personne ; en visite (démo), à un identifiant de démo, avec un plafond de créations.
 *
 * Réponse : { token: string, userId: string }
 */

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
    },
  })

const env = (k: string) => (globalThis as unknown as { Netlify?: { env: { get(k: string): string | undefined } } }).Netlify?.env.get(k) ?? process.env[k]

async function supabaseUser(req: Request): Promise<{ id: string; name: string } | null> {
  const url = env('SUPABASE_URL') ?? env('VITE_SUPABASE_URL')
  const key = env('SUPABASE_PUBLISHABLE_KEY') ?? env('VITE_SUPABASE_PUBLISHABLE_KEY')
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!url || !key || !token) return null
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } })
  if (!r.ok) return null
  const u = (await r.json()) as { id?: string; email?: string }
  return u.id ? { id: u.id, name: (u.email ?? 'maya').split('@')[0] } : null
}

// garde-fou simple (par instance) contre les rafales
const hits = new Map<string, number[]>()
function tooMany(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  list.push(now)
  hits.set(key, list)
  return list.length > max
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
    })
  if (req.method !== 'POST') return json(405, { error: 'method' })
  const id = env('STREAMOJI_CLIENT_ID')
  const secret = env('STREAMOJI_CLIENT_SECRET')
  if (!id || !secret) return json(503, { error: 'not-configured' })

  const user = await supabaseUser(req)
  let userId: string
  let userName: string
  let cap: number
  if (user) {
    userId = `maya-${user.id}`
    userName = user.name
    cap = 40
  } else {
    // visite : un identifiant par appareil (fourni par l'app), créations plafonnées
    const body = (await req.json().catch(() => ({}))) as { device?: string }
    const device = typeof body.device === 'string' && /^[a-z0-9-]{8,40}$/i.test(body.device) ? body.device : 'anonyme'
    userId = `maya-demo-${device}`
    userName = 'Visite'
    cap = 5
  }
  const ip = req.headers.get('x-nf-client-connection-ip') ?? 'ip'
  if (tooMany(`${userId}|${ip}`, 30, 60 * 60 * 1000)) return json(429, { error: 'trop de demandes' })

  const r = await fetch('https://us-central1-streamoji-265f4.cloudfunctions.net/getAuthToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Id': id, 'Client-Secret': secret },
    body: JSON.stringify({ userId, userName, maxAvatarsCreations: cap }),
  })
  const d = (await r.json().catch(() => null)) as { success?: boolean; authToken?: string; data?: { success?: boolean; authToken?: string } } | null
  const token = d?.authToken ?? d?.data?.authToken
  if (!r.ok || !token) return json(502, { error: 'streamoji' })
  return json(200, { token, userId })
}
