const API_BASE = import.meta.env.VITE_API_BASE || window.__API_BASE__ || ''
const hasBackend = !!API_BASE

function apiUrl(path) {
  return `${API_BASE.replace(/\/$/, '')}${path}`
}

async function requestJson(url, options = {}) {
  try {
    const res = await fetch(url, options)
    const data = await res.json()
    return { ok: res.ok, data }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

export async function getTuning() {
  if (!hasBackend) return null
  const response = await requestJson(apiUrl('/admin/tuning'))
  return response.ok && response.data.tuning ? response.data.tuning : null
}

export async function saveTuning(tuning) {
  if (!hasBackend) return { ok: true, fallback: true }
  const response = await requestJson(apiUrl('/admin/tuning'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tuning),
  })
  return response.ok && response.data.ok ? { ok: true } : { ok: false, error: response.error }
}

export async function getLeaderboard() {
  if (!hasBackend) return []
  const response = await requestJson(apiUrl('/leaderboard'))
  return response.ok && response.data.board ? response.data.board : []
}

export async function submitLeaderboard(playerId, score) {
  if (!hasBackend) return { ok: true, fallback: true }
  const response = await requestJson(apiUrl('/leaderboard'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: playerId, score }),
  })
  return response.ok && response.data.ok ? { ok: true } : { ok: false }
}

export async function clearLeaderboard() {
  if (!hasBackend) return { ok: true, fallback: true }
  const response = await requestJson(apiUrl('/admin/leaderboard/clear'), {
    method: 'POST',
  })
  return response.ok && response.data.ok ? { ok: true } : { ok: false }
}
