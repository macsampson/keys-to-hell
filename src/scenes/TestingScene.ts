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
import { Player } from "../entities/Player"

export class TestingScene extends Phaser.Scene {
  private gameState!: GameState
  private currentGameState: GameStateType = GameStateType.PLAYING // Start in playing mode

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
  private instructionPanel!: Phaser.GameObjects.Container
  private healthBar!: Phaser.GameObjects.Graphics
  private healthText!: Phaser.GameObjects.Text
  private expBar!: Phaser.GameObjects.Graphics
  private expText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private testingHelpText!: Phaser.GameObjects.Text

  // Cached screen dimensions
  private stableScreenWidth!: number
  private stableScreenHeight!: number

  // Enemy spawning tracking
  private enemySpawnWave: number = 0

  constructor() {
    super({ key: "TestingScene" })
  }

  preload(): void {
    // Load custom fonts
    this.load.font(
      "OldEnglishGothicPixel",
      "assets/fonts/OldEnglishGothicPixelRegular-ow2Bo.ttf"
    )
    this.load.font("DotGothic16", "assets/fonts/DotGothic16-Regular.ttf")

    // Load spritesheets for enemies
    this.load.spritesheet(
      "goblin_run",
      "assets/sprites/enemies/goblin/goblinsmasher_run_outline.png",
      {
        frameWidth: 16,
        frameHeight: 16,
        startFrame: 0,
        endFrame: -1,
      }
    )

    this.load.spritesheet(
      "goblin_idle",
      "assets/sprites/enemies/goblin/goblinsmasher_idle_outline.png",
      {
        frameWidth: 16,
        frameHeight: 16,
        startFrame: 0,
        endFrame: -1,
      }
    )

    this.load.spritesheet(
      "goblin_attack",
      "assets/sprites/enemies/goblin/goblinsmasher_attack_outline.png",
      {
        frameWidth: 16,
        frameHeight: 16,
        startFrame: 0,
        endFrame: -1,
      }
    )

    this.load.spritesheet(
      "goblin_hurt",
      "assets/sprites/enemies/goblin/goblinsmasher_hurt_outline.png",
      {
        frameWidth: 16,
        frameHeight: 16,
        startFrame: 0,
        endFrame: -1,
      }
    )

    this.load.spritesheet(
      "goblin_death",
      "assets/sprites/enemies/goblin/goblinsmasher_death_outline.png",
      {
        frameWidth: 16,
        frameHeight: 16,
        startFrame: 0,
        endFrame: -1,
      }
    )

    // Load all new enemy spritesheets for testing
    // Yokai spritesheets
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

    // Werewolf spritesheets
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

    // Gorgon spritesheets
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

    // Minotaur spritesheets
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

    // Schoolgirl spritesheets
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
  }

  create(): void {
    console.log("=== TESTING MODE INITIALIZED ===")

    // Create placeholder textures for player and projectiles
    this.createPlaceholderTextures()

    // Create animations from spritesheets
    this.createAnimations()

    // Cache stable screen dimensions
    this.stableScreenWidth = this.cameras.main.width
    this.stableScreenHeight = this.cameras.main.height

    // Initialize game state
    this.gameState = {
      score: 0,
      accuracy: 100,
      wpm: 0,
      isGameActive: true,
      currentSentence: "",
      typedText: "",
      isGamePaused: false,
    } as any

    // Create player first (needed by other systems)
    this.player = new Player(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2
    )
    this.add.existing(this.player)

    // Initialize all game systems
    this.initializeSystems()

    // Set up input handling
    this.setupInputHandling()

    // Create UI
    this.createTestingUI()

    // Start with some test enemies
    this.spawnInitialTestEnemies()

    // Show initial help
    this.showTestingInstructions()

    console.log("Testing mode ready! Press H for help or ESC to return to menu")
  }

