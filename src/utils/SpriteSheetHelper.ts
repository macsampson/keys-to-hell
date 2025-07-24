/**
 * SpriteSheet Helper - Comprehensive guide for using spritesheets in Phaser
 * This file demonstrates various techniques for loading and using spritesheets
 */

export class SpriteSheetHelper {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * Load different types of spritesheets in preload()
   */
  static loadSpritesheets(scene: Phaser.Scene) {
    // Method 1: Regular grid-based spritesheet
    scene.load.spritesheet(
      "goblin_run",
      "assets/sprites/enemies/spritesheets/goblinsmasher_run_outline.png",
      {
        frameWidth: 32, // Width of each frame
        frameHeight: 32, // Height of each frame
        startFrame: 0, // First frame to include (optional)
        endFrame: -1, // Last frame to include (-1 = all frames)
      }
    )

    // Method 2: Spritesheet with spacing between frames
    scene.load.spritesheet("hero_walk", "assets/sprites/hero_walk_strip.png", {
      frameWidth: 64,
      frameHeight: 64,
      spacing: 2, // Pixels between frames
      margin: 1, // Pixels around the edge
    })

    // Method 3: Texture Atlas (JSON-based, more flexible)
    scene.load.atlas(
      "character_atlas",
      "assets/sprites/character_atlas.png",
      "assets/sprites/character_atlas.json"
    )

    // Method 4: Multi-file atlas
    scene.load.multiatlas(
      "game_sprites",
      "assets/sprites/game_sprites.json",
      "assets/sprites/"
    )
  }

  /**
   * Create animations from spritesheets in create()
   */
  static createAnimations(scene: Phaser.Scene) {
    // Basic running animation
    scene.anims.create({
      key: "goblin_run",
      frames: scene.anims.generateFrameNumbers("goblin_run", {
        start: 0,
        end: -1,
      }),
      frameRate: 10, // Frames per second
      repeat: -1, // -1 = loop infinitely, 0 = play once
    })

    // Animation using specific frames (skip blank frames)
    // Useful when spritesheet has blank frames between animation frames
    const goblinFrames = [1, 3, 5, 7] // Only odd frames (even frames are blank)
    scene.anims.create({
      key: "goblin_run_specific",
      frames: goblinFrames.map((frameIndex) => ({
        key: "goblin_run",
        frame: frameIndex,
      })),
      frameRate: 8,
      repeat: -1,
    })

    // Walking animation with specific frame range
    scene.anims.create({
      key: "hero_walk",
      frames: scene.anims.generateFrameNumbers("hero_walk", {
        start: 0,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1,
    })

    // Idle animation (slower, fewer frames)
    scene.anims.create({
      key: "hero_idle",
      frames: scene.anims.generateFrameNumbers("hero_walk", {
        start: 8,
        end: 11,
      }),
      frameRate: 4,
      repeat: -1,
    })

    // Attack animation (plays once)
    scene.anims.create({
      key: "hero_attack",
      frames: scene.anims.generateFrameNumbers("hero_walk", {
        start: 12,
        end: 15,
      }),
      frameRate: 12,
      repeat: 0, // Play once
      hideOnComplete: false, // Keep showing last frame
    })

    // Using texture atlas frames (named frames)
    scene.anims.create({
      key: "player_run",
      frames: scene.anims.generateFrameNames("character_atlas", {
        prefix: "run_",
        suffix: ".png",
        start: 1,
        end: 8,
        zeroPad: 2, // run_01.png, run_02.png, etc.
      }),
      frameRate: 10,
      repeat: -1,
    })
  }

  /**
   * Usage examples for sprites and animations
   */
  static usageExamples(scene: Phaser.Scene) {
    // Create a sprite and play animation
    const goblin = scene.add.sprite(100, 100, "goblin_run")
    goblin.play("goblin_run")

    // Create sprite with physics
    const hero = scene.physics.add.sprite(200, 200, "hero_walk")
    hero.play("hero_walk")

    // Control animation playback
    hero.anims.pause() // Pause animation
    hero.anims.resume() // Resume animation
    hero.anims.stop() // Stop animation
    hero.anims.restart() // Restart from beginning

    // Change animations based on state
    hero.play("hero_idle") // Switch to idle
    hero.play("hero_attack") // Switch to attack

    // Animation events
    hero.on("animationcomplete", (anim: any) => {
      if (anim.key === "hero_attack") {
        hero.play("hero_idle") // Return to idle after attack
      }
    })

    // Chain animations
    hero.on("animationcomplete-hero_attack", () => {
      hero.play("hero_idle")
    })

    return { goblin, hero }
  }

  /**
   * Advanced techniques
   */
  static advancedTechniques(scene: Phaser.Scene) {
    // Randomize animation frame rate for variety
    const createVariedGoblin = (x: number, y: number) => {
      const goblin = scene.add.sprite(x, y, "goblin_run")
      const randomSpeed = Phaser.Math.Between(8, 12)

      // Create unique animation for this sprite
      const animKey = `goblin_run_${x}_${y}`
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers("goblin_run", {
          start: 0,
          end: -1,
        }),
        frameRate: randomSpeed,
        repeat: -1,
      })

      goblin.play(animKey)
      return goblin
    }

    // Flip sprites for direction
    const goblin = scene.add.sprite(300, 100, "goblin_run")
    goblin.play("goblin_run")
    goblin.setFlipX(true) // Flip horizontally

    // Tint animations for different enemy types
    const redGoblin = scene.add.sprite(400, 100, "goblin_run")
    redGoblin.play("goblin_run")
    redGoblin.setTint(0xff0000) // Red tint

    const blueGoblin = scene.add.sprite(500, 100, "goblin_run")
    blueGoblin.play("goblin_run")
    blueGoblin.setTint(0x0000ff) // Blue tint

    // Scale animations
    const bigGoblin = scene.add.sprite(600, 100, "goblin_run")
    bigGoblin.play("goblin_run")
    bigGoblin.setScale(1.5) // 50% larger

    return { goblin, redGoblin, blueGoblin, bigGoblin }
  }

