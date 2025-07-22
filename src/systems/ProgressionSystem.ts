import Phaser from "phaser"
import type {
  ProgressionSystem as IProgressionSystem,
  Upgrade,
} from "../types/interfaces"
import { Player } from "../entities/Player"
import { GAME_CONSTANTS } from "../config/GameConfig"

export class ProgressionSystem implements IProgressionSystem {
  public level: number
  public experience: number
  public experienceToNext: number
  public availableUpgrades: Upgrade[]

  private scene: Phaser.Scene
  private player: Player

  // Experience calculation constants
  private baseExperienceRequired: number = GAME_CONSTANTS.EXPERIENCE_BASE
  private experienceMultiplier: number = GAME_CONSTANTS.EXPERIENCE_MULTIPLIER

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene
    this.player = player

    this.level = 1
    this.experience = 0
    this.experienceToNext = this.calculateExperienceRequiredForLevel(2)
    this.availableUpgrades = []
  }

  public addExperience(amount: number): void {
    const previousLevel = this.level
    this.experience += amount

    console.log(`Added ${amount} XP. Total: ${this.experience}`)

    // Check for level ups
    while (this.experience >= this.experienceToNext) {
      this.levelUp()
    }

    // If level changed, emit level up event
    if (this.level > previousLevel) {
      this.scene.events.emit("playerLevelUp", this.level, previousLevel)
    }
  }

  public levelUp(): void {
    // Remove experience required for current level
    this.experience -= this.experienceToNext
    this.level++

    // Update player level
    this.player.level = this.level

    // Calculate experience required for next level
    this.experienceToNext =
      this.calculateExperienceRequiredForLevel(this.level + 1) -
      this.calculateExperienceRequiredForLevel(this.level)

    console.log(
      `Level up! Now level ${this.level}. XP to next: ${this.experienceToNext}`
    )

    // Generate upgrade options
    this.generateUpgradeOptions()

    // Trigger level up visual effect on player
    this.player.levelUp()

    // Emit level up event for UI updates
    this.scene.events.emit("levelUp", {
      newLevel: this.level,
      availableUpgrades: this.availableUpgrades,
    })
  }

  private calculateExperienceRequiredForLevel(targetLevel: number): number {
    if (targetLevel <= 1) return 0

    // Exponential experience curve: base * (multiplier ^ (level - 1))
    return Math.floor(
      this.baseExperienceRequired *
        Math.pow(this.experienceMultiplier, targetLevel - 2)
    )
  }

  public selectUpgrade(upgrade: Upgrade): void {
    if (!this.availableUpgrades.includes(upgrade)) {
      console.warn("Attempted to select unavailable upgrade:", upgrade.id)
      return
    }

    // Apply upgrade to player
    upgrade.apply(this.player)

    console.log(`Applied upgrade: ${upgrade.name}`)

    // Clear available upgrades
    this.availableUpgrades = []

    // Emit upgrade selected event
    this.scene.events.emit("upgradeSelected", upgrade)
  }

  private generateUpgradeOptions(): void {
    // Clear previous upgrades
    this.availableUpgrades = []

    // Define available upgrade types based on level
    const possibleUpgrades: Upgrade[] = [
      this.createAttackPowerUpgrade(),
      this.createMultiHitUpgrade(),
      this.createHealthUpgrade(),
      this.createTypingSpeedUpgrade(),
      this.createAttackSpeedUpgrade(),
    ]

    // Filter upgrades based on level and current player stats
    const validUpgrades = possibleUpgrades.filter((upgrade) =>
      this.isUpgradeValid(upgrade)
    )

    // Select 3 random upgrades (or all if less than 3 available)
    const upgradeCount = Math.min(3, validUpgrades.length)
    this.availableUpgrades = this.getRandomUpgrades(validUpgrades, upgradeCount)
  }

  private isUpgradeValid(upgrade: Upgrade): boolean {
    // Basic validation - can be expanded with more complex logic
    switch (upgrade.id) {
      case "multi_hit":
        return this.player.attackMultiplier < 5 // Max 5 projectiles
      case "health":
        return this.player.maxHealth < 200 // Max 200 health
      case "typing_speed":
        return this.player.typingSpeed < 3.0 // Max 3x typing speed
      default:
        return true
    }
  }

  private getRandomUpgrades(upgrades: Upgrade[], count: number): Upgrade[] {
    const shuffled = [...upgrades].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  private createAttackPowerUpgrade(): Upgrade {
    const powerIncrease = 5 + Math.floor(this.level * 2)
    return {
      id: "attack_power",
      name: "Increased Attack Power",
      description: `+${powerIncrease} attack damage`,
      effect: undefined as any, // Will be set by apply function
      apply: (player: Player) => {
        player.increaseAttackPower(powerIncrease)
      },
    }
  }

  private createMultiHitUpgrade(): Upgrade {
    return {
      id: "multi_hit",
      name: "Multi-Hit",
      description: "Fire an additional projectile per word",
      effect: undefined as any,
      apply: (player: Player) => {
        player.increaseAttackMultiplier(1)
      },
    }
  }

  private createHealthUpgrade(): Upgrade {
    const healthIncrease = 25 + Math.floor(this.level * 5)
    return {
      id: "health",
      name: "Health Boost",
      description: `+${healthIncrease} max health and restore to full`,
      effect: undefined as any,
      apply: (player: Player) => {
        player.maxHealth += healthIncrease
        player.health = player.maxHealth // Full heal
      },
    }
  }

  private createTypingSpeedUpgrade(): Upgrade {
    return {
      id: "typing_speed",
      name: "Typing Speed",
      description: "Faster word completion detection",
      effect: undefined as any,
      apply: (player: Player) => {
        player.increaseTypingSpeed(0.2)
      },
    }
  }

  private createAttackSpeedUpgrade(): Upgrade {
    return {
      id: "attack_speed",
      name: "Attack Speed",
      description: "Faster projectiles",
      effect: undefined as any,
      apply: (player: Player) => {
        // This would affect projectile speed - we'll implement in projectile system
        player.increaseAttackPower(2) // Small damage boost for now
      },
    }
  }

  // Getters for UI display
  public getExperienceProgress(): number {
    const totalExpForCurrentLevel =
      this.calculateExperienceRequiredForLevel(this.level + 1) -
      this.calculateExperienceRequiredForLevel(this.level)
    return this.experience / totalExpForCurrentLevel
  }

  public getExperienceForDisplay(): {
    current: number
    required: number
    percentage: number
  } {
    const totalRequired = this.experienceToNext + this.experience
    return {
      current: this.experience,
      required: totalRequired,
      percentage: this.getExperienceProgress(),
    }
  }

  public getTotalExperience(): number {
    return (
      this.calculateExperienceRequiredForLevel(this.level) + this.experience
    )
  }

  // Reset for new game
  public reset(): void {
    this.level = 1
    this.experience = 0
    this.experienceToNext = this.calculateExperienceRequiredForLevel(2)
    this.availableUpgrades = []

    // Reset player level
    this.player.level = 1
  }
}
