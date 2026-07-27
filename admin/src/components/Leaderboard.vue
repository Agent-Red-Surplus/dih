<template>
  <div style="padding-top:12px">
    <h3>Leaderboard</h3>
    <div v-if="loading">Loading…</div>
    <div v-else>
      <ol>
        <li v-for="entry in board" :key="entry.player_id + '-' + entry.ts">
          {{ entry.player_id }} — {{ Math.floor(entry.score) }}
        </li>
      </ol>
      <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; align-items:center">
        <input v-model="playerId" placeholder="player id" style="flex:1; min-width:120px" />
        <input v-model.number="score" type="number" placeholder="score" style="width:120px" />
        <button @click="submit">Submit</button>
        <button @click="clearBoard">Clear</button>
      </div>
      <div v-if="message" style="margin-top:8px">{{ message }}</div>
    </div>
  </div>
</template>

<script>
import { getLeaderboard, submitLeaderboard, clearLeaderboard } from '../api'

export default {
  name: 'Leaderboard',
  data() {
    return {
      loading: true,
      board: [],
      playerId: '',
      score: 0,
      message: '',
    }
  },
  methods: {
    async load() {
      this.loading = true
      this.message = ''
      try {
        this.board = await getLeaderboard()
      } catch (e) {
        this.message = 'Failed to load leaderboard.'
      } finally {
        this.loading = false
      }
    },
    async submit() {
      if (!this.playerId) {
        this.message = 'Enter a player id.'
        return
      }
      const result = await submitLeaderboard(this.playerId, this.score)
      if (result.ok) {
        this.message = result.fallback ? 'Saved locally.' : 'Submitted.'
        this.load()
      } else {
        this.message = 'Submit failed.'
      }
    },
    async clearBoard() {
      const result = await clearLeaderboard()
      if (result.ok) {
        this.message = result.fallback ? 'Cleared locally.' : 'Cleared.'
        this.load()
      } else {
        this.message = 'Clear failed.'
      }
    },
  },
  mounted() {
    this.load()
  },
}
</script>
