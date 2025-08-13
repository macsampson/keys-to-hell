import Phaser from "phaser"
import { GameObject } from "./GameObject"
import type { Player as IPlayer } from "../types/interfaces"

export class Player extends GameObject implements IPlayer {
  public attackPower: number
  public attackMultiplier: number
  public typingSpeed: number
  public level: number
  public position: Phaser.Math.Vector2

  // Projectile upgrades
  public projectileCount: number = 1
  public piercingCount: number = 0
  public hasSeekingProjectiles: boolean = false
  public seekingStrength: number = 0

  // AOE upgrades
  public hasWordBlast: boolean = false
  public blastRadius: number = 0
  public blastDamage: number = 0
  public hasChainLightning: boolean = false
  public chainJumps: number = 0
  public chainRange: number = 0

  // Special weapons
  public hasLaserBeam: boolean = false
  public laserDamagePerSecond: number = 0
  public laserWidth: number = 0
  public turretCount: number = 0
  public turretDamage: number = 0

  // Sentence upgrades
  public hasSentenceSlam: boolean = false
  public sentenceDamageMultiplier: number = 0
  public hasComboSystem: boolean = false
  public maxComboMultiplier: number = 0

  // Health & regen
  public hasRegeneration: boolean = false
  public regenRate: number = 0

  // Shields
  public hasTypingShield: boolean = false
  public shieldPerWord: number = 0
  public maxShield: number = 0
  public currentShield: number = 0
  public hasWordBarrier: boolean = false
  public barrierStrength: number = 0

  // Deflection & Reflection
  public hasProjectileDeflection: boolean = false
  public deflectionChance: number = 0
  public hasDamageReflection: boolean = false
  public reflectionDamage: number = 0

  // Aura & Area Control
  public hasSlowingAura: boolean = false
  public slowAuraRadius: number = 0
  public slowStrength: number = 0
  public hasDamageAura: boolean = false
  public auraRadius: number = 0
  public auraDamagePerSecond: number = 0
  public hasRepulsionField: boolean = false
  public repulsionRadius: number = 0
  public repulsionStrength: number = 0

  // Temporal & Reality
  public hasTimeDilation: boolean = false
  public dilationStrength: number = 0
  public dilationDuration: number = 0
  public hasRewind: boolean = false
  public rewindCharges: number = 0
  public rewindHealAmount: number = 0
  public hasStasisField: boolean = false
  public stasisDuration: number = 0
  public stasisRadius: number = 0

  // Utility
  public magnetRange: number = 100
  public magnetStrength: number = 1

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Use schoolgirl texture
    super(scene, x, y, "schoolgirl_idle")

    // Initialize player stats
    this.health = 100
    this.maxHealth = 100
    this.attackPower = 10
    this.attackMultiplier = 1
    this.typingSpeed = 1.0
    this.level = 1

    // Initialize position vector
    this.position = new Phaser.Math.Vector2(x, y)

    // Set up player appearance
    this.setDisplaySize(128, 128) // Same size as schoolgirl enemy
    // Remove tint since we want natural schoolgirl colors

    // Start idle animation
    this.play("schoolgirl_idle")