  private initializeSystems(): void {
    // Initialize systems in proper order
    this.audioSystem = new AudioSystem(this)
    this.performanceManager = new PerformanceManager(this)
    this.accessibilityManager = new AccessibilityManager(this)
    this.gameBalanceManager = new GameBalanceManager()
    this.textContentManager = new TextContentManager()
    this.gameStateManager = new GameStateManager(this)

    this.entityManager = new EntityManager(this)
    this.progressionSystem = new ProgressionSystem(this, this.player)
    this.visualEffectsSystem = new VisualEffectsSystem(this)

    // Pass systems to entity manager for proper integration
    this.entityManager.setVisualEffectsSystem(this.visualEffectsSystem)
    this.entityManager.setAudioSystem(this.audioSystem)
    this.entityManager.setGameBalanceManager(this.gameBalanceManager)

    // Set up event listeners
    this.setupEventListeners()

    // Start automatic shooting for testing
    this.startAutoShooting()

    // Start background music
    // this.audioSystem.playBackgroundMusic("background_music")
  }

  private setupEventListeners(): void {
    // Level up events
    this.events.on("levelUp", (data: any) => {
      console.log("Level up!", data)
    })
  }

  private setupInputHandling(): void {
    this.input.keyboard?.on("keydown", this.handleKeyDown, this)
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // ESC to return to menu
    if (event.code === "Escape") {
      this.scene.start("MenuScene")
      return
    }

    // Help
    if (event.code === "KeyH") {
      this.showTestingInstructions()
      return
    }

    // Testing shortcuts
    this.handleTestingShortcuts(event)

    // Individual enemy spawning shortcuts
    this.handleEnemySpawningShortcuts(event)

    // No typing needed in testing mode - attacks are automatic
  }

  private handleTestingShortcuts(event: KeyboardEvent): void {
    const upgradeManager = this.progressionSystem.getUpgradeManager()

    // Spawn enemies for testing
    if (event.code === "KeyE") {
      this.spawnTestEnemies()
      this.showTestingMessage("Spawned 10 test enemies")
      return
    }

    // Give XP and trigger level up
    if (event.code === "KeyL") {
      this.progressionSystem.addExperience(1000)
      this.showTestingMessage("Added 1000 XP")
      return
    }

    // Clear all enemies
    if (event.code === "KeyC") {
      this.entityManager.clearAll()
      this.enemySpawnWave = 0 // Reset spawn wave counter
      this.showTestingMessage("Cleared all enemies")
      return
    }

    // Reset player upgrades
    if (event.code === "KeyR") {
      this.resetPlayerUpgrades()
      this.showTestingMessage("Reset all upgrades")
      return
    }

    // Quick apply specific upgrades
    const upgradeKeys: Record<string, string> = {
      // Offensive (1-9)
      Digit1: "multi_shot",
      Digit2: "piercing",
      Digit3: "seeking",
      Digit4: "word_blast",
      Digit5: "chain_lightning",
      Digit6: "laser_beam",
      Digit7: "turret",
      Digit8: "sentence_slam",
      Digit9: "combo",

      // Defensive (Q-Y)
      KeyQ: "health_boost",
      KeyW: "regeneration",
      KeyT: "typing_shield",
      KeyY: "word_barrier",
      KeyU: "projectile_deflector",
      KeyI: "damage_reflection",
      KeyO: "slowing_aura",
      KeyP: "damage_aura",
      KeyA: "repulsion_field",
      KeyS: "time_dilation",
      KeyD: "rewind",
      KeyF: "stasis_field",
    }

    const upgradeId = upgradeKeys[event.code]
    if (upgradeId) {
      const success = upgradeManager.applyUpgrade(upgradeId, this.player)
      if (success) {
        console.log(`Applied upgrade: ${upgradeId}`)
        this.showTestingMessage(`Applied: ${upgradeId}`)
      } else {
        console.log(
          `Failed to apply upgrade: ${upgradeId} (may be at max level)`
        )
        this.showTestingMessage(`Failed: ${upgradeId} (max level?)`)
      }
    }
  }

