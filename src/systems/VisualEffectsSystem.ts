import Phaser from "phaser"

export interface EffectConfig {
  duration?: number
  intensity?: number
  color?: number
  scale?: number
  alpha?: number
}

export class VisualEffectsSystem {
  private scene: Phaser.Scene
  private screenShakeCamera: Phaser.Cameras.Scene2D.Camera
  private activeEffects: Set<Phaser.GameObjects.GameObject>

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.activeEffects = new Set()
    this.screenShakeCamera = scene.cameras.main
  }

  public initialize(): void {
    // Create a simple particle texture if it doesn't exist
    if (!this.scene.textures.exists("particle")) {
      const graphics = this.scene.add.graphics()

      // Create a white circle with soft edges
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(8, 8, 8)

      // Add a smaller bright center
      graphics.fillStyle(0xffffff, 0.8)
      graphics.fillCircle(8, 8, 4)

      graphics.generateTexture("particle", 16, 16)
      graphics.destroy()
    }
  }

  // Screen shake effect
  public screenShake(duration: number = 200, intensity: number = 10): void {
    this.screenShakeCamera.shake(duration, intensity)
  }

  // Flash effect for impactful moments
  public screenFlash(
    color: number = 0xffffff,
    duration: number = 100,
    alpha: number = 0.5
  ): void {
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      color,
      alpha
    )

    flash.setScrollFactor(0)
    flash.setDepth(1000)

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration,
      ease: "Power2",
      onComplete: () => flash.destroy(),
    })
  }

  // Particle explosion effect
  public createExplosion(
    x: number,
    y: number,
    config: EffectConfig = {}
  ): void {
    const {
      duration = 300,
      intensity = 20,
      color = 0xff6b35,
      scale = 0.5,
    } = config

    // Create the particle explosion with better visibility
    const emitter = this.scene.add.particles(x, y, "particle", {
      speed: { min: 100, max: 200 },
      scale: { start: scale * 1.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [color, 0xffffff, color],
      lifespan: duration,
      quantity: intensity,
      blendMode: "ADD",
      emitZone: {
        type: "edge",
        source: new Phaser.Geom.Circle(0, 0, 5),
        quantity: intensity,
      },
      rotate: { start: 0, end: 360 },
    })

    // Clean up after duration
    this.scene.time.delayedCall(duration + 100, () => {
      emitter.destroy()
    })
  }

  // Impact effect for projectile hits
  public createImpactEffect(
    x: number,
    y: number,
    config: EffectConfig = {}
  ): void {
    const { color = 0x00ff00, scale = 0.3, duration = 200 } = config

    // Create impact ring
    const ring = this.scene.add.graphics()
    ring.lineStyle(4, color, 1)
    ring.strokeCircle(x, y, 5)
    ring.setAlpha(0.8)

    this.activeEffects.add(ring)

    this.scene.tweens.add({
      targets: ring,
      scaleX: scale * 3,
      scaleY: scale * 3,
      alpha: 0,
      duration,
      ease: "Power2",
      onComplete: () => {
        this.activeEffects.delete(ring)
        ring.destroy()
      },
    })

    // Add particle burst
    this.createExplosion(x, y, {
      intensity: 8,
      color,
      duration: duration * 0.7,
      scale: 0.2,
    })
  }

  // Enemy death effect
  public createEnemyDeathEffect(
    x: number,
    y: number,
    config: EffectConfig = {}
  ): void {
    const { color = 0xff0000, duration = 500, intensity = 50 } = config

    // Screen shake
    // this.screenShake(150, 5)

    // Main explosion - much more visible
    this.createExplosion(x, y, {
      intensity: intensity,
      color,
      duration,
      scale: 1.2,
    })

    // Create additional explosion layers for better visibility
    this.scene.time.delayedCall(50, () => {
      this.createExplosion(x, y, {
        intensity: 25,
        color: 0xffaa00, // Orange
        duration: 400,
        scale: 0.8,
      })
    })

    // Secondary smaller explosions with different colors
    for (let i = 0; i < 5; i++) {
      const offsetX = Phaser.Math.Between(-30, 30)
      const offsetY = Phaser.Math.Between(-30, 30)
      const colors = [0xff4444, 0xffaa00, 0xffff00, 0xff6600]

      this.scene.time.delayedCall(i * 75, () => {
        this.createExplosion(x + offsetX, y + offsetY, {
          intensity: 15,
          color: colors[i % colors.length],
          duration: 300,
          scale: 0.6,
        })
      })
    }

    // Add expanding shockwave ring
    const shockwave = this.scene.add.graphics()
    shockwave.lineStyle(3, color, 0.8)
    shockwave.strokeCircle(x, y, 10)
    shockwave.setDepth(50)
    this.activeEffects.add(shockwave)

    this.scene.tweens.add({
      targets: shockwave,
      scaleX: 8,
      scaleY: 8,
      alpha: 0,
      duration: 600,
      ease: "Power2",
      onComplete: () => {
        this.activeEffects.delete(shockwave)
        shockwave.destroy()
      },
    })
  }

  // Level up effect
  public createLevelUpEffect(
    x: number,
    y: number,
    config: EffectConfig = {}
  ): void {
    const { color = 0xffd700, duration = 1000, scale = 1 } = config

    // Golden flash
    // this.screenFlash(color, 200, 0.3)

    // Rising particles
    const emitter = this.scene.add.particles(x, y + 50, "particle", {
      speedY: { min: -100, max: -50 },
      speedX: { min: -20, max: 20 },
      scale: { start: scale * 0.5, end: 0 },
      tint: [color, 0xffffff],
      lifespan: duration,
      frequency: 50,
      quantity: 2,
      blendMode: "ADD",
    })

    // Stop emitter after duration
    this.scene.time.delayedCall(duration, () => {
      emitter.destroy()
    })

    // Expanding golden ring
    const ring = this.scene.add.graphics()
    ring.lineStyle(6, color, 0.8)
    ring.strokeCircle(x, y, 10)

    this.activeEffects.add(ring)

    this.scene.tweens.add({
      targets: ring,
      scaleX: 5,
      scaleY: 5,
      alpha: 0,
      duration: duration * 0.8,
      ease: "Power2",
      onComplete: () => {
        this.activeEffects.delete(ring)
        ring.destroy()
      },
    })
  }

  // Damage number popup
  public createDamageNumber(
    x: number,
    y: number,
    damage: number,
    color: string = "#ff0000"
  ): void {
    const text = this.scene.add.text(x, y, `-${damage}`, {
      fontSize: "16px",
      color,
      fontStyle: "bold",
    })

    text.setOrigin(0.5)
    text.setDepth(100)
    this.activeEffects.add(text)

    this.scene.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        this.activeEffects.delete(text)
        text.destroy()
      },
    })
  }

  // Heal number popup
  public createHealNumber(x: number, y: number, heal: number): void {
    this.createDamageNumber(x, y, heal, "#00ff00")
  }

  // XP gain effect
  public createXPGainEffect(x: number, y: number, xp: number): void {
    const text = this.scene.add.text(x, y, `+${xp} XP`, {
      fontSize: "14px",
      color: "#00bfff",
      fontStyle: "bold",
    })

    text.setOrigin(0.5)
    text.setDepth(99)
    this.activeEffects.add(text)

    this.scene.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 600,
      ease: "Power1",
      onComplete: () => {
        this.activeEffects.delete(text)
        text.destroy()
      },
    })
  }

  // Typing effect (character highlight)
  public createTypingEffect(
    x: number,
    y: number,
    isCorrect: boolean = true
  ): void {
    const color = isCorrect ? 0x00ff00 : 0xff0000
    const alpha = isCorrect ? 0.6 : 0.8

    const highlight = this.scene.add.graphics()
    highlight.fillStyle(color, alpha)
    highlight.fillCircle(x, y, 8)

    this.activeEffects.add(highlight)

    this.scene.tweens.add({
      targets: highlight,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        this.activeEffects.delete(highlight)
        highlight.destroy()
      },
    })
  }

  // Word completion effect
  public createWordCompleteEffect(x: number, y: number, word: string): void {
    // Success flash
    // this.screenFlash(0x00ff00, 50, 0.2)

    // Word popup
    const text = this.scene.add.text(x, y - 20, word, {
      fontSize: "18px",
      color: "#00ff00",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    })

    text.setOrigin(0.5)
    text.setDepth(101)
    this.activeEffects.add(text)

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 800,
      ease: "Back.easeOut",
      onComplete: () => {
        this.activeEffects.delete(text)
        text.destroy()
      },
    })

    // Burst effect
    this.createExplosion(x, y, {
      color: 0x00ff00,
      intensity: 12,
      duration: 300,
      scale: 0.3,
    })
  }

  // UI element animations
  public animateUIElementIn(
    element: any, // Using any to avoid property access issues
    direction: "top" | "bottom" | "left" | "right" | "fade" = "fade",
    duration: number = 300
  ): void {
    const originalX = element.x
    const originalY = element.y
    const originalAlpha = element.alpha

    switch (direction) {
      case "top":
        element.y -= 50
        break
      case "bottom":
        element.y += 50
        break
      case "left":
        element.x -= 50
        break
      case "right":
        element.x += 50
        break
      case "fade":
        element.alpha = 0
        break
    }

    if (direction !== "fade") {
      element.alpha = 0
    }

    this.scene.tweens.add({
      targets: element,
      x: originalX,
      y: originalY,
      alpha: originalAlpha,
      duration,
      ease: "Back.easeOut",
    })
  }

  public animateUIElementOut(
    element: any, // Using any to avoid property access issues
    direction: "top" | "bottom" | "left" | "right" | "fade" = "fade",
    duration: number = 200,
    onComplete?: () => void
  ): void {
    let targetX = element.x
    let targetY = element.y

    switch (direction) {
      case "top":
        targetY -= 50
        break
      case "bottom":
        targetY += 50
        break
      case "left":
        targetX -= 50
        break
      case "right":
        targetX += 50
        break
    }

    this.scene.tweens.add({
      targets: element,
      x: targetX,
      y: targetY,
      alpha: 0,
      duration,
      ease: "Power2",
      onComplete,
    })
  }

  // Cleanup all active effects
  public clearAllEffects(): void {
    this.activeEffects.forEach((effect) => {
      if (effect && effect.active) {
        effect.destroy()
      }
    })
    this.activeEffects.clear()
  }

  // Update method for any time-based effects
  public update(_time: number, _delta: number): void {
    // Remove destroyed effects from tracking
    this.activeEffects.forEach((effect) => {
      if (!effect.active) {
        this.activeEffects.delete(effect)
      }
    })
  }

  public destroy(): void {
    this.clearAllEffects()
  }
}
