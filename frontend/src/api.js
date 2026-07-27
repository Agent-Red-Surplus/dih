const API_BASE = import.meta.env.VITE_API_BASE || window.__API_BASE__ || ''
const STORAGE_PREFIX = 'dih_'

const DEFAULT_TUNING = {
  auto_base_cost: 50,
  auto_cost_scaling: 25,
  click_base_cost: 20,
  click_value: 1,
  click_multiplier_cost_base: 2,
  producers: [
    { id: 'herb', name: 'Herb Patch', baseProduction: 1, baseCost: 10, costScaling: 1.2 },
    { id: 'nest', name: 'Nest', baseProduction: 5, baseCost: 100, costScaling: 1.25 },
  ],
  skills: [
    { id: 'click_master', name: 'Click Mastery', baseCost: 50, maxLevel: 5, effect: { clickPowerMult: 0.5 } },
    { id: 'automation', name: 'Automation', baseCost: 75, maxLevel: 5, effect: { autoBonus: 1 } },
  ],
  worlds: [
    { id: 'plains', name: 'Plains', multiplier: 1 },
    { id: 'jungle', name: 'Jungle', multiplier: 1.1 },
    { id: 'volcano', name: 'Volcano', multiplier: 1.25 },
  ],
  artifacts: [
    { id: 'amulet', name: 'Amulet of Growth', cost: 500, effect: { resourceMult: 1.1 } },
  ],
}

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

async function remoteFetch(path, options) {
  if (!API_BASE) throw new Error('no-backend')
  const res = await fetch(`${API_BASE}${path}`, options)
  if (!res.ok) throw new Error('bad-response')
  return res.json()
}

export async function getTuning() {
  if (!API_BASE) return loadLocal('tuning', DEFAULT_TUNING)
  try {
    const data = await remoteFetch('/admin/tuning')
    const tuning = data.tuning || DEFAULT_TUNING
    saveLocal('tuning', tuning)
    return tuning
  } catch {
    return loadLocal('tuning', DEFAULT_TUNING)
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
    const data = await res.json()
    return data
  } catch {
    return { ok: true, fallback: true }
  }
}

export async function loadLeaderboard() {
  const local = loadLocal('leaderboard', [])
  if (!API_BASE) return local
  try {
    const data = await remoteFetch('/leaderboard')
    return data.board || local
  } catch {
    return local
  }
}

export async function submitScore(player_id, score) {
  const entry = { player_id, score: Number(score), ts: Date.now() }
  const local = loadLocal('leaderboard', [])
  let board = [...local.filter((item) => item.player_id !== player_id), entry]
  board = board.sort((a, b) => b.score - a.score).slice(0, 100)
  saveLocal('leaderboard', board)

  if (!API_BASE) return { ok: true, fallback: true }
  try {
    const res = await fetch(`${API_BASE}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id, score }),
    })
    const data = await res.json()
    return data
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

export const BACKEND_AVAILABLE = Boolean(API_BASE)
