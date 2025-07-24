import { describe, it, expect, beforeEach, vi } from "vitest"
import { Enemy } from "../../src/entities/Enemy"
import { MovementPattern } from "../../src/types/interfaces"

describe("Enemy", () => {
  let enemy: Enemy
  let mockScene: any

  beforeEach(() => {
    mockScene = {
      cameras: {
        main: {
          centerX: 400,
          centerY: 300,
          width: 800,
          height: 600,
        },
      },
      physics: {
        add: {
          existing: vi.fn(),
        },
      },
      add: {
        existing: vi.fn(),
      },
    }
  })

  describe("Enemy Creation and Setup", () => {
    it("should create basic enemy with correct stats", () => {
      enemy = new Enemy(mockScene, 100, 100, "basic")

      expect(enemy.health).toBe(30)
      expect(enemy.maxHealth).toBe(30)
      expect(enemy.damage).toBe(10)
      expect(enemy.experienceValue).toBe(10)
      expect(enemy.x).toBe(100)
      expect(enemy.y).toBe(100)
    })

    it("should create fast enemy with correct stats", () => {
      enemy = new Enemy(mockScene, 100, 100, "fast")

      expect(enemy.health).toBe(20)
      expect(enemy.maxHealth).toBe(20)
      expect(enemy.damage).toBe(8)
      expect(enemy.experienceValue).toBe(15)
    })

    it("should create tank enemy with correct stats", () => {
      enemy = new Enemy(mockScene, 100, 100, "tank")

      expect(enemy.health).toBe(60)
      expect(enemy.maxHealth).toBe(60)
      expect(enemy.damage).toBe(15)
      expect(enemy.experienceValue).toBe(25)
    })

    it("should default to basic stats for unknown enemy type", () => {
      enemy = new Enemy(mockScene, 100, 100, "unknown")

      expect(enemy.health).toBe(30)
      expect(enemy.damage).toBe(10)
      expect(enemy.experienceValue).toBe(10)
    })
  })

  describe("Enemy Stats Management", () => {
    beforeEach(() => {
      enemy = new Enemy(mockScene, 100, 100, "basic")
    })

    it("should set custom stats correctly", () => {
      enemy.setStats(50, 20, 100)

      expect(enemy.health).toBe(50)
      expect(enemy.maxHealth).toBe(50)
      expect(enemy.damage).toBe(20)
    })

    it("should track time alive correctly", () => {
      const initialTime = enemy.getTimeAlive()
      expect(initialTime).toBe(0)

      // Simulate game update with delta time
      enemy.gameUpdate(1000, 100)
      expect(enemy.getTimeAlive()).toBe(100)

      enemy.gameUpdate(1100, 50)
      expect(enemy.getTimeAlive()).toBe(150)
    })
  })

  describe("Enemy Movement", () => {
    beforeEach(() => {
      enemy = new Enemy(mockScene, 100, 100, "basic")
      // Mock the physics body
      enemy.body = {
        setVelocity: vi.fn(),
      } as any
    })

    it("should set target position correctly", () => {
      const newTarget = new Phaser.Math.Vector2(200, 250)
      enemy.setTarget(newTarget)

      expect(enemy.target.x).toBe(200)
      expect(enemy.target.y).toBe(250)
    })

    it("should set movement pattern correctly", () => {
      enemy.setMovementPattern(MovementPattern.SINE_WAVE)
      expect(enemy.movementPattern).toBe(MovementPattern.SINE_WAVE)

      enemy.setMovementPattern(MovementPattern.SPIRAL)
      expect(enemy.movementPattern).toBe(MovementPattern.SPIRAL)

      enemy.setMovementPattern(MovementPattern.HOMING)
      expect(enemy.movementPattern).toBe(MovementPattern.HOMING)
    })

    it("should update movement during game update", () => {
      enemy.setMovementPattern(MovementPattern.STRAIGHT)
      enemy.gameUpdate(1000, 16)

      // Should have called setVelocity on the physics body
      expect((enemy.body as any).setVelocity).toHaveBeenCalled()
    })

    it("should not move when inactive", () => {
      enemy.setActive(false)
      enemy.gameUpdate(1000, 16)

      // Should not have called setVelocity when inactive
      expect((enemy.body as any).setVelocity).not.toHaveBeenCalled()
    })
  })

  describe("Enemy Health and Damage", () => {
    beforeEach(() => {
      enemy = new Enemy(mockScene, 100, 100, "basic")
    })

    it("should take damage correctly", () => {
      const initialHealth = enemy.health
      const damage = 15

      const survived = enemy.takeDamageAndCheckDeath(damage)

      expect(enemy.health).toBe(initialHealth - damage)
      expect(survived).toBe(false)
    })

    it("should die when health reaches zero", () => {
      const lethalDamage = enemy.health + 10

      const survived = enemy.takeDamageAndCheckDeath(lethalDamage)

      expect(enemy.health).toBeLessThanOrEqual(0)
      expect(survived).toBe(true)
      expect(enemy.isAlive()).toBe(false)
    })

    it("should calculate health percentage correctly", () => {
      expect(enemy.getHealthPercentage()).toBe(1.0)

      enemy.takeDamageAndCheckDeath(15) // Half damage to 30 health enemy
      expect(enemy.getHealthPercentage()).toBe(0.5)

      enemy.takeDamageAndCheckDeath(15) // Remaining damage
      expect(enemy.getHealthPercentage()).toBe(0)
    })
  })

  describe("Enemy State Transitions", () => {
    beforeEach(() => {
      enemy = new Enemy(mockScene, 100, 100, "basic")
    })

    it("should start alive and active", () => {
      expect(enemy.isAlive()).toBe(true)
      expect(enemy.active).toBe(true)
    })

    it("should become inactive when destroyed", () => {
      enemy.takeDamageAndCheckDeath(enemy.health)

      expect(enemy.isAlive()).toBe(false)
    })

    it("should handle healing correctly", () => {
      enemy.takeDamageAndCheckDeath(20)
      const healthAfterDamage = enemy.health

      enemy.heal(10)
      expect(enemy.health).toBe(healthAfterDamage + 10)
      expect(enemy.health).not.toBeGreaterThan(enemy.maxHealth)
    })

    it("should not heal beyond max health", () => {
      enemy.heal(100) // Excessive healing

      expect(enemy.health).toBe(enemy.maxHealth)
    })
  })

  describe("Enemy Experience and Rewards", () => {
    it("should provide correct experience values by type", () => {
      const basicEnemy = new Enemy(mockScene, 0, 0, "basic")
      expect(basicEnemy.experienceValue).toBe(10)

      const fastEnemy = new Enemy(mockScene, 0, 0, "fast")
      expect(fastEnemy.experienceValue).toBe(15)

      const tankEnemy = new Enemy(mockScene, 0, 0, "tank")
      expect(tankEnemy.experienceValue).toBe(25)
    })
  })
})
