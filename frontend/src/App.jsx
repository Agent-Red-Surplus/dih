import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import GameState from './game/state'
import Leaderboard from './Leaderboard'
import { getTuning, saveGameState, loadGameState } from './api'

const STORAGE_KEY = 'dih_state_full'
const PLAYER_ID_KEY = 'dih_player_id'
const ADMIN_PASSWORD = 'renzo'

function loadSavedGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return GameState.fromJSON(JSON.parse(raw))
  } catch {}
  return new GameState()
}

function saveToLocal(game) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game.toJSON()))
  } catch {}
}

export default function App() {
  const mountRef = useRef(null)
  const [game, setGame] = useState(loadSavedGame)
  const [, setTick] = useState(0)
  const [tuning, setTuning] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const [adminError, setAdminError] = useState('')
  const [isBackendEnabled, setIsBackendEnabled] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(PLAYER_ID_KEY)
    if (!stored) {
      localStorage.setItem(PLAYER_ID_KEY, 'player-' + Math.random().toString(36).slice(2, 10))
    }
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(65, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    const directional = new THREE.DirectionalLight(0xffffff, 0.8)
    directional.position.set(3, 4, 2)
    scene.add(directional)

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x14213d, side: THREE.DoubleSide })
    )
    plane.rotation.x = Math.PI / 2
    scene.add(plane)

    const nodes = []
    for (let i = 0; i < 8; i++) {
      const geometry = new THREE.IcosahedronGeometry(0.3 + Math.random() * 0.25, 1)
      const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(`hsl(${Math.random() * 360}, 70%, 55%)`), metalness: 0.4, roughness: 0.3 })
      const shard = new THREE.Mesh(geometry, material)
      shard.position.set((Math.random() - 0.5) * 10, 0.5 + Math.random() * 1.5, (Math.random() - 0.5) * 10)
      scene.add(shard)
      nodes.push(shard)
    }

    const cameraTarget = new THREE.Vector3(0, 1, 0)
    camera.position.set(0, 3, 8)
    camera.lookAt(cameraTarget)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    function onPointerDown(e) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(nodes, true)
      if (hits.length > 0) {
        game.click()
        setTick(t => t + 1)
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    let frame = null
    function animate() {
      nodes.forEach((node, index) => {
        node.rotation.y += 0.005 + index * 0.0005
        node.position.y = 0.5 + Math.sin(Date.now() * 0.001 + index) * 0.15
      })
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    function onResize() {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      nodes.forEach(node => node.geometry.dispose())
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [game])

  useEffect(() => {
    async function loadSettings() {
      const tuning = await getTuning()
      if (tuning) setTuning(tuning)
      const backendEnabled = !!import.meta.env.VITE_API_BASE || !!window.__API_BASE__
      setIsBackendEnabled(backendEnabled)
    }
    loadSettings()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      game.tick(1)
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [game])

  useEffect(() => {
    saveToLocal(game)
    const playerId = localStorage.getItem(PLAYER_ID_KEY)
    if (playerId) saveGameState(playerId, game.toJSON())
  }, [game])

  async function loadFromServer() {
    const playerId = localStorage.getItem(PLAYER_ID_KEY)
    if (!playerId) return
    const result = await loadGameState(playerId)
    if (result.ok && result.data) {
      setGame(GameState.fromJSON(result.data))
    }
  }

  useEffect(() => {
    loadFromServer()
  }, [])

  function buyAutoClicker() {
    const cost = (tuning?.auto_base_cost || 50) + game.autoClickers * (tuning?.auto_cost_scaling || 25)
    if (game.buyAutoClicker(cost)) setTick((t) => t + 1)
  }

  function buyProducer(index) {
    const cost = game.producerCost(index)
    if (game.buyProducer(index, cost)) setTick((t) => t + 1)
  }

  function buySkill(id) {
    if (game.buySkill(id)) setTick((t) => t + 1)
  }

  function prestige() {
    if (game.prestigeToNextWorld()) setTick((t) => t + 1)
  }

  function tryAdminLogin() {
    if (adminKey === ADMIN_PASSWORD) {
      setAdminOpen(true)
      setAdminError('')
    } else {
      setAdminError('Invalid password')
    }
  }

  const availableProducers = game.producers.map((p, i) => ({ ...p, cost: game.producerCost(i) }))
  const prestigeReady = game.canPrestige()

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a1326', color: '#f8f8ff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 16, top: 16, width: 380, padding: 18, background: 'rgba(3, 18, 45, 0.94)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 style={{ marginTop: 0, fontSize: '1.5rem' }}>DIH: Colony Nexus</h1>
        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          <div><strong>{game.currentWorld().name}</strong> · x{game.currentWorld().multiplier.toFixed(2)}</div>
          <div>Resources: {Math.floor(game.resources)}</div>
          <div>Evo Shards: {game.prestigeResources.evolutionShards}</div>
          <div>Void Crystals: {game.prestigeResources.voidCrystals}</div>
          <div>Colonies: {game.colonies.length}</div>
          <div>Meta Points: {game.metaPoints}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={buttonStyle} onClick={() => { game.click(); setTick(t => t + 1) }}>Launch Strike</button>
          <button style={buttonStyle} onClick={() => buyAutoClicker(game.autoClickers * (tuning?.auto_cost_scaling || 25) + (tuning?.auto_base_cost || 50))}>Auto Unit ({game.autoClickers * (tuning?.auto_cost_scaling || 25) + (tuning?.auto_base_cost || 50)})</button>
          <button style={buttonStyle} onClick={() => buyProducer(0)}>Herb Patch ({availableProducers[0]?.cost})</button>
        </div>
        <div style={{ marginTop: 14 }}>
          <h2 style={{ margin: '16px 0 8px' }}>Infrastructure</h2>
          {availableProducers.map((producer, idx) => (
            <div key={producer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <div>
                <strong>{producer.name}</strong> L{producer.level}
                <div style={{ fontSize: 12, color: '#a9b5d2' }}>Produces {producer.baseProduction} /s base</div>
              </div>
              <button style={buttonStyle} onClick={() => buyProducer(idx)}>Buy {producer.cost}</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <h2 style={{ margin: '16px 0 8px' }}>Research</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {game.skills.map((skill) => {
              const cost = Math.ceil(skill.baseCost * Math.pow(2, skill.level))
              return (
                <div key={skill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  <div>
                    <strong>{skill.name}</strong> L{skill.level}/{skill.maxLevel}
                    <div style={{ fontSize: 12, color: '#a9b5d2' }}>Next: {cost} resources</div>
                  </div>
                  <button style={buttonStyle} disabled={skill.level >= skill.maxLevel} onClick={() => buySkill(skill.id)}>Research {cost}</button>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={buttonStyle} disabled={!prestigeReady} onClick={() => { prestige(); setTick(t => t + 1) }}>Prestige</button>
          <button style={buttonStyle} onClick={() => saveToLocal(game)}>Save</button>
          <button style={buttonStyle} onClick={() => setAdminOpen(!adminOpen)}>Admin</button>
        </div>
        {adminOpen && (
          <div style={{ marginTop: 14, padding: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 14 }}>
            <h3>Admin Access</h3>
            <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder='Password' style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', marginBottom: 10 }} />
            <button style={buttonStyle} onClick={tryAdminLogin}>Enter</button>
            {adminError && <div style={{ marginTop: 8, color: '#ff8a8a' }}>{adminError}</div>}
            {adminOpen && !adminError && <div style={{ marginTop: 10, fontSize: 13 }}>Admin console unlocked at <a href='./admin/index.html' style={{ color: '#a9d1ff' }}>./admin/index.html</a></div>}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', right: 16, top: 16, width: 330, padding: 18, background: 'rgba(4, 20, 40, 0.94)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ marginTop: 0 }}>Dashboard</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={panelStyle}><strong>Production</strong>: {game.getProductionPerSecond().toFixed(1)} /s</div>
          <div style={panelStyle}><strong>Prestige Req</strong>: {game.getPrestigeThreshold()}</div>
          <div style={panelStyle}><strong>Colonies</strong>: {game.colonies.length}</div>
          <div style={panelStyle}><strong>Backend</strong>: {isBackendEnabled ? 'Enabled' : 'Local only'}</div>
        </div>
        <div style={{ marginTop: 16 }}>
          <h3>Quests</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {game.quests.map((quest) => (
              <div key={quest.id} style={{ padding: 10, background: quest.completed ? 'rgba(40, 90, 40, 0.5)' : 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                <div><strong>{quest.title}</strong></div>
                <div style={{ fontSize: 13, color: '#a9b5d2' }}>{quest.description}</div>
                <div style={{ marginTop: 4, color: quest.completed ? '#a3ffb0' : '#ffcb77' }}>{quest.completed ? 'Complete' : 'Incomplete'}</div>
              </div>
            ))}
          </div>
        </div>
        <Leaderboard />
      </div>

      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: -1 }} />
    </div>
  )
}

const buttonStyle = {
  border: 'none',
  padding: '10px 14px',
  borderRadius: 14,
  color: '#0b1b33',
  background: '#92a7ff',
  cursor: 'pointer',
}

const panelStyle = {
  padding: '12px',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.05)',
}