  private handleEnemySpawningShortcuts(event: KeyboardEvent): void {
    const enemySpawnKeys: Record<string, string> = {
      // Number row for enemy types
      Backquote: "basic", // ` key (above tab)
      Minus: "fast", // - key
      Equal: "tank", // = key
      Backslash: "yokai", // \ key
      BracketLeft: "werewolf", // [ key
      BracketRight: "gorgon", // ] key
      Semicolon: "minotaur", // ; key
      // Quote: "schoolgirl", // ' key - schoolgirl is now the player
    }

    const enemyType = enemySpawnKeys[event.code]
    if (enemyType) {
      this.spawnSpecificEnemy(enemyType)
      this.showTestingMessage(`Spawned ${enemyType} enemy`)
      return
    }
  }

  private spawnSpecificEnemy(enemyType: string): void {
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    // Spawn at random position around the edge
    const angle = Math.random() * Math.PI * 2
    const distance = 300 + Math.random() * 100
    const x = centerX + Math.cos(angle) * distance
    const y = centerY + Math.sin(angle) * distance

    const enemy = this.entityManager.spawnEnemy(x, y, enemyType)

    // Get enemy stats for display
    const enemyInfo = this.getEnemyInfo(enemyType)
    console.log(`Spawned ${enemyType} enemy:`, enemyInfo)
    console.log(`Position: (${Math.round(x)}, ${Math.round(y)})`)
  }

  private getEnemyInfo(enemyType: string): string {
    const enemyStats: Record<string, string> = {
      basic: "HP:30 DMG:10 SPD:80 - Basic enemy",
      fast: "HP:20 DMG:8 SPD:120 - Fast, low health",
      tank: "HP:60 DMG:15 SPD:50 - Slow, high health",
      yokai: "HP:45 DMG:12 SPD:90 - Sine wave movement",
      werewolf: "HP:80 DMG:18 SPD:110 - Homing attacks",
      gorgon: "HP:65 DMG:16 SPD:60 - Spiral movement",
      minotaur: "HP:120 DMG:25 SPD:45 - Boss enemy, straight charge",
      // schoolgirl: "HP:25 DMG:6 SPD:140 - Very fast, low damage", // Now the player
    }
    return enemyStats[enemyType] || "Unknown enemy type"
  }

  private createTestingUI(): void {
    // Create a persistent instruction panel
    this.instructionPanel = this.add.container(20, 20)

    const bgPanel = this.add.graphics()
    bgPanel.fillStyle(0x000000, 0.8)
    bgPanel.fillRoundedRect(0, 0, 450, 220, 10)
    this.instructionPanel.add(bgPanel)

    const titleText = this.add.text(10, 10, "TESTING MODE", {
      fontSize: "20px",
      color: "#ffff00",
      fontFamily: "Arial",
    })
    this.instructionPanel.add(titleText)

    const instructionText = this.add.text(
      10,
      40,
      "H - Help  E - Spawn (6→12→24)  C - Clear\n" +
        "L - Add XP  R - Reset  ESC - Menu\n" +
        "1-9: Offensive  Q,W,T,Y,U,I,O,P,A,S,D,F: Defensive\n" +
        "SPECIFIC ENEMIES:\n" +
        "` - Basic  - - Fast  = - Tank  \\\\ - Yokai\n" +
        "[ - Werewolf  ] - Gorgon  ; - Minotaur  ' - Schoolgirl\n" +
        "Attacks fire automatically every second!",
      {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "Arial",
        lineSpacing: 3,
      }
    )
    this.instructionPanel.add(instructionText)

    this.instructionPanel.setDepth(1500)

    // Create health UI
    this.createHealthUI()

    // Create experience UI
    this.createExperienceUI()
  }

  private createHealthUI(): void {
    this.healthBar = this.add.graphics().setDepth(1000)
    this.healthText = this.add
      .text(0, 0, "", {
        fontSize: "18px",
        color: "#ffffff",
        fontFamily: "OldEnglishGothicPixel",
      })
      .setDepth(1000)
  }

  private createExperienceUI(): void {
    this.expBar = this.add.graphics().setDepth(1000)
    this.expText = this.add
      .text(0, 0, "", {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "OldEnglishGothicPixel",
      })
      .setDepth(1000)

    this.levelText = this.add
      .text(0, 0, "", {
        fontSize: "20px",
        color: "#ffff00",
        fontFamily: "OldEnglishGothicPixel",
      })
      .setDepth(1000)
  }

