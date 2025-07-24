import { describe, it, expect, beforeEach, vi } from "vitest"
import { Player } from "../../src/entities/Player"

describe("Player", () => {
  let player: Player
  let mockScene: any

  beforeEach(() => {
    mockScene = {
      cameras: {
        main: {
          shake: vi.fn(),
        },
      },
      physics: {
        world: {
          enable: vi.fn(),
          timeScale: 1,
        },
      },
      add: {
        existing: vi.fn(),
        text: vi.fn().mockReturnValue({
          setDepth: vi.fn().mockReturnThis(),
        }),
      },
      time: {
        delayedCall: vi.fn(),
      },
      tweens: {
        add: vi.fn(),
      },
      entityManager: {
        getAllActiveEnemies: vi.fn().mockReturnValue([]),
      },
    }
  })

  describe("Player Creation and Setup", () => {
    it("should create player with correct initial stats", () => {
      player = new Player(mockScene, 400, 300)

      expect(player.health).toBe(100)
      expect(player.maxHealth).toBe(100)
      expect(player.attackPower).toBe(10)
      expect(player.attackMultiplier).toBe(1)
      expect(player.typingSpeed).toBe(1.0)
      expect(player.level).toBe(1)
      expect(player.x).toBe(400)
      expect(player.y).toBe(300)
    })

    it("should initialize position vector correctly", () => {
      player = new Player(mockScene, 150, 250)

      expect(player.position.x).toBe(150)
      expect(player.position.y).toBe(250)
    })

    it("should initialize all upgrade properties to default values", () => {
      player = new Player(mockScene, 0, 0)

      // Projectile upgrades
      expect(player.projectileCount).toBe(1)
      expect(player.piercingCount).toBe(0)
      expect(player.hasSeekingProjectiles).toBe(false)
      expect(player.seekingStrength).toBe(0)

      // Health & regen
      expect(player.hasRegeneration).toBe(false)
      expect(player.regenRate).toBe(0)

      // Shields
      expect(player.hasTypingShield).toBe(false)
      expect(player.currentShield).toBe(0)
      expect(player.maxShield).toBe(0)
    })
  })

  describe("Player Movement and Position", () => {
    beforeEach(() => {
      player = new Player(mockScene, 100, 100)
    })

    it("should update position vector during gameUpdate", () => {
      player.setPosition(200, 300)
      player.gameUpdate(0, 16)

      expect(player.position.x).toBe(200)
      expect(player.position.y).toBe(300)
    })

    it("should move to specified position", () => {
      player.moveToPosition(500, 400)

      expect(player.x).toBe(500)
      expect(player.y).toBe(400)
      expect(player.position.x).toBe(500)
      expect(player.position.y).toBe(400)
    })
  })

  describe("Player Stats and Upgrades", () => {
    beforeEach(() => {
      player = new Player(mockScene, 0, 0)
    })

    it("should increase attack power correctly", () => {
      const initialPower = player.attackPower
      player.increaseAttackPower(15)

      expect(player.attackPower).toBe(initialPower + 15)
    })

    it("should increase attack multiplier correctly", () => {
      const initialMultiplier = player.attackMultiplier
      player.increaseAttackMultiplier(0.5)

      expect(player.attackMultiplier).toBe(initialMultiplier + 0.5)
    })

    it("should increase typing speed correctly", () => {
      const initialSpeed = player.typingSpeed
      player.increaseTypingSpeed(0.3)

      expect(player.typingSpeed).toBe(initialSpeed + 0.3)
    })

    it("should level up correctly", () => {
      const initialLevel = player.level
      player.levelUp()

      expect(player.level).toBe(initialLevel + 1)
    })

    it("should return correct stats object", () => {
      player.health = 80
      player.attackPower = 25
      player.level = 3

      const stats = player.getStats()

      expect(stats).toEqual({
        health: 80,
        maxHealth: 100,
        attackPower: 25,
        attackMultiplier: 1,
        typingSpeed: 1.0,
        level: 3,
      })
    })
  })

  describe("Player Health and Damage", () => {
    beforeEach(() => {
      player = new Player(mockScene, 0, 0)
    })

    it("should take damage correctly without shields", () => {
      const initialHealth = player.health
      const damage = 20

      const isDead = player.takeDamage(damage)

      expect(player.health).toBe(initialHealth - damage)
      expect(isDead).toBe(false)
    })

    it("should die when health reaches zero", () => {
      const lethalDamage = player.health + 10

      const isDead = player.takeDamage(lethalDamage)

      expect(player.health).toBeLessThanOrEqual(0)
      expect(isDead).toBe(true)
    })

    it("should apply screen shake when taking damage", () => {
      player.takeDamage(10)

      expect(mockScene.cameras.main.shake).toHaveBeenCalledWith(200, 0.01)
    })

    it("should absorb damage with shields", () => {
      player.currentShield = 30
      const damage = 20

      const isDead = player.takeDamage(damage)

      expect(player.currentShield).toBe(10)
      expect(player.health).toBe(100) // No health damage
      expect(isDead).toBe(false)
    })

    it("should handle partial shield absorption", () => {
      player.currentShield = 15
      const damage = 25

      const isDead = player.takeDamage(damage)

      expect(player.currentShield).toBe(0)
      expect(player.health).toBe(90) // 10 damage after shield
      expect(isDead).toBe(false)
    })
  })

  describe("Player Regeneration", () => {
    beforeEach(() => {
      player = new Player(mockScene, 0, 0)
      player.hasRegeneration = true
      player.regenRate = 10 // 10 HP per second
      player.health = 50 // Damaged
    })

    it("should regenerate health over time", () => {
      const delta = 1000 // 1 second

      player.gameUpdate(0, delta)

      expect(player.health).toBe(60) // 50 + 10
    })

    it("should not regenerate beyond max health", () => {
      player.health = 95
      const delta = 1000 // Would regen 10, but max is 100

      player.gameUpdate(0, delta)

      expect(player.health).toBe(100)
    })

    it("should not regenerate when at full health", () => {
      player.health = 100
      const delta = 1000

      player.gameUpdate(0, delta)

      expect(player.health).toBe(100)
    })

    it("should not regenerate when upgrade is disabled", () => {
      player.hasRegeneration = false
      player.health = 50
      const delta = 1000

      player.gameUpdate(0, delta)

      expect(player.health).toBe(50)
    })
  })

  describe("Player Shield System", () => {
    beforeEach(() => {
      player = new Player(mockScene, 0, 0)
      player.hasTypingShield = true
      player.shieldPerWord = 5
      player.maxShield = 50
      player.currentShield = 20
    })

    it("should generate shield from word completion", () => {
      player.onWordCompleted()

      expect(player.currentShield).toBe(25)
    })

    it("should not exceed max shield from word completion", () => {
      player.currentShield = 48
      player.onWordCompleted()

      expect(player.currentShield).toBe(50)
    })

    it("should not generate shield when upgrade is disabled", () => {
      player.hasTypingShield = false
      const initialShield = player.currentShield

      player.onWordCompleted()

      expect(player.currentShield).toBe(initialShield)
    })
  })

  describe("Player Word Barrier System", () => {
    beforeEach(() => {
      player = new Player(mockScene, 0, 0)
      player.hasWordBarrier = true
      player.barrierStrength = 8
      player.maxShield = 50
      player.currentShield = 15
    })

    it("should generate barrier from perfect word", () => {
      player.onPerfectWord()

      expect(player.currentShield).toBe(23)
    })

    it("should not exceed max shield from barrier generation", () => {
      player.currentShield = 45
      player.onPerfectWord()

      expect(player.currentShield).toBe(50)
    })

    it("should not generate barrier when upgrade is disabled", () => {
      player.hasWordBarrier = false
      const initialShield = player.currentShield

      player.onPerfectWord()

      expect(player.currentShield).toBe(initialShield)
    })
  })

  describe("Player Rewind Ability", () => {
    beforeEach(() => {
      player = new Player(mockScene, 0, 0)
      player.hasRewind = true
      player.rewindCharges = 2
      player.rewindHealAmount = 30
      player.health = 10 // Low health
    })

    it("should prevent death and heal when rewind is available", () => {
      const lethalDamage = 50

      const isDead = player.takeDamage(lethalDamage)

      expect(isDead).toBe(false)
      expect(player.rewindCharges).toBe(1)
      expect(player.health).toBe(40) // 10 + 30 heal
    })

    it("should not exceed max health when healing with rewind", () => {
      player.health = 80
      const lethalDamage = 100

      player.takeDamage(lethalDamage)

      expect(player.health).toBe(100) // Capped at max health
    })

    it("should not activate rewind when no charges available", () => {
      player.rewindCharges = 0
      const lethalDamage = 50

      const isDead = player.takeDamage(lethalDamage)

      expect(isDead).toBe(true)
      expect(player.health).toBeLessThanOrEqual(0)
    })

    it("should not activate rewind for non-lethal damage", () => {
      const damage = 5

      const isDead = player.takeDamage(damage)

      expect(isDead).toBe(false)
      expect(player.rewindCharges).toBe(2) // Unchanged
      expect(player.health).toBe(5) // Normal damage
    })
  })

  describe("Player Time Dilation", () => {
    beforeEach(() => {
      player = new Player(mockScene, 0, 0)
      player.hasTimeDilation = true
      player.dilationStrength = 0.5 // 50% slowdown
      player.dilationDuration = 3000
    })

    it("should activate time dilation when health is low", () => {
      player.health = 25 // 25% health

      player.takeDamage(5)

      expect(mockScene.physics.world.timeScale).toBe(0.5)
      expect(mockScene.isTimeDilated).toBe(true)
    })

    it("should not activate time dilation when health is above threshold", () => {
      player.health = 50 // 50% health

      player.takeDamage(5)

      expect(mockScene.physics.world.timeScale).toBe(1)
      expect(mockScene.isTimeDilated).toBeUndefined()
    })

    it("should schedule time scale restoration", () => {
      player.health = 20

      player.takeDamage(5)

      expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
        3000,
        expect.any(Function)
      )
    })
  })

  describe("Player Stasis Field", () => {
    let mockEnemies: any[]

    beforeEach(() => {
      player = new Player(mockScene, 400, 300)
      player.hasStasisField = true
      player.stasisRadius = 100
      player.stasisDuration = 2000

      mockEnemies = [
        {
          x: 450,
          y: 350,
          body: { velocity: { x: 50, y: 30 }, setVelocity: vi.fn() },
        },
        {
          x: 600,
          y: 400,
          body: { velocity: { x: -20, y: 40 }, setVelocity: vi.fn() },
        },
      ]

      mockScene.entityManager.getAllActiveEnemies.mockReturnValue(mockEnemies)
    })

    it("should freeze enemies within radius on sentence completion", () => {
      player.onSentenceCompleted()

      // First enemy is within radius (distance ~70)
      expect(mockEnemies[0].body.setVelocity).toHaveBeenCalledWith(0, 0)
      expect(mockEnemies[0].isFrozen).toBe(true)
      expect(mockEnemies[0].stasisOriginalVelocity).toEqual({ x: 50, y: 30 })

      // Second enemy is outside radius (distance ~250)
      expect(mockEnemies[1].body.setVelocity).not.toHaveBeenCalled()
      expect(mockEnemies[1].isFrozen).toBeUndefined()
    })

    it("should schedule enemy movement restoration", () => {
      player.onSentenceCompleted()

      expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
        2000,
        expect.any(Function)
      )
    })

    it("should not activate stasis when upgrade is disabled", () => {
      player.hasStasisField = false

      player.onSentenceCompleted()

      mockEnemies.forEach((enemy) => {
        expect(enemy.body.setVelocity).not.toHaveBeenCalled()
      })
    })
  })
})