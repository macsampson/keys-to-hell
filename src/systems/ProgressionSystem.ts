import Phaser from "phaser"
import type {
  ProgressionSystem as IProgressionSystem,
  Upgrade,
} from "../types/interfaces"
import { Player } from "../entities/Player"
import { GAME_CONSTANTS } from "../config/GameConfig"
import { UpgradeManager } from "./upgrades/UpgradeManager"
import { BaseUpgrade } from "./upgrades/BaseUpgrade"

export class ProgressionSystem implements IProgressionSystem {
  public level: number
  public experience: number
  public experienceToNext: number
  public availableUpgrades: BaseUpgrade[]

  private scene: Phaser.Scene
  private player: Player
  private upgradeManager: UpgradeManager

  // Experience calculation constants
  private baseExperienceRequired: number = GAME_CONSTANTS.EXPERIENCE_BASE
  private experienceMultiplier: number = GAME_CONSTANTS.EXPERIENCE_MULTIPLIER

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene
    this.player = player
    this.upgradeManager = new UpgradeManager()

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

  public selectUpgrade(upgrade: BaseUpgrade): void {
    if (!this.availableUpgrades.includes(upgrade)) {
      console.warn("Attempted to select unavailable upgrade:", upgrade.id)
      return
    }

    // Apply upgrade to player using the upgrade manager
    const success = this.upgradeManager.applyUpgrade(upgrade.id, this.player)
    
    if (success) {
      console.log(`Applied upgrade: ${upgrade.name}`)
      
      // Clear available upgrades
      this.availableUpgrades = []

      // Emit upgrade selected event
      this.scene.events.emit("upgradeSelected", upgrade)
    }
  }

  private generateUpgradeOptions(): void {
    // Use the upgrade manager to generate balanced upgrade choices
    this.availableUpgrades = this.upgradeManager.generateBalancedUpgradeChoices(3)
    
    console.log(`Generated ${this.availableUpgrades.length} upgrade options:`, 
      this.availableUpgrades.map(u => `${u.name} (${u.rarity})`))
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
    
    // Reset upgrade manager
    this.upgradeManager.reset()
  }

  // Get upgrade manager for UI access
  public getUpgradeManager(): UpgradeManager {
    return this.upgradeManager
  }
}
