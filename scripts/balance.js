const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'backend', 'data')
let tuning = null
const defaultTuning = {
  auto_base_cost: 50,
  auto_cost_scaling: 25,
  click_base_cost: 20,
  click_value: 1,
  click_multiplier_cost_base: 2,
  producers: [
    { id: 'herb', name: 'Herb Patch', baseProduction: 1, baseCost: 10, costScaling: 1.2 },
    { id: 'nest', name: 'Nest', baseProduction: 5, baseCost: 100, costScaling: 1.25 }
  ],
  skills: [],
  worlds: [ { id: 'plains', multiplier: 1 } ],
  artifacts: []
}

try {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'admin_tuning.json'), 'utf8')
  tuning = JSON.parse(raw).tuning
} catch (e) {
  tuning = defaultTuning
}

// Simulation: naive greedy strategy
function simulate(goal = 1e6, maxTicks = 24 * 365 * 2 /* 2 years in hours */) {
  let resources = 0
  let auto = 0
  const producers = tuning.producers.map(p => ({ ...p, level: 0 }))
  const artifacts = tuning.artifacts.map(a => ({ ...a, owned: false }))
  let worldMult = tuning.worlds && tuning.worlds[0] ? tuning.worlds[0].multiplier : 1

  for (let t = 0; t < maxTicks; t++) {
    // each tick is 1 hour
    // income from autos
    resources += auto
    // income from producers
    let prod = 0
    for (const p of producers) prod += p.level * p.baseProduction
    prod *= worldMult
    for (const a of artifacts) if (a.owned && a.effect && a.effect.resourceMult) prod *= a.effect.resourceMult
    resources += prod

    // attempt buys: prioritize cheapest producer, then auto, then artifact
    // buy producers greedily
    producers.sort((a, b) => (a.baseCost * Math.pow(a.costScaling, a.level)) - (b.baseCost * Math.pow(b.costScaling, b.level)))
    for (const p of producers) {
      const cost = Math.ceil(p.baseCost * Math.pow(p.costScaling, p.level))
      if (resources >= cost) {
        resources -= cost
        p.level += 1
      }
    }

    // buy auto if affordable
    const autoCost = tuning.auto_base_cost + Math.floor(auto * tuning.auto_cost_scaling)
    if (resources >= autoCost) {
      resources -= autoCost
      auto += 1
    }

    // buy artifact if cheap and not owned
    for (const a of artifacts) {
      if (!a.owned && resources >= a.cost) {
        resources -= a.cost
        a.owned = true
      }
    }

    if (resources >= goal) return { reached: true, hours: t + 1 }
  }
  return { reached: false, hours: maxTicks }
}

function run() {
  console.log('Using tuning:', tuning.producers ? 'admin_tuning.json' : 'defaults')
  const res = simulate()
  if (res.reached) console.log(`Goal reached in ${res.hours} hours (~${(res.hours/24).toFixed(1)} days).`)
  else console.log(`Goal NOT reached in ${res.hours} hours (~${(res.hours/24).toFixed(1)} days).`)
}

if (require.main === module) run()

module.exports = { simulate }
