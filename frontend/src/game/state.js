class GameState {
  constructor(obj) {
    if (obj) return GameState.fromJSON(obj)
    this.resources = 0
    this.clickPower = 1
    this.clickRate = 1
    this.autoClickers = 0
    this.colonies = []
    this.research = []
    this.prestigeResources = {
      evolutionShards: 0,
      colonyCommission: 0,
      voidCrystals: 0,
    }
    this.producers = [
      { id: 'herb', name: 'Herb Patch', level: 0, baseProduction: 1, baseCost: 10, costScaling: 1.2 },
      { id: 'nest', name: 'Nest', level: 0, baseProduction: 5, baseCost: 120, costScaling: 1.25 },
      { id: 'forge', name: 'Forge', level: 0, baseProduction: 30, baseCost: 900, costScaling: 1.3 },
      { id: 'mine', name: 'Ore Mine', level: 0, baseProduction: 120, baseCost: 6500, costScaling: 1.35 },
      { id: 'colony', name: 'Resource Colony', level: 0, baseProduction: 800, baseCost: 50000, costScaling: 1.45 },
    ]
    this.skills = [
      { id: 'click_master', name: 'Click Mastery', level: 0, maxLevel: 8, baseCost: 50, effect: { clickPowerMult: 0.4 } },
      { id: 'automation', name: 'Automation', level: 0, maxLevel: 8, baseCost: 120, effect: { autoBonus: 1 } },
      { id: 'resource_flow', name: 'Resource Flow', level: 0, maxLevel: 6, baseCost: 800, effect: { productionMult: 0.15 } },
      { id: 'shard_synthesis', name: 'Shard Synthesis', level: 0, maxLevel: 5, baseCost: 5000, effect: { shardGain: 0.05 } },
    ]
    this.worldIndex = 0
    this.worlds = [
      { id: 'plains', name: 'Plains', multiplier: 1 },
      { id: 'jungle', name: 'Jungle', multiplier: 1.2 },
      { id: 'volcano', name: 'Volcano', multiplier: 1.4 },
      { id: 'sky', name: 'Sky Colony', multiplier: 1.6 },
      { id: 'nova', name: 'Nova', multiplier: 1.95 },
    ]
    this.metaPoints = 0
    this.artifacts = [
      { id: 'amulet', name: 'Amulet of Growth', owned: false, cost: 500, effect: { resourceMult: 1.1 } },
      { id: 'chronosphere', name: 'Chronosphere', owned: false, cost: 7500, effect: { tickSpeed: 0.9 } },
      { id: 'orb', name: 'Void Orb', owned: false, cost: 40000, effect: { productionMult: 1.25 } },
    ]
    this.quests = [
      { id: 'first_click', title: 'First Contact', description: 'Click to awaken your first engine.', completed: false, reward: { resources: 25 } },
      { id: 'build_nest', title: 'Farm the Nest', description: 'Unlock your first Nest.', completed: false, reward: { resources: 200 } },
      { id: 'colonize', title: 'New Colony', description: 'Build your first Colony.', completed: false, reward: { evolutionShards: 1 } },
    ]
    this.stats = {
      totalClicks: 0,
      totalProduction: 0,
      totalPrestiges: 0,
      totalColonies: 0,
      totalArtifacts: 0,
    }
  }

  tick(dt = 1) {
    const production = this.getProductionPerSecond()
    this.resources += production * dt
    this.stats.totalProduction += production * dt
    this.colonies.forEach((colony) => {
      colony.produced = (colony.produced || 0) + colony.level * 0.25 * dt
    })
  }

  click() {
    let strength = this.clickPower * this.clickRate
    const clickMaster = this.skills.find(s => s.id === 'click_master')
    strength += strength * clickMaster.level * clickMaster.effect.clickPowerMult
    if (this.artifacts.find(a => a.id === 'chronosphere' && a.owned)) strength *= 1.1
    this.resources += strength
    this.stats.totalClicks += 1
    this.maybeCompleteQuest('first_click')
  }

  getProductionPerSecond() {
    let prod = this.autoClickers * 2
    for (const producer of this.producers) {
      prod += producer.level * producer.baseProduction * this.getProducerBonus(producer)
    }
    const world = this.currentWorld()
    prod *= world.multiplier
    const resourceFlow = this.skills.find(s => s.id === 'resource_flow')
    prod *= 1 + resourceFlow.level * resourceFlow.effect.productionMult
    if (this.artifacts.some(a => a.owned && a.effect && a.effect.resourceMult)) {
      prod *= this.artifacts.reduce((acc, a) => (a.owned && a.effect && a.effect.resourceMult ? acc * a.effect.resourceMult : acc), 1)
    }
    return prod
  }

  getProducerBonus(producer) {
    let bonus = 1
    if (producer.id === 'nest') bonus += 0.05 * this.skills.find(s => s.id === 'automation').level
    if (producer.id === 'forge') bonus += 0.1 * this.prestigeResources.evolutionShards
    if (producer.id === 'colony') bonus += 0.15 * this.colonies.length
    return bonus
  }

  buyAutoClicker(cost) {
    if (this.resources >= cost) {
      this.resources -= cost
      this.autoClickers += 1
      return true
    }
    return false
  }

  buyProducer(index, cost) {
    const producer = this.producers[index]
    if (!producer || this.resources < cost) return false
    this.resources -= cost
    producer.level += 1
    if (producer.id === 'colony') {
      this.colonies.push({ id: `colony-${producer.level}-${Date.now()}`, level: producer.level, produced: 0 })
      this.stats.totalColonies += 1
      this.maybeCompleteQuest('colonize')
    }
    return true
  }

  producerCost(index) {
    const producer = this.producers[index]
    return Math.ceil(producer.baseCost * Math.pow(producer.costScaling, producer.level))
  }

  buySkill(id) {
    const skill = this.skills.find(x => x.id === id)
    if (!skill || skill.level >= skill.maxLevel) return false
    const cost = Math.ceil(skill.baseCost * Math.pow(2, skill.level))
    if (this.resources < cost) return false
    this.resources -= cost
    skill.level += 1
    if (skill.id === 'automation') this.autoClickers += skill.effect.autoBonus
    return true
  }

  currentWorld() {
    return this.worlds[this.worldIndex]
  }

  getPrestigeThreshold() {
    return 25000 * Math.pow(2, this.worldIndex)
  }

  canPrestige() {
    return this.worldIndex < this.worlds.length - 1 && this.resources >= this.getPrestigeThreshold()
  }

  prestigeToNextWorld() {
    if (!this.canPrestige()) return false
    const gained = Math.max(1, Math.floor(this.resources / 6000) + this.worldIndex * 2)
    this.metaPoints += gained
    this.prestigeResources.evolutionShards += Math.floor(gained * 0.5)
    this.prestigeResources.colonyCommission += Math.floor(gained * 0.4)
    this.prestigeResources.voidCrystals += Math.floor(gained * 0.2)
    this.stats.totalPrestiges += 1
    this.resources = 0
    this.clickPower = 1
    this.clickRate = 1
    this.autoClickers = 0
    this.colonies = []
    this.research = []
    for (const producer of this.producers) producer.level = 0
    for (const skill of this.skills) skill.level = 0
    this.worldIndex += 1
    return true
  }

  buyArtifact(id) {
    const artifact = this.artifacts.find(x => x.id === id)
    if (!artifact || artifact.owned || this.resources < artifact.cost) return false
    this.resources -= artifact.cost
    artifact.owned = true
    this.stats.totalArtifacts += 1
    return true
  }

  maybeCompleteQuest(id) {
    const quest = this.quests.find(q => q.id === id && !q.completed)
    if (!quest) return
    quest.completed = true
    this.resources += quest.reward.resources || 0
    this.prestigeResources.evolutionShards += quest.reward.evolutionShards || 0
  }

  toJSON() {
    return {
      resources: this.resources,
      clickPower: this.clickPower,
      clickRate: this.clickRate,
      autoClickers: this.autoClickers,
      colonies: this.colonies,
      research: this.research,
      prestigeResources: this.prestigeResources,
      producers: this.producers,
      skills: this.skills,
      worldIndex: this.worldIndex,
      metaPoints: this.metaPoints,
      artifacts: this.artifacts,
      quests: this.quests,
      stats: this.stats,
    }
  }

  static fromJSON(obj) {
    const state = new GameState()
    Object.assign(state, {
      resources: obj.resources || 0,
      clickPower: obj.clickPower || 1,
      clickRate: obj.clickRate || 1,
      autoClickers: obj.autoClickers || 0,
      colonies: obj.colonies || state.colonies,
      research: obj.research || state.research,
      prestigeResources: obj.prestigeResources || state.prestigeResources,
      producers: obj.producers || state.producers,
      skills: obj.skills || state.skills,
      worldIndex: obj.worldIndex || 0,
      metaPoints: obj.metaPoints || 0,
      artifacts: obj.artifacts || state.artifacts,
      quests: obj.quests || state.quests,
      stats: obj.stats || state.stats,
    })
    return state
  }
}

export default GameState
