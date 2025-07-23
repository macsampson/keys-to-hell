import { BaseUpgrade, UpgradeRarity } from "./BaseUpgrade"
import { Player } from "../../entities/Player"

// Import all upgrade classes
import {
  MultiShotUpgrade,
  PiercingUpgrade,
  SeekingUpgrade,
  WordBlastUpgrade,
  ChainLightningUpgrade,
  LaserBeamUpgrade,
  TurretUpgrade,
  SentenceSlamUpgrade,
  ComboUpgrade,
} from "./OffensiveUpgrades"

import {
  HealthBoostUpgrade,
  RegenerationUpgrade,
  TypingShieldUpgrade,
  WordBarrierUpgrade,
  ProjectileDeflectorUpgrade,
  DamageReflectionUpgrade,
  SlowingAuraUpgrade,
  DamageAuraUpgrade,
  RepulsionFieldUpgrade,
  TimeDilationUpgrade,
  RewindUpgrade,
  StasisFieldUpgrade,
} from "./DefensiveUpgrades"

export class UpgradeManager {
  private availableUpgrades: Map<string, BaseUpgrade> = new Map()
  private playerUpgrades: Map<string, BaseUpgrade> = new Map()

  // Rarity weights for selection (Common 60%, Rare 25%, Epic 12%, Legendary 3%)
  private rarityWeights = {
    [UpgradeRarity.COMMON]: 60,
    [UpgradeRarity.RARE]: 25,
    [UpgradeRarity.EPIC]: 12,
    [UpgradeRarity.LEGENDARY]: 3,
  }

  constructor() {
    this.initializeUpgrades()
  }

  private initializeUpgrades(): void {
    // Initialize all upgrade instances
    const upgrades = [
      // Offensive upgrades
      new MultiShotUpgrade(),
      new PiercingUpgrade(),
      new SeekingUpgrade(),
      new WordBlastUpgrade(),
      new ChainLightningUpgrade(),
      new LaserBeamUpgrade(),
      new TurretUpgrade(),
      new SentenceSlamUpgrade(),
      new ComboUpgrade(),

      // Defensive upgrades
      new HealthBoostUpgrade(),
      new RegenerationUpgrade(),
      new TypingShieldUpgrade(),
      new WordBarrierUpgrade(),
      new ProjectileDeflectorUpgrade(),
      new DamageReflectionUpgrade(),
      new SlowingAuraUpgrade(),
      new DamageAuraUpgrade(),
      new RepulsionFieldUpgrade(),
      new TimeDilationUpgrade(),
      new RewindUpgrade(),
      new StasisFieldUpgrade(),
    ]

    // Add all upgrades to available upgrades map
    upgrades.forEach((upgrade) => {
      this.availableUpgrades.set(upgrade.id, upgrade)
    })
  }

  public generateUpgradeChoices(count: number = 3): BaseUpgrade[] {
    // Get eligible upgrades (not maxed out)
    const eligibleUpgrades = Array.from(this.availableUpgrades.values()).filter(
      (upgrade) => {
        const playerUpgrade = this.playerUpgrades.get(upgrade.id)
        return !playerUpgrade || playerUpgrade.canUpgrade()
      }
    )

    if (eligibleUpgrades.length === 0) {
      return []
    }

    // Create weighted array based on rarity
    const weightedUpgrades: BaseUpgrade[] = []
    eligibleUpgrades.forEach((upgrade) => {
      const weight = this.rarityWeights[upgrade.rarity]
      for (let i = 0; i < weight; i++) {
        weightedUpgrades.push(upgrade)
      }
    })

    // Select unique upgrades
    const selectedUpgrades: BaseUpgrade[] = []
    const usedIds = new Set<string>()

    while (
      selectedUpgrades.length < count &&
      selectedUpgrades.length < eligibleUpgrades.length
    ) {
      const randomIndex = Math.floor(Math.random() * weightedUpgrades.length)
      const selectedUpgrade = weightedUpgrades[randomIndex]

      if (!usedIds.has(selectedUpgrade.id)) {
        selectedUpgrades.push(selectedUpgrade)
        usedIds.add(selectedUpgrade.id)
      }
    }

    return selectedUpgrades
  }

