import React, { useEffect, useState } from 'react'
import { loadLeaderboard, submitScore } from './api'

export default function Leaderboard() {
  const [board, setBoard] = useState([])
  const [player, setPlayer] = useState('')
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState('')

  async function load() {
    const data = await loadLeaderboard()
    setBoard(data)
  }

  async function submit() {
    if (!player) {
      setMessage('Enter a player id.')
      return
    }
    const result = await submitScore(player, score)
    if (result.ok) {
      setMessage(result.fallback ? 'Score saved locally.' : 'Score submitted.')
      load()
    } else {
      setMessage('Submit failed.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <h3>Leaderboard</h3>
      <ol style={{ paddingLeft: 18 }}>
        {board.map((e) => (
          <li key={`${e.player_id}-${e.ts}`} style={{ marginBottom: 6 }}>
            {e.player_id} — {Math.floor(e.score)}
          </li>
        ))}
      </ol>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input placeholder='player id' value={player} onChange={(e) => setPlayer(e.target.value)} style={{ flex: 1, minWidth: 120, padding: 8 }} />
        <input type='number' placeholder='score' value={score} onChange={(e) => setScore(Number(e.target.value))} style={{ width: 100, padding: 8 }} />
        <button onClick={submit} style={{ padding: '8px 12px' }}>Submit</button>
      </div>
      {message && <div style={{ marginTop: 10, color: '#444' }}>{message}</div>}
    </div>
  )
}