    // Enable physics if available
    if (scene.physics && scene.physics.world) {
      scene.physics.world.enable(this)
    }
  }

  public gameUpdate(time: number, delta: number): void {
    // Update position vector to match sprite position
    this.position.set(this.x, this.y)

    // Handle regeneration
    if (this.hasRegeneration && this.regenRate > 0) {
      this.handleRegeneration(delta)
    }

    // Handle aura effects
    this.handleAuraEffects(delta)
  }

  private handleRegeneration(delta: number): void {
    if (this.health < this.maxHealth) {
      const regenAmount = (this.regenRate * delta) / 1000 // Convert to per-second rate
      this.health = Math.min(this.health + regenAmount, this.maxHealth)
    }
  }

  public takeDamage(damage: number): boolean {
    let actualDamage = damage

    // Handle shields first
    if (this.currentShield > 0) {
      const shieldAbsorbed = Math.min(this.currentShield, actualDamage)
      this.currentShield -= shieldAbsorbed
      actualDamage -= shieldAbsorbed
      console.log(
        `Shield absorbed ${shieldAbsorbed} damage, ${this.currentShield} shield remaining`
      )
    }

    // Check for rewind ability before taking fatal damage
    if (
      actualDamage >= this.health &&
      this.hasRewind &&
      this.rewindCharges > 0
    ) {
      this.activateRewind()
      return false // Prevent death
    }

    // Apply remaining damage to health
    const isDead =
      actualDamage > 0 ? super.takeDamageAndCheckDeath(actualDamage) : false

    // Activate time dilation if health is low
    if (this.hasTimeDilation && this.getHealthPercentage() < 0.3) {
      this.activateTimeDilation()
    }

    // Add screen shake effect for player damage
    if (actualDamage > 0 && this.scene.cameras.main) {
      this.scene.cameras.main.shake(200, 0.01)
    }

    return isDead
  }

  private activateRewind(): void {
    this.rewindCharges--
    this.health = Math.min(this.health + this.rewindHealAmount, this.maxHealth)
    console.log(
      `Rewind activated! Healed ${this.rewindHealAmount} HP. Charges remaining: ${this.rewindCharges}`
    )

    // Visual effect for rewind
    const scene = this.scene as any
    if (scene.add) {
      const rewindText = scene.add
        .text(this.x, this.y - 50, "REWIND!", {
          fontSize: "20px",
          color: "#00ff00",
          fontFamily: "OldEnglishGothicPixel",
        })
        .setDepth(1000)

      scene.tweens.add({
        targets: rewindText,
        y: rewindText.y - 30,
        alpha: 0,
        duration: 1500,
        onComplete: () => rewindText.destroy(),
      })
    }
  }

  private activateTimeDilation(): void {
    const scene = this.scene as any
    if (!scene.physics || scene.isTimeDilated) return

    scene.isTimeDilated = true
    const originalTimeScale = scene.physics.world.timeScale || 1
    const dilatedTimeScale = originalTimeScale * (1 - this.dilationStrength)

    scene.physics.world.timeScale = dilatedTimeScale
    console.log(
      `Time dilation activated: ${this.dilationStrength * 100}% slowdown for ${
        this.dilationDuration
      }ms`
    )

    // Restore time scale after duration
    scene.time.delayedCall(this.dilationDuration, () => {
      if (scene.physics && scene.physics.world) {
        scene.physics.world.timeScale = originalTimeScale
        scene.isTimeDilated = false
        console.log("Time dilation ended")
      }
    })
  }

  public onSentenceCompleted(): void {
    // Activate stasis field if upgrade is active
    if (this.hasStasisField) {
      this.activateStasisField()
    }
  }

  private activateStasisField(): void {
    const scene = this.scene as any
    if (!scene.entityManager) return

    const enemies = scene.entityManager.getAllActiveEnemies()
    const affectedEnemies: any[] = []

    enemies.forEach((enemy: any) => {
      const distance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        enemy.x,
        enemy.y
      )
      if (distance <= this.stasisRadius) {
        // Store original velocity and freeze enemy
        enemy.stasisOriginalVelocity = {
          x: enemy.body?.velocity?.x || 0,
          y: enemy.body?.velocity?.y || 0,
        }

        if (enemy.body) {
          enemy.body.setVelocity(0, 0)
        }

        enemy.isFrozen = true
        affectedEnemies.push(enemy)
      }
    })

    console.log(
      `Stasis field activated, froze ${affectedEnemies.length} enemies for ${this.stasisDuration}ms`
    )

    // Restore enemy movement after duration
    scene.time.delayedCall(this.stasisDuration, () => {
      affectedEnemies.forEach((enemy) => {
        if (enemy.body && enemy.stasisOriginalVelocity) {
          enemy.body.setVelocity(
            enemy.stasisOriginalVelocity.x,
            enemy.stasisOriginalVelocity.y
          )
        }
        enemy.isFrozen = false
        delete enemy.stasisOriginalVelocity
      })
      console.log(
        `Stasis field ended, restored movement to ${affectedEnemies.length} enemies`
      )
    })
  }

  public moveToPosition(x: number, y: number): void {
    this.setPosition(x, y)
    this.position.set(x, y)
  }

  public increaseAttackPower(amount: number): void {
    this.attackPower += amount
  }

  public increaseAttackMultiplier(multiplier: number): void {
    this.attackMultiplier += multiplier
  }

  public increaseTypingSpeed(amount: number): void {
    this.typingSpeed += amount
  }

  public onWordCompleted(): void {
    // Generate shield from typing if upgrade is active
    if (this.hasTypingShield && this.shieldPerWord > 0) {
      this.currentShield = Math.min(
        this.currentShield + this.shieldPerWord,
        this.maxShield
      )
      console.log(
        `Generated ${this.shieldPerWord} shield from typing. Current shield: ${this.currentShield}/${this.maxShield}`
      )
    }
  }

  public performAttack(
    target?: { x: number; y: number } | null,
    onThrow?: () => void
  ): void {
    // Face the target if one is provided
    if (target) {
      this.faceTarget(target)
    }

    // Play attack animation
    this.play("schoolgirl_attack")

    // Call the throw callback when the throwing frame happens (roughly halfway through animation)
    // schoolgirl_attack has 8 frames at 12 fps, so around 300ms for the throw frame
    if (onThrow) {
      this.scene.time.delayedCall(480, onThrow)
    }

    // Return to idle animation after attack completes
    this.scene.time.delayedCall(500, () => {
      if (this.active) {
        this.play("schoolgirl_idle")
      }
    })
  }

  private faceTarget(target: { x: number; y: number }): void {
    const horizontalDistance = Math.abs(target.x - this.x)

    // If target is directly above or below (very small horizontal distance), don't change facing
    if (horizontalDistance < 10) {
      return
    }

    // Face towards target horizontally
    if (this.x < target.x) {
      // Target is to the right, face right
      this.setFlipX(false)
    } else {
      // Target is to the left, face left
      this.setFlipX(true)
    }
  }

  public onPerfectWord(): void {
    // Generate barrier from perfect typing if upgrade is active
    if (this.hasWordBarrier && this.barrierStrength > 0) {
      this.currentShield = Math.min(
        this.currentShield + this.barrierStrength,
        this.maxShield
      )
      console.log(
        `Generated ${this.barrierStrength} barrier from perfect word. Current shield: ${this.currentShield}/${this.maxShield}`
      )
    }
  }

  private handleAuraEffects(delta: number): void {
    // Get all enemies from scene - we need access to the EntityManager
    const scene = this.scene as any
    if (!scene.entityManager) return

    const enemies = scene.entityManager.getAllActiveEnemies()

    enemies.forEach((enemy: any) => {
      const distance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        enemy.x,
        enemy.y
      )

      // Slowing Aura
      if (this.hasSlowingAura && distance <= this.slowAuraRadius) {
        this.applySlowingEffect(enemy, delta)
      }

      // Damage Aura
      if (this.hasDamageAura && distance <= this.auraRadius) {
        this.applyDamageAura(enemy, delta)
      }

      // Repulsion Field
      if (this.hasRepulsionField && distance <= this.repulsionRadius) {
        this.applyRepulsionEffect(enemy, delta)
      }
    })
  }

  private applySlowingEffect(enemy: any, delta: number): void {
    // Apply slow effect by reducing enemy movement speed
    if (!enemy.originalSpeed) {
      enemy.originalSpeed = enemy.speed || 100
    }
    enemy.speed = enemy.originalSpeed * (1 - this.slowStrength)
  }

  private applyDamageAura(enemy: any, delta: number): void {
    // Apply damage over time
    const damageThisFrame = (this.auraDamagePerSecond * delta) / 1000
    enemy.takeDamage(damageThisFrame)
  }

  private applyRepulsionEffect(enemy: any, delta: number): void {
    // Push enemy away from player
    const direction = new Phaser.Math.Vector2(
      enemy.x - this.x,
      enemy.y - this.y
    )
    if (direction.length() > 0) {
      direction.normalize()
      const repulsionForce = (this.repulsionStrength * delta) / 1000

      enemy.x += direction.x * repulsionForce
      enemy.y += direction.y * repulsionForce
    }
  }

  public levelUp(): void {
    this.level++

    // Add level up visual effect
    this.scene.add
      .text(this.x, this.y - 50, "LEVEL UP!", {
        fontSize: "16px",
        color: "#ffff00",
      })
      .setDepth(1000)
  }

  public getStats(): {
    health: number
    maxHealth: number
    attackPower: number
    attackMultiplier: number
    typingSpeed: number
    level: number
  } {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      attackPower: this.attackPower,
      attackMultiplier: this.attackMultiplier,
      typingSpeed: this.typingSpeed,
      level: this.level,
    }
  }
}
