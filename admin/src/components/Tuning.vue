<template>
  <div style="padding:20px; max-width:800px">
    <h2>Game Tuning</h2>
    <div v-if="loading">Loading…</div>
    <div v-else>
      <div style="display:grid;grid-template-columns:1fr 120px;gap:8px;align-items:center">
        <label>Auto base cost</label>
        <input type="number" v-model.number="tuning.auto_base_cost" />
        <label>Auto cost scaling</label>
        <input type="number" v-model.number="tuning.auto_cost_scaling" />
        <label>Click base cost</label>
        <input type="number" v-model.number="tuning.click_base_cost" />
        <label>Click value</label>
        <input type="number" v-model.number="tuning.click_value" />
        <label>Click multiplier cost base</label>
        <input type="number" v-model.number="tuning.click_multiplier_cost_base" />
      </div>

      <div style="margin-top:12px">
        <h3>Producers</h3>
        <div v-for="(p, idx) in tuning.producers" :key="p.id" style="display:grid;grid-template-columns:1fr 80px 80px 80px;gap:8px;align-items:center;margin-bottom:6px">
          <div>{{ p.name || p.id }}</div>
          <input type="number" v-model.number="p.baseProduction" />
          <input type="number" v-model.number="p.baseCost" />
          <input type="number" step="0.01" v-model.number="p.costScaling" />
        </div>
      </div>

      <div style="margin-top:12px">
        <h3>Skills</h3>
        <div v-for="(s, idx) in tuning.skills" :key="s.id" style="display:grid;grid-template-columns:1fr 80px 80px;gap:8px;align-items:center;margin-bottom:6px">
          <div>{{ s.name || s.id }}</div>
          <input type="number" v-model.number="s.baseCost" />
          <input type="number" v-model.number="s.maxLevel" />
        </div>
      </div>

      <div style="margin-top:12px">
        <h3>Worlds</h3>
        <div v-for="(w, idx) in tuning.worlds" :key="w.id" style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
          <div style="width:160px">{{ w.name || w.id }}</div>
          <input type="number" step="0.01" v-model.number="w.multiplier" />
        </div>
      </div>

      <div style="margin-top:12px">
        <h3>Artifacts</h3>
        <div v-for="(a, idx) in tuning.artifacts" :key="a.id" style="display:grid;grid-template-columns:1fr 80px 80px;gap:8px;align-items:center;margin-bottom:6px">
          <div>{{ a.name || a.id }}</div>
          <input type="number" v-model.number="a.cost" />
          <input type="number" step="0.01" v-model.number="a.effect.resourceMult" />
        </div>
      </div>

      <div style="margin-top:12px">
        <button @click="save">Save Tuning</button>
        <button @click="reset" style="margin-left:8px">Reset Defaults</button>
      </div>

      <div style="margin-top:12px">
        <label>Raw JSON (advanced)</label>
        <textarea style="width:100%;height:160px;margin-top:6px" v-model="raw"></textarea>
        <div style="margin-top:6px">
          <button @click="saveRaw">Save JSON</button>
        </div>
      </div>

      <div v-if="message" style="margin-top:8px">{{ message }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tuning',
  data() {
    return {
      loading: true,
      tuning: {},
      message: '',
      raw: ''
    }
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const base = import.meta.env.VITE_API_BASE || window.__API_BASE__ || 'http://localhost:8000'
        const res = await fetch(`${base}/admin/tuning`)
        const j = await res.json()
        this.tuning = j.tuning || {}
        this.raw = JSON.stringify(this.tuning, null, 2)
      } catch (e) {
        this.message = 'Failed to load tuning.'
        this.tuning = {}
      } finally {
        this.loading = false
      }
    },
    async save() {
      try {
        const base = import.meta.env.VITE_API_BASE || window.__API_BASE__ || 'http://localhost:8000'
        const res = await fetch(`${base}/admin/tuning`, { method: 'POST', body: JSON.stringify(this.tuning), headers: { 'Content-Type': 'application/json' } })
        const j = await res.json()
        if (j.ok) this.message = 'Saved.'
        else this.message = 'Save failed.'
      } catch (e) {
        this.message = 'Save failed.'
      }
    },
    async saveRaw() {
      try {
        const parsed = JSON.parse(this.raw)
        this.tuning = parsed
        await this.save()
      } catch (e) {
        this.message = 'Invalid JSON.'
      }
    },
    reset() {
      // reload will fall back to defaults if not present on server
      this.tuning = {
        auto_base_cost: 50,
        auto_cost_scaling: 25,
        click_base_cost: 20,
        click_value: 1,
        click_multiplier_cost_base: 2,
        producers: [
          { id: 'herb', name: 'Herb Patch', baseProduction: 1, baseCost: 10, costScaling: 1.2 },
          { id: 'nest', name: 'Nest', baseProduction: 5, baseCost: 100, costScaling: 1.25 }
        ],
        skills: [
          { id: 'click_master', name: 'Click Mastery', baseCost: 50, maxLevel: 5, effect: { clickPowerMult: 0.5 } },
          { id: 'automation', name: 'Automation', baseCost: 75, maxLevel: 5, effect: { autoBonus: 1 } }
        ],
        worlds: [
          { id: 'plains', name: 'Plains', multiplier: 1 },
          { id: 'jungle', name: 'Jungle', multiplier: 1.1 },
          { id: 'volcano', name: 'Volcano', multiplier: 1.25 }
        ],
        artifacts: [
          { id: 'amulet', name: 'Amulet of Growth', cost: 500, effect: { resourceMult: 1.1 } }
        ]
      }
    }
  },
  mounted() {
    this.load()
  }
}
</script>
