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
        const base = window.__API_BASE__ || 'http://localhost:8000'
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
        const base = window.__API_BASE__ || 'http://localhost:8000'
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
        click_multiplier_cost_base: 2
      }
    }
  },
  mounted() {
    this.load()
  }
}
</script>
