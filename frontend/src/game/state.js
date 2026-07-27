class GameState {
  constructor(obj) {
    if (obj) return GameState.fromJSON(obj)
    this.resources = 0
    this.clickPower = 1
    this.autoClickers = 0

    // Layer 2: producers
    this.producers = [
      { id: 'herb', name: 'Herb Patch', level: 0, baseProduction: 1, baseCost: 10, costScaling: 1.2 },
      { id: 'nest', name: 'Nest', level: 0, baseProduction: 5, baseCost: 100, costScaling: 1.25 },
    ]

    // Layer 3: simple skill tree
    this.skills = [
      { id: 'click_master', name: 'Click Mastery', level: 0, maxLevel: 5, baseCost: 50, effect: { clickPowerMult: 0.5 } },
      { id: 'automation', name: 'Automation', level: 0, maxLevel: 5, baseCost: 75, effect: { autoBonus: 1 } },
    ]

    // Layer 4: worlds/biomes
    this.worldIndex = 0
    this.worlds = [
      { id: 'plains', name: 'Plains', multiplier: 1 },
      { id: 'jungle', name: 'Jungle', multiplier: 1.1 },
      { id: 'volcano', name: 'Volcano', multiplier: 1.25 },
    ]
    this.metaPoints = 0 // prestige currency when switching worlds

    // Layer 5: artifacts / strategic
    this.artifacts = [
      { id: 'amulet', name: 'Amulet of Growth', owned: false, cost: 500, effect: { resourceMult: 1.1 } },
    ]

    this.tuning = null
  }

  tick(dt = 1) {
    // autos
    this.resources += this.autoClickers * dt

    // producers
    let prod = 0
    for (const p of this.producers) {
      prod += p.level * p.baseProduction
    }
    prod *= this.currentWorld().multiplier
    // artifacts
    for (const a of this.artifacts) if (a.owned && a.effect && a.effect.resourceMult) prod *= a.effect.resourceMult
    this.resources += prod * dt
  }

  click() {
    let mult = 1
    for (const s of this.skills) if (s.id === 'click_master') mult += s.level * s.effect.clickPowerMult
    for (const a of this.artifacts) if (a.owned && a.effect && a.effect.resourceMult) mult *= a.effect.resourceMult
    this.resources += this.clickPower * mult
  }

  buyAutoClicker(cost) {
    // cost provided by UI tuning calculation
    if (this.resources >= cost) {
      this.resources -= cost
      this.autoClickers += 1
      return true
    }
    return false
  }

  buyProducer(index, cost) {
    const p = this.producers[index]
    if (!p) return false
    if (this.resources >= cost) {
      this.resources -= cost
      p.level += 1
      return true
    }
    return false
  }

  producerCost(index) {
    const p = this.producers[index]
    return Math.ceil(p.baseCost * Math.pow(p.costScaling, p.level))
  }

  buySkill(id) {
    const s = this.skills.find(x => x.id === id)
    if (!s || s.level >= s.maxLevel) return false
    const cost = Math.ceil(s.baseCost * Math.pow(2, s.level))
    if (this.resources >= cost) {
      this.resources -= cost
      s.level += 1
      // some skills grant auto bonuses
      if (s.id === 'automation') this.autoClickers += s.effect.autoBonus
      return true
    }
    return false
  }

  currentWorld() {
    return this.worlds[this.worldIndex]
  }

  canPrestige() {
    return this.worldIndex < this.worlds.length - 1
  }

  prestigeToNextWorld() {
    if (!this.canPrestige()) return false
    // convert resources to metaPoints
    const gained = Math.floor(this.resources / 1000)
    this.metaPoints += gained
    // reset core progress but keep artifacts and metaPoints
    this.resources = 0
    this.clickPower = 1
    this.autoClickers = 0
    for (const p of this.producers) p.level = 0
    for (const s of this.skills) s.level = 0
    this.worldIndex += 1
    return true
  }

  buyArtifact(id) {
    const a = this.artifacts.find(x => x.id === id)
    if (!a || a.owned) return false
    if (this.resources >= a.cost) {
      this.resources -= a.cost
      a.owned = true
      return true
    }
    return false
  }

  toJSON() {
    return {
      resources: this.resources,
      clickPower: this.clickPower,
      autoClickers: this.autoClickers,
      producers: this.producers,
      skills: this.skills,
      worldIndex: this.worldIndex,
      metaPoints: this.metaPoints,
      artifacts: this.artifacts,
    }
  }

  static fromJSON(obj) {
    const s = new GameState()
    Object.assign(s, {
      resources: obj.resources || 0,
      clickPower: obj.clickPower || 1,
      autoClickers: obj.autoClickers || 0,
      producers: obj.producers || s.producers,
      skills: obj.skills || s.skills,
      worldIndex: obj.worldIndex || 0,
      metaPoints: obj.metaPoints || 0,
      artifacts: obj.artifacts || s.artifacts,
    })
    return s
  }
}

export default GameState
