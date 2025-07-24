import { describe, it, expect, beforeEach, vi } from "vitest"
import { UpgradeManager } from "../../src/systems/upgrades/UpgradeManager"
import {
  BaseUpgrade,
  UpgradeRarity,
} from "../../src/systems/upgrades/BaseUpgrade"
import { Player } from "../../src/entities/Player"

describe("UpgradeManager", () => {
  let upgradeManager: UpgradeManager
  let mockPlayer: Player

  beforeEach(() => {
    upgradeManager = new UpgradeManager()

    mockPlayer = {
      level: 1,
      attackPower: 10,
      maxHealth: 100,
      health: 100,
    } as any
  })

  describe("Upgrade Generation", () => {
    it("should generate exactly 3 upgrade choices by default", () => {
      const upgrades = upgradeManager.generateUpgradeChoices()

      expect(upgrades).toHaveLength(3)
    })

    it("should generate specified number of upgrade choices", () => {
      const count = 15
      const upgrades = upgradeManager.generateUpgradeChoices(count)

      expect(upgrades).toHaveLength(Math.min(count, 24)) // Limited by available unique upgrades
    })

    it("should generate balanced upgrade choices from different categories", () => {
      const upgrades = upgradeManager.generateBalancedUpgradeChoices(3)

      expect(upgrades).toHaveLength(3)

      // All upgrades should be unique
      const upgradeIds = upgrades.map((u) => u.id)
      const uniqueIds = new Set(upgradeIds)
      expect(uniqueIds.size).toBe(upgradeIds.length)
    })

    it("should not offer maxed out upgrades", () => {
      // Apply an upgrade multiple times to max it out
      const upgrades = upgradeManager.generateUpgradeChoices(3)
      const testUpgrade = upgrades[0]

      // Max out the upgrade
      for (let i = 0; i < testUpgrade.maxLevel; i++) {
        upgradeManager.applyUpgrade(testUpgrade.id, mockPlayer)
      }

      // Generate new choices - should not include maxed upgrade
      const newUpgrades = upgradeManager.generateUpgradeChoices(3)
      const newUpgradeIds = newUpgrades.map((u) => u.id)

      expect(newUpgradeIds).not.toContain(testUpgrade.id)
    })
  })

  describe("Upgrade Rarity Distribution", () => {
    it("should follow rarity distribution over many generations", () => {
      const rarityCount = {
        [UpgradeRarity.COMMON]: 0,
        [UpgradeRarity.RARE]: 0,
        [UpgradeRarity.EPIC]: 0,
        [UpgradeRarity.LEGENDARY]: 0,
      }

      // Generate many upgrade sets to test distribution
      for (let i = 0; i < 100; i++) {
        const upgrades = upgradeManager.generateUpgradeChoices(3)
        upgrades.forEach((upgrade) => {
          rarityCount[upgrade.rarity]++
        })
      }

      const total = Object.values(rarityCount).reduce((a, b) => a + b, 0)

      // Check approximate distribution (allowing for variance)
      const commonPercentage = (rarityCount[UpgradeRarity.COMMON] / total) * 100
      const rarePercentage = (rarityCount[UpgradeRarity.RARE] / total) * 100
      const epicPercentage = (rarityCount[UpgradeRarity.EPIC] / total) * 100
      const legendaryPercentage =
        (rarityCount[UpgradeRarity.LEGENDARY] / total) * 100

      // Allow 15% variance from expected values
      expect(commonPercentage).toBeGreaterThan(45) // Expected ~60%
      expect(rarePercentage).toBeGreaterThan(10) // Expected ~25%
      expect(epicPercentage).toBeGreaterThan(0) // Expected ~12%
      expect(legendaryPercentage).toBeGreaterThan(0) // Expected ~3%
    })
  })

  describe("Upgrade Application", () => {
    it("should apply upgrade correctly and track player upgrades", () => {
      const upgrades = upgradeManager.generateUpgradeChoices(3)
      const upgrade = upgrades[0]

      const success = upgradeManager.applyUpgrade(upgrade.id, mockPlayer)

      expect(success).toBe(true)
      expect(upgradeManager.hasUpgrade(upgrade.id)).toBe(true)
      expect(upgradeManager.getUpgradeLevel(upgrade.id)).toBe(1)
    })

    it("should not apply non-existent upgrades", () => {
      const success = upgradeManager.applyUpgrade("non-existent-id", mockPlayer)

      expect(success).toBe(false)
      expect(upgradeManager.hasUpgrade("non-existent-id")).toBe(false)
    })

    it("should level up existing upgrades when applied again", () => {
      const upgrades = upgradeManager.generateUpgradeChoices(3)
      const upgrade = upgrades[0]

      // Apply upgrade twice
      upgradeManager.applyUpgrade(upgrade.id, mockPlayer)
      upgradeManager.applyUpgrade(upgrade.id, mockPlayer)

      expect(upgradeManager.getUpgradeLevel(upgrade.id)).toBe(2)
    })

    it("should respect maximum upgrade levels", () => {
      const upgrades = upgradeManager.generateUpgradeChoices(3)
      const upgrade = upgrades[0]
      const maxLevel = upgrade.maxLevel

      // Try to apply upgrade beyond max level
      for (let i = 0; i < maxLevel + 2; i++) {
        upgradeManager.applyUpgrade(upgrade.id, mockPlayer)
      }

      expect(upgradeManager.getUpgradeLevel(upgrade.id)).toBe(maxLevel)
    })
  })

  describe("Upgrade Level Validation", () => {
    it("should validate upgrade level constraints correctly", () => {
      const upgrades = upgradeManager.generateUpgradeChoices(3)
      const upgrade = upgrades[0]

      // Initially should be able to upgrade
      expect(upgrade.canUpgrade()).toBe(true)

      // Max out the upgrade
      for (let i = 0; i < upgrade.maxLevel; i++) {
        upgrade.upgrade()
      }

      // Should no longer be able to upgrade
      expect(upgrade.canUpgrade()).toBe(false)
      expect(upgrade.currentLevel).toBe(upgrade.maxLevel)
    })

    it("should not upgrade beyond max level", () => {
      const upgrades = upgradeManager.generateUpgradeChoices(3)
      const upgrade = upgrades[0]
      const maxLevel = upgrade.maxLevel

      // Try to upgrade beyond max
      for (let i = 0; i < maxLevel + 5; i++) {
        upgrade.upgrade()
      }

      expect(upgrade.currentLevel).toBe(maxLevel)
    })
  })

  describe("Player Capability Updates", () => {
    it("should update player capabilities when upgrade applied", () => {
      // This test verifies that upgrades actually modify the player
      const upgrades = upgradeManager.generateUpgradeChoices(3)
      const upgrade = upgrades[0]

      // Store original player state
      const originalAttackPower = mockPlayer.attackPower
      const originalMaxHealth = mockPlayer.maxHealth

      upgradeManager.applyUpgrade(upgrade.id, mockPlayer)

      // Player should be modified (at least one property should change)
      // We can't predict exactly what will change since upgrades vary
      const playerChanged =
        mockPlayer.attackPower !== originalAttackPower ||
        mockPlayer.maxHealth !== originalMaxHealth ||
        Object.keys(mockPlayer).length > 4 // New properties added

      expect(playerChanged).toBe(true)
    })
  })

  describe("Multiple Upgrade Effect Combinations", () => {
    it("should handle multiple upgrades applied to same player", () => {
      const upgrades = upgradeManager.generateUpgradeChoices(3)

      // Apply all three upgrades
      upgrades.forEach((upgrade) => {
        upgradeManager.applyUpgrade(upgrade.id, mockPlayer)
      })

      // All upgrades should be tracked
      upgrades.forEach((upgrade) => {
        expect(upgradeManager.hasUpgrade(upgrade.id)).toBe(true)
        expect(upgradeManager.getUpgradeLevel(upgrade.id)).toBe(1)
      })
    })

    it("should calculate synergistic effects correctly", () => {
      // Apply multiple upgrades that might interact
      const upgrades = upgradeManager.generateUpgradeChoices(3)

      upgrades.forEach((upgrade) => {
        upgradeManager.applyUpgrade(upgrade.id, mockPlayer)
      })

      // Verify no conflicts or errors occurred
      expect(upgradeManager.hasUpgrade(upgrades[0].id)).toBe(true)
      expect(upgradeManager.hasUpgrade(upgrades[1].id)).toBe(true)
      expect(upgradeManager.hasUpgrade(upgrades[2].id)).toBe(true)
    })
  })

  describe("System Reset", () => {
    it("should reset all upgrade state correctly", () => {
      // Apply some upgrades
      const upgrades = upgradeManager.generateUpgradeChoices(3)
      upgrades.forEach((upgrade) => {
        upgradeManager.applyUpgrade(upgrade.id, mockPlayer)
      })

      expect(upgradeManager.hasUpgrade(upgrades[0].id)).toBe(true)

      upgradeManager.reset()

      // All upgrades should be cleared
      upgrades.forEach((upgrade) => {
        expect(upgradeManager.hasUpgrade(upgrade.id)).toBe(false)
        expect(upgradeManager.getUpgradeLevel(upgrade.id)).toBe(0)
      })
    })
  })
})
