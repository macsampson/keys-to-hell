export interface BalanceConfig {
  // Enemy settings
  enemy: {
    baseHealth: number
    healthScaling: number
    baseDamage: number
    damageScaling: number
    baseSpeed: number
    speedScaling: number
    spawnRate: {
      base: number
      decrease: number
      minimum: number
    }
    maxEnemies: {
      base: number
      increase: number
      maximum: number
    }
  }

  // Player settings
  player: {
    baseHealth: number
    baseAttackPower: number
    baseAttackSpeed: number
    baseTypingSpeed: number
    baseAttackMultiplier: number
  }

  // Experience and progression
  experience: {
    baseRequired: number
    multiplier: number
    enemyKillBase: number
    enemyKillScaling: number
  }

  // Upgrade settings
  upgrades: {
    attackPowerBase: number
    attackPowerScaling: number
    healthBoostBase: number
    healthBoostScaling: number
    typingSpeedBonus: number
    multiHitBonus: number
  }

  // Difficulty scaling
  difficulty: {
    levelThresholds: number[]
    enemyVariety: number[]
    specialEnemyChance: number[]
  }
}

export class GameBalanceManager {
  private config: BalanceConfig
  private currentLevel: number = 1
  private playtestData: {
    survivalTimes: number[]
    killCounts: number[]
    accuracyRates: number[]
    difficultyFeedback: number[]
  }

  constructor() {
    this.config = this.getDefaultBalance()
    this.playtestData = {
      survivalTimes: [],
      killCounts: [],
      accuracyRates: [],
      difficultyFeedback: [],
    }

    this.loadBalanceConfig()
  }

  private getDefaultBalance(): BalanceConfig {
    return {
      enemy: {
        baseHealth: 30,
        healthScaling: 5, // +5 health per level
        baseDamage: 10,
        damageScaling: 2, // +2 damage per level
        baseSpeed: 80,
        speedScaling: 3, // +3 speed per level
        spawnRate: {
          base: 5000, // 5 seconds
          decrease: 50, // -50ms per level
          minimum: 1000, // 1 second minimum
        },
        maxEnemies: {
          base: 5,
          increase: 1, // +1 max enemy every 2 levels
          maximum: 20,
        },
      },

      player: {
        baseHealth: 100,
        baseAttackPower: 25,
        baseAttackSpeed: 1.0,
        baseTypingSpeed: 1.0,
        baseAttackMultiplier: 1,
      },

      experience: {
        baseRequired: 50,
        multiplier: 1.5,
        enemyKillBase: 10,
        enemyKillScaling: 2, // +2 XP per level for enemy kills
      },

      upgrades: {
        attackPowerBase: 5,
        attackPowerScaling: 2, // Base + (level * scaling)
        healthBoostBase: 25,
        healthBoostScaling: 5,
        typingSpeedBonus: 0.2,
        multiHitBonus: 1,
      },

      difficulty: {
        levelThresholds: [1, 5, 10, 15, 20, 30],
        enemyVariety: [1, 2, 3, 4, 5, 6], // Number of enemy types
        specialEnemyChance: [0, 0.1, 0.2, 0.3, 0.4, 0.5], // Chance of special enemies
      },
    }
  }

  public getEnemyStats(
    level: number,
    enemyType: string = "basic"
  ): {
    health: number
    damage: number
    speed: number
    experienceValue: number
  } {
    const baseHealth = this.config.enemy.baseHealth
    const baseDamage = this.config.enemy.baseDamage
    const baseSpeed = this.config.enemy.baseSpeed

    // Calculate scaled stats
    let health = baseHealth + level * this.config.enemy.healthScaling
    let damage = baseDamage + level * this.config.enemy.damageScaling
    let speed = baseSpeed + level * this.config.enemy.speedScaling

    // Apply enemy type multipliers
    switch (enemyType) {
      case "fast":
        health *= 0.7
        speed *= 1.5
        damage *= 0.8
        break
      case "tank":
        health *= 2.0
        speed *= 0.6
        damage *= 1.5
        break
      case "elite":
        health *= 1.5
        speed *= 1.2
        damage *= 1.3
        break
      case "basic":
      default:
        // No modifications
        break
    }

    // Calculate experience value based on difficulty
    const experienceValue = Math.floor(
      this.config.experience.enemyKillBase +
        level *
          this.config.experience.enemyKillScaling *
          this.getEnemyDifficultyMultiplier(enemyType)
    )

    return {
      health: Math.round(health),
      damage: Math.round(damage),
      speed: Math.round(speed),
      experienceValue,
    }
  }

  private getEnemyDifficultyMultiplier(enemyType: string): number {
    switch (enemyType) {
      case "fast":
        return 1.2
      case "tank":
        return 1.8
      case "elite":
        return 2.0
      case "basic":
      default:
        return 1.0
    }
  }

