import { Player } from "../../entities/Player"
import { 
  ProjectileUpgrade, 
  AOEUpgrade, 
  SpecialWeaponUpgrade, 
  SentenceUpgrade, 
  UpgradeRarity 
} from "./BaseUpgrade"

// PROJECTILE UPGRADES
export class MultiShotUpgrade extends ProjectileUpgrade {
  id = 'multi_shot'
  name = 'Multi-Shot'
  description = 'Fire additional projectiles per word'
  rarity = UpgradeRarity.COMMON
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    player.projectileCount += 1
  }

  getDescription(level: number): string {
    return `Fire ${level + 1} additional projectile${level > 0 ? 's' : ''} per word`
  }
}

export class PiercingUpgrade extends ProjectileUpgrade {
  id = 'piercing'
  name = 'Piercing Shots'
  description = 'Projectiles pass through multiple enemies'
  rarity = UpgradeRarity.RARE
  maxLevel = 3

  apply(player: Player): void {
    this.upgrade()
    player.piercingCount += 1
  }

  getDescription(level: number): string {
    return `Projectiles pierce through ${level + 1} additional enem${level > 0 ? 'ies' : 'y'}`
  }
}

export class SeekingUpgrade extends ProjectileUpgrade {
  id = 'seeking'
  name = 'Seeking Missiles'
  description = 'Projectiles home in on enemies'
  rarity = UpgradeRarity.EPIC
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    player.hasSeekingProjectiles = true
    player.seekingStrength += 0.2
  }

  getDescription(level: number): string {
    const strength = Math.round((level + 1) * 0.2 * 100)
    return `Projectiles seek enemies with ${strength}% tracking strength`
  }
}

// AOE UPGRADES
export class WordBlastUpgrade extends AOEUpgrade {
  id = 'word_blast'
  name = 'Word Blast'
  description = 'Completed words create explosions'
  rarity = UpgradeRarity.RARE
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    player.hasWordBlast = true
    player.blastRadius += 50
    player.blastDamage += 20
  }

  getDescription(level: number): string {
    const radius = (level + 1) * 50
    const damage = (level + 1) * 20
    return `Explosions with ${radius}px radius dealing ${damage} damage`
  }
}

export class ChainLightningUpgrade extends AOEUpgrade {
  id = 'chain_lightning'
  name = 'Chain Lightning'
  description = 'Attacks jump between nearby enemies'
  rarity = UpgradeRarity.EPIC
  maxLevel = 4

  apply(player: Player): void {
    this.upgrade()
    player.hasChainLightning = true
    player.chainJumps += 1
    player.chainRange += 30
  }

  getDescription(level: number): string {
    const jumps = level + 1
    const range = (level + 1) * 30
    return `Lightning jumps to ${jumps} additional enemies within ${range}px`
  }
}

// SPECIAL WEAPON UPGRADES
export class LaserBeamUpgrade extends SpecialWeaponUpgrade {
  id = 'laser_beam'
  name = 'Laser Beam'
  description = 'Hold space to charge continuous laser'
  rarity = UpgradeRarity.LEGENDARY
  maxLevel = 3

  apply(player: Player): void {
    this.upgrade()
    player.hasLaserBeam = true
    player.laserDamagePerSecond += 15
    player.laserWidth += 5
  }

  getDescription(level: number): string {
    const dps = (level + 1) * 15
    const width = (level + 1) * 5
    return `Laser deals ${dps} DPS with ${width}px width`
  }
}

export class TurretUpgrade extends SpecialWeaponUpgrade {
  id = 'turret'
  name = 'Typing Turrets'
  description = 'Autonomous turrets that fire based on typing speed'
  rarity = UpgradeRarity.EPIC
  maxLevel = 4

  apply(player: Player): void {
    this.upgrade()
    player.turretCount += 1
    player.turretDamage += 10
  }

  getDescription(level: number): string {
    const count = level + 1
    const damage = (level + 1) * 10
    return `${count} turret${count > 1 ? 's' : ''} dealing ${damage} damage each`
  }
}

// SENTENCE UPGRADES
export class SentenceSlamUpgrade extends SentenceUpgrade {
  id = 'sentence_slam'
  name = 'Sentence Slam'
  description = 'Completing sentences creates massive attacks'
  rarity = UpgradeRarity.RARE
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    player.hasSentenceSlam = true
    player.sentenceDamageMultiplier += 2
  }

  getDescription(level: number): string {
    const multiplier = (level + 1) * 2
    return `Sentence completion deals ${multiplier}x damage`
  }
}

export class ComboUpgrade extends SentenceUpgrade {
  id = 'combo'
  name = 'Word Combos'
  description = 'Consecutive correct words increase damage'
  rarity = UpgradeRarity.COMMON
  maxLevel = 5

  apply(player: Player): void {
    this.upgrade()
    player.hasComboSystem = true
    player.maxComboMultiplier += 0.5
  }

  getDescription(level: number): string {
    const multiplier = (level + 1) * 0.5
    return `Max combo multiplier: ${multiplier.toFixed(1)}x`
  }
}