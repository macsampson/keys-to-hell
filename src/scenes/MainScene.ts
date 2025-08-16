import Phaser from "phaser"
import { GAME_CONSTANTS } from "../config/GameConfig"
import type { GameState } from "../types/interfaces"
import { GameStateType } from "../types/interfaces"
import { TypingSystem } from "../systems/TypingSystem"
import { EntityManager } from "../systems/EntityManager"
import { ProgressionSystem } from "../systems/ProgressionSystem"
import { VisualEffectsSystem } from "../systems/VisualEffectsSystem"
import { AudioSystem } from "../systems/AudioSystem"
import { PerformanceManager } from "../systems/PerformanceManager"
import { AccessibilityManager } from "../systems/AccessibilityManager"
import { GameBalanceManager } from "../systems/GameBalanceManager"
import { TextContentManager } from "../systems/TextContentManager"
import { GameStateManager } from "../systems/GameStateManager"
import { Enemy } from "../entities/Enemy"
import { Player } from "../entities/Player"

export class MainScene extends Phaser.Scene {
  private gameState!: GameState
  private currentGameState: GameStateType = GameStateType.MENU

  // Game Systems
  private typingSystem!: TypingSystem
  private entityManager!: EntityManager
  private progressionSystem!: ProgressionSystem
  private visualEffectsSystem!: VisualEffectsSystem
  private audioSystem!: AudioSystem
  private performanceManager!: PerformanceManager
  private accessibilityManager!: AccessibilityManager
  private gameBalanceManager!: GameBalanceManager
  private textContentManager!: TextContentManager
  private gameStateManager!: GameStateManager
  private player!: Player
  // UI Elements
  private titleText!: Phaser.GameObjects.Text
  private instructionText!: Phaser.GameObjects.Text
  private healthBar!: Phaser.GameObjects.Graphics
  private healthText!: Phaser.GameObjects.Text
  private expBar!: Phaser.GameObjects.Graphics
  private expText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text

  // Cached screen dimensions to prevent camera shake interference
  private stableScreenWidth!: number
  private stableScreenHeight!: number

  constructor() {
    super({ key: "MainScene" })
  }

