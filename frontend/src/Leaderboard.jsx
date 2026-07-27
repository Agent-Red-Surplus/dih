import React, { useEffect, useState } from 'react'

const API_BASE = window.__API_BASE__ || 'http://localhost:8000'

export default function Leaderboard() {
  const [board, setBoard] = useState([])
  const [player, setPlayer] = useState('')
  const [score, setScore] = useState(0)

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`)
      const j = await res.json()
      setBoard(j.board || [])
    } catch {}
  }

  async function submit() {
    try {
      await fetch(`${API_BASE}/leaderboard`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: player, score }) })
      load()
    } catch {}
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{ marginTop: 12 }}>
      <h3>Leaderboard</h3>
      <ol>
        {board.map((e) => <li key={e.player_id + e.ts}>{e.player_id} — {Math.floor(e.score)}</li>)}
      </ol>
      <div>
        <input placeholder='player id' value={player} onChange={(e)=>setPlayer(e.target.value)} />
        <input type='number' placeholder='score' value={score} onChange={(e)=>setScore(Number(e.target.value))} style={{width:120,marginLeft:8}} />
        <button onClick={submit} style={{marginLeft:8}}>Submit</button>
      </div>
    </div>
  )
}
