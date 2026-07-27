<template>
  <div style="padding:20px; max-width:960px; margin:0 auto; color:#f8f8ff; background:#07101f; min-height:100vh;">
    <h1 style="margin-bottom:16px;">DIH Admin Console</h1>
    <div style="display:grid; grid-template-columns:1fr 320px; gap:18px;">
      <div style="background:rgba(255,255,255,0.05); border-radius:18px; padding:18px; border:1px solid rgba(255,255,255,0.08);">
        <Tuning />
      </div>
      <div style="background:rgba(255,255,255,0.05); border-radius:18px; padding:18px; border:1px solid rgba(255,255,255,0.08);">
        <Leaderboard />
      </div>
    </div>
  </div>
</template>

<script>
import Tuning from './components/Tuning.vue'
import Leaderboard from './components/Leaderboard.vue'

export default {
  name: 'App',
  components: { Tuning, Leaderboard }
}
</script>
