<template>
  <div style="padding-top:12px">
    <h3>Leaderboard</h3>
    <div v-if="loading">Loading…</div>
    <div v-else>
      <ol>
        <li v-for="entry in board" :key="entry.player_id + entry.ts">{{ entry.player_id }} — {{ Math.floor(entry.score) }}</li>
      </ol>
      <div style="margin-top:8px">
        <input v-model="playerId" placeholder="player id" />
        <input v-model.number="score" type="number" placeholder="score" style="width:120px;margin-left:8px" />
        <button @click="submit" style="margin-left:8px">Submit</button>
        <button @click="clearBoard" style="margin-left:8px">Clear (admin)</button>
      </div>
      <div v-if="message" style="margin-top:8px">{{ message }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Leaderboard',
  data() {
    return { loading: true, board: [], playerId: '', score: 0, message: '' }
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const base = window.__API_BASE__ || 'http://localhost:8000'
        const res = await fetch(`${base}/leaderboard`)
        const j = await res.json()
        this.board = j.board || []
      } catch (e) {
        this.message = 'Failed to load leaderboard.'
      } finally {
        this.loading = false
      }
    },
    async submit() {
      try {
        const base = window.__API_BASE__ || 'http://localhost:8000'
        const res = await fetch(`${base}/leaderboard`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: this.playerId, score: this.score }) })
        const j = await res.json()
        if (j.ok) {
          this.message = 'Submitted.'
          this.load()
        } else this.message = 'Submit failed.'
      } catch (e) {
        this.message = 'Submit failed.'
      }
    }
    ,
    async clearBoard() {
      try {
        const base = window.__API_BASE__ || 'http://localhost:8000'
        const res = await fetch(`${base}/admin/leaderboard/clear`, { method: 'POST' })
        const j = await res.json()
        if (j.ok) {
          this.message = 'Cleared.'
          this.load()
        } else this.message = 'Clear failed.'
      } catch (e) {
        this.message = 'Clear failed.'
      }
    }
  },
  mounted() { this.load() }
}
</script>
