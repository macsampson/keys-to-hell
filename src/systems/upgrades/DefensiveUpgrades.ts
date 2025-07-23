import { Player } from "../../entities/Player"
import { 
  HealthUpgrade, 
  ShieldUpgrade, 
  DeflectionUpgrade, 
  AuraUpgrade, 
  TemporalUpgrade, 
  UpgradeRarity 
} from "./BaseUpgrade"

// HEALTH UPGRADES
export class HealthBoostUpgrade extends HealthUpgrade {
  id = 'health_boost'
  name = 'Health Boost'
  description = 'Increases maximum health'
  rarity = UpgradeRarity.COMMON
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    const healthIncrease = 20
    player.maxHealth += healthIncrease
    player.health = Math.min(player.health + healthIncrease, player.maxHealth)
  }

  getDescription(level: number): string {
    const total = (level + 1) * 20
    return `+${total} max health and restore ${total} health`
  }
}

export class RegenerationUpgrade extends HealthUpgrade {
  id = 'regeneration'
  name = 'Regeneration'
  description = 'Heal over time'
  rarity = UpgradeRarity.RARE
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    player.hasRegeneration = true
    player.regenRate += 2
  }

  getDescription(level: number): string {
    const rate = (level + 1) * 2
    return `Regenerate ${rate} health per second`
  }
}

// SHIELD UPGRADES
export class TypingShieldUpgrade extends ShieldUpgrade {
  id = 'typing_shield'
  name = 'Typing Shield'
  description = 'Generate shields while typing'
  rarity = UpgradeRarity.COMMON
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    player.hasTypingShield = true
    player.shieldPerWord += 5
    player.maxShield += 30
  }

  getDescription(level: number): string {
    const perWord = (level + 1) * 5
    const maxShield = (level + 1) * 30
    return `Gain ${perWord} shield per word (max ${maxShield})`
  }
}

export class WordBarrierUpgrade extends ShieldUpgrade {
  id = 'word_barrier'
  name = 'Word Barrier'
  description = 'Perfect words create damage-absorbing barriers'
  rarity = UpgradeRarity.RARE
  maxLevel = 4

  apply(player: Player): void {
    this.upgrade()
    player.hasWordBarrier = true
    player.barrierStrength += 25
  }

  getDescription(level: number): string {
    const strength = (level + 1) * 25
    return `Perfect words create ${strength} HP barriers`
  }
}

// DEFLECTION UPGRADES
export class ProjectileDeflectorUpgrade extends DeflectionUpgrade {
  id = 'projectile_deflector'
  name = 'Projectile Deflector'
  description = 'Deflect enemy projectiles when typing correctly'
  rarity = UpgradeRarity.RARE
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    player.hasProjectileDeflection = true
    player.deflectionChance += 0.15
  }

  getDescription(level: number): string {
    const chance = Math.round((level + 1) * 0.15 * 100)
    return `${chance}% chance to deflect projectiles while typing`
  }
}

export class DamageReflectionUpgrade extends DeflectionUpgrade {
  id = 'damage_reflection'
  name = 'Damage Reflection'
  description = 'Reflect damage back to attackers'
  rarity = UpgradeRarity.EPIC
  maxLevel = 4

  apply(player: Player): void {
    this.upgrade()
    player.hasDamageReflection = true
    player.reflectionDamage += 0.2
  }

  getDescription(level: number): string {
    const percent = Math.round((level + 1) * 0.2 * 100)
    return `Reflect ${percent}% of damage back to attackers`
  }
}

// AURA UPGRADES
export class SlowingAuraUpgrade extends AuraUpgrade {
  id = 'slowing_aura'
  name = 'Slowing Aura'
  description = 'Slow enemies within range'
  rarity = UpgradeRarity.COMMON
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    player.hasSlowingAura = true
    player.slowAuraRadius += 30
    player.slowStrength += 0.1
  }

  getDescription(level: number): string {
    const radius = (level + 1) * 30
    const slow = Math.round((level + 1) * 0.1 * 100)
    return `Slow enemies by ${slow}% within ${radius}px`
  }
}

export class DamageAuraUpgrade extends AuraUpgrade {
  id = 'damage_aura'
  name = 'Damage Aura'
  description = 'Damage enemies that get too close'
  rarity = UpgradeRarity.RARE
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    player.hasDamageAura = true
    player.auraRadius += 25
    player.auraDamagePerSecond += 10
  }

  getDescription(level: number): string {
    const radius = (level + 1) * 25
    const dps = (level + 1) * 10
    return `Deal ${dps} DPS to enemies within ${radius}px`
  }
}

export class RepulsionFieldUpgrade extends AuraUpgrade {
  id = 'repulsion_field'
  name = 'Repulsion Field'
  description = 'Push enemies away from player'
  rarity = UpgradeRarity.EPIC
  maxLevel = 4

  apply(player: Player): void {
    this.upgrade()
    player.hasRepulsionField = true
    player.repulsionRadius += 40
    player.repulsionStrength += 20
  }

  getDescription(level: number): string {
    const radius = (level + 1) * 40
    const strength = (level + 1) * 20
    return `Push enemies away with ${strength} force within ${radius}px`
  }
}

// TEMPORAL UPGRADES
export class TimeDilationUpgrade extends TemporalUpgrade {
  id = 'time_dilation'
  name = 'Time Dilation'
  description = 'Slow time when health is low'
  rarity = UpgradeRarity.EPIC
  maxLevel = 3

  apply(player: Player): void {
    this.upgrade()
    player.hasTimeDilation = true
    player.dilationStrength += 0.1
    player.dilationDuration += 500
  }

  getDescription(level: number): string {
    const slow = Math.round((level + 1) * 0.1 * 100)
    const duration = (level + 1) * 500
    return `${slow}% time slow for ${duration}ms when health < 30%`
  }
}

export class RewindUpgrade extends TemporalUpgrade {
  id = 'rewind'
  name = 'Rewind'
  description = 'Restore health when taking fatal damage'
  rarity = UpgradeRarity.LEGENDARY
  maxLevel = 2

  apply(player: Player): void {
    this.upgrade()
    player.hasRewind = true
    player.rewindCharges += 1
    player.rewindHealAmount += 25
  }

  getDescription(level: number): string {
    const charges = level + 1
    const heal = (level + 1) * 25
    return `${charges} charge${charges > 1 ? 's' : ''}: avoid death and heal ${heal} HP`
  }
}

export class StasisFieldUpgrade extends TemporalUpgrade {
  id = 'stasis_field'
  name = 'Stasis Field'
  description = 'Freeze enemies when completing sentences'
  rarity = UpgradeRarity.RARE
  maxLevel = 4

  apply(player: Player): void {
    this.upgrade()
    player.hasStasisField = true
    player.stasisDuration += 1000
    player.stasisRadius += 50
  }

  getDescription(level: number): string {
    const duration = (level + 1) * 1000
    const radius = (level + 1) * 50
    return `Freeze enemies for ${duration}ms within ${radius}px on sentence completion`
  }
}