import GameState from './state'

describe('GameState basic progression', () => {
  test('click increases resources', () => {
    const g = new GameState()
    const before = g.resources
    g.click()
    expect(g.resources).toBeGreaterThan(before)
  })

  test('producer increases production after level', () => {
    const g = new GameState()
    const cost = g.producerCost(0)
    g.resources = cost
    const bought = g.buyProducer(0, cost)
    expect(bought).toBe(true)
    g.tick(1)
    expect(g.resources).toBeGreaterThan(0)
  })

  test('prestige to next world grants meta points and resets', () => {
    const g = new GameState()
    g.resources = 5000
    const ok = g.prestigeToNextWorld()
    expect(ok).toBe(true)
    expect(g.worldIndex).toBe(1)
    expect(g.metaPoints).toBeGreaterThanOrEqual(1)
  })
})
