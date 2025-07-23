import Phaser from "phaser"
import { GameObject } from "./GameObject"
import type { Projectile as IProjectile, Enemy } from "../types/interfaces"

export class Projectile extends GameObject implements IProjectile {
  public damage: number
  public target: Enemy | null
  public speed: number

  private timeAlive: number = 0
  private projectileId: string
  private static nextId: number = 1
  private shouldReturnToPool: boolean = false

  // Upgrade properties
  public piercingCount: number = 0
  public hasSeekingBehavior: boolean = false
  public seekingStrength: number = 0
  public enemiesPierced: Set<string> = new Set()

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number,
    target: Enemy | null = null,
    piercingCount: number = 0,
    hasSeekingBehavior: boolean = false,
    seekingStrength: number = 0
  ) {
    super(scene, x, y, "projectile")

    this.projectileId = `P${Projectile.nextId++}`
    this.damage = damage
    this.target = target
    this.speed = 400
    this.health = 1
    this.maxHealth = 1

    // Set upgrade properties
    this.piercingCount = piercingCount
    this.hasSeekingBehavior = hasSeekingBehavior
    this.seekingStrength = seekingStrength
    this.enemiesPierced = new Set()

    console.log(
      `[${this.projectileId}] Created at (${x.toFixed(1)}, ${y.toFixed(
        1
      )}) with target: ${
        target ? `(${target.x.toFixed(1)}, ${target.y.toFixed(1)})` : "none"
      }`
    )

    // Set sprite properties
    this.setDisplaySize(8, 8)
    this.setTint(0xffff44)

    // Add to physics
    scene.physics.add.existing(this)

    // Set initial velocity towards target
    this.launchTowardsTarget()
  }

  private launchTowardsTarget(): void {
    const body = this.body as Phaser.Physics.Arcade.Body
    if (!body) return

    if (this.target && this.target.active) {
      // Calculate direction to target
      const direction = new Phaser.Math.Vector2(
        this.target.x - this.x,
        this.target.y - this.y
      ).normalize()

      body.setVelocity(direction.x * this.speed, direction.y * this.speed)

      // Rotate projectile to face target
      this.rotation = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        this.target.x,
        this.target.y
      )
    } else {
      // No target, just shoot upward
      body.setVelocity(0, -this.speed)
    }
  }

  public gameUpdate(_time: number, delta: number): void {
    this.timeAlive += delta

    if (!this.active) {
      console.log(
        `[${this.projectileId}] Skipping inactive projectile at (${this.x}, ${this.y})`
      )
      return
    }

    // Log current state every 500ms for debugging
    if (
      Math.floor(this.timeAlive / 500) !==
      Math.floor((this.timeAlive - delta) / 500)
    ) {
      console.log(
        `[${this.projectileId}] State: pos(${this.x.toFixed(
          1
        )}, ${this.y.toFixed(1)}), alive: ${this.timeAlive.toFixed(
          0
        )}ms, target: ${
          this.target
            ? `(${this.target.x.toFixed(1)}, ${this.target.y.toFixed(1)})`
            : "none"
        }, velocity: ${
          this.body
            ? `(${(this.body as Phaser.Physics.Arcade.Body).velocity.x.toFixed(1)}, ${(
                this.body as Phaser.Physics.Arcade.Body
              ).velocity.y.toFixed(1)})`
            : "no body"
        }`
      )
    }

    // Update homing behavior if target exists and seeking is enabled
    if (this.target && this.target.active && this.hasSeekingBehavior) {
      this.updateHoming(delta)
    } else if (this.target && !this.target.active) {
      console.log(
        `[${this.projectileId}] Target became inactive, continuing with last velocity`
      )
      this.target = null // Clear dead target
    }

    // Check destruction conditions - only destroy if off screen
    const offScreen = this.isOffScreen()

    if (offScreen) {
      console.log(
        `[${this.projectileId}] MARKED FOR POOL RETURN: off screen at (${this.x}, ${this.y})`
      )
      this.markForPoolReturn()
    }
  }

  private updateHoming(_delta: number): void {
    if (!this.target || !this.target.active) {
      console.log(`[${this.projectileId}] updateHoming: No valid target`)
      return
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    if (!body) {
      console.log(`[${this.projectileId}] updateHoming: No physics body`)
      return
    }

    // Calculate new direction to target
    const direction = new Phaser.Math.Vector2(
      this.target.x - this.x,
      this.target.y - this.y
    )

    const distanceToTarget = direction.length()

    // Check for zero-length vector (projectile at exact same position as target)
    if (distanceToTarget === 0) {
      console.log(
        `[${this.projectileId}] Projectile at same position as target, skipping homing update`
      )
      return
    }

    direction.normalize()

    // Apply some homing behavior (not perfect tracking)
    const currentVelocity = new Phaser.Math.Vector2(
      body.velocity.x,
      body.velocity.y
    )
    const currentSpeed = currentVelocity.length()

    // Check for zero velocity
    if (currentSpeed === 0) {
      // If no current velocity, just set direction towards target
      console.log(
        `[${this.projectileId}] updateHoming: Zero velocity detected, setting direction towards target`
      )
      body.setVelocity(direction.x * this.speed, direction.y * this.speed)
    } else {
      currentVelocity.normalize()
      const targetVelocity = direction.scale(this.speed)

      // Use seeking strength from upgrade
      const homingStrength = this.seekingStrength > 0 ? this.seekingStrength : 0.05
      const newVelocity = currentVelocity
        .lerp(targetVelocity.normalize(), homingStrength)
        .scale(this.speed)

      body.setVelocity(newVelocity.x, newVelocity.y)

      // Log significant velocity changes
      const velocityChange =
        Math.abs(newVelocity.x - body.velocity.x) +
        Math.abs(newVelocity.y - body.velocity.y)
      if (velocityChange > 50) {
        console.log(
          `[${
            this.projectileId
          }] updateHoming: Large velocity change - distance: ${distanceToTarget.toFixed(
            1
          )}, old: (${body.velocity.x.toFixed(1)}, ${body.velocity.y.toFixed(
            1
          )}), new: (${newVelocity.x.toFixed(1)}, ${newVelocity.y.toFixed(1)})`
        )
      }
    }

    // Update rotation
    this.rotation = Phaser.Math.Angle.Between(
      0,
      0,
      body.velocity.x,
      body.velocity.y
    )
  }

  private isOffScreen(): boolean {
    const camera = this.scene.cameras.main

    // Use world bounds, not camera bounds
    const worldView = camera.worldView
    const margin = 100 // Increased margin for safety

    const leftBound = worldView.x - margin
    const rightBound = worldView.x + worldView.width + margin
    const topBound = worldView.y - margin
    const bottomBound = worldView.y + worldView.height + margin

    const isOff =
      this.x < leftBound ||
      this.x > rightBound ||
      this.y < topBound ||
      this.y > bottomBound

    if (isOff) {
      console.log(
        `[${this.projectileId}] Off screen: pos(${this.x.toFixed(
          1
        )}, ${this.y.toFixed(1)}) vs bounds(${leftBound.toFixed(
          1
        )}, ${topBound.toFixed(1)}, ${rightBound.toFixed(
          1
        )}, ${bottomBound.toFixed(1)})`
      )
      console.log(
        `[${this.projectileId}] World view: x=${worldView.x}, y=${worldView.y}, w=${worldView.width}, h=${worldView.height}`
      )
      console.log(
        `[${this.projectileId}] Camera: x=${camera.scrollX}, y=${camera.scrollY}, zoom=${camera.zoom}`
      )
    }

    return isOff
  }

  public onHitTarget(enemy?: Enemy): void {
    // Create hit effect
    this.createHitEffect()

    // Handle piercing behavior
    if (enemy && this.piercingCount > 0) {
      this.handlePiercing(enemy)
    } else {
      // No piercing, mark for pool return instead of destroying
      this.markForPoolReturn()
    }
  }

  private handlePiercing(enemy: Enemy): void {
    // Track this enemy as pierced
    const enemyId = (enemy as any).enemyId || enemy.name || `enemy_${enemy.x}_${enemy.y}`
    this.enemiesPierced.add(enemyId)

    // Check if we've pierced enough enemies
    if (this.enemiesPierced.size >= this.piercingCount + 1) {
      // Mark for pool return after piercing max enemies
      this.markForPoolReturn()
      console.log(`[${this.projectileId}] Marked for pool return after piercing ${this.enemiesPierced.size} enemies`)
    } else {
      console.log(`[${this.projectileId}] Pierced enemy ${enemyId}, continuing (${this.enemiesPierced.size}/${this.piercingCount + 1})`)
      // Continue with current velocity
    }
  }

  public hasPiercedEnemy(enemy: Enemy): boolean {
    const enemyId = (enemy as any).enemyId || enemy.name || `enemy_${enemy.x}_${enemy.y}`
    return this.enemiesPierced.has(enemyId)
  }

  private createHitEffect(): void {
    // Flash effect removed - no visual flash
  }

  public setTarget(target: Enemy | null): void {
    this.target = target
    if (target) {
      this.launchTowardsTarget()
    }
  }

  public getDamage(): number {
    return this.damage
  }

  public getTimeAlive(): number {
    return this.timeAlive
  }

  public getProjectileId(): string {
    return this.projectileId
  }

  private markForPoolReturn(): void {
    this.shouldReturnToPool = true
    this.setActive(false)
    this.setVisible(false)
    console.log(`[${this.projectileId}] Marked for pool return`)
  }

  public shouldBeReturnedToPool(): boolean {
    return this.shouldReturnToPool
  }

  public resetPoolFlag(): void {
    this.shouldReturnToPool = false
  }
}