  preload(): void {
    // Load custom fonts
    this.load.font(
      "OldEnglishGothicPixel",
      "assets/fonts/OldEnglishGothicPixelRegular-ow2Bo.ttf"
    )
    this.load.font("DotGothic16", "assets/fonts/DotGothic16-Regular.ttf")

    // Load spritesheets with frame configuration
    this.load.spritesheet(
      "goblin_run",
      "assets/sprites/enemies/goblin/goblinsmasher_run_outline.png",
      {
        frameWidth: 16, // Width of each frame in pixels
        frameHeight: 16, // Height of each frame in pixels
        startFrame: 0, // First frame to use (optional)
        endFrame: -1, // Last frame to use (-1 means all frames)
      }
    )

    // Load goblin hurt sprite
    this.load.spritesheet(
      "goblin_hurt",
      "assets/sprites/enemies/goblin/goblinsmasher_hurt_outline.png",
      {
        frameWidth: 16, // Width of each frame in pixels
        frameHeight: 16, // Height of each frame in pixels
        startFrame: 0,
        endFrame: -1,
      }
    )

    // Load goblin death spritesheet
    this.load.spritesheet(
      "goblin_death",
      "assets/sprites/enemies/goblin/goblinsmasher_death_outline.png",
      {
        frameWidth: 16, // Width of each frame in pixels
        frameHeight: 16, // Height of each frame in pixels
        startFrame: 0,
        endFrame: -1,
      }
    )

    // Load yokai spritesheets
    this.load.spritesheet(
      "yokai_walk",
      "assets/sprites/enemies/yokai/Walk.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet("yokai_run", "assets/sprites/enemies/yokai/Run.png", {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet(
      "yokai_attack",
      "assets/sprites/enemies/yokai/Attack_1.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "yokai_hurt",
      "assets/sprites/enemies/yokai/Hurt.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "yokai_death",
      "assets/sprites/enemies/yokai/Dead.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )

    // Load werewolf spritesheets
    this.load.spritesheet(
      "werewolf_walk",
      "assets/sprites/enemies/werewolf/walk.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "werewolf_run",
      "assets/sprites/enemies/werewolf/Run.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "werewolf_attack",
      "assets/sprites/enemies/werewolf/Attack_1.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "werewolf_hurt",
      "assets/sprites/enemies/werewolf/Hurt.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "werewolf_death",
      "assets/sprites/enemies/werewolf/Dead.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )

    // Load gorgon spritesheets
    this.load.spritesheet(
      "gorgon_walk",
      "assets/sprites/enemies/gorgon/Walk.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "gorgon_run",
      "assets/sprites/enemies/gorgon/Run.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "gorgon_attack",
      "assets/sprites/enemies/gorgon/Attack_1.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "gorgon_hurt",
      "assets/sprites/enemies/gorgon/Hurt.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "gorgon_death",
      "assets/sprites/enemies/gorgon/Dead.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )

    // Load minotaur spritesheets
    this.load.spritesheet(
      "minotaur_walk",
      "assets/sprites/enemies/minotaur/Walk.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "minotaur_attack",
      "assets/sprites/enemies/minotaur/Attack.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "minotaur_hurt",
      "assets/sprites/enemies/minotaur/Hurt.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "minotaur_death",
      "assets/sprites/enemies/minotaur/Dead.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )

    // Load schoolgirl spritesheets
    this.load.spritesheet(
      "schoolgirl_walk",
      "assets/sprites/enemies/schoolgirl/Walk.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "schoolgirl_idle",
      "assets/sprites/enemies/schoolgirl/Idle.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "schoolgirl_attack",
      "assets/sprites/enemies/schoolgirl/Attack.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )
    this.load.spritesheet(
      "schoolgirl_book",
      "assets/sprites/enemies/schoolgirl/Book.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    )
    this.load.spritesheet(
      "schoolgirl_death",
      "assets/sprites/enemies/schoolgirl/Protection.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    )

    // Load other assets
    this.load.image(
      "player",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )
    this.load.image(
      "projectile",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )

    this.createPlaceholderAudio()

    // Load background music
    this.load.audio("level_1", "assets/audio/level_1/level_1.ogg")

    this.load.on("loaderror", (file: any) => {
      if (file.key === "background_music") {
        console.error("Failed to load background music:", file)
      }
    })
  }

  create(): void {
    // Set up camera bounds to use current viewport size
    this.cameras.main.setBounds(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height
    )

    // Cache stable screen dimensions for UI positioning
    this.updateStableScreenDimensions()

    // Initialize performance and accessibility systems first
    this.performanceManager = new PerformanceManager(this)
    this.accessibilityManager = new AccessibilityManager(this)

    // Initialize balance and content systems
    this.gameBalanceManager = new GameBalanceManager()
    this.textContentManager = new TextContentManager()

    // Initialize game state manager
    this.gameStateManager = new GameStateManager(this)

    // Set up state change listeners
    this.events.on("stateChanged", this.handleStateChange, this)

    // Initialize visual effects system
    this.visualEffectsSystem = new VisualEffectsSystem(this)
    this.visualEffectsSystem.initialize()

    // Create animations from spritesheets
    this.createAnimations()

    // Initialize game systems
    this.entityManager = new EntityManager(this)
    this.typingSystem = new TypingSystem(this)

    // Create player instance
    this.player = new Player(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2
    )

    // Create progression system
    this.progressionSystem = new ProgressionSystem(this, this.player)

    // Initialize audio system
    this.audioSystem = new AudioSystem(this)
    this.audioSystem.initializeSoundPools()

    // Pass systems to entity manager
    this.entityManager.setVisualEffectsSystem(this.visualEffectsSystem)
    this.entityManager.setAudioSystem(this.audioSystem)
    this.entityManager.setGameBalanceManager(this.gameBalanceManager)

    // Pass systems to typing system
    this.typingSystem.setTextContentManager(this.textContentManager)
    this.typingSystem.setGameStateManager(this.gameStateManager)

    // Initialize game state
    this.initializeGameState()

    // Set up game events
    this.setupGameEvents()

    // Set up input handling
    this.setupInputHandling()

    // Set up window resize handler to refresh stable dimensions
    window.addEventListener("resize", () => {
      // Wait a frame after resize to ensure dimensions are stable
      this.time.delayedCall(16, () => {
        this.updateStableScreenDimensions()
        // Only update UI if game is active to avoid interfering with menu
        if (this.gameStateManager && this.gameStateManager.isGameActive()) {
          this.updateHealthUI()
          this.updateExperienceUI()
        }
      })
    })

    // Create UI
    this.createUI()

    // Start in menu state
    this.showMenu()

    // Try to start background music immediately (will fail if audio context suspended)
    // this.time.delayedCall(500, () => {
    //   console.log(
    //     "Attempting to start background music automatically after 500ms delay"
    //   )
    //   this.playMenuMusic()
    // })
  }

  private initializeGameState(): void {
    this.gameState = {
      player: this.player,
      enemies: [],
      projectiles: [],
      typingSystem: this.typingSystem,
      progressionSystem: this.progressionSystem,
      gameTime: 0,
      score: 0,
      isGameActive: false,
    }
  }

  private setupGameEvents(): void {
    // Listen for typing system events
    this.events.on("wordComplete", this.handleWordComplete, this)
    this.events.on("sentenceComplete", this.handleSentenceComplete, this)
    this.events.on("typingSuccess", this.handleTypingSuccess, this)
    this.events.on("typingError", this.handleTypingError, this)

    // Listen for entity events
    this.events.on("enemyKilled", this.handleEnemyKilled, this)

    // Listen for progression events
    this.events.on("levelUp", this.handleLevelUp, this)
    this.events.on("playerLevelUp", this.handlePlayerLevelUp, this)

    // Listen for background music events
    // this.events.on("playMusic", this.playMenuMusic, this)
    // this.events.on("stopMusic", this.stopMenuMusic, this)
  }

  private createAnimations(): void {
    // Create running animation for the goblin spritesheet
    // Use only frames with actual sprites (0 and 2), skipping blank frames (1 and 3)
    this.anims.create({
      key: "goblin_run",
      frames: [
        { key: "goblin_run", frame: 0 },
        { key: "goblin_run", frame: 2 },
        { key: "goblin_run", frame: 4 },
        { key: "goblin_run", frame: 6 },
      ],
      frameRate: 6, // Slower animation speed since we have fewer frames
      repeat: -1, // Loop infinitely
    })

    // Create hurt animation using the hurt sprite
    this.anims.create({
      key: "goblin_hurt",
      frames: [{ key: "goblin_hurt", frame: 0 }],
      frameRate: 1,
      repeat: 0, // Play once
    })

    // Create death animation using specific frames from death spritesheet
    this.anims.create({
      key: "goblin_death",
      frames: [
        { key: "goblin_death", frame: 0 },
        { key: "goblin_death", frame: 2 },
        { key: "goblin_death", frame: 4 },
        { key: "goblin_death", frame: 6 },
        { key: "goblin_death", frame: 8 },
        { key: "goblin_death", frame: 10 },
      ],
      frameRate: 8, // Animation speed
      repeat: 0, // Play once
    })

    // Yokai animations
    this.anims.create({
      key: "yokai_walk",
      frames: this.anims.generateFrameNumbers("yokai_walk", {
        start: 0,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1,
    })
    this.anims.create({
      key: "yokai_run",
      frames: this.anims.generateFrameNumbers("yokai_run", {
        start: 0,
        end: 7,
      }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: "yokai_attack",
      frames: this.anims.generateFrameNumbers("yokai_attack", {
        start: 0,
        end: 9,
      }),
      frameRate: 12,
      repeat: 0,
    })
    this.anims.create({
      key: "yokai_hurt",
      frames: this.anims.generateFrameNumbers("yokai_hurt", {
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: 0,
    })
    this.anims.create({
      key: "yokai_death",
      frames: this.anims.generateFrameNumbers("yokai_death", {
        start: 0,
        end: 9,
      }),
      frameRate: 6,
      repeat: 0,
    })

    // Werewolf animations
    this.anims.create({
      key: "werewolf_walk",
      frames: this.anims.generateFrameNumbers("werewolf_walk", {
        start: 0,
        end: 10,
      }),
      frameRate: 8,
      repeat: -1,
    })
    this.anims.create({
      key: "werewolf_run",
      frames: this.anims.generateFrameNumbers("werewolf_run", {
        start: 0,
        end: 8,
      }),
      frameRate: 12,
      repeat: -1,
    })
    this.anims.create({
      key: "werewolf_attack",
      frames: this.anims.generateFrameNumbers("werewolf_attack", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: 0,
    })
    this.anims.create({
      key: "werewolf_hurt",
      frames: this.anims.generateFrameNumbers("werewolf_hurt", {
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: 0,
    })
    this.anims.create({
      key: "werewolf_death",
      frames: this.anims.generateFrameNumbers("werewolf_death", {
        start: 0,
        end: 1,
      }),
      frameRate: 3,
      repeat: 0,
    })

    // Gorgon animations
    this.anims.create({
      key: "gorgon_walk",
      frames: this.anims.generateFrameNumbers("gorgon_walk", {
        start: 0,
        end: 12,
      }),
      frameRate: 8,
      repeat: -1,
    })
    this.anims.create({
      key: "gorgon_run",
      frames: this.anims.generateFrameNumbers("gorgon_run", {
        start: 0,
        end: 6,
      }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: "gorgon_attack",
      frames: this.anims.generateFrameNumbers("gorgon_attack", {
        start: 0,
        end: 15,
      }),
      frameRate: 14,
      repeat: 0,
    })
    this.anims.create({
      key: "gorgon_hurt",
      frames: this.anims.generateFrameNumbers("gorgon_hurt", {
        start: 0,
        end: 2,
      }),
      frameRate: 6,
      repeat: 0,
    })
    this.anims.create({
      key: "gorgon_death",
      frames: this.anims.generateFrameNumbers("gorgon_death", {
        start: 0,
        end: 2,
      }),
      frameRate: 4,
      repeat: 0,
    })

    // Minotaur animations
    this.anims.create({
      key: "minotaur_walk",
      frames: this.anims.generateFrameNumbers("minotaur_walk", {
        start: 0,
        end: 11,
      }),
      frameRate: 6,
      repeat: -1,
    })
    this.anims.create({
      key: "minotaur_attack",
      frames: this.anims.generateFrameNumbers("minotaur_attack", {
        start: 0,
        end: 4,
      }),
      frameRate: 8,
      repeat: 0,
    })
    this.anims.create({
      key: "minotaur_hurt",
      frames: this.anims.generateFrameNumbers("minotaur_hurt", {
        start: 0,
        end: 2,
      }),
      frameRate: 6,
      repeat: 0,
    })
    this.anims.create({
      key: "minotaur_death",
      frames: this.anims.generateFrameNumbers("minotaur_death", {
        start: 0,
        end: 4,
      }),
      frameRate: 4,
      repeat: 0,
    })

    // Schoolgirl animations
    this.anims.create({
      key: "schoolgirl_walk",
      frames: this.anims.generateFrameNumbers("schoolgirl_walk", {
        start: 0,
        end: 11,
      }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: "schoolgirl_idle",
      frames: this.anims.generateFrameNumbers("schoolgirl_idle", {
        start: 0,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1,
    })
    this.anims.create({
      key: "schoolgirl_attack",
      frames: this.anims.generateFrameNumbers("schoolgirl_attack", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: 0,
    })
    this.anims.create({
      key: "schoolgirl_book",
      frames: this.anims.generateFrameNumbers("schoolgirl_book", {
        start: 0,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1,
    })
    this.anims.create({
      key: "schoolgirl_book_attack",
      frames: this.anims.generateFrameNumbers("schoolgirl_book_attack", {
        start: 0,
        end: 7,
      }),
      frameRate: 7,
      repeat: 0,
    })
    this.anims.create({
      key: "schoolgirl_death",
      frames: this.anims.generateFrameNumbers("schoolgirl_death", {
        start: 0,
        end: 3,
      }),
      frameRate: 6,
      repeat: 0,
    })
  }

  private createPlaceholderAudio(): void {
    // Create placeholder audio using Web Audio API
    const createAudioBuffer = (
      frequency: number,
      duration: number
    ): ArrayBuffer => {
      const sampleRate = 22050
      const numSamples = Math.floor(sampleRate * duration)
      const buffer = new ArrayBuffer(44 + numSamples * 2) // WAV header + 16-bit samples
      const view = new DataView(buffer)

      // WAV header
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i))
        }
      }

      writeString(0, "RIFF")
      view.setUint32(4, 36 + numSamples * 2, true)
      writeString(8, "WAVE")
      writeString(12, "fmt ")
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      writeString(36, "data")
      view.setUint32(40, numSamples * 2, true)

      // Generate sine wave samples
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const envelope = Math.max(0, 1 - t / duration) // Fade out
        const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3
        const intSample = Math.max(
          -32768,
          Math.min(32767, Math.floor(sample * 32767))
        )
        view.setInt16(44 + i * 2, intSample, true)
      }

      return buffer
    }

    // Create different sound buffers
    const sounds = [
      { key: "correct_char", frequency: 800, duration: 0.1 },
      { key: "incorrect_char", frequency: 200, duration: 0.2 },
      { key: "projectile_launch", frequency: 600, duration: 0.15 },
      { key: "projectile_hit", frequency: 400, duration: 0.1 },
      { key: "enemy_death", frequency: 150, duration: 0.3 },
      { key: "word_complete", frequency: 1000, duration: 0.2 },
      { key: "level_up", frequency: 1200, duration: 0.5 },
      { key: "countdown_number", frequency: 900, duration: 0.3 },
      { key: "countdown_start", frequency: 1400, duration: 0.4 },
    ]

    sounds.forEach(({ key, frequency, duration }) => {
      try {
        const buffer = createAudioBuffer(frequency, duration)
        const blob = new Blob([buffer], { type: "audio/wav" })
        const url = URL.createObjectURL(blob)
        this.load.audio(key, url)
        console.log(`Created placeholder audio for "${key}"`)
      } catch (error) {
        console.error(`Failed to create audio for "${key}":`, error)
      }
    })
  }

  private setupInputHandling(): void {
    // Typing input is now handled by TypingSystem
    // Only handle game control keys here
    this.input.keyboard?.on("keydown", this.handleKeyDown, this)
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.currentGameState === GameStateType.MENU) {
      // Try to start background music on first user interaction
      if (!this.audioSystem.hasBackgroundMusic()) {
        console.log(
          "First user interaction detected, starting background music"
        )
        // this.playMenuMusic()
      }

      if (event.code === "Enter" || event.code === "Space") {
        this.startGame()
      } else if (event.code === "Escape") {
        // Return to main menu
        this.scene.start("MenuScene")
      }
    } else if (this.currentGameState === GameStateType.GAME_OVER) {
      if (event.code === "Enter") {
        this.restartGame()
      } else if (event.code === "Escape") {
        // Return to main menu
        this.scene.start("MenuScene")
      }
    } else if (this.currentGameState === GameStateType.PLAYING) {
      // ESC key handling is now managed by GameStateManager
      // Only handle typing input here

      // Handle backspace for typing (only if game is active)
      if (event.code === "Backspace" && this.gameStateManager.isGameActive()) {
        this.events.emit("backspaceInput")
        return
      }

      // Handle regular character input for typing (only if game is active)
      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        this.gameStateManager.isGameActive()
      ) {
        this.events.emit("typingInput", event.key)
      }
    } else if (this.currentGameState === GameStateType.PAUSED) {
      // ESC key handling is now managed by GameStateManager
      // No other input should be processed while paused
    }
  }

  private createUI(): void {
    // Title text
    this.titleText = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 3,
        "TYPING HELL",
        {
          fontSize: "48px",
          color: "#ff6b6b",
          fontFamily: "OldEnglishGothicPixel",
          stroke: "#000000",
          strokeThickness: 2,
        }
      )
      .setOrigin(0.5)

    // Instruction text
    this.instructionText = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        "Press SPACE or ENTER to start\n\nType words to attack enemies!\nEscape to pause during game",
        {
          fontSize: "24px",
          color: "#ffffff",
          fontFamily: "OldEnglishGothicPixel",
          align: "center",
        }
      )
      .setOrigin(0.5)

    // Create health UI
    this.createHealthUI()

    // Create experience UI
    this.createExperienceUI()
  }

  private createHealthUI(): void {
    // Health bar background
    this.healthBar = this.add.graphics()
    this.healthBar.setDepth(1000)

    // Health text
    this.healthText = this.add
      .text(0, 0, "", {
        fontSize: "18px",
        color: "#ffffff",
        fontFamily: "OldEnglishGothicPixel",
      })
      .setDepth(1000)

    // Initially hidden
    this.healthBar.setVisible(false)
    this.healthText.setVisible(false)
  }

  private updateStableScreenDimensions(): void {
    // Cache screen dimensions when camera is stable (not during shake effects)
    this.stableScreenWidth =
      this.scale.width > 0 ? this.scale.width : this.cameras.main.width
    this.stableScreenHeight =
      this.scale.height > 0 ? this.scale.height : this.cameras.main.height

    console.log(
      `Cached stable screen dimensions: ${this.stableScreenWidth}x${this.stableScreenHeight}`
    )
  }

  private showUpgradeSelectionUI(availableUpgrades: any[]): void {
    // Create dark overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, this.stableScreenWidth, this.stableScreenHeight)
    overlay.setDepth(2000)

    // Title
    const title = this.add.text(
      this.stableScreenWidth / 2,
      this.stableScreenHeight / 2 - 200,
      "LEVEL UP! Choose an Upgrade:",
      {
        fontSize: "32px",
        color: "#ffff00",
        fontFamily: "OldEnglishGothicPixel",
      }
    )
    title.setOrigin(0.5)
    title.setDepth(2001)

    // Create upgrade option buttons
    const upgradeButtons: Phaser.GameObjects.Container[] = []
    const buttonWidth = 300
    const buttonHeight = 120
    const spacing = 50
    const startX =
      this.stableScreenWidth / 2 -
      (buttonWidth + spacing) * 1.5 +
      buttonWidth / 2

    availableUpgrades.forEach((upgrade, index) => {
      const x = startX + (buttonWidth + spacing) * index
      const y = this.stableScreenHeight / 2

      // Create button container
      const buttonContainer = this.add.container(x, y)
      buttonContainer.setDepth(2001)

      // Button background
      const buttonBg = this.add.graphics()
      buttonBg.fillStyle(0x333333)
      buttonBg.fillRect(
        -buttonWidth / 2,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight
      )

      // Rarity border
      const rarityColor = upgrade.getRarityColor
        ? upgrade.getRarityColor()
        : 0xffffff
      buttonBg.lineStyle(3, rarityColor)
      buttonBg.strokeRect(
        -buttonWidth / 2,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight
      )

      buttonContainer.add(buttonBg)

      // Upgrade name
      const nameText = this.add.text(0, -35, upgrade.name, {
        fontSize: "18px",
        color: "#ffffff",
        fontFamily: "OldEnglishGothicPixel",
        align: "center",
      })
      nameText.setOrigin(0.5)
      buttonContainer.add(nameText)

      // Upgrade description
      const descText = this.add.text(0, 0, upgrade.description, {
        fontSize: "14px",
        color: "#cccccc",
        fontFamily: "OldEnglishGothicPixel",
        align: "center",
        wordWrap: { width: buttonWidth - 20 },
      })
      descText.setOrigin(0.5)
      buttonContainer.add(descText)

      // Rarity text
      const rarityText = this.add.text(0, 35, upgrade.rarity.toUpperCase(), {
        fontSize: "12px",
        color: rarityColor,
        fontFamily: "OldEnglishGothicPixel",
        align: "center",
      })
      rarityText.setOrigin(0.5)
      buttonContainer.add(rarityText)

      // Make button interactive
      buttonBg.setInteractive(
        new Phaser.Geom.Rectangle(
          -buttonWidth / 2,
          -buttonHeight / 2,
          buttonWidth,
          buttonHeight
        ),
        Phaser.Geom.Rectangle.Contains
      )

      // Button hover effects
      buttonBg.on("pointerover", () => {
        buttonBg.clear()
        buttonBg.fillStyle(0x444444)
        buttonBg.fillRect(
          -buttonWidth / 2,
          -buttonHeight / 2,
          buttonWidth,
          buttonHeight
        )
        buttonBg.lineStyle(3, rarityColor)
        buttonBg.strokeRect(
          -buttonWidth / 2,
          -buttonHeight / 2,
          buttonWidth,
          buttonHeight
        )
      })

      buttonBg.on("pointerout", () => {
        buttonBg.clear()
        buttonBg.fillStyle(0x333333)
        buttonBg.fillRect(
          -buttonWidth / 2,
          -buttonHeight / 2,
          buttonWidth,
          buttonHeight
        )
        buttonBg.lineStyle(3, rarityColor)
        buttonBg.strokeRect(
          -buttonWidth / 2,
          -buttonHeight / 2,
          buttonWidth,
          buttonHeight
        )
      })

      // Button click handler
      buttonBg.on("pointerdown", () => {
        this.selectUpgrade(upgrade, [overlay, title, ...upgradeButtons])
      })

      upgradeButtons.push(buttonContainer)
    })

    // Add keyboard support (1, 2, 3 keys)
    const keyListener = (event: KeyboardEvent) => {
      const keyNum = parseInt(event.key)
      if (keyNum >= 1 && keyNum <= availableUpgrades.length) {
        const selectedUpgrade = availableUpgrades[keyNum - 1]
        this.selectUpgrade(selectedUpgrade, [overlay, title, ...upgradeButtons])
        document.removeEventListener("keydown", keyListener)
      }
    }

    document.addEventListener("keydown", keyListener)

    // Store the listener for cleanup
    ;(overlay as any).keyListener = keyListener
  }

  private selectUpgrade(
    upgrade: any,
    uiElements: Phaser.GameObjects.GameObject[]
  ): void {
    // Apply the upgrade
    this.progressionSystem.selectUpgrade(upgrade)

    // Update UI immediately to reflect changes from powerups like health boost
    this.updateHealthUI()
    this.updateExperienceUI()

    // Clean up UI elements
    uiElements.forEach((element) => {
      if ((element as any).keyListener) {
        document.removeEventListener("keydown", (element as any).keyListener)
      }
      element.destroy()
    })

    // Resume the game
    this.gameStateManager.resumeGame()

    // Show upgrade feedback
    this.showUpgradeFeedback(upgrade)
  }

  private showUpgradeFeedback(upgrade: any): void {
    // Create floating text to show what upgrade was selected
    const feedbackText = this.add.text(
      this.stableScreenWidth / 2,
      this.stableScreenHeight / 2 - 100,
      `${upgrade.name} Acquired!`,
      {
        fontSize: "24px",
        color: upgrade.getRarityColor
          ? `#${upgrade.getRarityColor().toString(16).padStart(6, "0")}`
          : "#ffffff",
        fontFamily: "OldEnglishGothicPixel",
      }
    )
    feedbackText.setOrigin(0.5)
    feedbackText.setDepth(2000)

    // Animate the feedback text
    this.tweens.add({
      targets: feedbackText,
      y: feedbackText.y - 50,
      alpha: 0,
      duration: 2000,
      ease: "Power2",
      onComplete: () => {
        feedbackText.destroy()
      },
    })
  }

  private handleWordBlastUpgrade(): void {
    if (!this.gameState.player.hasWordBlast) return

    // Get the first target for explosion center
    const targets = this.getTargetsForAttack()
    if (targets.length === 0) return

    const explosionCenter = targets[0]
    this.createWordBlastExplosion(explosionCenter.x, explosionCenter.y)
  }

  private createWordBlastExplosion(x: number, y: number): void {
    const player = this.gameState.player
    const blastRadius = player.blastRadius
    const blastDamage = player.blastDamage

    // Create visual explosion effect
    const explosion = this.add.graphics()
    explosion.setDepth(500)

    // Animate explosion
    this.tweens.add({
      targets: explosion,
      duration: 300,
      onUpdate: (tween) => {
        const progress = tween.progress
        const currentRadius = blastRadius * progress

        explosion.clear()
        explosion.fillStyle(0xff4444, 0.6 - progress * 0.6)
        explosion.fillCircle(x, y, currentRadius)
        explosion.lineStyle(3, 0xff8888, 1 - progress)
        explosion.strokeCircle(x, y, currentRadius)
      },
      onComplete: () => {
        explosion.destroy()
      },
    })

    // Damage all enemies in blast radius
    const enemies = this.entityManager.getAllActiveEnemies()
    enemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
      if (distance <= blastRadius) {
        enemy.takeDamageAndCheckDeath(blastDamage)
        console.log(
          `Word blast hit enemy at distance ${distance.toFixed(
            1
          )} for ${blastDamage} damage`
        )
      }
    })

    console.log(
      `Word blast created at (${x}, ${y}) with radius ${blastRadius} and damage ${blastDamage}`
    )
  }

  private handleChainLightningUpgrade(): void {
    if (!this.gameState.player.hasChainLightning) return

    // Get the first target as the initial lightning target
    const targets = this.getTargetsForAttack()
    if (targets.length === 0) return

    const initialTarget = targets[0]
    this.createChainLightning(initialTarget, new Set(), 0)
  }

  private createChainLightning(
    startEnemy: any,
    hitEnemies: Set<any>,
    jumpCount: number
  ): void {
    const player = this.gameState.player
    const maxJumps = player.chainJumps
    const chainRange = player.chainRange
    const lightningDamage = player.attackPower // Use base attack power for lightning

    // Damage the current enemy
    startEnemy.takeDamage(lightningDamage)
    hitEnemies.add(startEnemy)

    console.log(
      `Chain lightning hit #${jumpCount + 1}, damage: ${lightningDamage}`
    )

    // Stop if we've reached max jumps
    if (jumpCount >= maxJumps) {
      console.log(`Chain lightning completed after ${jumpCount + 1} hits`)
      return
    }

    // Find next enemy to jump to
    const allEnemies = this.entityManager.getAllActiveEnemies()
    let nearestEnemy = null
    let nearestDistance = Infinity

    for (const enemy of allEnemies) {
      if (hitEnemies.has(enemy)) continue // Skip already hit enemies

      const distance = Phaser.Math.Distance.Between(
        startEnemy.x,
        startEnemy.y,
        enemy.x,
        enemy.y
      )

      if (distance <= chainRange && distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = enemy
      }
    }

    if (nearestEnemy) {
      // Create visual lightning effect between enemies
      this.createLightningVisual(
        startEnemy.x,
        startEnemy.y,
        nearestEnemy.x,
        nearestEnemy.y
      )

      // Continue the chain with a short delay
      this.time.delayedCall(100, () => {
        this.createChainLightning(nearestEnemy, hitEnemies, jumpCount + 1)
      })
    } else {
      console.log(
        `Chain lightning ended after ${
          jumpCount + 1
        } hits - no more targets in range`
      )
    }
  }

  private createLightningVisual(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    const lightning = this.add.graphics()
    lightning.setDepth(600)

    // Create jagged lightning line
    const points = this.generateLightningPoints(x1, y1, x2, y2)

    lightning.lineStyle(3, 0x00ffff, 1)
    lightning.beginPath()
    lightning.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length; i++) {
      lightning.lineTo(points[i].x, points[i].y)
    }

    lightning.strokePath()

    // Animate and fade out
    this.tweens.add({
      targets: lightning,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        lightning.destroy()
      },
    })
  }

  private generateLightningPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): { x: number; y: number }[] {
    const points = [{ x: x1, y: y1 }]
    const segments = 4

    for (let i = 1; i < segments; i++) {
      const t = i / segments
      const x = x1 + (x2 - x1) * t
      const y = y1 + (y2 - y1) * t

      // Add random offset for jagged effect
      const offsetX = (Math.random() - 0.5) * 20
      const offsetY = (Math.random() - 0.5) * 20

      points.push({ x: x + offsetX, y: y + offsetY })
    }

    points.push({ x: x2, y: y2 })
    return points
  }

  private updateHealthUI(): void {
    if (!this.player) return

    const healthPercent = this.player.getHealthPercentage()

    // Use cached stable dimensions instead of current camera dimensions
    const screenWidth = this.stableScreenWidth
    const screenHeight = this.stableScreenHeight

    const barWidth = screenWidth * 0.5 // 50% of screen width
    const barHeight = 20
    const x = (screenWidth - barWidth) / 2 // Center horizontally
    const y = screenHeight - 80 // 80px from bottom

    // Clear previous graphics
    this.healthBar.clear()

    // Draw health bar background
    this.healthBar.fillStyle(0x333333)
    this.healthBar.fillRect(x, y, barWidth, barHeight)

    // Draw health bar
    const healthColor = 0x710000
    this.healthBar.fillStyle(healthColor)
    this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight)

    // Draw health bar border
    this.healthBar.lineStyle(2, 0xffffff)
    this.healthBar.strokeRect(x, y, barWidth, barHeight)

    // Update health text
    this.healthText.setText(
      `Health: ${this.player.health}/${this.player.maxHealth}`
    )

    // Force text to update its bounds before positioning
    this.healthText.updateText()
    const healthTextWidth = this.healthText.width

    // Position health text above the bar, centered
    this.healthText.setPosition(x + barWidth / 2 - healthTextWidth / 2, y - 25)
  }

  private createExperienceUI(): void {
    // Experience bar
    this.expBar = this.add.graphics()
    this.expBar.setDepth(1000)

    // Level text
    this.levelText = this.add
      .text(0, 0, "", {
        fontSize: "18px",
        color: "#ffff00",
        fontFamily: "OldEnglishGothicPixel",
      })
      .setDepth(1000)

    // Experience text
    this.expText = this.add
      .text(0, 0, "", {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "OldEnglishGothicPixel",
      })
      .setDepth(1000)

    // Initially hidden
    this.expBar.setVisible(false)
    this.levelText.setVisible(false)
    this.expText.setVisible(false)
  }

  private updateExperienceUI(): void {
    if (!this.progressionSystem) return

    const expData = this.progressionSystem.getExperienceForDisplay()

    // Use cached stable dimensions instead of current camera dimensions
    const screenWidth = this.stableScreenWidth
    const screenHeight = this.stableScreenHeight

    const barWidth = screenWidth * 0.5 // 50% of screen width
    const barHeight = 15
    const x = (screenWidth - barWidth) / 2 // Center horizontally
    const y = screenHeight - 30 // 50px from bottom

    // Clear previous graphics
    this.expBar.clear()

    // Draw experience bar background
    this.expBar.fillStyle(0x333333)
    this.expBar.fillRect(x, y, barWidth, barHeight)

    // Draw experience bar
    this.expBar.fillStyle(0x00aaff)
    this.expBar.fillRect(x, y, barWidth * expData.percentage, barHeight)

    // Draw experience bar border
    this.expBar.lineStyle(2, 0xffffff)
    this.expBar.strokeRect(x, y, barWidth, barHeight)

    // Update text
    this.levelText.setText(`Level: ${this.progressionSystem.level}`)
    this.expText.setText(`XP: ${expData.current}/${expData.required}`)

    // Force text to update its bounds before positioning
    this.expText.updateText()
    const expTextWidth = this.expText.width

    // Position texts: level on left, XP on right
    this.levelText.setPosition(x, y - 20)
    this.expText.setPosition(x + barWidth - expTextWidth, y - 20)
  }

  private showMenu(): void {
    this.currentGameState = GameStateType.MENU
    this.titleText.setVisible(true)
    this.instructionText.setVisible(true)

    // Hide health UI
    this.healthBar.setVisible(false)
    this.healthText.setVisible(false)

    // Hide experience UI
    this.expBar.setVisible(false)
    this.levelText.setVisible(false)
    this.expText.setVisible(false)
  }

  private startGame(): void {
    console.log("=== GAME START DEBUG ===")
    console.log("Player initial state:")
    console.log("- projectileCount:", this.gameState.player.projectileCount)
    console.log("- attackPower:", this.gameState.player.attackPower)
    console.log("- position:", this.gameState.player.position)
    console.log("- health:", this.gameState.player.health)
    console.log("=== END GAME START DEBUG ===")

    // Refresh stable screen dimensions before starting game
    this.updateStableScreenDimensions()

    // Hide menu UI
    this.titleText.setVisible(false)
    this.instructionText.setVisible(false)

    // Show health UI
    this.healthBar.setVisible(true)
    this.healthText.setVisible(true)

    // Show experience UI
    this.expBar.setVisible(true)
    this.levelText.setVisible(true)
    this.expText.setVisible(true)

    // Reset game state
    this.gameState.gameTime = 0
    this.gameState.score = 0

    // Reset player health
    this.player.health = this.player.maxHealth
    this.updateHealthUI()
    this.updateExperienceUI()

    // Set state to PLAYING but keep game inactive during countdown
    this.currentGameState = GameStateType.PLAYING
    this.gameState.isGameActive = false

    // Start countdown before beginning game
    this.startCountdown()
  }

  private startCountdown(): void {
    // Use a small delay to ensure everything is ready
    this.time.delayedCall(100, () => {
      // Create countdown text object centered on screen
      const countdownText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        "3",
        {
          fontSize: "72px",
          color: "#ffff00", // Back to yellow
          stroke: "#000000",
          strokeThickness: 3,
        }
      )
      countdownText.setOrigin(0.5)
      countdownText.setDepth(3000) // High depth to ensure it's on top

      this.runCountdownSequence(countdownText)
    })
  }

  private runCountdownSequence(countdownText: Phaser.GameObjects.Text): void {
    const countdownSequence = ["3", "2", "1", "Type!"]
    let currentIndex = 0

    const showNextCountdown = () => {
      if (currentIndex < countdownSequence.length) {
        const text = countdownSequence[currentIndex]
        countdownText.setText(text)

        // Play appropriate sound effect
        if (text === "Type!") {
          this.audioSystem.playCountdownStartSound()
        } else {
          this.audioSystem.playCountdownNumberSound()
        }

        // Use OldEnglishGothicPixel for all countdown text
        countdownText.setStyle({ fontFamily: "OldEnglishGothicPixel" })

        // Reset scale and alpha for each number
        countdownText.setScale(1)
        countdownText.setAlpha(1)

        // Simple scale animation for each countdown item
        this.tweens.add({
          targets: countdownText,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 200,
          ease: "Power2",
          yoyo: true,
          onComplete: () => {
            // Fade out effect near the end
            this.tweens.add({
              targets: countdownText,
              alpha: 0.5,
              duration: 600,
            })
          },
        })

        currentIndex++
        this.time.delayedCall(1000, showNextCountdown)
      } else {
        // Countdown complete - start the actual game
        countdownText.destroy()
        this.beginActualGame()
      }
    }

    // Start the countdown sequence
    showNextCountdown()
  }

  private beginActualGame(): void {
    // Actually start the game systems now
    this.gameStateManager.startGame()
    this.currentGameState = GameStateType.PLAYING
    this.gameState.isGameActive = true

    // Show the typing text box
    this.typingSystem.showTextBox()

    // Announce game start
    this.accessibilityManager.announceGameState(
      "Playing",
      "Game started! Type words to attack enemies."
    )

    this.audioSystem.playMusic("level_1")
  }

  // Pause/resume functionality now handled by GameStateManager

  private handleStateChange(data: {
    newState: GameStateType
    previousState: GameStateType | null
  }): void {
    switch (data.newState) {
      case GameStateType.PAUSED:
        // Show pause message
        this.instructionText.setText("PAUSED\n\nPress ESCAPE to resume")
        this.instructionText.setVisible(true)

        // Announce pause
        this.accessibilityManager.announceGameState(
          "Paused",
          "Press ESCAPE to resume"
        )
        break

      case GameStateType.PLAYING:
        if (data.previousState === GameStateType.PAUSED) {
          // Hide pause message
          this.instructionText.setVisible(false)

          // Announce resume
          this.accessibilityManager.announceGameState("Playing", "Game resumed")
        }
        break
    }
  }

  update(time: number, delta: number): void {
    // Performance monitoring
    this.performanceManager.startFrame()
    this.performanceManager.startUpdate()

    // Sync local state with GameStateManager
    this.currentGameState = this.gameStateManager.currentState
    this.gameState.isGameActive = this.gameStateManager.isGameActive()

    // Only update game logic when actively playing
    if (this.gameStateManager.isGameActive()) {
      this.gameState.gameTime += delta

      // Update player
      this.player.gameUpdate(time, delta)

      // Check for player-enemy collisions with culling
      this.checkPlayerEnemyCollisions()

      // Check game over condition
      if (!this.player.isAlive()) {
        this.gameOver()
        return
      }

      // Update game systems with performance optimization
      if (this.performanceManager.shouldSpawnEntity()) {
        this.entityManager.update(time, delta)
      }
    }

    // Only update text system (text system will check pause state internally)
    this.typingSystem.updateText(delta)

    this.performanceManager.endUpdate()
    this.performanceManager.endFrame()
  }

  // Event handlers for typing system
  private handleWordComplete(_wordsCompleted: number): void {
    console.log("=== WORD COMPLETE DEBUG ===")
    console.log(
      "Player projectileCount:",
      this.gameState.player.projectileCount
    )
    console.log("Player attackPower:", this.gameState.player.attackPower)
    console.log("Player position:", this.gameState.player.position)
    console.log(
      "this.player === this.gameState.player:",
      this.player === this.gameState.player
    )
    console.log("Direct player.projectileCount:", this.player.projectileCount)
    console.log("Direct player.attackPower:", this.player.attackPower)

    // Launch attack when word is completed
    this.launchAttackFromTyping()

    // Trigger word completion effects
    this.gameState.player.onWordCompleted()

    // Handle AOE upgrades
    this.handleWordBlastUpgrade()
    this.handleChainLightningUpgrade()

    // Update score
    this.gameState.score += 10
    console.log("=== END WORD COMPLETE DEBUG ===")
  }

  private handleSentenceComplete(_sentence: string): void {
    // Trigger sentence completion effects
    this.gameState.player.onSentenceCompleted()

    // Bonus points for completing sentence
    this.gameState.score += 50
  }

  private handleTypingSuccess(_character: string): void {
    // Could add subtle visual feedback here
    console.log("MainScene: Typing success, playing correct typing sound")
    this.audioSystem.playTypingSound(true)
  }

  private handleTypingError(_typed: string, _expected: string): void {
    // Could add screen shake or other error feedback
    console.log("MainScene: Typing error, playing incorrect typing sound")
    this.audioSystem.playTypingSound(false)
  }

  private handleEnemyKilled(experienceValue: number): void {
    console.log("MainScene: Enemy killed, playing death sound")
    this.audioSystem.playEnemyDeathSound()
    // Add experience points to progression system
    this.progressionSystem.addExperience(experienceValue)

    // Add to score as well
    this.gameState.score += experienceValue

    // Defer UI update until after screen shake effects complete (150ms + buffer)
    this.time.delayedCall(200, () => {
      this.updateExperienceUI()
    })
  }

  private handleLevelUp(data: {
    newLevel: number
    availableUpgrades: any[]
  }): void {
    console.log(`Player leveled up to ${data.newLevel}!`)

    // Pause the game
    this.gameStateManager.pauseGame()

    // Show upgrade selection UI
    this.showUpgradeSelectionUI(data.availableUpgrades)
  }

  private handlePlayerLevelUp(newLevel: number, previousLevel: number): void {
    console.log(`Player advanced from level ${previousLevel} to ${newLevel}`)

    // Update text difficulty based on new level
    this.textContentManager.adjustDifficulty(newLevel)

    // Update enemy spawn settings for the new level
    const spawnSettings = this.gameBalanceManager.getSpawnSettings(newLevel)
    this.entityManager.updateSpawnSettings(spawnSettings)

    // Defer XP UI update to avoid conflicts with other graphics operations
    this.time.delayedCall(1, () => {
      this.updateExperienceUI()
    })

    // Visual feedback for level up
  }

  private launchAttackFromTyping(): void {
    console.log("MainScene: Launching attack, playing projectile sound")
    this.audioSystem.playProjectileLaunchSound()

    // Debug enemy count
    const allEnemies = this.entityManager.getAllActiveEnemies()
    console.log("Total active enemies:", allEnemies.length)

    // Get targeting strategy based on player level/upgrades
    const targets = this.getTargetsForAttack()

    if (targets.length === 0) {
      console.log("No targets available for attack - no enemies present")
      return
    }

    // Trigger player attack animation with target facing and projectile launch callback
    const target = targets[0]
    this.player.performAttack(target, () => {
      // This callback fires when the throw happens in the animation
      this.launchProjectiles(target)
    })
  }

  private launchProjectiles(target: any): void {
    // Calculate number of projectiles to fire (base 1 + multishot upgrade)
    const projectileCount = this.gameState.player.projectileCount

    console.log(`Firing ${projectileCount} projectiles with multishot`)

    // Fire multiple projectiles with slight visual separation and timing delay
    for (let i = 0; i < projectileCount; i++) {
      // Calculate slight angle variation for visual separation
      const angleVariation = (i - (projectileCount - 1) / 2) * 0.1 // Small angle spread

      // Calculate slight position offset for visual separation
      const offsetDistance = i * 8 // 8 pixels apart
      const offsetX = Math.sin(angleVariation) * offsetDistance
      const offsetY = Math.cos(angleVariation) * offsetDistance

      // Add timing delay between projectiles
      const delay = i * 50 // 50ms delay between each projectile

      this.time.delayedCall(delay, () => {
        this.entityManager.createProjectile(
          this.gameState.player.position.x + offsetX,
          this.gameState.player.position.y + offsetY,
          this.gameState.player.attackPower,
          target,
          this.gameState.player.piercingCount,
          this.gameState.player.hasSeekingProjectiles,
          this.gameState.player.seekingStrength
        )
      })
    }

    console.log(
      `Launched projectile at target: (${target.x.toFixed(
        1
      )}, ${target.y.toFixed(1)})`
    )
  }

  private getTargetsForAttack(): Enemy[] {
    const playerPos = this.gameState.player.position

    // Get all active enemies
    const allEnemies = this.entityManager
      .getEnemyGroup()
      .children.entries.filter((enemy) => enemy.active)
      .map((enemy) => enemy as Enemy)

    if (allEnemies.length === 0) {
      return []
    }

    // Find the closest and weakest enemy (priority: closest first, then weakest if tied)
    const target = this.findClosestWeakestEnemy(allEnemies, playerPos)

    return target ? [target] : []
  }

  private checkPlayerEnemyCollisions(): void {
    const enemies = this.entityManager
      .getEnemyGroup()
      .children.entries.filter((enemy) => enemy.active)
      .map((enemy) => enemy as Enemy)

    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y
      )

      // Collision radius (sum of both sprites' effective radii)
      const collisionDistance = 25 // Adjust based on sprite sizes

      if (distance < collisionDistance) {
        // Player takes damage
        this.player.takeDamage(enemy.damage)
        this.audioSystem.playPlayerHurtSound()

        // Defer health UI update until after any camera shake effects complete
        this.time.delayedCall(250, () => {
          this.updateHealthUI()
        })

        // Knockback effect - push enemy away
        const angle = Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          enemy.x,
          enemy.y
        )
        const knockbackDistance = 50
        enemy.x += Math.cos(angle) * knockbackDistance
        enemy.y += Math.sin(angle) * knockbackDistance

        console.log(`Player collision! Player health: ${this.player.health}`)
      }
    }
  }

  private gameOver(): void {
    this.gameStateManager.endGame()
    this.currentGameState = GameStateType.GAME_OVER
    this.gameState.isGameActive = false

    // Hide health UI
    this.healthBar.setVisible(false)
    this.healthText.setVisible(false)

    // Hide experience UI
    this.expBar.setVisible(false)
    this.levelText.setVisible(false)
    this.expText.setVisible(false)

    // Show game over screen with level reached
    this.instructionText.setText(
      `GAME OVER\n\nLevel Reached: ${
        this.progressionSystem.level
      }\nFinal Score: ${this.gameState.score}\nSurvival Time: ${Math.floor(
        this.gameState.gameTime / 1000
      )}s\n\nPress ENTER to restart`
    )
    this.instructionText.setVisible(true)
  }

  private restartGame(): void {
    this.gameStateManager.restartGame()
    // Reset player
    this.player.health = this.player.maxHealth
    this.updateHealthUI()
    this.player.moveToPosition(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2
    )

    // Clear all enemies and projectiles
    this.entityManager.clearAll()

    // Reset typing system
    this.typingSystem.reset()

    // Reset progression system
    this.progressionSystem.reset()

    // Start the game
    this.startGame()
  }

  private findClosestWeakestEnemy(
    enemies: Enemy[],
    playerPos: Phaser.Math.Vector2
  ): Enemy | null {
    if (enemies.length === 0) return null

    // Find the closest enemy
    let closestEnemy = enemies[0]
    let closestDistance = Phaser.Math.Distance.Between(
      playerPos.x,
      playerPos.y,
      closestEnemy.x,
      closestEnemy.y
    )

    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.x,
        enemy.y
      )

      if (distance < closestDistance) {
        closestDistance = distance
        closestEnemy = enemy
      } else if (distance === closestDistance) {
        // If distance is tied, prefer the weaker enemy
        if (enemy.health < closestEnemy.health) {
          closestEnemy = enemy
        }
      }
    }

    return closestEnemy
  }

  // Public getters for other systems to access
  public getGameState(): GameState {
    return this.gameState
  }

  public getEntityManager(): EntityManager {
    return this.entityManager
  }

  public getTypingSystem(): TypingSystem {
    return this.typingSystem
  }

  // Background music handlers
  private playMenuMusic(): void {
    console.log("playMenuMusic called")

    if (this.audioSystem) {
      // Check if we're using WebAudio and if context is suspended
      const soundManager = this.sound as any
      if (soundManager.context && soundManager.context.state === "suspended") {
        console.log("Audio context suspended, attempting to resume")
        soundManager.context
          .resume()
          .then(() => {
            console.log("Audio context resumed, now playing music")
            this.audioSystem.playMusic("background_music", {
              loop: true,
              volume: 0.3,
            })
          })
          .catch((error: any) => {
            console.error("Failed to resume audio context:", error)
          })
      } else {
        this.audioSystem.playMusic("background_music", {
          loop: true,
          volume: 0.3,
        })
      }
    } else {
      console.log("AudioSystem not available")
    }
  }

  private stopMenuMusic(): void {
    if (this.audioSystem) {
      this.audioSystem.stopMusic()
    }
  }
}