  public getSpawnSettings(level: number): {
    spawnRate: number
    maxEnemies: number
    enemyTypes: string[]
  } {
    const spawnRate = Math.max(
      this.config.enemy.spawnRate.minimum,
      this.config.enemy.spawnRate.base -
        level * this.config.enemy.spawnRate.decrease
    )

    const maxEnemies = Math.min(
      this.config.enemy.maxEnemies.maximum,
      this.config.enemy.maxEnemies.base + Math.floor(level / 2)
    )

    // Determine available enemy types based on level
    const enemyTypes = ["basic"]
    if (level >= 3) enemyTypes.push("fast")
    // schoolgirl is now the player, removed from enemy types
    if (level >= 8) enemyTypes.push("yokai")
    if (level >= 10) enemyTypes.push("gorgon")
    if (level >= 12) enemyTypes.push("werewolf")
    if (level >= 15) enemyTypes.push("minotaur")

    return {
      spawnRate,
      maxEnemies,
      enemyTypes,
    }
  }

  public getUpgradeValue(upgradeType: string, playerLevel: number): number {
    switch (upgradeType) {
      case "attack_power":
        return (
          this.config.upgrades.attackPowerBase +
          playerLevel * this.config.upgrades.attackPowerScaling
        )

      case "health":
        return (
          this.config.upgrades.healthBoostBase +
          playerLevel * this.config.upgrades.healthBoostScaling
        )

      case "typing_speed":
        return this.config.upgrades.typingSpeedBonus

      case "multi_hit":
        return this.config.upgrades.multiHitBonus

      case "attack_speed":
        return 2 + Math.floor(playerLevel / 3) // Small damage boost for now

      default:
        return 0
    }
  }

  public getExperienceRequired(level: number): number {
    return Math.floor(
      this.config.experience.baseRequired *
        Math.pow(this.config.experience.multiplier, level - 1)
    )
  }

  public getDifficultyTier(level: number): number {
    const thresholds = this.config.difficulty.levelThresholds
    let tier = 0

    for (let i = 0; i < thresholds.length; i++) {
      if (level >= thresholds[i]) {
        tier = i
      } else {
        break
      }
    }

    return tier
  }

  public shouldSpawnSpecialEnemy(level: number): boolean {
    const tier = this.getDifficultyTier(level)
    const chance = this.config.difficulty.specialEnemyChance[tier] || 0
    return Math.random() < chance
  }

  // Adaptive balancing based on player performance
  public adjustBalance(playerStats: {
    survivalTime: number
    killCount: number
    accuracy: number
    level: number
    deathCause: string
  }): void {
    // Record playtest data
    this.playtestData.survivalTimes.push(playerStats.survivalTime)
    this.playtestData.killCounts.push(playerStats.killCount)
    this.playtestData.accuracyRates.push(playerStats.accuracy)

    // Analyze and adjust if needed
    this.analyzePerformance()
  }

  private analyzePerformance(): void {
    if (this.playtestData.survivalTimes.length < 5) return // Need minimum data

    const avgSurvival =
      this.playtestData.survivalTimes.reduce((a, b) => a + b, 0) /
      this.playtestData.survivalTimes.length

    const avgKills =
      this.playtestData.killCounts.reduce((a, b) => a + b, 0) /
      this.playtestData.killCounts.length

    const avgAccuracy =
      this.playtestData.accuracyRates.reduce((a, b) => a + b, 0) /
      this.playtestData.accuracyRates.length

    // Target metrics (what we want players to achieve on average)
    const targetSurvival = 120000 // 2 minutes
    const targetKills = 20
    const targetAccuracy = 85

    // Adjust if performance is consistently too high or low
    if (avgSurvival > targetSurvival * 1.5) {
      // Game is too easy - increase difficulty
      this.config.enemy.healthScaling += 1
      this.config.enemy.spawnRate.decrease += 10
      console.log(
        "Balance: Increased enemy difficulty due to high survival times"
      )
    } else if (avgSurvival < targetSurvival * 0.5) {
      // Game is too hard - decrease difficulty
      this.config.enemy.healthScaling = Math.max(
        1,
        this.config.enemy.healthScaling - 1
      )
      this.config.enemy.spawnRate.decrease -= 5
      console.log(
        "Balance: Decreased enemy difficulty due to low survival times"
      )
    }

    if (avgAccuracy < targetAccuracy * 0.8) {
      // Players struggling with typing - adjust text difficulty
      console.log("Balance: Consider reducing text difficulty")
    }

    this.saveBalanceConfig()
  }

