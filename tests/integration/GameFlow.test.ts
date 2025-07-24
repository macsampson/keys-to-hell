import { describe, it, expect, beforeEach, vi } from "vitest"
import { TypingSystem } from "../../src/systems/TypingSystem"
import { ProgressionSystem } from "../../src/systems/ProgressionSystem"
import { GameStateManager } from "../../src/systems/GameStateManager"
import { GameStateType } from "../../src/types/interfaces"

describe("Game Flow Integration", () => {
  let typingSystem: TypingSystem
  let progressionSystem: ProgressionSystem
  let gameStateManager: GameStateManager
  let mockScene: any
  let mockPlayer: any

  beforeEach(() => {
    // Create comprehensive mock scene
    mockScene = {
      add: {
        rectangle: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
        }),
        text: vi.fn().mockReturnValue({
          setVisible: vi.fn(),
          setText: vi.fn(),
          setTint: vi.fn(),
          setPosition: vi.fn(),
          setAlpha: vi.fn(),
          width: 100,
          height: 20,
          style: {},
          x: 0,
          y: 0,
          destroy: vi.fn(),
        }),
      },
      time: {
        now: 0,
        delayedCall: vi.fn(),
      },
      events: {
        on: vi.fn(),
        emit: vi.fn(),
      },
      tweens: {
        add: vi.fn(),
      },
      input: {
        keyboard: {
          on: vi.fn(),
        },
      },
    }

    mockPlayer = {
      level: 1,
      levelUp: vi.fn(),
      attackPower: 10,
      maxHealth: 100,
      health: 100,
    }

    typingSystem = new TypingSystem(mockScene)
    progressionSystem = new ProgressionSystem(mockScene, mockPlayer)
    gameStateManager = new GameStateManager(mockScene)
  })

  describe("System Communication Logic", () => {
    it("should coordinate typing system with attack system correctly", () => {
      // Start game
      gameStateManager.startGame()
      expect(gameStateManager.isGameActive()).toBe(true)

      // Type a complete word
      const word = "The"
      for (const char of word) {
        typingSystem.processInput(char)
      }
      typingSystem.processInput(" ") // Complete word

      // Verify word completion triggered
      expect(typingSystem.wordsCompleted).toBe(1)
      expect(mockScene.events.emit).toHaveBeenCalledWith("wordComplete", 1)
    })

    it("should integrate progression system with experience calculations", () => {
      const initialLevel = progressionSystem.level
      const experienceAmount = 1

      // Add experience
      progressionSystem.addExperience(experienceAmount)

      expect(progressionSystem.experience).toBe(experienceAmount)

      // Add enough experience to level up
      const moreExperience = progressionSystem.experienceToNext
      progressionSystem.addExperience(moreExperience)

      expect(progressionSystem.level).toBe(initialLevel + 1)
      expect(progressionSystem.availableUpgrades).toHaveLength(3)
    })

    it("should handle game state transitions during level up", () => {
      gameStateManager.startGame()

      // Simulate level up
      const experienceNeeded = progressionSystem.experienceToNext
      progressionSystem.addExperience(experienceNeeded)

      // Change to level up state
      gameStateManager.changeState(GameStateType.LEVEL_UP)

      expect(gameStateManager.isLevelingUp()).toBe(true)
      expect(gameStateManager.isGameActive()).toBe(false)

      // Resume game after upgrade selection
      gameStateManager.changeState(GameStateType.PLAYING)

      expect(gameStateManager.isGameActive()).toBe(true)
      expect(gameStateManager.isLevelingUp()).toBe(false)
    })
  })

  describe("End-to-End Logic Scenarios", () => {
    it("should handle complete gameplay loop from start to game over", () => {
      // Initial state
      expect(gameStateManager.currentState).toBe(GameStateType.MENU)
      expect(progressionSystem.level).toBe(1)
      expect(typingSystem.wordsCompleted).toBe(0)

      // Start game
      gameStateManager.startGame()
      expect(gameStateManager.isGameActive()).toBe(true)

      // Type some words
      for (let i = 0; i < 3; i++) {
        typingSystem.processInput("T")
        typingSystem.processInput("h")
        typingSystem.processInput("e")
        typingSystem.processInput(" ")
      }
      expect(typingSystem.wordsCompleted).toBe(3)

      // Add experience to level up
      progressionSystem.addExperience(progressionSystem.experienceToNext)
      expect(progressionSystem.level).toBe(2)

      // End game
      gameStateManager.endGame()
      expect(gameStateManager.currentState).toBe(GameStateType.GAME_OVER)
      expect(gameStateManager.isGameActive()).toBe(false)
    })

    it("should handle multi-level progression with increasing difficulty", () => {
      const startLevel = progressionSystem.level
      let currentLevel = startLevel

      // Level up multiple times
      for (let i = 0; i < 3; i++) {
        const experienceNeeded = progressionSystem.experienceToNext
        progressionSystem.addExperience(experienceNeeded)
        currentLevel++

        expect(progressionSystem.level).toBe(currentLevel)

        // Each level up should offer upgrades
        expect(progressionSystem.availableUpgrades).toHaveLength(3)

        // Select first upgrade
        const upgrade = progressionSystem.availableUpgrades[0]
        progressionSystem.selectUpgrade(upgrade)

        // Upgrades should be cleared after selection
        expect(progressionSystem.availableUpgrades).toHaveLength(0)
      }

      expect(progressionSystem.level).toBe(startLevel + 3)
    })

    it("should maintain game state consistency through pause/resume cycles", () => {
      // Connect gameStateManager to typingSystem
      typingSystem.setGameStateManager(gameStateManager)

      gameStateManager.startGame()

      // Type some content
      typingSystem.processInput("T")
      typingSystem.processInput("e")
      const typedContentBeforePause = typingSystem.typedText

      // Pause game
      gameStateManager.pauseGame()
      expect(gameStateManager.isGamePaused()).toBe(true)

      // Resume game
      gameStateManager.resumeGame()
      expect(gameStateManager.isGameActive()).toBe(true)

      // Typing state should be preserved
      expect(typingSystem.typedText).toBe(typedContentBeforePause)

      // Should be able to continue typing
      typingSystem.processInput("s")
      typingSystem.processInput("t")
      expect(typingSystem.typedText).toBe(typedContentBeforePause + "st")
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("should handle rapid state changes gracefully", () => {
      // Rapid state changes
      gameStateManager.startGame()
      gameStateManager.pauseGame()
      gameStateManager.resumeGame()
      gameStateManager.endGame()
      gameStateManager.restartGame()

      expect(gameStateManager.currentState).toBe(GameStateType.PLAYING)
      expect(gameStateManager.isGameActive()).toBe(true)
    })

    it("should handle invalid input gracefully", () => {
      gameStateManager.startGame()

      // Try invalid characters
      const invalidChars = ["", "\n", "\t", "\\", '"']
      invalidChars.forEach((char) => {
        expect(() => {
          typingSystem.processInput(char)
        }).not.toThrow()
      })
    })

    it("should handle extreme experience values", () => {
      // Very large experience gain
      const massiveExperience = 999999

      expect(() => {
        progressionSystem.addExperience(massiveExperience)
      }).not.toThrow()

      expect(progressionSystem.level).toBeGreaterThan(1)
      expect(progressionSystem.experience).toBeGreaterThanOrEqual(0)
    })

    it("should handle system reset correctly", () => {
      // Make progress in all systems
      gameStateManager.startGame()
      typingSystem.processInput("T")
      typingSystem.processInput("e")
      progressionSystem.addExperience(100)

      // Reset systems
      typingSystem.reset()
      progressionSystem.reset()
      gameStateManager.changeState(GameStateType.MENU)

      // Verify clean state
      expect(typingSystem.typedText).toBe("")
      expect(typingSystem.wordsCompleted).toBe(0)
      expect(progressionSystem.level).toBe(1)
      expect(progressionSystem.experience).toBe(0)
      expect(gameStateManager.currentState).toBe(GameStateType.MENU)
    })
  })

  describe("Performance and Scalability", () => {
    it("should handle rapid typing input without data loss", () => {
      const text = "The quick brown fox jumps over the lazy dog"

      // Type entire text rapidly
      for (const char of text) {
        typingSystem.processInput(char)
      }

      expect(typingSystem.typedText).toBe(text)
      expect(typingSystem.wordsCompleted).toBeGreaterThan(0)
    })

    it("should handle multiple level ups in single experience addition", () => {
      const initialLevel = progressionSystem.level

      // Add massive experience to trigger multiple level ups
      const massiveExperience = progressionSystem.experienceToNext * 5
      progressionSystem.addExperience(massiveExperience)

      expect(progressionSystem.level).toBeGreaterThan(initialLevel + 2)
      expect(progressionSystem.availableUpgrades).toHaveLength(3)
    })
  })
})
