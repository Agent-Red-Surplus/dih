const wasmPath = import.meta.env.VITE_MISSION_WASM_PATH || '/unity/mission.wasm'
let wasmModule = null
let wasmExports = null

export async function initMissionWasm() {
  if (wasmExports) return wasmExports
  try {
    const response = await fetch(wasmPath)
    const bytes = await response.arrayBuffer()
    const result = await WebAssembly.instantiate(bytes, {})
    wasmModule = result.module
    wasmExports = result.instance.exports
    return wasmExports
  } catch (error) {
    console.warn('Mission WASM failed to load:', error)
    return null
  }
}

export async function computeWasmReward(score) {
  const exports = await initMissionWasm()
  if (!exports || !exports.compute_reward) return Math.floor(score * 10)
  try {
    return exports.compute_reward(score)
  } catch {
    return Math.floor(score * 10)
  }
}

export async function computeHitDamage(hitCount) {
  const exports = await initMissionWasm()
  if (!exports || !exports.compute_hit_damage) return Math.max(1, Math.floor(hitCount / 2))
  try {
    return exports.compute_hit_damage(hitCount)
  } catch {
    return Math.max(1, Math.floor(hitCount / 2))
  }
}