  public getRecommendedSettings(playerLevel: number): {
    enemyCount: number
    spawnDelay: number
    textDifficulty: string
    upgradeAvailability: string[]
  } {
    const spawnSettings = this.getSpawnSettings(playerLevel)
    const tier = this.getDifficultyTier(playerLevel)

    let textDifficulty = "easy"
    if (playerLevel >= 5) textDifficulty = "medium"
    if (playerLevel >= 10) textDifficulty = "hard"
    if (playerLevel >= 15) textDifficulty = "expert"

    const upgradeAvailability = ["attack_power", "health"]
    if (playerLevel >= 3) upgradeAvailability.push("typing_speed")
    if (playerLevel >= 5) upgradeAvailability.push("multi_hit")
    if (playerLevel >= 7) upgradeAvailability.push("attack_speed")

    return {
      enemyCount: spawnSettings.maxEnemies,
      spawnDelay: spawnSettings.spawnRate,
      textDifficulty,
      upgradeAvailability,
    }
  }

  // Balance presets for different play styles
  public applyBalancePreset(preset: "casual" | "normal" | "hardcore"): void {
    switch (preset) {
      case "casual":
        this.config.enemy.healthScaling *= 0.7
        this.config.enemy.damageScaling *= 0.8
        this.config.enemy.spawnRate.base *= 1.5
        this.config.experience.multiplier *= 0.8
        break

      case "hardcore":
        this.config.enemy.healthScaling *= 1.5
        this.config.enemy.damageScaling *= 1.3
        this.config.enemy.spawnRate.base *= 0.7
        this.config.experience.multiplier *= 1.3
        break

      case "normal":
      default:
        // Use default config
        this.config = this.getDefaultBalance()
        break
    }

    console.log(`Applied ${preset} balance preset`)
  }

  public validateBalance(): {
    isValid: boolean
    warnings: string[]
    suggestions: string[]
  } {
    const warnings: string[] = []
    const suggestions: string[] = []

    // Check for potential balance issues
    if (this.config.enemy.healthScaling > 10) {
      warnings.push("Enemy health scaling may be too high")
      suggestions.push(
        "Consider reducing health scaling to prevent bullet-sponge enemies"
      )
    }

    if (this.config.enemy.spawnRate.minimum < 300) {
      warnings.push("Minimum spawn rate may be too fast")
      suggestions.push(
        "Increase minimum spawn rate to prevent overwhelming players"
      )
    }

    if (this.config.experience.multiplier > 2.0) {
      warnings.push("Experience multiplier may cause exponential growth")
      suggestions.push(
        "Consider capping experience requirements at higher levels"
      )
    }

    const isValid = warnings.length === 0

    return {
      isValid,
      warnings,
      suggestions,
    }
  }

  public exportBalance(): string {
    return JSON.stringify(this.config, null, 2)
  }

  public importBalance(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson)
      this.config = { ...this.config, ...imported }
      this.saveBalanceConfig()
      console.log("Balance configuration imported successfully")
      return true
    } catch (error) {
      console.error("Failed to import balance configuration:", error)
      return false
    }
  }

  private saveBalanceConfig(): void {
    try {
      localStorage.setItem("typing_hell_balance", JSON.stringify(this.config))
    } catch (error) {
      console.warn("Failed to save balance config:", error)
    }
  }

  private loadBalanceConfig(): void {
    try {
      const saved = localStorage.getItem("typing_hell_balance")
      if (saved) {
        const loaded = JSON.parse(saved)
        this.config = { ...this.config, ...loaded }
      }
    } catch (error) {
      console.warn("Failed to load balance config:", error)
    }
  }

  public getBalanceConfig(): BalanceConfig {
    return { ...this.config }
  }

  public resetToDefault(): void {
    this.config = this.getDefaultBalance()
    this.saveBalanceConfig()
    console.log("Balance reset to default configuration")
  }

  public getBalanceReport(): {
    config: BalanceConfig
    playtestData: {
      survivalTimes: number[]
      killCounts: number[]
      accuracyRates: number[]
      difficultyFeedback: number[]
    }
    recommendations: string[]
  } {
    const recommendations: string[] = []

    if (this.playtestData.survivalTimes.length > 0) {
      const avgSurvival =
        this.playtestData.survivalTimes.reduce((a, b) => a + b, 0) /
        this.playtestData.survivalTimes.length

      if (avgSurvival > 180000) {
        // 3 minutes
        recommendations.push("Consider increasing enemy spawn rate or damage")
      } else if (avgSurvival < 60000) {
        // 1 minute
        recommendations.push(
          "Consider decreasing enemy difficulty or spawn rate"
        )
      }
    }

    return {
      config: this.config,
      playtestData: { ...this.playtestData },
      recommendations,
    }
  }
}
