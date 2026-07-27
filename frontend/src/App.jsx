import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import GameState from './game/state'
import Leaderboard from './Leaderboard'
import { getTuning } from './api'

const STORAGE_KEY = 'dih_state_full'
const PLAYER_ID_KEY = 'dih_player_id'

function loadSavedGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return GameState.fromJSON(JSON.parse(raw))
  } catch {
    // ignore malformed local storage
  }
  return new GameState()
}

function saveGame(game) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game.toJSON()))
  } catch {}
}

function getPlayerId() {
  try {
    let id = localStorage.getItem(PLAYER_ID_KEY)
    if (!id) {
      id = 'player-' + Math.random().toString(36).slice(2, 10)
      localStorage.setItem(PLAYER_ID_KEY, id)
    }
    return id
  } catch {
    return 'player-unknown'
  }
}

export default function App() {
  const mountRef = useRef(null)
  const [game, setGame] = useState(loadSavedGame)
  const [, setTick] = useState(0)
  const [tuning, setTuning] = useState(null)
  const [backendEnabled] = useState(Boolean(import.meta.env.VITE_API_BASE || window.__API_BASE__))
  const playerId = useRef(getPlayerId())

  useEffect(() => {
    async function loadConfig() {
      const t = await getTuning()
      setTuning(t)
    }
    loadConfig()
  }, [])

  useEffect(() => {
    saveGame(game)
  }, [game])

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
        setTick((t) => t + 1)
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
  }, [game])

  useEffect(() => {
    const interval = setInterval(() => {
      game.tick(1)
      setTick((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [game])

  const effectiveTuning = tuning || {
    auto_base_cost: 50,
    auto_cost_scaling: 25,
    click_base_cost: 20,
    click_value: 1,
    click_multiplier_cost_base: 2,
  }

  function buyAutoClicker() {
    const cost = (effectiveTuning.auto_base_cost || 50) + game.autoClickers * (effectiveTuning.auto_cost_scaling || 25)
    if (game.buyAutoClicker(cost)) setTick((t) => t + 1)
  }

  function upgradeClickPower() {
    const cost = (effectiveTuning.click_base_cost || 20) * game.clickPower
    if (game.resources >= cost) {
      game.resources -= cost
      game.clickPower += 1
      setTick((t) => t + 1)
    }
  }

  function buyProducer(i) {
    const cost = game.producerCost(i)
    if (game.buyProducer(i, cost)) setTick((t) => t + 1)
  }

  function buySkill(id) {
    if (game.buySkill(id)) setTick((t) => t + 1)
  }

  function prestige() {
    if (game.prestigeToNextWorld()) setTick((t) => t + 1)
  }

  function buyArtifact(id) {
    if (game.buyArtifact(id)) setTick((t) => t + 1)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#08111f', color: '#f4f8ff' }}>
      <div style={{ position: 'absolute', left: 16, top: 16, padding: 18, background: 'rgba(5, 11, 24, 0.9)', borderRadius: 14, maxWidth: 420, fontFamily: 'system-ui, sans-serif', fontSize: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>DIH Evo Engine</h2>
            <div style={{ color: '#8fb6d6', fontSize: 12 }}>Local-first incremental game with optional backend sync.</div>
          </div>
          <a href="/admin/" style={{ color: '#93ddff', textDecoration: 'none', fontSize: 14 }}>Admin</a>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <div><strong>World:</strong> {game.currentWorld().name} (x{game.currentWorld().multiplier.toFixed(2)})</div>
          <div><strong>Resources:</strong> {Math.floor(game.resources)}</div>
          <div><strong>Auto Clickers:</strong> {game.autoClickers}</div>
          <div><strong>Click Power:</strong> {game.clickPower}</div>
          <div><strong>Backend:</strong> {backendEnabled ? 'enabled' : 'local only'}</div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { game.click(); setTick((t) => t + 1) }} style={{ flex: 1, minWidth: 120, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#76d2ff', color: '#06223d', cursor: 'pointer' }}>Click (+{game.clickPower})</button>
          <button onClick={buyAutoClicker} style={{ flex: 1, minWidth: 120, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#4a94ff', color: '#fff', cursor: 'pointer' }}>Buy Auto ({game.producerCost(0)})</button>
          <button onClick={upgradeClickPower} style={{ flex: 1, minWidth: 120, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#d17bff', color: '#fff', cursor: 'pointer' }}>Upgrade Click ({(effectiveTuning.click_base_cost || 20) * game.clickPower})</button>
        </div>

        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '12px 0 8px' }}>Producers</h4>
          {game.producers.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8, background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 10 }}>
              <div>{p.name} L{p.level} (+{(p.baseProduction * p.level * game.currentWorld().multiplier).toFixed(1)}/s)</div>
              <button onClick={() => buyProducer(i)} style={{ borderRadius: 8, border: 'none', padding: '8px 10px', background: '#6fd7a9', color: '#0d2c1d', cursor: 'pointer' }}>Buy {game.producerCost(i)}</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '12px 0 8px' }}>Skills</h4>
          {game.skills.map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8, background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 10 }}>
              <div>{s.name} L{s.level}/{s.maxLevel}</div>
              <button onClick={() => buySkill(s.id)} disabled={s.level >= s.maxLevel} style={{ borderRadius: 8, border: 'none', padding: '8px 10px', background: s.level >= s.maxLevel ? '#999' : '#ffa04a', color: '#051405', cursor: s.level >= s.maxLevel ? 'not-allowed' : 'pointer' }}>Buy {Math.ceil(s.baseCost * Math.pow(2, s.level))}</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '12px 0 8px' }}>Artifacts</h4>
          {game.artifacts.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8, background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 10 }}>
              <div>{a.name} {a.owned ? '(owned)' : ''}</div>
              {!a.owned && <button onClick={() => buyArtifact(a.id)} style={{ borderRadius: 8, border: 'none', padding: '8px 10px', background: '#ff7ca5', color: '#2b051e', cursor: 'pointer' }}>Buy {a.cost}</button>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><strong>Meta Points:</strong> {game.metaPoints}</div>
          <button onClick={prestige} disabled={!game.canPrestige()} style={{ borderRadius: 8, border: 'none', padding: '10px 14px', background: '#ffda5e', color: '#2e2000', cursor: game.canPrestige() ? 'pointer' : 'not-allowed' }}>Prestige</button>
        </div>
      </div>

      <div style={{ position: 'absolute', right: 16, top: 16, width: 320, padding: 18, background: 'rgba(255,255,255,0.94)', borderRadius: 14, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', color: '#111' }}>
        <Leaderboard />
      </div>

      <div style={{ width: '100%', height: '100%' }} ref={mountRef} />
    </div>
  )
}
