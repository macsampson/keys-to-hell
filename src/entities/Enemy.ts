import Phaser from "phaser"
import { GameObject } from "./GameObject"
import type { Enemy as IEnemy } from "../types/interfaces"
import { MovementPattern } from "../types/interfaces"

export class Enemy extends GameObject implements IEnemy {
  public damage: number = 0
  public experienceValue: number = 0
  public movementPattern: MovementPattern
  public target: Phaser.Math.Vector2

  private speed: number = 0
  private timeAlive: number = 0

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enemyType: string = "basic"
  ) {
    // Use the spritesheet texture instead of 'enemy'
    super(scene, x, y, "goblin_run")

    // Set enemy properties based on type
    this.setupEnemyType(enemyType)

    this.setDepth(1000)

    // Set target to player position (center of screen for now)
    this.target = new Phaser.Math.Vector2(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY
    )

    // Set default movement pattern
    this.movementPattern = MovementPattern.STRAIGHT

    // Make it a physics sprite
    scene.physics.add.existing(this)

    // Set sprite properties
    this.setDisplaySize(32, 32) // Twice the spritesheet frame size (16x16 -> 32x32)

    // Start the running animation
    this.play("goblin_run")
  }

  private setupEnemyType(enemyType: string): void {
    switch (enemyType) {
      case "basic":
        this.health = 30
        this.maxHealth = 30
        this.damage = 10
        this.experienceValue = 10
        this.speed = 80
        break
      case "fast":
        this.health = 20
        this.maxHealth = 20
        this.damage = 8
        this.experienceValue = 15
        this.speed = 120
        this.setTint(0x44ff44)
        break
      case "tank":
        this.health = 60
        this.maxHealth = 60
        this.damage = 15
        this.experienceValue = 25
        this.speed = 50
        this.setTint(0x4444ff)
        this.setDisplaySize(48, 48) // Larger than normal (1.5x the doubled base size)
        break
      default:
        this.health = 30
        this.maxHealth = 30
        this.damage = 10
        this.experienceValue = 10
        this.speed = 80
    }
  }

  public gameUpdate(time: number, delta: number): void {
    this.timeAlive += delta

    if (!this.active) return

    // Update movement based on pattern
    this.updateMovement(time, delta)

    // Check if enemy is off screen and should be destroyed
    if (this.isOffScreen()) {
      this.destroyGameObject()
    }
  }

  private updateMovement(time: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body
    if (!body) return

    switch (this.movementPattern) {
      case MovementPattern.STRAIGHT:
        this.moveTowardsTarget(body, delta)
        break
      case MovementPattern.SINE_WAVE:
        this.moveSineWave(body, time, delta)
        break
      case MovementPattern.SPIRAL:
        this.moveSpiral(body, time, delta)
        break
      case MovementPattern.HOMING:
        this.moveHoming(body, delta)
        break
    }
  }

  private moveTowardsTarget(
    body: Phaser.Physics.Arcade.Body,
    delta: number
  ): void {
    const direction = new Phaser.Math.Vector2(
      this.target.x - this.x,
      this.target.y - this.y
    ).normalize()

    body.setVelocity(direction.x * this.speed, direction.y * this.speed)
  }

  private moveSineWave(
    body: Phaser.Physics.Arcade.Body,
    time: number,
    delta: number
  ): void {
    const direction = new Phaser.Math.Vector2(
      this.target.x - this.x,
      this.target.y - this.y
    ).normalize()

    // Add sine wave perpendicular to movement
    const perpendicular = new Phaser.Math.Vector2(-direction.y, direction.x)
    const waveOffset = Math.sin(time * 0.003) * 50

    body.setVelocity(
      (direction.x + perpendicular.x * waveOffset * 0.02) * this.speed,
      (direction.y + perpendicular.y * waveOffset * 0.02) * this.speed
    )
  }

  private moveSpiral(
    body: Phaser.Physics.Arcade.Body,
    time: number,
    delta: number
  ): void {
    const angle = time * 0.002
    const radius = 100 + Math.sin(time * 0.001) * 50

    const targetX = this.target.x + Math.cos(angle) * radius
    const targetY = this.target.y + Math.sin(angle) * radius

    const direction = new Phaser.Math.Vector2(
      targetX - this.x,
      targetY - this.y
    ).normalize()

    body.setVelocity(
      direction.x * this.speed * 0.8,
      direction.y * this.speed * 0.8
    )
  }

  private moveHoming(body: Phaser.Physics.Arcade.Body, delta: number): void {
    // More aggressive targeting
    const direction = new Phaser.Math.Vector2(
      this.target.x - this.x,
      this.target.y - this.y
    ).normalize()

    body.setVelocity(
      direction.x * this.speed * 1.2,
      direction.y * this.speed * 1.2
    )
  }

  private isOffScreen(): boolean {
    const camera = this.scene.cameras.main
    return (
      this.x < -50 ||
      this.x > camera.width + 50 ||
      this.y < -50 ||
      this.y > camera.height + 50
    )
  }

  public setTarget(target: Phaser.Math.Vector2): void {
    this.target = target
  }

  public setMovementPattern(pattern: MovementPattern): void {
    this.movementPattern = pattern
  }

  public setStats(health: number, damage: number, speed: number): void {
    this.health = health
    this.maxHealth = health
    this.damage = damage
    this.speed = speed
  }

  public getTimeAlive(): number {
    return this.timeAlive
  }

  private isPlayingDeathAnimation: boolean = false

  public takeDamageAndCheckDeath(damage: number): boolean {
    // Call the parent method to handle damage
    const isDead = super.takeDamageAndCheckDeath(damage)

    if (isDead && !this.isPlayingDeathAnimation) {
      // Mark as playing death animation to prevent duplicate calls
      this.isPlayingDeathAnimation = true

      // Play death animation
      this.play("goblin_death")

      // Stop physics body movement
      const body = this.body as Phaser.Physics.Arcade.Body
      if (body) {
        body.setVelocity(0, 0)
        body.enable = false // Disable physics interactions
      }

      // Delay destruction until animation completes (6 frames at 8 fps = 750ms)
      this.scene.time.delayedCall(750, () => {
        this.destroyGameObject()
      })
    } else if (!isDead) {
      // If not dead, play hurt animation briefly
      this.play("goblin_hurt")

      // Return to running animation after hurt animation
      this.scene.time.delayedCall(200, () => {
        if (this.active) {
          this.play("goblin_run")
        }
      })
    }

    return isDead
  }
}