  private spawnInitialTestEnemies(): void {
    // Spawn a few enemies to start with
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const radius = 200
      const x = this.cameras.main.width / 2 + Math.cos(angle) * radius
      const y = this.cameras.main.height / 2 + Math.sin(angle) * radius
      this.entityManager.spawnEnemy(x, y)
    }
  }

  private spawnTestEnemies(): void {
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    // Define concentric circles: closer (6), medium (12), farther (24)
    const waves = [
      { count: 6, radius: 150 },
      { count: 12, radius: 250 },
      { count: 24, radius: 350 },
    ]

    const currentWave = waves[this.enemySpawnWave % waves.length]
    console.log(
      `Spawning wave ${this.enemySpawnWave + 1}: ${
        currentWave.count
      } enemies at radius ${currentWave.radius}`
    )

    for (let i = 0; i < currentWave.count; i++) {
      const angle = (i / currentWave.count) * Math.PI * 2
      const x = centerX + Math.cos(angle) * currentWave.radius
      const y = centerY + Math.sin(angle) * currentWave.radius
      this.entityManager.spawnEnemy(x, y)
    }

    this.enemySpawnWave++
  }

  private showTestingInstructions(): void {
    const helpText = `
=== TYPING HELL TESTING MODE ===

GENERAL CONTROLS:
H - Show this help    E - Spawn enemies (6→12→24)    C - Clear enemies
L - Add 1000 XP       R - Reset upgrades            ESC - Return to menu

SPECIFIC ENEMY SPAWNING:
\` - Basic (HP:30, DMG:10)        - - Fast (HP:20, DMG:8, Speed+)
= - Tank (HP:60, DMG:15, Slow)    \\\\ - Yokai (HP:45, DMG:12, Sine Wave)
[ - Werewolf (HP:80, DMG:18, Homing)  ] - Gorgon (HP:65, DMG:16, Spiral)
; - Minotaur (HP:120, DMG:25, Boss)   ' - Schoolgirl (HP:25, DMG:6, Fast)

OFFENSIVE ABILITIES:
1 - Multi-Shot        2 - Piercing           3 - Seeking
4 - Word Blast        5 - Chain Lightning    6 - Laser Beam
7 - Turret            8 - Sentence Slam      9 - Combo

DEFENSIVE ABILITIES:
Q - Health Boost      W - Regeneration       T - Typing Shield
Y - Word Barrier      U - Projectile Deflect I - Damage Reflect
O - Slowing Aura      P - Damage Aura        A - Repulsion Field
S - Time Dilation     D - Rewind             F - Stasis Field

HOW TO TEST:
1. Spawn specific enemies to test (\`, -, =, \\\\, [, ], ;, ') or waves (E)
2. Try different abilities (1-9, Q,W,T,Y,U,I,O,P,A,S,D,F)
3. Attacks fire automatically every second - no typing needed!
4. Press ability keys multiple times to level them up
5. Use L to gain XP naturally, R to reset and try different builds
6. Watch enemy behavior: movement patterns, animations, stats
    `

    console.log(helpText)
    this.showTestingMessage("Help printed to console (F12)")
  }

  private showTestingMessage(message: string): void {
    const messageText = this.add
      .text(this.cameras.main.width / 2, 200, message, {
        fontSize: "20px",
        color: "#00ff00",
        fontFamily: "OldEnglishGothicPixel",
        backgroundColor: "#000000",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(2000)

    this.tweens.add({
      targets: messageText,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        messageText.destroy()
      },
    })
  }

  // Automatic shooting for testing
  private startAutoShooting(): void {
    // Shoot every 1 second automatically for testing
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.launchAttackFromTyping("test")

        // Occasionally trigger special abilities
        if (Math.random() < 0.3 && this.player.hasWordBlast) {
          this.handleWordBlastUpgrade()
        }
      },
      loop: true,
    })
  }

  private launchAttackFromTyping(word: string): void {
    // Get nearest enemy as target (or null if no enemies)
    const target = this.entityManager.getNearestEnemy(
      this.player.x,
      this.player.y
    )

    // Only attack if there are enemies
    if (target) {
      // Trigger player attack animation with projectile launch callback
      this.player.performAttack(target, () => {
        // This callback fires when the throw happens in the animation
        this.launchProjectiles(target)
      })
    }
  }

  private launchProjectiles(target: any): void {
    const projectileCount = Math.max(1, this.player.projectileCount)

    for (let i = 0; i < projectileCount; i++) {
      console.log(
        `Creating projectile ${i + 1}/${projectileCount} with target:`,
        target ? "exists" : "none"
      )

      this.entityManager.createProjectile(
        this.player.x,
        this.player.y,
        10, // damage
        target, // will shoot at target or upward if null
        this.player.piercingCount,
        this.player.hasSeekingProjectiles,
        this.player.seekingStrength
      )
    }

    // Handle word blast
    if (this.player.hasWordBlast) {
      this.handleWordBlastUpgrade()
    }
  }

  private handleWordBlastUpgrade(): void {
    const explosionRadius = this.player.blastRadius
    const explosionDamage = this.player.blastDamage

    // Create visual explosion effect
    this.visualEffectsSystem.createExplosion(this.player.x, this.player.y, {
      color: 0xff6b6b,
      intensity: 8,
      scale: explosionRadius / 100,
    })

    // Damage enemies in radius
    this.entityManager.getAllActiveEnemies().forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y
      )

      if (distance <= explosionRadius) {
        enemy.takeDamageAndCheckDeath(explosionDamage)
      }
    })
  }

  update(time: number, delta: number): void {
    // Update all systems
    if (this.gameStateManager.isGameActive()) {
      this.entityManager.update(time, delta)
    }

    this.visualEffectsSystem.update(time, delta)

    // Update UI
    this.updateHealthUI()
    this.updateExperienceUI()
  }

  private updateHealthUI(): void {
    const barWidth = Math.floor(this.stableScreenWidth * 0.5)
    const barHeight = 20
    const barX = (this.stableScreenWidth - barWidth) / 2
    const barY = this.stableScreenHeight - 80

    this.healthBar.clear()

    // Background
    this.healthBar.fillStyle(0x333333)
    this.healthBar.fillRect(barX, barY, barWidth, barHeight)

    // Health bar
    const healthPercent = this.player.health / this.player.maxHealth
    this.healthBar.fillStyle(0x710000)
    this.healthBar.fillRect(barX, barY, barWidth * healthPercent, barHeight)

    // Text
    this.healthText.setText(
      `Health: ${this.player.health}/${this.player.maxHealth}`
    )
    this.healthText.setPosition(barX, barY - 25)
  }

  private updateExperienceUI(): void {
    const barWidth = Math.floor(this.stableScreenWidth * 0.5)
    const barHeight = 15
    const barX = (this.stableScreenWidth - barWidth) / 2
    const barY = this.stableScreenHeight - 50

    this.expBar.clear()

    // Background
    this.expBar.fillStyle(0x333333)
    this.expBar.fillRect(barX, barY, barWidth, barHeight)

    // Experience bar
    const expProgress = this.progressionSystem.getExperienceProgress()
    this.expBar.fillStyle(0x4a90e2)
    this.expBar.fillRect(barX, barY, barWidth * expProgress, barHeight)

    // Experience text
    const expData = this.progressionSystem.getExperienceForDisplay()
    this.expText.setText(`XP: ${expData.current}/${expData.required}`)
    this.expText.setPosition(barX, barY - 20)

    // Level text
    this.levelText.setText(`Level ${this.progressionSystem.level}`)
    this.levelText.setPosition(barX + barWidth - 100, barY - 20)
  }

  // Public getters for systems
  public getEntityManager(): EntityManager {
    return this.entityManager
  }

  public getTypingSystem(): TypingSystem {
    return this.typingSystem
  }

  private createPlaceholderTextures(): void {
    // Player now uses schoolgirl sprite instead of generated texture
    // Projectiles now use book texture from schoolgirl_book asset
  }

  private createAnimations(): void {
    // Create running animation for the goblin spritesheet
    this.anims.create({
      key: "goblin_run",
      frames: [
        { key: "goblin_run", frame: 0 },
        { key: "goblin_run", frame: 2 },
        { key: "goblin_run", frame: 4 },
        { key: "goblin_run", frame: 6 },
      ],
      frameRate: 6,
      repeat: -1,
    })

    // Create hurt animation
    this.anims.create({
      key: "goblin_hurt",
      frames: [{ key: "goblin_hurt", frame: 0 }],
      frameRate: 1,
      repeat: 0,
    })

    // Create idle animation
    this.anims.create({
      key: "goblin_idle",
      frames: [
        { key: "goblin_idle", frame: 0 },
        { key: "goblin_idle", frame: 2 },
      ],
      frameRate: 2,
      repeat: -1,
    })

    // Create attack animation
    this.anims.create({
      key: "goblin_attack",
      frames: [
        { key: "goblin_attack", frame: 0 },
        { key: "goblin_attack", frame: 2 },
        { key: "goblin_attack", frame: 4 },
      ],
      frameRate: 8,
      repeat: 0,
    })

    // Create death animation
    this.anims.create({
      key: "goblin_death",
      frames: [
        { key: "goblin_death", frame: 0 },
        { key: "goblin_death", frame: 2 },
        { key: "goblin_death", frame: 4 },
        { key: "goblin_death", frame: 6 },
      ],
      frameRate: 6,
      repeat: 0,
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

  private resetPlayerUpgrades(): void {
    // Reset progression system
    this.progressionSystem.reset()

    // Reset all player ability properties to defaults
    this.player.projectileCount = 1
    this.player.piercingCount = 0
    this.player.hasSeekingProjectiles = false
    this.player.seekingStrength = 0

    // AOE upgrades
    this.player.hasWordBlast = false
    this.player.blastRadius = 0
    this.player.blastDamage = 0
    this.player.hasChainLightning = false
    this.player.chainJumps = 0
    this.player.chainRange = 0

    // Special weapons
    this.player.hasLaserBeam = false
    this.player.laserDamagePerSecond = 0
    this.player.laserWidth = 0
    this.player.turretCount = 0
    this.player.turretDamage = 0

    // Sentence upgrades
    this.player.hasSentenceSlam = false
    this.player.sentenceDamageMultiplier = 0
    this.player.hasComboSystem = false
    this.player.maxComboMultiplier = 0

    // Health & regen
    this.player.hasRegeneration = false
    this.player.regenRate = 0
    this.player.health = 100
    this.player.maxHealth = 100

    // Shields
    this.player.hasTypingShield = false
    this.player.shieldPerWord = 0
    this.player.maxShield = 0
    this.player.currentShield = 0
    this.player.hasWordBarrier = false
    this.player.barrierStrength = 0

    // Deflection & Reflection
    this.player.hasProjectileDeflection = false
    this.player.deflectionChance = 0
    this.player.hasDamageReflection = false
    this.player.reflectionDamage = 0

    // Aura & Area Control
    this.player.hasSlowingAura = false
    this.player.slowAuraRadius = 0
    this.player.slowStrength = 0
    this.player.hasDamageAura = false
    this.player.auraRadius = 0
    this.player.auraDamagePerSecond = 0
    this.player.hasRepulsionField = false
    this.player.repulsionRadius = 0
    this.player.repulsionStrength = 0

    // Temporal upgrades
    this.player.hasTimeDilation = false
    this.player.dilationStrength = 0
    this.player.dilationDuration = 0
    this.player.hasRewind = false
    this.player.rewindCharges = 0
    this.player.rewindHealAmount = 0
    this.player.hasStasisField = false
    this.player.stasisDuration = 0
    this.player.stasisRadius = 0

    console.log("Player upgrades reset to defaults")
  }
}