  /**
   * Performance optimization for many animated sprites
   */
  static createOptimizedSpritePool(
    scene: Phaser.Scene,
    maxSprites: number = 50
  ) {
    const spritePool: Phaser.GameObjects.Sprite[] = []

    // Pre-create sprites for object pooling
    for (let i = 0; i < maxSprites; i++) {
      const sprite = scene.add.sprite(0, 0, "goblin_run")
      sprite.setVisible(false)
      sprite.setActive(false)
      spritePool.push(sprite)
    }

    const getPooledSprite = (x: number, y: number) => {
      const sprite = spritePool.find((s) => !s.active)
      if (sprite) {
        sprite.setPosition(x, y)
        sprite.setVisible(true)
        sprite.setActive(true)
        sprite.play("goblin_run")
        return sprite
      }
      return null
    }

    const returnToPool = (sprite: Phaser.GameObjects.Sprite) => {
      sprite.setVisible(false)
      sprite.setActive(false)
      sprite.anims.stop()
    }

    return { getPooledSprite, returnToPool, spritePool }
  }
}

/**
 * Common spritesheet configurations for different sprite sizes
 */
export const COMMON_SPRITE_CONFIGS = {
  // Retro 16x16 sprites
  RETRO_16: { frameWidth: 16, frameHeight: 16 },

  // Standard 32x32 sprites
  STANDARD_32: { frameWidth: 32, frameHeight: 32 },

  // Large 64x64 sprites
  LARGE_64: { frameWidth: 64, frameHeight: 64 },

  // Character sprites (often taller)
  CHARACTER: { frameWidth: 32, frameHeight: 48 },

  // UI elements
  UI_BUTTON: { frameWidth: 96, frameHeight: 32 },
}

/**
 * Helper function to determine spritesheet dimensions
 */
export function analyzeSpriteSheet(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
) {
  const framesX = Math.floor(imageWidth / frameWidth)
  const framesY = Math.floor(imageHeight / frameHeight)
  const totalFrames = framesX * framesY

  return {
    framesPerRow: framesX,
    totalRows: framesY,
    totalFrames: totalFrames,
    config: { frameWidth, frameHeight },
  }
}
