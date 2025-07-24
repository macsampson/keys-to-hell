import { describe, it, expect, beforeEach, vi } from "vitest"
import { Projectile } from "../../src/entities/Projectile"
import type { Enemy } from "../../src/types/interfaces"

describe("Projectile", () => {
  let projectile: Projectile
  let mockScene: any
  let mockTarget: Enemy

  beforeEach(() => {
    projectile = {
      body: {
        setVelocity: vi.fn(),
        velocity: { x: 100, y: -50 },
      } as any,
    } as unknown as Projectile

    mockScene = {
      cameras: {
        main: {
          worldView: {
            x: 0,
            y: 0,
            width: 800,
            height: 600,
          },
          scrollX: 0,
          scrollY: 0,
          zoom: 1,
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

    mockTarget = {
      x: 200,
      y: 150,
      active: true,
      enemyId: "test_enemy_1",
    } as unknown as Enemy
  })

  describe("Projectile Creation and Setup", () => {
    it("should create projectile with correct initial stats", () => {
      projectile = new Projectile(mockScene, 100, 100, 25)

      expect(projectile.damage).toBe(25)
      expect(projectile.speed).toBe(400)
      expect(projectile.health).toBe(1)
      expect(projectile.maxHealth).toBe(1)
      expect(projectile.x).toBe(100)
      expect(projectile.y).toBe(100)
    })

    it("should create projectile with target", () => {
      projectile = new Projectile(mockScene, 100, 100, 20, mockTarget)

      expect(projectile.target).toBe(mockTarget)
      expect(projectile.damage).toBe(20)
    })

    it("should create projectile with piercing upgrade", () => {
      projectile = new Projectile(mockScene, 100, 100, 15, null, 3)

      expect(projectile.piercingCount).toBe(3)
      expect(projectile.enemiesPierced.size).toBe(0)
    })

    it("should create projectile with seeking behavior", () => {
      projectile = new Projectile(
        mockScene,
        100,
        100,
        15,
        mockTarget,
        0,
        true,
        0.1
      )

      expect(projectile.hasSeekingBehavior).toBe(true)
      expect(projectile.seekingStrength).toBe(0.1)
    })

    it("should generate unique projectile IDs", () => {
      const projectile1 = new Projectile(mockScene, 0, 0, 10)
      const projectile2 = new Projectile(mockScene, 0, 0, 10)

      expect(projectile1.getProjectileId()).not.toBe(
        projectile2.getProjectileId()
      )
    })
  })

  describe("Projectile Physics and Movement", () => {
    beforeEach(() => {
      projectile = new Projectile(mockScene, 100, 100, 20, mockTarget)
      projectile.body = {
        setVelocity: vi.fn(), // TODO: is this right??
        velocity: { x: 100, y: -50 },
      } as any
    })

    it("should set initial velocity towards target", () => {
      // idk whats going on here
    })

    it("should set velocity upward when no target", () => {
      const noTargetProjectile = new Projectile(mockScene, 100, 100, 20, null)
      noTargetProjectile.body = {
        setVelocity: vi.fn(),
        velocity: { x: 0, y: -400 },
      } as any

      // Call launchTowardsTarget manually since constructor already called it
      ;(noTargetProjectile as any).launchTowardsTarget()

      expect((noTargetProjectile.body as any).setVelocity).toHaveBeenCalledWith(
        0,
        -400
      )
    })

    it("should update rotation to face movement direction", () => {
      projectile.gameUpdate(0, 16)

      expect(projectile.rotation).toBeDefined()
    })
  })

  describe("Projectile Targeting and Seeking", () => {
    beforeEach(() => {
      projectile = new Projectile(
        mockScene,
        100,
        100,
        20,
        mockTarget,
        0,
        true,
        0.1
      )
      projectile.body = {
        setVelocity: vi.fn(),
        velocity: { x: 100, y: -50 },
      } as any
    })

    it("should update homing when target is active", () => {
      const initialVelocityCalls = (projectile.body as any).setVelocity.mock
        .calls.length

      projectile.gameUpdate(0, 16)

      expect(
        (projectile.body as any).setVelocity.mock.calls.length
      ).toBeGreaterThan(initialVelocityCalls)
    })

    it("should clear target when target becomes inactive", () => {
      mockTarget.active = false

      projectile.gameUpdate(0, 16)

      expect(projectile.target).toBe(null)
    })

    it("should handle zero-length direction vector", () => {
      // Position projectile at exact same location as target
      projectile.setPosition(mockTarget.x, mockTarget.y)

      expect(() => projectile.gameUpdate(0, 16)).not.toThrow()
    })

    it("should handle zero velocity during homing", () => {
      ;(projectile.body as any).velocity = { x: 0, y: 0 }

      projectile.gameUpdate(0, 16)

      expect((projectile.body as any).setVelocity).toHaveBeenCalled()
    })

    it("should set new target correctly", () => {
      const newTarget = { x: 300, y: 250, active: true } as unknown as Enemy
      const originalSetVelocityCalls = (projectile.body as any).setVelocity.mock
        .calls.length

      projectile.setTarget(newTarget)

      expect(projectile.target).toBe(newTarget)
      expect(
        (projectile.body as any).setVelocity.mock.calls.length
      ).toBeGreaterThan(originalSetVelocityCalls)
    })
  })

  describe("Projectile Off-Screen Detection", () => {
    beforeEach(() => {
      projectile = new Projectile(mockScene, 400, 300, 20)
    })

    it("should detect when projectile is off-screen left", () => {
      projectile.setPosition(-200, 300)

      projectile.gameUpdate(0, 16)

      expect(projectile.shouldBeReturnedToPool()).toBe(true)
    })

    it("should detect when projectile is off-screen right", () => {
      projectile.setPosition(1100, 300)

      projectile.gameUpdate(0, 16)

      expect(projectile.shouldBeReturnedToPool()).toBe(true)
    })

    it("should detect when projectile is off-screen top", () => {
      projectile.setPosition(400, -200)

      projectile.gameUpdate(0, 16)

      expect(projectile.shouldBeReturnedToPool()).toBe(true)
    })

    it("should detect when projectile is off-screen bottom", () => {
      projectile.setPosition(400, 800)

      projectile.gameUpdate(0, 16)

      expect(projectile.shouldBeReturnedToPool()).toBe(true)
    })

    it("should remain active when on-screen", () => {
      projectile.setPosition(400, 300)

      projectile.gameUpdate(0, 16)

      expect(projectile.shouldBeReturnedToPool()).toBe(false)
    })
  })

  describe("Projectile Damage and Hit Detection", () => {
    beforeEach(() => {
      projectile = new Projectile(mockScene, 100, 100, 30)
    })

    it("should return correct damage value", () => {
      expect(projectile.getDamage()).toBe(30)
    })

    it("should mark for pool return on hit without piercing", () => {
      projectile.onHitTarget()

      expect(projectile.shouldBeReturnedToPool()).toBe(true)
      expect(projectile.active).toBe(false)
      expect(projectile.visible).toBe(false)
    })

    it("should track time alive correctly", () => {
      const delta1 = 16
      const delta2 = 20

      projectile.gameUpdate(0, delta1)
      expect(projectile.getTimeAlive()).toBe(delta1)

      projectile.gameUpdate(0, delta2)
      expect(projectile.getTimeAlive()).toBe(delta1 + delta2)
    })
  })

  describe("Projectile Piercing Mechanics", () => {
    let enemy1: Enemy
    let enemy2: Enemy
    let enemy3: Enemy

    beforeEach(() => {
      projectile = new Projectile(mockScene, 100, 100, 25, null, 2) // Pierce 2 enemies

      enemy1 = { x: 150, y: 150, enemyId: "enemy_1" } as unknown as Enemy
      enemy2 = { x: 200, y: 200, enemyId: "enemy_2" } as unknown as Enemy
      enemy3 = { x: 250, y: 250, enemyId: "enemy_3" } as unknown as Enemy
    })

    it("should track pierced enemies", () => {
      projectile.onHitTarget(enemy1)

      expect(projectile.hasPiercedEnemy(enemy1)).toBe(true)
      expect(projectile.shouldBeReturnedToPool()).toBe(false)
    })

    it("should continue after piercing first enemy", () => {
      projectile.onHitTarget(enemy1)

      expect(projectile.enemiesPierced.size).toBe(1)
      expect(projectile.shouldBeReturnedToPool()).toBe(false)
    })

    it("should return to pool after piercing max enemies", () => {
      projectile.onHitTarget(enemy1) // 1st pierce
      expect(projectile.shouldBeReturnedToPool()).toBe(false)

      projectile.onHitTarget(enemy2) // 2nd pierce
      expect(projectile.shouldBeReturnedToPool()).toBe(false)

      projectile.onHitTarget(enemy3) // 3rd hit (1 + 2 pierces = max)
      expect(projectile.shouldBeReturnedToPool()).toBe(true)
    })

    it("should not hit already pierced enemy", () => {
      projectile.onHitTarget(enemy1)

      expect(projectile.hasPiercedEnemy(enemy1)).toBe(true)
      expect(projectile.hasPiercedEnemy(enemy2)).toBe(false)
    })

    it("should handle enemies without explicit IDs", () => {
      const anonymousEnemy = { x: 300, y: 300 } as Enemy

      projectile.onHitTarget(anonymousEnemy)

      expect(projectile.hasPiercedEnemy(anonymousEnemy)).toBe(true)
    })
  })

  describe("Projectile Pool Management", () => {
    beforeEach(() => {
      projectile = new Projectile(mockScene, 100, 100, 20)
    })

    it("should not be marked for pool return initially", () => {
      expect(projectile.shouldBeReturnedToPool()).toBe(false)
    })

    it("should mark for pool return correctly", () => {
      projectile.onHitTarget()

      expect(projectile.shouldBeReturnedToPool()).toBe(true)
      expect(projectile.active).toBe(false)
      expect(projectile.visible).toBe(false)
    })

    it("should reset pool flag", () => {
      projectile.onHitTarget() // Mark for return
      expect(projectile.shouldBeReturnedToPool()).toBe(true)

      projectile.resetPoolFlag()

      expect(projectile.shouldBeReturnedToPool()).toBe(false)
    })

    it("should skip updates when inactive", () => {
      projectile.setActive(false)
      const initialTimeAlive = projectile.getTimeAlive()

      projectile.gameUpdate(0, 16)

      expect(projectile.getTimeAlive()).toBe(initialTimeAlive + 16) // Time still increments
    })
  })

  describe("Projectile Advanced Seeking Behavior", () => {
    beforeEach(() => {
      projectile = new Projectile(
        mockScene,
        100,
        100,
        20,
        mockTarget,
        0,
        true,
        0.2
      )
      projectile.body = {
        setVelocity: vi.fn(),
        velocity: { x: 120, y: -60 },
      } as any
    })

    it("should use seeking strength for homing", () => {
      projectile.gameUpdate(0, 16)

      expect((projectile.body as any).setVelocity).toHaveBeenCalled()
    })

    it("should use default homing strength when seekingStrength is 0", () => {
      projectile.seekingStrength = 0

      projectile.gameUpdate(0, 16)

      expect((projectile.body as any).setVelocity).toHaveBeenCalled()
    })

    it("should maintain speed while changing direction", () => {
      const originalSpeed = projectile.speed

      projectile.gameUpdate(0, 16)

      // Verify the projectile maintains its speed
      expect(projectile.speed).toBe(originalSpeed)
    })

    it("should handle target at same position gracefully", () => {
      mockTarget.x = projectile.x
      mockTarget.y = projectile.y

      expect(() => projectile.gameUpdate(0, 16)).not.toThrow()
    })
  })
})
