import { describe, it, expect, beforeEach, vi } from "vitest"
import { GameStateManager } from "../../src/systems/GameStateManager"
import { GameStateType } from "../../src/types/interfaces"

describe("GameStateManager", () => {
  let gameStateManager: GameStateManager
  let mockScene: any

  beforeEach(() => {
    mockScene = {
      events: {
        emit: vi.fn(),
        on: vi.fn(),
      },
      input: {
        keyboard: {
          on: vi.fn(),
        },
      },
      time: {
        paused: false,
      },
      physics: {
        resume: vi.fn(),
        pause: vi.fn(),
      },
    }

    gameStateManager = new GameStateManager(mockScene)
  })

  describe("Initial State", () => {
    it("should start in menu state", () => {
      expect(gameStateManager.currentState).toBe(GameStateType.MENU)
      expect(gameStateManager.previousState).toBeNull()
    })

    it("should not be game active initially", () => {
      expect(gameStateManager.isGameActive()).toBe(false)
      expect(gameStateManager.isGamePaused()).toBe(false)
      expect(gameStateManager.isLevelingUp()).toBe(false)
    })
  })

  describe("State Transitions", () => {
    it("should change state correctly", () => {
      gameStateManager.changeState(GameStateType.PLAYING)

      expect(gameStateManager.currentState).toBe(GameStateType.PLAYING)
      expect(gameStateManager.previousState).toBe(GameStateType.MENU)
      expect(mockScene.events.emit).toHaveBeenCalledWith("stateChanged", {
        newState: GameStateType.PLAYING,
        previousState: GameStateType.MENU,
      })
    })

    it("should not change to same state", () => {
      const emitSpy = vi.spyOn(mockScene.events, "emit")

      gameStateManager.changeState(GameStateType.MENU) // Already in menu

      expect(emitSpy).not.toHaveBeenCalled()
      expect(gameStateManager.previousState).toBeNull()
    })

    it("should track previous state correctly through multiple changes", () => {
      gameStateManager.changeState(GameStateType.PLAYING)
      gameStateManager.changeState(GameStateType.PAUSED)
      gameStateManager.changeState(GameStateType.GAME_OVER)

      expect(gameStateManager.currentState).toBe(GameStateType.GAME_OVER)
      expect(gameStateManager.previousState).toBe(GameStateType.PAUSED)
    })
  })

  describe("Game Control Methods", () => {
    it("should start game correctly", () => {
      gameStateManager.startGame()

      expect(gameStateManager.currentState).toBe(GameStateType.PLAYING)
      expect(gameStateManager.isGameActive()).toBe(true)
    })

    it("should pause game only when playing", () => {
      // Try to pause when not playing
      gameStateManager.pauseGame()
      expect(gameStateManager.currentState).toBe(GameStateType.MENU)

      // Start game and then pause
      gameStateManager.startGame()
      gameStateManager.pauseGame()

      expect(gameStateManager.currentState).toBe(GameStateType.PAUSED)
      expect(gameStateManager.isGamePaused()).toBe(true)
    })

    it("should resume game only when paused", () => {
      // Try to resume when not paused
      gameStateManager.resumeGame()
      expect(gameStateManager.currentState).toBe(GameStateType.MENU)

      // Start, pause, then resume
      gameStateManager.startGame()
      gameStateManager.pauseGame()
      gameStateManager.resumeGame()

      expect(gameStateManager.currentState).toBe(GameStateType.PLAYING)
      expect(gameStateManager.isGameActive()).toBe(true)
    })

    it("should end game correctly", () => {
      gameStateManager.startGame()
      gameStateManager.endGame()

      expect(gameStateManager.currentState).toBe(GameStateType.GAME_OVER)
      expect(gameStateManager.isGameActive()).toBe(false)
    })

    it("should restart game correctly", () => {
      gameStateManager.startGame()
      gameStateManager.endGame()
      gameStateManager.restartGame()

      expect(gameStateManager.currentState).toBe(GameStateType.PLAYING)
      expect(gameStateManager.isGameActive()).toBe(true)
      expect(mockScene.events.emit).toHaveBeenCalledWith("gameRestart")
    })
  })

  describe("State Query Methods", () => {
    it("should correctly identify game active state", () => {
      expect(gameStateManager.isGameActive()).toBe(false)

      gameStateManager.startGame()
      expect(gameStateManager.isGameActive()).toBe(true)

      gameStateManager.pauseGame()
      expect(gameStateManager.isGameActive()).toBe(false)

      gameStateManager.resumeGame()
      expect(gameStateManager.isGameActive()).toBe(true)
    })

    it("should correctly identify paused state", () => {
      expect(gameStateManager.isGamePaused()).toBe(false)

      gameStateManager.startGame()
      expect(gameStateManager.isGamePaused()).toBe(false)

      gameStateManager.pauseGame()
      expect(gameStateManager.isGamePaused()).toBe(true)

      gameStateManager.resumeGame()
      expect(gameStateManager.isGamePaused()).toBe(false)
    })

    it("should correctly identify level up state", () => {
      gameStateManager.changeState(GameStateType.LEVEL_UP)

      expect(gameStateManager.isLevelingUp()).toBe(true)
      expect(gameStateManager.isGameActive()).toBe(false)
    })
  })

  describe("State Callbacks", () => {
    it("should execute registered state callbacks", () => {
      const playingCallback = vi.fn()
      const pausedCallback = vi.fn()

      gameStateManager.registerStateCallback(
        GameStateType.PLAYING,
        playingCallback
      )
      gameStateManager.registerStateCallback(
        GameStateType.PAUSED,
        pausedCallback
      )

      gameStateManager.startGame()
      expect(playingCallback).toHaveBeenCalledOnce()
      expect(pausedCallback).not.toHaveBeenCalled()

      gameStateManager.pauseGame()
      expect(pausedCallback).toHaveBeenCalledOnce()
    })

    it("should not execute callbacks for unregistered states", () => {
      const callback = vi.fn()

      gameStateManager.registerStateCallback(GameStateType.PLAYING, callback)
      gameStateManager.changeState(GameStateType.GAME_OVER)

      expect(callback).not.toHaveBeenCalled()
    })

    it("should override callbacks when registered multiple times", () => {
      const firstCallback = vi.fn()
      const secondCallback = vi.fn()

      gameStateManager.registerStateCallback(
        GameStateType.PLAYING,
        firstCallback
      )
      gameStateManager.registerStateCallback(
        GameStateType.PLAYING,
        secondCallback
      )

      gameStateManager.startGame()

      expect(firstCallback).not.toHaveBeenCalled()
      expect(secondCallback).toHaveBeenCalledOnce()
    })
  })

  describe("Complex State Sequences", () => {
    it("should handle complete game flow correctly", () => {
      // Menu -> Playing -> Paused -> Playing -> Game Over -> Playing
      expect(gameStateManager.currentState).toBe(GameStateType.MENU)

      gameStateManager.startGame()
      expect(gameStateManager.currentState).toBe(GameStateType.PLAYING)
      expect(gameStateManager.isGameActive()).toBe(true)

      gameStateManager.pauseGame()
      expect(gameStateManager.currentState).toBe(GameStateType.PAUSED)
      expect(gameStateManager.isGameActive()).toBe(false)

      gameStateManager.resumeGame()
      expect(gameStateManager.currentState).toBe(GameStateType.PLAYING)
      expect(gameStateManager.isGameActive()).toBe(true)

      gameStateManager.endGame()
      expect(gameStateManager.currentState).toBe(GameStateType.GAME_OVER)
      expect(gameStateManager.isGameActive()).toBe(false)

      gameStateManager.restartGame()
      expect(gameStateManager.currentState).toBe(GameStateType.PLAYING)
      expect(gameStateManager.isGameActive()).toBe(true)
    })

    it("should maintain state consistency through level up process", () => {
      gameStateManager.startGame()
      gameStateManager.changeState(GameStateType.LEVEL_UP)

      expect(gameStateManager.isLevelingUp()).toBe(true)
      expect(gameStateManager.isGameActive()).toBe(false)

      gameStateManager.changeState(GameStateType.PLAYING)

      expect(gameStateManager.isLevelingUp()).toBe(false)
      expect(gameStateManager.isGameActive()).toBe(true)
    })
  })

  describe("Event Emission", () => {
    it("should emit state change events with correct data", () => {
      gameStateManager.startGame()
      gameStateManager.pauseGame()

      expect(mockScene.events.emit).toHaveBeenCalledWith("stateChanged", {
        newState: GameStateType.PAUSED,
        previousState: GameStateType.PLAYING,
      })
    })

    it("should emit game restart event", () => {
      gameStateManager.restartGame()

      expect(mockScene.events.emit).toHaveBeenCalledWith("gameRestart")
    })
  })
})
