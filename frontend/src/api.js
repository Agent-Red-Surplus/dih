const API_BASE = import.meta.env.VITE_API_BASE || window.__API_BASE__ || ''
const hasBackend = !!API_BASE
const leaderboardKey = 'dih_leaderboard'
const tuningKey = 'dih_tuning'

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

function readLocalLeaderboard() {
  try {
    const raw = localStorage.getItem(leaderboardKey)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeLocalLeaderboard(board) {
  localStorage.setItem(leaderboardKey, JSON.stringify(board))
}

export async function loadLeaderboard() {
  if (hasBackend) {
    const response = await requestJson(apiUrl('/leaderboard'))
    if (response.ok && response.data.board) {
      return response.data.board
    }
  }
  return readLocalLeaderboard()
}

export async function submitScore(playerId, score) {
  const payload = { player_id: playerId, score }
  if (hasBackend) {
    const response = await requestJson(apiUrl('/leaderboard'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (response.ok && response.data.ok) {
      return { ok: true }
    }
  }

  const board = readLocalLeaderboard()
  board.push({ player_id: playerId, score, ts: Date.now() })
  board.sort((a, b) => b.score - a.score)
  writeLocalLeaderboard(board.slice(0, 100))
  return { ok: true, fallback: true }
}

export async function clearLeaderboard() {
  if (hasBackend) {
    const response = await requestJson(apiUrl('/admin/leaderboard/clear'), {
      method: 'POST',
    })
    if (response.ok && response.data.ok) {
      return { ok: true }
    }
  }
  writeLocalLeaderboard([])
  return { ok: true, fallback: true }
}

export async function getTuning() {
  if (hasBackend) {
    const response = await requestJson(apiUrl('/admin/tuning'))
    if (response.ok && response.data.tuning) {
      return response.data.tuning
    }
  }
  try {
    const raw = localStorage.getItem(tuningKey)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function saveTuning(tuning) {
  if (hasBackend) {
    const response = await requestJson(apiUrl('/admin/tuning'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tuning),
    })
    if (response.ok && response.data.ok) {
      return { ok: true }
    }
  }
  try {
    localStorage.setItem(tuningKey, JSON.stringify(tuning))
    return { ok: true, fallback: true }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

export async function saveGameState(playerId, data) {
  if (hasBackend) {
    const response = await requestJson(apiUrl('/save'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, data }),
    })
    if (response.ok && response.data.ok) {
      return { ok: true }
    }
  }
  try {
    localStorage.setItem(`dih_state_${playerId}`, JSON.stringify(data))
    return { ok: true, fallback: true }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

export async function loadGameState(playerId) {
  if (hasBackend) {
    const response = await requestJson(apiUrl(`/load/${playerId}`))
    if (response.ok && response.data.data) {
      return { ok: true, data: response.data.data }
    }
  }
  try {
    const raw = localStorage.getItem(`dih_state_${playerId}`)
    if (!raw) return { ok: false }
    return { ok: true, data: JSON.parse(raw) }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}