  public applyUpgrade(upgradeId: string, player: Player): boolean {
    const availableUpgrade = this.availableUpgrades.get(upgradeId)
    if (!availableUpgrade) {
      console.warn(`Upgrade not found: ${upgradeId}`)
      return false
    }

    // Get or create player's version of this upgrade
    let playerUpgrade = this.playerUpgrades.get(upgradeId)
    if (!playerUpgrade) {
      // Create a new instance for the player
      playerUpgrade = this.createUpgradeInstance(upgradeId)
      if (!playerUpgrade) {
        console.warn(`Failed to create upgrade instance: ${upgradeId}`)
        return false
      }
      this.playerUpgrades.set(upgradeId, playerUpgrade)
    }

    // Apply the upgrade if possible
    if (playerUpgrade.canUpgrade()) {
      playerUpgrade.apply(player)
      console.log(
        `Applied upgrade: ${playerUpgrade.name} (Level ${playerUpgrade.currentLevel})`
      )
      return true
    }

    console.warn(`Upgrade already at max level: ${upgradeId}`)
    return false
  }

  private createUpgradeInstance(upgradeId: string): BaseUpgrade | undefined {
    // Create a new instance based on upgrade ID
    switch (upgradeId) {
      // Offensive upgrades
      case "multi_shot":
        return new MultiShotUpgrade()
      case "piercing":
        return new PiercingUpgrade()
      case "seeking":
        return new SeekingUpgrade()
      case "word_blast":
        return new WordBlastUpgrade()
      case "chain_lightning":
        return new ChainLightningUpgrade()
      case "laser_beam":
        return new LaserBeamUpgrade()
      case "turret":
        return new TurretUpgrade()
      case "sentence_slam":
        return new SentenceSlamUpgrade()
      case "combo":
        return new ComboUpgrade()

      // Defensive upgrades
      case "health_boost":
        return new HealthBoostUpgrade()
      case "regeneration":
        return new RegenerationUpgrade()
      case "typing_shield":
        return new TypingShieldUpgrade()
      case "word_barrier":
        return new WordBarrierUpgrade()
      case "projectile_deflector":
        return new ProjectileDeflectorUpgrade()
      case "damage_reflection":
        return new DamageReflectionUpgrade()
      case "slowing_aura":
        return new SlowingAuraUpgrade()
      case "damage_aura":
        return new DamageAuraUpgrade()
      case "repulsion_field":
        return new RepulsionFieldUpgrade()
      case "time_dilation":
        return new TimeDilationUpgrade()
      case "rewind":
        return new RewindUpgrade()
      case "stasis_field":
        return new StasisFieldUpgrade()

      default:
        return undefined
    }
  }

  public getPlayerUpgrade(upgradeId: string): BaseUpgrade | undefined {
    return this.playerUpgrades.get(upgradeId)
  }

  public getPlayerUpgrades(): BaseUpgrade[] {
    return Array.from(this.playerUpgrades.values())
  }

  public hasUpgrade(upgradeId: string): boolean {
    return this.playerUpgrades.has(upgradeId)
  }

  public getUpgradeLevel(upgradeId: string): number {
    const upgrade = this.playerUpgrades.get(upgradeId)
    return upgrade ? upgrade.currentLevel : 0
  }

  // Reset for new game
  public reset(): void {
    this.playerUpgrades.clear()
  }

  // Get upgrade categories for balanced selection
  public generateBalancedUpgradeChoices(count: number = 3): BaseUpgrade[] {
    const choices = this.generateUpgradeChoices(count * 2) // Generate more than needed
    const balancedChoices: BaseUpgrade[] = []
    const usedCategories = new Set<string>()

    // Try to get different categories
    for (const upgrade of choices) {
      const category = (upgrade as any).category
      if (!usedCategories.has(category) && balancedChoices.length < count) {
        balancedChoices.push(upgrade)
        usedCategories.add(category)
      }
    }

    // Fill remaining slots if we don't have enough different categories
    if (balancedChoices.length < count) {
      for (const upgrade of choices) {
        if (balancedChoices.length >= count) break
        if (!balancedChoices.includes(upgrade)) {
          balancedChoices.push(upgrade)
        }
      }
    }

    return balancedChoices.slice(0, count)
  }
}
