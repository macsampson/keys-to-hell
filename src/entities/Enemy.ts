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
  private enemyType: string = "basic"

  static getEnemyTexture(enemyType: string): string {
    switch (enemyType) {
      case "yokai":
        return "yokai_walk"
      case "werewolf":
        return "werewolf_walk"
      case "gorgon":
        return "gorgon_walk"
      case "minotaur":
        return "minotaur_walk"
      case "schoolgirl":
        return "schoolgirl_walk"
      default:
        return "goblin_run"
    }
  }

  static getWalkingAnimation(enemyType: string): string {
    switch (enemyType) {
      case "yokai":
        return "yokai_walk"
      case "werewolf":
        return "werewolf_walk"
      case "gorgon":
        return "gorgon_walk"
      case "minotaur":
        return "minotaur_walk"
      case "schoolgirl":
        return "schoolgirl_walk"
      default:
        return "goblin_run"
    }
  }

  static getHurtAnimation(enemyType: string): string {
    switch (enemyType) {
      case "yokai":
        return "yokai_hurt"
      case "werewolf":
        return "werewolf_hurt"
      case "gorgon":
        return "gorgon_hurt"
      case "minotaur":
        return "minotaur_hurt"
      case "schoolgirl":
        return "schoolgirl_hurt"
      default:
        return "goblin_hurt"
    }
  }

  static getDeathAnimation(enemyType: string): string {
    switch (enemyType) {
      case "yokai":
        return "yokai_death"
      case "werewolf":
        return "werewolf_death"
      case "gorgon":
        return "gorgon_death"
      case "minotaur":
        return "minotaur_death"
      case "schoolgirl":
        return "schoolgirl_death"
      default:
        return "goblin_death"
    }
  }

  static getAttackAnimation(enemyType: string): string {
    switch (enemyType) {
      case "yokai":
        return "yokai_attack"
      case "werewolf":
        return "werewolf_attack"
      case "gorgon":
        return "gorgon_attack"
      case "minotaur":
        return "minotaur_attack"
      case "schoolgirl":
        return "schoolgirl_attack"
      default:
        return "goblin_run" // Goblins don't have attack animation yet
    }
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enemyType: string = "basic"
  ) {
    // Get the appropriate texture for the enemy type
    const texture = Enemy.getEnemyTexture(enemyType)
    super(scene, x, y, texture)

    // Store the enemy type
    this.enemyType = enemyType

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

    // Set default sprite size (will be overridden by setupEnemyType for specific enemies)
    this.setDisplaySize(32, 32) // Default size for basic enemies

    // Start the appropriate running/walking animation
    this.play(Enemy.getWalkingAnimation(enemyType))

    // Apply enemy-specific sizing after other setup
    this.applyEnemySpecificSizing(enemyType)
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
      case "yokai":
        this.health = 45
        this.maxHealth = 45
        this.damage = 12
        this.experienceValue = 20
        this.speed = 90
        this.setTint(0xff8888) // Light red tint for supernatural
        this.movementPattern = MovementPattern.SINE_WAVE
        break
      case "werewolf":
        this.health = 80
        this.maxHealth = 80
        this.damage = 18
        this.experienceValue = 35
        this.speed = 110
        this.setTint(0x8b4513) // Brown tint
        this.movementPattern = MovementPattern.HOMING
        break
      case "gorgon":
        this.health = 65
        this.maxHealth = 65
        this.damage = 16
        this.experienceValue = 30
        this.speed = 60
        this.setTint(0x90ee90) // Light green tint
        this.movementPattern = MovementPattern.SPIRAL
        break
      case "minotaur":
        this.health = 120
        this.maxHealth = 120
        this.damage = 25
        this.experienceValue = 50
        this.speed = 45
        this.setTint(0x8b4513) // Brown tint
        this.movementPattern = MovementPattern.STRAIGHT
        break
      case "schoolgirl":
        this.health = 25
        this.maxHealth = 25
        this.damage = 6
        this.experienceValue = 12
        this.speed = 140
        this.setTint(0xffb6c1) // Light pink tint
        this.movementPattern = MovementPattern.SINE_WAVE
        break
      default:
        this.health = 30
        this.maxHealth = 30
        this.damage = 10
        this.experienceValue = 10
        this.speed = 80
    }
  }

  private applyEnemySpecificSizing(enemyType: string): void {
    switch (enemyType) {
      case "tank":
        this.setDisplaySize(48, 48) // Larger than basic
        break
      case "yokai":
        this.setDisplaySize(96, 96) // Double size for ethereal enemy
        break
      case "werewolf":
        this.setDisplaySize(104, 104) // Double size for aggressive enemy
        break
      case "gorgon":
        this.setDisplaySize(92, 92) // Double size for medium-large
        break
      case "minotaur":
        this.setDisplaySize(128, 128) // Double size - massive boss
        break
      case "schoolgirl":
        this.setDisplaySize(72, 72) // Double size for visibility
        break
      // basic, fast, and default cases use the default 32x32 size
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

      // Play appropriate death animation for this enemy type
      this.play(Enemy.getDeathAnimation(this.enemyType))

      // Stop physics body movement
      const body = this.body as Phaser.Physics.Arcade.Body
      if (body) {
        body.setVelocity(0, 0)
        body.enable = false // Disable physics interactions
      }

      // Delay destruction until animation completes
      this.scene.time.delayedCall(750, () => {
        this.destroyGameObject()
      })
    } else if (!isDead) {
      // If not dead, play appropriate hurt animation briefly
      this.play(Enemy.getHurtAnimation(this.enemyType))

      // Return to walking animation after hurt animation
      this.scene.time.delayedCall(200, () => {
        if (this.active) {
          this.play(Enemy.getWalkingAnimation(this.enemyType))
        }
      })
    }

    return isDead
  }
}
