import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import GameState from './game/state'
import Leaderboard from './Leaderboard'

const API_BASE = import.meta.env.VITE_API_BASE || window.__API_BASE__ || 'http://localhost:8000'

export default function App() {
  const mountRef = useRef(null)
  const [game, setGame] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('dih_state_full'))
      if (raw) return GameState.fromJSON(raw)
    } catch {}
    return new GameState()
  })
  const [, setTick] = useState(0)

  const playerIdRef = useRef(null)
  useEffect(() => {
    let id = localStorage.getItem('dih_player_id')
    if (!id) {
      id = 'player-' + Math.random().toString(36).slice(2, 10)
      localStorage.setItem('dih_player_id', id)
    }
    playerIdRef.current = id
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshNormalMaterial()
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    camera.position.z = 3

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    function onPointerDown(e) {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(cube)
      if (intersects.length > 0) {
        game.click()
        setTick(t => t + 1)
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    let raf = null
    function animate() {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    function onResize() {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [clickPower])

  const [tuning, setTuning] = useState({
    auto_base_cost: 50,
    auto_cost_scaling: 25,
    click_base_cost: 20,
    click_value: 1,
    click_multiplier_cost_base: 2
  })

  useEffect(() => {
    async function loadTuning() {
      try {
        const res = await fetch(`${API_BASE}/admin/tuning`)
        if (res.ok) {
          const j = await res.json()
          if (j.tuning) setTuning(j.tuning)
        }
      } catch {}
    }
    loadTuning()
  }, [])

  // game tick
  useEffect(() => {
    const id = setInterval(() => {
      game.tick(1)
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [game])

  // autosave local + server (full game state)
  useEffect(() => {
    const save = () => {
      const state = game.toJSON()
      localStorage.setItem('dih_state_full', JSON.stringify(state))
      fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerIdRef.current, data: state }),
      }).catch(() => {})
    }
    const id = setInterval(save, 30000)
    return () => clearInterval(id)
  }, [game])

  async function loadFromServer() {
    try {
      const id = playerIdRef.current
      const res = await fetch(`${API_BASE}/load/${id}`)
      if (res.ok) {
        const j = await res.json()
        const data = j.data || {}
        if (data) {
          const g = GameState.fromJSON(data)
          setGame(g)
        }
      }
    } catch {}
  }

  useEffect(() => { loadFromServer() }, [])

  function buyAutoClicker() {
    const cost = (tuning.auto_base_cost || 50) + game.autoClickers * (tuning.auto_cost_scaling || 25)
    if (game.buyAutoClicker(cost)) setTick(t => t + 1)
  }

  function upgradeClickPower() {
    const cost = (tuning.click_base_cost || 20) * game.clickPower
    if (game.resources >= cost) {
      game.resources -= cost
      game.clickPower += 1
      setTick(t => t + 1)
    }
  }

  function buyProducer(i) {
    const cost = game.producerCost(i)
    if (game.buyProducer(i, cost)) setTick(t => t + 1)
  }

  function buySkill(id) {
    if (game.buySkill(id)) setTick(t => t + 1)
  }

  function prestige() {
    if (game.prestigeToNextWorld()) setTick(t => t + 1)
  }

  function buyArtifact(id) {
    if (game.buyArtifact(id)) setTick(t => t + 1)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 10, top: 10, padding: 10, background: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: 6, maxWidth: 360 }}>
        <div><strong>World:</strong> {game.currentWorld().name} (x{game.currentWorld().multiplier})</div>
        <div>Resources: {Math.floor(game.resources)}</div>
        <div>Auto Clickers: {game.autoClickers}</div>
        <div>Click Power: {game.clickPower}</div>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => { game.click(); setTick(t => t + 1) }}>Click (+{game.clickPower})</button>
          <button onClick={buyAutoClicker} style={{ marginLeft: 8 }}>Buy Auto ({(tuning.auto_base_cost || 50) + game.autoClickers * (tuning.auto_cost_scaling || 25)})</button>
          <button onClick={upgradeClickPower} style={{ marginLeft: 8 }}>Upgrade Click ({(tuning.click_base_cost || 20) * game.clickPower})</button>
        </div>
          <hr />
        <div><strong>Producers</strong></div>
        {game.producers.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>{p.name} L{p.level} (+{p.baseProduction * p.level}/s)</div>
            <div>
              <button onClick={() => buyProducer(i)}>Buy ({game.producerCost(i)})</button>
            </div>
          </div>
        ))}
        <hr />
        <div><strong>Skills</strong></div>
        {game.skills.map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>{s.name} L{s.level}/{s.maxLevel}</div>
            <div>
              <button onClick={() => buySkill(s.id)}>Buy ({Math.ceil(s.baseCost * Math.pow(2, s.level))})</button>
            </div>
          </div>
        ))}
        <hr />
        <div><strong>Artifacts</strong></div>
        {game.artifacts.map(a => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>{a.name} {a.owned ? '(owned)' : ''}</div>
            <div>
              {!a.owned && <button onClick={() => buyArtifact(a.id)}>Buy ({a.cost})</button>}
            </div>
          </div>
        ))}
        <hr />
        <div><strong>Prestige</strong></div>
        <div>Meta Points: {game.metaPoints}</div>
        <div style={{ marginTop: 6 }}>
          <button onClick={prestige} disabled={!game.canPrestige()}>Prestige to next world</button>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 10, top: 10, width: 320, padding: 10, background: 'rgba(255,255,255,0.9)', borderRadius: 6 }}>
        <Leaderboard />
      </div>
      <div style={{ width: '100%', height: '100%' }} ref={mountRef} />
    </div>
  )
}
