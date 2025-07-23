import { Player } from "../../entities/Player"

export enum UpgradeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export abstract class BaseUpgrade {
  abstract id: string
  abstract name: string
  abstract description: string
  abstract rarity: UpgradeRarity
  abstract maxLevel: number
  currentLevel: number = 0
  
  abstract apply(player: Player): void
  abstract getDescription(level: number): string
  
  canUpgrade(): boolean {
    return this.currentLevel < this.maxLevel
  }
  
  upgrade(): void {
    if (this.canUpgrade()) {
      this.currentLevel++
    }
  }
  
  getRarityColor(): number {
    switch (this.rarity) {
      case UpgradeRarity.COMMON:
        return 0xffffff // White
      case UpgradeRarity.RARE:
        return 0x00ff00 // Green
      case UpgradeRarity.EPIC:
        return 0xff00ff // Purple
      case UpgradeRarity.LEGENDARY:
        return 0xffa500 // Orange
      default:
        return 0xffffff
    }
  }
}

// Offensive Upgrade Categories
export abstract class ProjectileUpgrade extends BaseUpgrade {
  category = 'projectile'
}

export abstract class AOEUpgrade extends BaseUpgrade {
  category = 'aoe'
}

export abstract class SpecialWeaponUpgrade extends BaseUpgrade {
  category = 'special_weapon'
}

export abstract class SentenceUpgrade extends BaseUpgrade {
  category = 'sentence'
}

// Defensive Upgrade Categories
export abstract class HealthUpgrade extends BaseUpgrade {
  category = 'health'
}

export abstract class ShieldUpgrade extends BaseUpgrade {
  category = 'shield'
}

export abstract class DeflectionUpgrade extends BaseUpgrade {
  category = 'deflection'
}

export abstract class AuraUpgrade extends BaseUpgrade {
  category = 'aura'
}

export abstract class TemporalUpgrade extends BaseUpgrade {
  category = 'temporal'
}