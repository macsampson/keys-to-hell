import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock Phaser before importing anything that depends on it
vi.mock("phaser", async () => {
  const phaserMock = await import("../mocks/phaser-mock")
  return { default: phaserMock.default }
})

// // Mock all entities that use Phaser
// vi.mock("../../src/entities/Enemy", () => ({
//   Enemy: class {
//     x = 0
//     y = 0
//     health = 100
//     experienceValue = 10
//     active = true
//     scene = {}
//     setStats = vi.fn()
//     takeDamageAndCheckDeath = vi.fn().mockReturnValue(false)
//     destroy = vi.fn()
//     gameUpdate = vi.fn()
//     setActive = vi.fn()
//     constructor(scene: any, x: number, y: number, type: string) {
//       this.x = x
//       this.y = y
//     }
//   },
// }))

// Real Projectile class will be imported below

// Use the phaser alias which points to our mock
import Phaser from "phaser"

import { EntityManager } from "../../src/systems/EntityManager"
import { Enemy } from "../../src/entities/Enemy"
import { Projectile } from "../../src/entities/Projectile"

describe("EntityManager", () => {
  let entityManager: EntityManager

  let mockScene: any
  let mockBalanceManager: any
  let mockVisualEffectsSystem: any
  let mockAudioSystem: any
  let mockEnemyGroup: any
  let mockProjectileGroup: any

  beforeEach(() => {
    // Create mock groups with spied add methods
    mockEnemyGroup = new (Phaser as any).Group()
    mockProjectileGroup = new (Phaser as any).Group()

    // Spy on the add methods
    vi.spyOn(mockEnemyGroup, "add")
    vi.spyOn(mockProjectileGroup, "add")

    // Create mock scene with proper Phaser-like objects
    mockScene = {
      add: {
        group: vi
          .fn()
          .mockReturnValueOnce(mockEnemyGroup) // First call for enemyGroup
          .mockReturnValueOnce(mockProjectileGroup) // Second call for projectileGroup
          .mockImplementation(() => new (Phaser as any).Group()), // Subsequent calls
        existing: vi.fn(),
        circle: vi.fn().mockReturnValue({
          destroy: vi.fn(),
          scene: true,
        }),
      },
      physics: {
        add: {
          overlap: vi.fn(),
          existing: vi.fn(),
        },
        world: {
          enable: vi.fn(),
        },
      },
      cameras: {
        main: {
          width: 800,
          height: 600,
          centerX: 400,
          centerY: 300,
        },
      },
      time: {
        now: 0,
      },
      events: {
        emit: vi.fn(),
      },
      tweens: {
        add: vi.fn().mockImplementation((config) => {
          // Simulate immediate completion for testing
          if (config.onComplete) {
            setTimeout(config.onComplete, 0)
          }
        }),
      },
      progressionSystem: {
        level: 1,
      },
    }

    // Mock balance manager
    mockBalanceManager = {
      getEnemyStats: vi.fn().mockReturnValue({
        health: 30,
        damage: 10,
        speed: 50,
      }),
      getSpawnSettings: vi.fn().mockReturnValue({
        spawnRate: 2000,
        maxEnemies: 20,
        enemyTypes: ["basic", "fast", "tank"],
      }),
      shouldSpawnSpecialEnemy: vi.fn().mockReturnValue(false),
    }

    // Mock visual effects system
    mockVisualEffectsSystem = {
      createEnemyDeathEffect: vi.fn(),
      createProjectileHitEffect: vi.fn(),
    }

    // Mock audio system
    mockAudioSystem = {
      playProjectileHitSound: vi.fn(),
    }

    entityManager = new EntityManager(mockScene)

    // Ensure clean state for each test
    entityManager.clearAll()
  })

  describe("Enemy Spawning Logic", () => {
    it("should spawn enemy at specified position", () => {
      const x = 100
      const y = 200
      const enemyType = "basic"

      const enemy = entityManager.spawnEnemy(x, y, enemyType)

      expect(enemy).toBeInstanceOf(Enemy)
      expect(enemy.x).toBe(x)
      expect(enemy.y).toBe(y)
      expect(mockEnemyGroup.add).toHaveBeenCalledWith(enemy)
    })

    it("should spawn random enemy at screen edge", () => {
      const enemy = entityManager.spawnRandomEnemy()

      expect(enemy).toBeInstanceOf(Enemy)
      // Check that enemy spawned at edge with proper offset (50px)
      const isAtEdge =
        enemy.x <= -50 ||
        enemy.x >= mockScene.cameras.main.width + 50 ||
        enemy.y <= -50 ||
        enemy.y >= mockScene.cameras.main.height + 50
      expect(isAtEdge).toBe(true)

      // Verify it's within reasonable bounds for each spawn side
      if (enemy.y === -50) {
        // Top spawn
        expect(enemy.x).toBeGreaterThanOrEqual(0)
        expect(enemy.x).toBeLessThanOrEqual(mockScene.cameras.main.width)
      } else if (enemy.x === mockScene.cameras.main.width + 50) {
        // Right spawn
        expect(enemy.y).toBeGreaterThanOrEqual(0)
        expect(enemy.y).toBeLessThanOrEqual(mockScene.cameras.main.height)
      } else if (enemy.y === mockScene.cameras.main.height + 50) {
        // Bottom spawn
        expect(enemy.x).toBeGreaterThanOrEqual(0)
        expect(enemy.x).toBeLessThanOrEqual(mockScene.cameras.main.width)
      } else if (enemy.x === -50) {
        // Left spawn
        expect(enemy.y).toBeGreaterThanOrEqual(0)
        expect(enemy.y).toBeLessThanOrEqual(mockScene.cameras.main.height)
      }
    })

    it("should apply difficulty scaling when balance manager is set", () => {
      // Mock Enemy setStats method
      vi.spyOn(Enemy.prototype, "setStats").mockImplementation(() => {})

      entityManager.setGameBalanceManager(mockBalanceManager)
      const enemy = entityManager.spawnEnemy(100, 100, "basic")

      expect(mockBalanceManager.getEnemyStats).toHaveBeenCalledWith(1, "basic")
      expect(enemy.setStats).toHaveBeenCalledWith(30, 10, 50)
    })
  })

  describe("Enemy State Management", () => {
    it("should track active enemy count correctly", () => {
      expect(entityManager.getActiveEnemyCount()).toBe(0)

      entityManager.spawnEnemy(100, 100)
      expect(entityManager.getActiveEnemyCount()).toBe(1)

      entityManager.spawnEnemy(200, 200)
      expect(entityManager.getActiveEnemyCount()).toBe(2)
    })

    it("should handle enemy collision detection setup", () => {
      expect(mockScene.physics.add.overlap).toHaveBeenCalled()
    })
  })

  describe("Collision System", () => {
    beforeEach(() => {
      entityManager.setAudioSystem(mockAudioSystem)
      entityManager.setVisualEffectsSystem(mockVisualEffectsSystem)
    })

    it("should handle projectile-enemy collision correctly", () => {
      const enemy = entityManager.spawnEnemy(100, 100, "basic")
      const projectile = entityManager.createProjectile(90, 90, 25)

      // Mock enemy health
      enemy.health = 30
      enemy.takeDamageAndCheckDeath = vi.fn().mockReturnValue(false) // Enemy survives

      // Simulate collision
      const collisionHandler = mockScene.physics.add.overlap.mock.calls[0][2]
      collisionHandler(projectile, enemy)

      // Verify damage was applied
      expect(enemy.takeDamageAndCheckDeath).toHaveBeenCalledWith(25)
      expect(mockAudioSystem.playProjectileHitSound).toHaveBeenCalled()
    })

    it("should handle enemy death during collision", () => {
      const enemy = entityManager.spawnEnemy(100, 100, "basic")
      const projectile = entityManager.createProjectile(90, 90, 50)

      enemy.health = 30
      enemy.takeDamageAndCheckDeath = vi.fn().mockReturnValue(true) // Enemy dies
      enemy.experienceValue = 10

      // Simulate collision
      const collisionHandler = mockScene.physics.add.overlap.mock.calls[0][2]
      collisionHandler(projectile, enemy)

      // Verify enemy death handling
      expect(enemy.takeDamageAndCheckDeath).toHaveBeenCalledWith(50)
      expect(mockScene.events.emit).toHaveBeenCalledWith("enemyKilled", 10)
      expect(
        mockVisualEffectsSystem.createEnemyDeathEffect
      ).toHaveBeenCalledWith(100, 100)
    })

    it("should handle piercing projectile collisions", () => {
      const enemy1 = entityManager.spawnEnemy(100, 100, "basic")
      const enemy2 = entityManager.spawnEnemy(120, 120, "basic")
      const projectile = entityManager.createProjectile(90, 90, 20, null, 2) // 2 piercing

      enemy1.health = 30
      enemy2.health = 30
      enemy1.takeDamageAndCheckDeath = vi.fn().mockReturnValue(false)
      enemy2.takeDamageAndCheckDeath = vi.fn().mockReturnValue(false)
      projectile.onHitTarget = vi.fn()
      projectile.hasPiercedEnemy = vi.fn().mockReturnValue(false)

      const collisionHandler = mockScene.physics.add.overlap.mock.calls[0][2]

      // First collision
      collisionHandler(projectile, enemy1)
      expect(enemy1.takeDamageAndCheckDeath).toHaveBeenCalledWith(20)
      expect(projectile.onHitTarget).toHaveBeenCalledWith(enemy1)

      // Second collision - should still work
      collisionHandler(projectile, enemy2)
      expect(enemy2.takeDamageAndCheckDeath).toHaveBeenCalledWith(20)
    })

    it("should prevent duplicate collisions with same enemy", () => {
      const enemy = entityManager.spawnEnemy(100, 100, "basic")
      const projectile = entityManager.createProjectile(90, 90, 20, null, 2)

      enemy.takeDamageAndCheckDeath = vi.fn().mockReturnValue(false)
      projectile.hasPiercedEnemy = vi.fn().mockReturnValue(true) // Already hit this enemy

      const collisionHandler = mockScene.physics.add.overlap.mock.calls[0][2]
      collisionHandler(projectile, enemy)

      // Should not process collision
      expect(enemy.takeDamageAndCheckDeath).not.toHaveBeenCalled()
    })

    it("should validate collision pre-conditions", () => {
      const enemy = entityManager.spawnEnemy(100, 100, "basic")
      const projectile = entityManager.createProjectile(90, 90, 20)

      // Test collision validation callback
      const processCallback = mockScene.physics.add.overlap.mock.calls[0][3]

      // Valid collision
      expect(processCallback(projectile, enemy)).toBe(true)

      // Invalid collision - inactive projectile
      projectile.setActive(false)
      expect(processCallback(projectile, enemy)).toBe(false)

      // Invalid collision - invisible (pooled) projectile
      projectile.setActive(true)
      projectile.setVisible(false)
      expect(processCallback(projectile, enemy)).toBe(false)

      // Invalid collision - already collided projectile
      projectile.setVisible(true)
      ;(projectile as any).hasCollided = true
      expect(processCallback(projectile, enemy)).toBe(false)
    })

    it("should handle collision with invalid objects gracefully", () => {
      const collisionHandler = mockScene.physics.add.overlap.mock.calls[0][2]

      // Should not throw with null objects
      expect(() => collisionHandler(null, null)).not.toThrow()
      expect(() => collisionHandler(undefined, undefined)).not.toThrow()

      // Should not throw with objects missing scene
      const invalidProjectile = { active: true, scene: null }
      const invalidEnemy = { active: true, scene: null }
      expect(() =>
        collisionHandler(invalidProjectile, invalidEnemy)
      ).not.toThrow()
    })
  })

  describe("Projectile Management", () => {
    it("should create projectile with correct parameters", () => {
      const x = 100
      const y = 100
      const damage = 25
      const piercingCount = 1
      const seeking = false

      const projectile = entityManager.createProjectile(
        x,
        y,
        damage,
        null,
        piercingCount
      )

      expect(projectile.x).toBe(x)
      expect(projectile.y).toBe(y)
      expect(projectile.getDamage()).toBe(damage)
    })

    it("should track active projectile count correctly", () => {
      expect(entityManager.getActiveProjectileCount()).toBe(0)

      entityManager.createProjectile(100, 100, 10)
      expect(entityManager.getActiveProjectileCount()).toBe(1)

      entityManager.createProjectile(200, 200, 15)
      expect(entityManager.getActiveProjectileCount()).toBe(2)
    })

    it("should use object pooling for projectiles", () => {
      // Create multiple projectiles to test pooling
      const projectiles = []
      for (let i = 0; i < 5; i++) {
        projectiles.push(entityManager.createProjectile(i * 50, 100, 10))
      }

      expect(projectiles.length).toBe(5)
      // Verify all projectiles are active
      projectiles.forEach((p) => expect(p.active).toBe(true))
    })

    it("should reuse pooled projectiles when available", () => {
      // Create a projectile
      const projectile1 = entityManager.createProjectile(100, 100, 10)
      const id1 = projectile1.getProjectileId()

      // Return it to pool by marking for return and cleaning up
      ;(projectile1 as any).markForPoolReturn()
      entityManager.update(1000, 16) // Trigger cleanup

      // Create another projectile - should reuse the pooled one
      const projectile2 = entityManager.createProjectile(200, 200, 15)
      const id2 = projectile2.getProjectileId()

      // Should be the same object (reused from pool)
      expect(id1).toBe(id2)
      expect(projectile2.x).toBe(200)
      expect(projectile2.y).toBe(200)
      expect(projectile2.getDamage()).toBe(15)
    })

    it("should respect maxProjectilePool limit", () => {
      // Access private pool to verify limit
      const pool = (entityManager as any).projectilePool
      expect(pool.length).toBe(100) // maxProjectilePool limit

      // All pool projectiles should be inactive initially
      pool.forEach((proj: any) => {
        expect(proj.active).toBe(false)
        expect(proj.visible).toBe(false)
      })
    })

    it("should properly reset projectile properties when retrieved from pool", () => {
      // Create and configure a projectile with specific properties
      const projectile = entityManager.createProjectile(
        100,
        100,
        25,
        null,
        3,
        true,
        0.5
      )
      projectile.piercingCount = 2 // Simulate some piercing usage
      ;(projectile as any).hasCollided = true
      ;(projectile as any).timeAlive = 5000

      // Return to pool
      ;(projectile as any).markForPoolReturn()
      entityManager.update(1000, 16)

      // Create new projectile from pool
      const newProjectile = entityManager.createProjectile(
        200,
        200,
        50,
        null,
        1,
        false,
        0
      )

      // Verify reset properties
      expect(newProjectile.x).toBe(200)
      expect(newProjectile.y).toBe(200)
      expect(newProjectile.getDamage()).toBe(50)
      expect(newProjectile.piercingCount).toBe(1)
      expect(newProjectile.hasSeekingBehavior).toBe(false)
      expect(newProjectile.seekingStrength).toBe(0)
      expect((newProjectile as any).hasCollided).toBe(false)
      expect((newProjectile as any).timeAlive).toBe(0)
      expect(newProjectile.active).toBe(true)
      expect(newProjectile.visible).toBe(true)
    })

    it("should create new projectile when pool is empty", () => {
      // Fill up the pool by creating 100+ projectiles
      const projectiles = []
      for (let i = 0; i < 105; i++) {
        projectiles.push(entityManager.createProjectile(i, 100, 10))
      }

      // Verify we created more than the pool size
      expect(projectiles.length).toBe(105)
      expect(entityManager.getActiveProjectileCount()).toBe(105)

      // All should be active
      projectiles.forEach((p) => expect(p.active).toBe(true))
    })
  })

  describe("Balance Manager Integration", () => {
    beforeEach(() => {
      entityManager.setGameBalanceManager(mockBalanceManager)
      // Mock Enemy setStats method
      vi.spyOn(Enemy.prototype, "setStats").mockImplementation(() => {})
    })

    it("should use balance manager for enemy type selection", () => {
      const enemy = entityManager.spawnRandomEnemy()

      expect(mockBalanceManager.getSpawnSettings).toHaveBeenCalledWith(1)
      expect(enemy).toBeInstanceOf(Enemy)

      // Should spawn one of the configured enemy types
      const spawnCalls = mockBalanceManager.getEnemyStats.mock.calls
      expect(spawnCalls.length).toBeGreaterThan(0)
      const enemyType = spawnCalls[0][1]
      expect(["basic", "fast", "tank"]).toContain(enemyType)
    })

    it("should spawn special enemies when balance manager indicates", () => {
      mockBalanceManager.shouldSpawnSpecialEnemy.mockReturnValue(true)

      const enemy = entityManager.spawnRandomEnemy()

      expect(mockBalanceManager.shouldSpawnSpecialEnemy).toHaveBeenCalledWith(1)
      // Should use the last (most advanced) enemy type
      expect(mockBalanceManager.getEnemyStats).toHaveBeenCalledWith(1, "tank")
    })

    it("should update spawn settings from balance manager", () => {
      const newSettings = {
        spawnRate: 1000,
        maxEnemies: 30,
        enemyTypes: ["basic", "elite", "boss"],
      }

      entityManager.updateSpawnSettings(newSettings)

      // Verify internal settings updated
      expect((entityManager as any).enemySpawnRate).toBe(1000)
      expect((entityManager as any).maxEnemies).toBe(30)
    })

    it("should use balanced enemy stats for all enemy types", () => {
      const enemyTypes = ["basic", "fast", "tank"]

      enemyTypes.forEach((type) => {
        mockBalanceManager.getEnemyStats.mockClear()
        const enemy = entityManager.spawnEnemy(100, 100, type)

        expect(mockBalanceManager.getEnemyStats).toHaveBeenCalledWith(1, type)
        expect(Enemy.prototype.setStats).toHaveBeenCalledWith(30, 10, 50)
      })
    })

    it("should fall back to default behavior without balance manager", () => {
      // Create new entity manager without balance manager
      const entityManagerNoBalance = new EntityManager(mockScene)

      // Mock the weightedRandomChoice method
      const spy = vi
        .spyOn(entityManagerNoBalance as any, "weightedRandomChoice")
        .mockReturnValue("basic")

      const enemy = entityManagerNoBalance.spawnRandomEnemy()

      expect(spy).toHaveBeenCalledWith(
        ["basic", "fast", "tank"],
        [0.6, 0.3, 0.1]
      )
      expect(enemy).toBeInstanceOf(Enemy)
    })

    it("should handle automatic enemy spawning with balance manager", () => {
      mockScene.time.now = 6000 // 6 seconds - past spawn rate

      // Mock the spawn methods
      const spawnBalancedSpy = vi
        .spyOn(entityManager, "spawnBalancedEnemy")
        .mockReturnValue({} as Enemy)

      entityManager.update(6000, 16)

      expect(spawnBalancedSpy).toHaveBeenCalled()
    })
  })

  describe("Target Selection Logic", () => {
    it("should find nearest enemy correctly", () => {
      const enemy1 = entityManager.spawnEnemy(100, 100)
      const enemy2 = entityManager.spawnEnemy(200, 200)
      const enemy3 = entityManager.spawnEnemy(50, 50)

      const nearest = entityManager.getNearestEnemy(60, 60)
      expect(nearest).toBe(enemy3) // Should be closest to (60,60)
    })

    it("should find weakest enemy correctly", () => {
      const enemy1 = entityManager.spawnEnemy(100, 100, "basic")
      const enemy2 = entityManager.spawnEnemy(200, 200, "tank")
      const enemy3 = entityManager.spawnEnemy(300, 300, "fast")

      // Set different health values to test selection
      enemy1.health = 30
      enemy2.health = 60
      enemy3.health = 20

      const weakest = entityManager.getWeakestEnemy()
      expect(weakest).toBe(enemy3) // Enemy3 has lowest health (20)
    })

    it("should find strongest enemy correctly", () => {
      const enemy1 = entityManager.spawnEnemy(100, 100, "basic")
      const enemy2 = entityManager.spawnEnemy(200, 200, "tank")
      const enemy3 = entityManager.spawnEnemy(300, 300, "fast")

      // Set different health values to test selection
      enemy1.health = 30
      enemy2.health = 60
      enemy3.health = 20

      const strongest = entityManager.getStrongestEnemy()
      expect(strongest).toBe(enemy2) // Enemy2 has highest health (60)
    })

    it("should get enemies in range correctly", () => {
      const enemy1 = entityManager.spawnEnemy(100, 100)
      const enemy2 = entityManager.spawnEnemy(150, 150)
      const enemy3 = entityManager.spawnEnemy(300, 300)

      const inRange = entityManager.getEnemiesInRange(125, 125, 50)
      expect(inRange).toContain(enemy1)
      expect(inRange).toContain(enemy2)
      expect(inRange).not.toContain(enemy3)
    })

    it("should return null when no enemies exist", () => {
      expect(entityManager.getNearestEnemy(100, 100)).toBeNull()
      expect(entityManager.getWeakestEnemy()).toBeNull()
      expect(entityManager.getStrongestEnemy()).toBeNull()
    })
  })

  describe("Random Enemy Generation", () => {
    it("should generate enemies with appropriate variety", () => {
      const enemies = []
      for (let i = 0; i < 10; i++) {
        enemies.push(entityManager.spawnRandomEnemy())
      }

      // Should generate multiple enemies successfully
      expect(enemies).toHaveLength(10)

      // All enemies should be valid Enemy instances
      enemies.forEach((enemy) => {
        expect(enemy).toBeInstanceOf(Enemy)
        expect(enemy.health).toBeGreaterThan(0)
      })
    })
  })

  describe("Update Cycle Management", () => {
    it("should update all enemies during update cycle", () => {
      const enemy1 = entityManager.spawnEnemy(100, 100)
      const enemy2 = entityManager.spawnEnemy(200, 200)

      enemy1.gameUpdate = vi.fn()
      enemy2.gameUpdate = vi.fn()

      entityManager.update(1000, 16)

      expect(enemy1.gameUpdate).toHaveBeenCalledWith(1000, 16)
      expect(enemy2.gameUpdate).toHaveBeenCalledWith(1000, 16)
    })

    it("should update all projectiles during update cycle", () => {
      const projectile1 = entityManager.createProjectile(100, 100, 10)
      const projectile2 = entityManager.createProjectile(200, 200, 15)

      projectile1.gameUpdate = vi.fn()
      projectile2.gameUpdate = vi.fn()

      entityManager.update(1000, 16)

      expect(projectile1.gameUpdate).toHaveBeenCalledWith(1000, 16)
      expect(projectile2.gameUpdate).toHaveBeenCalledWith(1000, 16)
    })

    it("should handle automatic enemy spawning during update", () => {
      entityManager.setGameBalanceManager(mockBalanceManager)

      // Set last spawn time to trigger spawning
      ;(entityManager as any).lastEnemySpawn = 0
      ;(entityManager as any).enemySpawnRate = 1000

      const spawnSpy = vi
        .spyOn(entityManager, "spawnBalancedEnemy")
        .mockReturnValue({} as Enemy)

      entityManager.update(2000, 16) // 2 seconds should trigger spawn

      expect(spawnSpy).toHaveBeenCalled()
      expect((entityManager as any).lastEnemySpawn).toBe(2000)
    })

    it("should not spawn enemies if max limit reached", () => {
      entityManager.setMaxEnemies(1)
      entityManager.spawnEnemy(100, 100) // Reach max
      ;(entityManager as any).lastEnemySpawn = 0
      ;(entityManager as any).enemySpawnRate = 1000

      const spawnSpy = vi.spyOn(entityManager, "spawnBalancedEnemy")

      entityManager.update(2000, 16)

      expect(spawnSpy).not.toHaveBeenCalled()
    })

    it("should clean up destroyed objects during update", () => {
      const enemy = entityManager.spawnEnemy(100, 100)
      const projectile = entityManager.createProjectile(100, 100, 10)

      // Mark objects as destroyed
      enemy.setActive(false)
      ;(enemy as any).scene = null
      ;(projectile as any).markForPoolReturn()

      const cleanupSpy = vi.spyOn(
        entityManager as any,
        "cleanupDestroyedObjects"
      )

      entityManager.update(1000, 16)

      expect(cleanupSpy).toHaveBeenCalled()
    })

    it("should handle errors during enemy updates gracefully", () => {
      const enemy = entityManager.spawnEnemy(100, 100)
      enemy.gameUpdate = vi.fn().mockImplementation(() => {
        throw new Error("Update error")
      })

      // Should not throw, should remove problematic enemy
      expect(() => entityManager.update(1000, 16)).not.toThrow()
      expect(entityManager.getActiveEnemyCount()).toBe(0)
    })

    it("should handle errors during projectile updates gracefully", () => {
      const projectile = entityManager.createProjectile(100, 100, 10)
      projectile.gameUpdate = vi.fn().mockImplementation(() => {
        throw new Error("Update error")
      })

      // Should not throw
      expect(() => entityManager.update(1000, 16)).not.toThrow()
    })

    it("should log game state periodically", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      entityManager.spawnEnemy(100, 100)
      entityManager.createProjectile(100, 100, 10)

      // Simulate 5 second interval
      entityManager.update(5000, 16)
      entityManager.update(10000, 16)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Game State - Active Enemies:")
      )

      consoleSpy.mockRestore()
    })

    it("should only update active and visible projectiles", () => {
      const activeProjectile = entityManager.createProjectile(100, 100, 10)
      const inactiveProjectile = entityManager.createProjectile(200, 200, 10)
      const invisibleProjectile = entityManager.createProjectile(300, 300, 10)

      activeProjectile.gameUpdate = vi.fn()
      inactiveProjectile.gameUpdate = vi.fn()
      invisibleProjectile.gameUpdate = vi.fn()

      // Make some projectiles inactive/invisible
      inactiveProjectile.setActive(false)
      invisibleProjectile.setVisible(false)

      entityManager.update(1000, 16)

      expect(activeProjectile.gameUpdate).toHaveBeenCalled()
      expect(inactiveProjectile.gameUpdate).not.toHaveBeenCalled()
      expect(invisibleProjectile.gameUpdate).not.toHaveBeenCalled()
    })
  })

  describe("System Management", () => {
    it("should clear all entities correctly", () => {
      entityManager.spawnEnemy(100, 100)
      entityManager.spawnEnemy(200, 200)
      entityManager.createProjectile(50, 50, 10)

      expect(entityManager.getActiveEnemyCount()).toBeGreaterThan(0)
      expect(entityManager.getActiveProjectileCount()).toBeGreaterThan(0)

      entityManager.clearAll()

      expect(entityManager.getActiveEnemyCount()).toBe(0)
      expect(entityManager.getActiveProjectileCount()).toBe(0)
    })

    it("should handle update cycle without errors", () => {
      entityManager.spawnEnemy(100, 100)
      entityManager.createProjectile(50, 50, 10)

      // Should not throw errors during update
      expect(() => {
        entityManager.update(1000, 16)
      }).not.toThrow()
    })

    it("should destroy system resources properly", () => {
      const enemyGroup = entityManager.getEnemyGroup()
      const projectileGroup = entityManager.getProjectileGroup()

      enemyGroup.destroy = vi.fn()
      projectileGroup.destroy = vi.fn()

      entityManager.destroy()

      expect(enemyGroup.destroy).toHaveBeenCalled()
      expect(projectileGroup.destroy).toHaveBeenCalled()
    })
  })

  describe("Edge Cases and Error Handling", () => {
    it("should handle null/undefined targets gracefully", () => {
      expect(() => {
        entityManager.createProjectile(100, 100, 10, null)
      }).not.toThrow()

      expect(() => {
        entityManager.createProjectile(100, 100, 10, undefined as any)
      }).not.toThrow()
    })

    it("should handle invalid enemy spawn parameters", () => {
      expect(() => {
        entityManager.spawnEnemy(NaN, NaN, "invalid_type")
      }).not.toThrow()

      expect(() => {
        entityManager.spawnEnemy(-999, -999)
      }).not.toThrow()
    })

    it("should handle maximum entity stress testing", () => {
      // Prevent automatic spawning during this test
      entityManager.setEnemySpawnRate(999999) // Very high value to prevent auto-spawn

      // Test just enemy spawning first (without projectiles to avoid mock issues)
      for (let i = 0; i < 50; i++) {
        entityManager.spawnEnemy(i * 10, 100)
      }

      expect(entityManager.getActiveEnemyCount()).toBe(50)

      // Should handle update without issues
      expect(() => entityManager.update(1000, 16)).not.toThrow()

      // Verify no additional enemies were spawned during update
      expect(entityManager.getActiveEnemyCount()).toBe(50)
    })

    it("should handle rapid spawning and cleanup", () => {
      // Rapid spawn and cleanup cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        // Spawn entities
        for (let i = 0; i < 10; i++) {
          entityManager.spawnEnemy(i * 10, cycle * 50)
          entityManager.createProjectile(i * 5, cycle * 25, 10)
        }

        // Clear all
        entityManager.clearAll()

        expect(entityManager.getActiveEnemyCount()).toBe(0)
        expect(entityManager.getActiveProjectileCount()).toBe(0)
      }
    })

    it("should maintain consistent pool state across operations", () => {
      const initialPoolSize = (entityManager as any).projectilePool.length

      // Create and destroy many projectiles
      const projectiles = []
      for (let i = 0; i < 50; i++) {
        projectiles.push(entityManager.createProjectile(i * 10, 100, 10))
      }

      // Mark for return and cleanup
      projectiles.forEach((p) => (p as any).markForPoolReturn())
      entityManager.update(1000, 16)

      // Pool size should remain consistent
      expect((entityManager as any).projectilePool.length).toBe(initialPoolSize)

      // Should still be able to create new projectiles
      const newProjectile = entityManager.createProjectile(500, 500, 25)
      expect(newProjectile).toBeDefined()
      expect(newProjectile.active).toBe(true)
    })

    it("should handle concurrent modifications during update", () => {
      const enemies = []
      const projectiles = []

      // Create entities
      for (let i = 0; i < 10; i++) {
        enemies.push(entityManager.spawnEnemy(i * 50, 100))
        projectiles.push(entityManager.createProjectile(i * 30, 150, 10))
      }

      // Mock updates that modify the collections
      enemies[0].gameUpdate = vi.fn().mockImplementation(() => {
        // This enemy spawns another enemy during its update
        entityManager.spawnEnemy(999, 999)
      })

      projectiles[0].gameUpdate = vi.fn().mockImplementation(() => {
        // This projectile creates another projectile during its update
        entityManager.createProjectile(888, 888, 5)
      })

      // Should handle concurrent modifications gracefully
      expect(() => entityManager.update(1000, 16)).not.toThrow()

      // Verify new entities were created
      expect(entityManager.getActiveEnemyCount()).toBeGreaterThan(10)
      expect(entityManager.getActiveProjectileCount()).toBeGreaterThan(10)
    })
  })

  describe("System Integration", () => {
    beforeEach(() => {
      entityManager.setVisualEffectsSystem(mockVisualEffectsSystem)
      entityManager.setAudioSystem(mockAudioSystem)
      entityManager.setGameBalanceManager(mockBalanceManager)
    })

    it("should integrate with all systems during enemy death", () => {
      const enemy = entityManager.spawnEnemy(100, 100, "basic")
      enemy.health = 20
      enemy.experienceValue = 15
      enemy.takeDamageAndCheckDeath = vi.fn().mockReturnValue(true)

      const projectile = entityManager.createProjectile(95, 95, 25)

      // Simulate collision that kills enemy
      const collisionHandler = mockScene.physics.add.overlap.mock.calls[0][2]
      collisionHandler(projectile, enemy)

      // Verify all systems were called
      expect(mockAudioSystem.playProjectileHitSound).toHaveBeenCalled()
      expect(
        mockVisualEffectsSystem.createEnemyDeathEffect
      ).toHaveBeenCalledWith(100, 100)
      expect(mockScene.events.emit).toHaveBeenCalledWith("enemyKilled", 15)
    })

    it("should handle missing systems gracefully", () => {
      // Create manager without systems
      const bareEntityManager = new EntityManager(mockScene)

      const enemy = bareEntityManager.spawnEnemy(100, 100, "basic")
      enemy.health = 20
      enemy.takeDamageAndCheckDeath = vi.fn().mockReturnValue(true)

      const projectile = bareEntityManager.createProjectile(95, 95, 25)

      // Should not throw when systems are missing
      expect(() => {
        const collisionHandler = mockScene.physics.add.overlap.mock.calls[1][2]
        collisionHandler(projectile, enemy)
      }).not.toThrow()
    })

    it("should coordinate with progression system for player level", () => {
      // Test level-based enemy stat scaling
      mockScene.progressionSystem.level = 5

      const enemy = entityManager.spawnEnemy(100, 100, "basic")

      expect(mockBalanceManager.getEnemyStats).toHaveBeenCalledWith(5, "basic")
    })

    it("should emit events for external system consumption", () => {
      const enemy = entityManager.spawnEnemy(100, 100, "basic")
      enemy.health = 10
      enemy.experienceValue = 25
      enemy.takeDamageAndCheckDeath = vi.fn().mockReturnValue(true)

      const projectile = entityManager.createProjectile(95, 95, 15)

      // Clear previous event calls
      mockScene.events.emit.mockClear()

      // Trigger enemy death
      const collisionHandler = mockScene.physics.add.overlap.mock.calls[0][2]
      collisionHandler(projectile, enemy)

      // Verify correct event emission
      expect(mockScene.events.emit).toHaveBeenCalledWith("enemyKilled", 25)
      expect(mockScene.events.emit).toHaveBeenCalledTimes(1)
    })
  })
})
