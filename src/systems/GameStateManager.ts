import Phaser from "phaser"
import type { GameStateManager as IGameStateManager } from "../types/interfaces"
import { GameStateType } from "../types/interfaces"

export class GameStateManager implements IGameStateManager {
  public currentState: GameStateType
  public previousState: GameStateType | null

  private scene: Phaser.Scene
  private stateChangeCallbacks: Map<GameStateType, () => void>

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.currentState = GameStateType.MENU
    this.previousState = null
    this.stateChangeCallbacks = new Map()

    // Set up keyboard controls for game states
    this.setupKeyboardControls()
  }

  public changeState(newState: GameStateType): void {
    if (this.currentState === newState) return

    console.log(`State change: ${this.currentState} -> ${newState}`)

    this.previousState = this.currentState
    this.currentState = newState

    // Execute state-specific logic
    this.handleStateChange(newState)

    // Execute registered callbacks
    const callback = this.stateChangeCallbacks.get(newState)
    if (callback) {
      callback()
    }

    // Emit state change event
    this.scene.events.emit("stateChanged", {
      newState,
      previousState: this.previousState,
    })
  }

  public pauseGame(): void {
    if (this.currentState === GameStateType.PLAYING) {
      this.changeState(GameStateType.PAUSED)
    }
  }

  public resumeGame(): void {
    if (this.currentState === GameStateType.PAUSED) {
      this.changeState(GameStateType.PLAYING)
    }
  }

  public startGame(): void {
    this.changeState(GameStateType.PLAYING)
  }

  public endGame(): void {
    this.changeState(GameStateType.GAME_OVER)
  }

  public restartGame(): void {
    // Reset game state and start new game
    this.scene.events.emit("gameRestart")
    this.changeState(GameStateType.PLAYING)
  }

  public registerStateCallback(
    state: GameStateType,
    callback: () => void
  ): void {
    this.stateChangeCallbacks.set(state, callback)
  }

  public isGameActive(): boolean {
    return this.currentState === GameStateType.PLAYING
  }

  public isGamePaused(): boolean {
    return this.currentState === GameStateType.PAUSED
  }

  public isLevelingUp(): boolean {
    return this.currentState === GameStateType.LEVEL_UP
  }

  private handleStateChange(newState: GameStateType): void {
    switch (newState) {
      case GameStateType.MENU:
        this.handleMenuState()
        break
      case GameStateType.PLAYING:
        this.handlePlayingState()
        break
      case GameStateType.PAUSED:
        this.handlePausedState()
        break
      case GameStateType.GAME_OVER:
        this.handleGameOverState()
        break
      case GameStateType.LEVEL_UP:
        this.handleLevelUpState()
        break
    }
  }

  private handleMenuState(): void {
    // Pause game physics and timers
    this.scene.physics?.pause()
    this.scene.time.paused = true
  }

  private handlePlayingState(): void {
    // Resume game physics and timers
    this.scene.physics?.resume()
    this.scene.time.paused = false
  }

  private handlePausedState(): void {
    // Pause game physics and timers
    this.scene.physics?.pause()
    this.scene.time.paused = true
  }

  private handleGameOverState(): void {
    // Pause game physics and timers
    this.scene.physics?.pause()
    this.scene.time.paused = true
  }

  private handleLevelUpState(): void {
    // Pause game physics but keep timers running for UI animations
    this.scene.physics?.pause()
  }

  private setupKeyboardControls(): void {
    // ESC key for pause/resume
    this.scene.input.keyboard?.on("keydown-ESC", () => {
      if (this.currentState === GameStateType.PLAYING) {
        this.pauseGame()
      } else if (this.currentState === GameStateType.PAUSED) {
        this.resumeGame()
      }
    })

    // R key for restart (when game over)
    this.scene.input.keyboard?.on("keydown-R", () => {
      if (this.currentState === GameStateType.GAME_OVER) {
        this.restartGame()
      }
    })

    // ENTER key for starting game from menu
    this.scene.input.keyboard?.on("keydown-ENTER", () => {
      if (this.currentState === GameStateType.MENU) {
        this.startGame()
      }
    })
  }

  // Clean up when destroying
  public destroy(): void {
    this.stateChangeCallbacks.clear()
    this.scene.input.keyboard?.removeAllListeners()
  }
}
