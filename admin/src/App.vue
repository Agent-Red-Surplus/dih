<template>
  <div style="padding:20px">
    <h1>DIH Admin Dashboard</h1>
    <Tuning />
    <Leaderboard />
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
