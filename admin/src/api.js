const API_BASE = import.meta.env.VITE_API_BASE || window.__API_BASE__ || ''
const STORAGE_PREFIX = 'dih_admin_'

function localKey(key) {
  return `${STORAGE_PREFIX}${key}`
}

function loadLocal(key, def = null) {
  try {
    const raw = localStorage.getItem(localKey(key))
    return raw ? JSON.parse(raw) : def
  } catch {
    return def
  }
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(localKey(key), JSON.stringify(value))
  } catch {}
}

export async function getTuning() {
  if (!API_BASE) return loadLocal('tuning', null)
  try {
    const res = await fetch(`${API_BASE}/admin/tuning`)
    const data = await res.json()
    saveLocal('tuning', data.tuning)
    return data.tuning
  } catch {
    return loadLocal('tuning', null)
  }
}

export async function saveTuning(tuning) {
  saveLocal('tuning', tuning)
  if (!API_BASE) return { ok: true, fallback: true }
  try {
    const res = await fetch(`${API_BASE}/admin/tuning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tuning),
    })
    return await res.json()
  } catch {
    return { ok: true, fallback: true }
  }
}

export async function getLeaderboard() {
  if (!API_BASE) return loadLocal('leaderboard', [])
  try {
    const res = await fetch(`${API_BASE}/leaderboard`)
    const data = await res.json()
    return data.board || []
  } catch {
    return loadLocal('leaderboard', [])
  }
}

export async function submitLeaderboard(player_id, score) {
  const local = loadLocal('leaderboard', [])
  const entry = { player_id, score: Number(score), ts: Date.now() }
  const board = [...local.filter((item) => item.player_id !== player_id), entry].sort((a, b) => b.score - a.score).slice(0, 100)
  saveLocal('leaderboard', board)
  if (!API_BASE) return { ok: true, fallback: true }
  try {
    const res = await fetch(`${API_BASE}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id, score }),
    })
    return await res.json()
  } catch {
    return { ok: true, fallback: true }
  }
}

export async function clearLeaderboard() {
  saveLocal('leaderboard', [])
  if (!API_BASE) return { ok: true, fallback: true }
  try {
    const res = await fetch(`${API_BASE}/admin/leaderboard/clear`, { method: 'POST' })
    return await res.json()
  } catch {
    return { ok: true, fallback: true }
  }
}
