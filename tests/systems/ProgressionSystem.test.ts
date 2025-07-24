import { describe, it, expect, beforeEach, vi } from "vitest"
import { ProgressionSystem } from "../../src/systems/ProgressionSystem"
import { Player } from "../../src/entities/Player"
import { GAME_CONSTANTS } from "../../src/config/GameConfig"

describe("ProgressionSystem", () => {
  let progressionSystem: ProgressionSystem
  let mockScene: any
  let mockPlayer: Player

  beforeEach(() => {
    mockScene = {
      events: {
        emit: vi.fn(),
      },
    }

    // Create mock player
    mockPlayer = {
      level: 1,
      levelUp: vi.fn(),
    } as any

    progressionSystem = new ProgressionSystem(mockScene, mockPlayer)
  })

  describe("Experience and Leveling Logic", () => {
    it("should calculate experience points for destroying enemies correctly", () => {
      const initialExperience = progressionSystem.experience
      const experienceAmount = 50

      progressionSystem.addExperience(experienceAmount)

      expect(progressionSystem.experience).toBe(
        initialExperience + experienceAmount
      )
    })

    it("should require experience for next level", () => {
      const initialExperience = progressionSystem.experienceToNext
      
      // Should start with a positive experience requirement
      expect(initialExperience).toBeGreaterThan(0)
      
      // After leveling up, should have a new requirement
      progressionSystem.addExperience(initialExperience)
      const level2Experience = progressionSystem.experienceToNext
      
      expect(level2Experience).toBeGreaterThan(0)
    })

    it("should level up when sufficient experience is gained", () => {
      const initialLevel = progressionSystem.level
      const experienceNeeded = progressionSystem.experienceToNext

      progressionSystem.addExperience(experienceNeeded)

      expect(progressionSystem.level).toBe(initialLevel + 1)
      expect(mockPlayer.level).toBe(initialLevel + 1)
      expect(mockPlayer.levelUp).toHaveBeenCalled()
      expect(mockScene.events.emit).toHaveBeenCalledWith(
        "levelUp",
        expect.any(Object)
      )
    })

    it("should generate exactly 3 random upgrade choices on level up", () => {
      const experienceNeeded = progressionSystem.experienceToNext

      progressionSystem.addExperience(experienceNeeded)

      expect(progressionSystem.availableUpgrades).toHaveLength(3)
    })

    it("should handle multiple level ups from single experience gain", () => {
      const initialLevel = progressionSystem.level
      const massiveExperience = progressionSystem.experienceToNext * 3

      progressionSystem.addExperience(massiveExperience)

      expect(progressionSystem.level).toBeGreaterThan(initialLevel + 1)
    })

    it("should update player stats when upgrade applied", () => {
      // Force level up to get upgrades
      progressionSystem.addExperience(progressionSystem.experienceToNext)

      const upgrade = progressionSystem.availableUpgrades[0]

      progressionSystem.selectUpgrade(upgrade)

      expect(progressionSystem.availableUpgrades).toHaveLength(0)
      expect(mockScene.events.emit).toHaveBeenCalledWith(
        "upgradeSelected",
        upgrade
      )
    })
  })

  describe("Experience Calculation Edge Cases", () => {
    it("should start with positive experience requirement", () => {
      expect(progressionSystem.experienceToNext).toBeGreaterThan(0)
    })

    it("should handle fractional experience correctly", () => {
      progressionSystem.addExperience(10.5)
      expect(progressionSystem.experience).toBe(10.5)

      progressionSystem.addExperience(5.7)
      expect(progressionSystem.experience).toBe(16.2)
    })

    it("should maintain experience overflow after level up", () => {
      const neededForLevelUp = progressionSystem.experienceToNext
      const overflow = 25

      progressionSystem.addExperience(neededForLevelUp + overflow)

      expect(progressionSystem.experience).toBe(overflow)
    })
  })

  describe("Upgrade System Logic", () => {
    beforeEach(() => {
      // Force level up to get upgrades
      progressionSystem.addExperience(progressionSystem.experienceToNext)
    })

    it("should not allow selection of unavailable upgrades", () => {
      const fakeUpgrade = { id: "fake", name: "Fake Upgrade" } as any

      progressionSystem.selectUpgrade(fakeUpgrade)

      // Should not emit upgrade selected event
      expect(mockScene.events.emit).not.toHaveBeenCalledWith(
        "upgradeSelected",
        fakeUpgrade
      )
    })

    it("should clear available upgrades after selection", () => {
      const upgrade = progressionSystem.availableUpgrades[0]

      progressionSystem.selectUpgrade(upgrade)

      expect(progressionSystem.availableUpgrades).toHaveLength(0)
    })

    it("should offer upgrades from different categories when possible", () => {
      // This test checks that the upgrade manager is working
      // Actual category distribution is handled by UpgradeManager
      expect(progressionSystem.availableUpgrades).toHaveLength(3)

      // All upgrades should have unique IDs
      const upgradeIds = progressionSystem.availableUpgrades.map((u) => u.id)
      const uniqueIds = new Set(upgradeIds)
      expect(uniqueIds.size).toBe(upgradeIds.length)
    })
  })

  describe("Progress Tracking", () => {
    it("should calculate experience progress percentage correctly", () => {
      const progress = progressionSystem.getExperienceProgress()
      expect(progress).toBe(0) // No experience gained yet

      const halfExperience = progressionSystem.experienceToNext / 2
      progressionSystem.addExperience(halfExperience)

      const newProgress = progressionSystem.getExperienceProgress()
      expect(newProgress).toBeCloseTo(0.5, 1)
    })

    it("should provide correct experience display data", () => {
      const displayData = progressionSystem.getExperienceForDisplay()

      expect(displayData.current).toBe(progressionSystem.experience)
      expect(displayData.required).toBe(progressionSystem.experienceToNext)
      expect(displayData.percentage).toBe(
        progressionSystem.getExperienceProgress()
      )
    })

    it("should calculate total experience correctly", () => {
      const initialTotal = progressionSystem.getTotalExperience()
      expect(initialTotal).toBe(0) // Level 1 start

      progressionSystem.addExperience(50)
      const newTotal = progressionSystem.getTotalExperience()
      expect(newTotal).toBe(50)

      // Level up and check total includes previous level requirements
      progressionSystem.addExperience(progressionSystem.experienceToNext)
      const afterLevelUpTotal = progressionSystem.getTotalExperience()
      expect(afterLevelUpTotal).toBeGreaterThan(newTotal)
    })
  })

  describe("System Reset", () => {
    it("should reset all progression state correctly", () => {
      // Make some progress
      progressionSystem.addExperience(progressionSystem.experienceToNext) // Level up

      expect(progressionSystem.level).toBeGreaterThan(1)
      expect(progressionSystem.availableUpgrades.length).toBeGreaterThan(0)

      progressionSystem.reset()

      expect(progressionSystem.level).toBe(1)
      expect(progressionSystem.experience).toBe(0)
      expect(progressionSystem.availableUpgrades).toHaveLength(0)
      expect(mockPlayer.level).toBe(1)
      expect(progressionSystem.experienceToNext).toBe(
        GAME_CONSTANTS.EXPERIENCE_BASE
      )
    })
  })

  describe("Event Emission", () => {
    it("should emit level up event when player levels up", () => {
      const experienceNeeded = progressionSystem.experienceToNext

      progressionSystem.addExperience(experienceNeeded)

      expect(mockScene.events.emit).toHaveBeenCalledWith("playerLevelUp", 2, 1)
      expect(mockScene.events.emit).toHaveBeenCalledWith("levelUp", {
        newLevel: 2,
        availableUpgrades: expect.any(Array),
      })
    })

    it("should not emit level up events when no level change occurs", () => {
      progressionSystem.addExperience(10) // Not enough to level up

      expect(mockScene.events.emit).not.toHaveBeenCalledWith(
        "playerLevelUp",
        expect.any(Number),
        expect.any(Number)
      )
      expect(mockScene.events.emit).not.toHaveBeenCalledWith(
        "levelUp",
        expect.any(Object)
      )
    })
  })
})
