import Phaser from "phaser"

export interface AudioConfig {
  volume?: number
  loop?: boolean
  delay?: number
  rate?: number
  detune?: number
  seek?: number
}

export interface SoundPool {
  sounds: Phaser.Sound.BaseSound[]
  currentIndex: number
  maxSize: number
}

export class AudioSystem {
  private scene: Phaser.Scene
  private soundPools: Map<string, SoundPool>
  private backgroundMusic: Phaser.Sound.BaseSound | null
  private masterVolume: number = 1
  private sfxVolume: number = 0.7
  private musicVolume: number = 0.5
  private isMuted: boolean = false

  // Sound effect keys
  public readonly SOUNDS = {
    TYPING: "typing",
    CORRECT_CHAR: "correct_char",
    INCORRECT_CHAR: "incorrect_char",
    WORD_COMPLETE: "word_complete",
    PROJECTILE_LAUNCH: "projectile_launch",
    PROJECTILE_HIT: "projectile_hit",
    ENEMY_DEATH: "enemy_death",
    PLAYER_HURT: "player_hurt",
    LEVEL_UP: "level_up",
    UPGRADE_SELECT: "upgrade_select",
    PAUSE: "pause",
    RESUME: "resume",
    GAME_OVER: "game_over",
    MENU_SELECT: "menu_select",
    BUTTON_CLICK: "button_click",
  } as const

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.soundPools = new Map()
    this.backgroundMusic = null

    // Load sound settings from localStorage if available
    this.loadSettings()
  }

  // Initialize sound pools for frequently used sounds
  public initializeSoundPools(): void {
    const frequentSounds = [
      this.SOUNDS.TYPING,
      this.SOUNDS.CORRECT_CHAR,
      this.SOUNDS.INCORRECT_CHAR,
      this.SOUNDS.PROJECTILE_LAUNCH,
      this.SOUNDS.PROJECTILE_HIT,
    ]

    frequentSounds.forEach((soundKey) => {
      this.createSoundPool(soundKey, 5) // Pool of 5 sounds each
    })
  }

  private createSoundPool(soundKey: string, poolSize: number): void {
    console.log(`AudioSystem: Creating sound pool for "${soundKey}" with size ${poolSize}`)
    
    if (!this.scene.cache.audio.exists(soundKey)) {
      console.warn(`AudioSystem: Audio key "${soundKey}" not found in cache, cannot create pool`)
      return
    }

    const pool: SoundPool = {
      sounds: [],
      currentIndex: 0,
      maxSize: poolSize,
    }

    for (let i = 0; i < poolSize; i++) {
      const sound = this.scene.sound.add(soundKey, {
        volume: this.sfxVolume * this.masterVolume,
      })
      pool.sounds.push(sound)
    }

    this.soundPools.set(soundKey, pool)
  }

  // Play sound effect with pooling
  public playSFX(
    soundKey: string,
    config: AudioConfig = {}
  ): Phaser.Sound.BaseSound | null {
    console.log(`AudioSystem: Attempting to play sound "${soundKey}"`, {
      isMuted: this.isMuted,
      masterVolume: this.masterVolume,
      sfxVolume: this.sfxVolume,
      config
    })

    if (this.isMuted) {
      console.log(`AudioSystem: Sound "${soundKey}" not played - audio is muted`)
      return null
    }

    const pool = this.soundPools.get(soundKey)

    if (pool) {
      // Use pooled sound
      console.log(`AudioSystem: Using pooled sound for "${soundKey}" (pool size: ${pool.sounds.length})`)
      const sound = pool.sounds[pool.currentIndex]
      pool.currentIndex = (pool.currentIndex + 1) % pool.maxSize

      if (sound.isPlaying) {
        sound.stop()
      }

      const finalVolume = (config.volume || this.sfxVolume) * this.masterVolume
      console.log(`AudioSystem: Playing "${soundKey}" with volume ${finalVolume}`)

      try {
        ;(sound as Phaser.Sound.WebAudioSound).setVolume(finalVolume)
        ;(sound as Phaser.Sound.WebAudioSound).setRate(config.rate || 1)
        ;(sound as Phaser.Sound.WebAudioSound).setDetune(config.detune || 0)

        if (config.delay) {
          this.scene.time.delayedCall(config.delay, () => {
            sound.play()
          })
        } else {
          const result = sound.play()
          console.log(`AudioSystem: Sound "${soundKey}" play result:`, result)
        }
      } catch (error) {
        console.error(`AudioSystem: Error playing pooled sound "${soundKey}":`, error)
      }

      return sound
    } else {
      // Create and play single-use sound
      console.log(`AudioSystem: No pool found for "${soundKey}", creating single-use sound`)
      return this.playSound(soundKey, config)
    }
  }

  // Play sound without pooling
  private playSound(
    soundKey: string,
    config: AudioConfig = {}
  ): Phaser.Sound.BaseSound | null {
    console.log(`AudioSystem: playSound called for "${soundKey}"`)
    
    if (this.isMuted) {
      console.log(`AudioSystem: Sound "${soundKey}" not played - muted`)
      return null
    }
    
    if (!this.scene.cache.audio.exists(soundKey)) {
      console.error(`AudioSystem: Sound "${soundKey}" not found in cache`)
      return null
    }

    const finalVolume = (config.volume || this.sfxVolume) * this.masterVolume
    console.log(`AudioSystem: Creating single-use sound "${soundKey}" with volume ${finalVolume}`)

    let sound: Phaser.Sound.BaseSound
    
    try {
      sound = this.scene.sound.add(soundKey, {
        volume: finalVolume,
        loop: config.loop || false,
        rate: config.rate || 1,
        detune: config.detune || 0,
      })

      if (config.delay) {
        this.scene.time.delayedCall(config.delay, () => {
          const result = sound.play()
          console.log(`AudioSystem: Delayed play result for "${soundKey}":`, result)
        })
      } else {
        const result = sound.play()
        console.log(`AudioSystem: Immediate play result for "${soundKey}":`, result)
      }
    } catch (error) {
      console.error(`AudioSystem: Error playing single-use sound "${soundKey}":`, error)
      return null
    }

    // Clean up non-looping sounds when complete
    if (!config.loop) {
      sound.once("complete", () => {
        sound.destroy()
      })
    }

    return sound
  }

  // Background music management
  public playBackgroundMusic(musicKey: string, config: AudioConfig = {}): void {
    if (this.backgroundMusic) {
      this.stopBackgroundMusic()
    }

    if (!this.scene.cache.audio.exists(musicKey)) {
      console.warn(`Music key "${musicKey}" not found in cache`)
      return
    }

    const volume = (config.volume || this.musicVolume) * this.masterVolume

    this.backgroundMusic = this.scene.sound.add(musicKey, {
      volume: this.isMuted ? 0 : volume,
      loop: config.loop !== false, // Default to looping
      rate: config.rate || 1,
    })

    if (config.delay) {
      this.scene.time.delayedCall(config.delay, () => {
        this.backgroundMusic?.play()
      })
    } else {
      this.backgroundMusic.play()
    }
  }

  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop()
      this.backgroundMusic.destroy()
      this.backgroundMusic = null
    }
  }

  public pauseBackgroundMusic(): void {
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.pause()
    }
  }

  public resumeBackgroundMusic(): void {
    if (this.backgroundMusic && this.backgroundMusic.isPaused) {
      this.backgroundMusic.resume()
    }
  }

  // Specific game sound effects
  public playTypingSound(isCorrect: boolean = true): void {
    const soundKey = isCorrect
      ? this.SOUNDS.CORRECT_CHAR
      : this.SOUNDS.INCORRECT_CHAR
    const pitch = isCorrect ? 1 : 0.7

    this.playSFX(soundKey, {
      rate: pitch,
      volume: 0.3,
    })
  }

  public playWordCompleteSound(): void {
    this.playSFX(this.SOUNDS.WORD_COMPLETE, {
      volume: 0.5,
      rate: 1.2,
    })
  }

  public playProjectileLaunchSound(): void {
    this.playSFX(this.SOUNDS.PROJECTILE_LAUNCH, {
      volume: 0.4,
      detune: Phaser.Math.Between(-100, 100), // Slight pitch variation
    })
  }

  public playProjectileHitSound(): void {
    this.playSFX(this.SOUNDS.PROJECTILE_HIT, {
      volume: 0.5,
      rate: Phaser.Math.FloatBetween(0.9, 1.1), // Slight rate variation
    })
  }

  public playEnemyDeathSound(): void {
    this.playSFX(this.SOUNDS.ENEMY_DEATH, {
      volume: 0.6,
    })
  }

  public playPlayerHurtSound(): void {
    this.playSFX(this.SOUNDS.PLAYER_HURT, {
      volume: 0.7,
    })
  }

  public playLevelUpSound(): void {
    this.playSFX(this.SOUNDS.LEVEL_UP, {
      volume: 0.8,
      rate: 1.1,
    })
  }

  public playUpgradeSelectSound(): void {
    this.playSFX(this.SOUNDS.UPGRADE_SELECT, {
      volume: 0.6,
    })
  }

  public playUISound(
    type: "click" | "select" | "pause" | "resume" | "game_over"
  ): void {
    let soundKey: string
    let config: AudioConfig = { volume: 0.5 }

    switch (type) {
      case "click":
        soundKey = this.SOUNDS.BUTTON_CLICK
        break
      case "select":
        soundKey = this.SOUNDS.MENU_SELECT
        break
      case "pause":
        soundKey = this.SOUNDS.PAUSE
        break
      case "resume":
        soundKey = this.SOUNDS.RESUME
        break
      case "game_over":
        soundKey = this.SOUNDS.GAME_OVER
        config.volume = 0.7
        break
      default:
        return
    }

    this.playSFX(soundKey, config)
  }

  // Volume controls
  public setMasterVolume(volume: number): void {
    this.masterVolume = Phaser.Math.Clamp(volume, 0, 1)
    this.updateAllVolumes()
    this.saveSettings()
  }

  public setSFXVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1)
    this.updateSFXVolumes()
    this.saveSettings()
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1)
    if (this.backgroundMusic) {
      ;(this.backgroundMusic as Phaser.Sound.WebAudioSound).setVolume(
        this.isMuted ? 0 : this.musicVolume * this.masterVolume
      )
    }
    this.saveSettings()
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted
    this.updateAllVolumes()
    this.saveSettings()
    return this.isMuted
  }

  private updateAllVolumes(): void {
    this.updateSFXVolumes()

    if (this.backgroundMusic) {
      ;(this.backgroundMusic as Phaser.Sound.WebAudioSound).setVolume(
        this.isMuted ? 0 : this.musicVolume * this.masterVolume
      )
    }
  }

  private updateSFXVolumes(): void {
    const finalSFXVolume = this.isMuted ? 0 : this.sfxVolume * this.masterVolume

    this.soundPools.forEach((pool) => {
      pool.sounds.forEach((sound) => {
        ;(sound as Phaser.Sound.WebAudioSound).setVolume(finalSFXVolume)
      })
    })
  }

  // Settings persistence
  private saveSettings(): void {
    const settings = {
      masterVolume: this.masterVolume,
      sfxVolume: this.sfxVolume,
      musicVolume: this.musicVolume,
      isMuted: this.isMuted,
    }

    try {
      localStorage.setItem("typing_hell_audio", JSON.stringify(settings))
    } catch (error) {
      console.warn("Failed to save audio settings:", error)
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem("typing_hell_audio")
      if (saved) {
        const settings = JSON.parse(saved)
        this.masterVolume = settings.masterVolume ?? 1
        this.sfxVolume = settings.sfxVolume ?? 0.7
        this.musicVolume = settings.musicVolume ?? 0.5
        this.isMuted = settings.isMuted ?? false
      }
    } catch (error) {
      console.warn("Failed to load audio settings:", error)
    }
  }

  // Getters
  public getMasterVolume(): number {
    return this.masterVolume
  }

  public getSFXVolume(): number {
    return this.sfxVolume
  }

  public getMusicVolume(): number {
    return this.musicVolume
  }

  public getIsMuted(): boolean {
    return this.isMuted
  }

  // Cleanup
  public destroy(): void {
    this.stopBackgroundMusic()

    this.soundPools.forEach((pool) => {
      pool.sounds.forEach((sound) => {
        if (sound) {
          sound.destroy()
        }
      })
    })

    this.soundPools.clear()
  }

  // Static method to preload audio assets
  static preloadAssets(scene: Phaser.Scene): void {
    // Note: In a real implementation, you would load actual audio files
    // For now, we'll create placeholder entries that can be replaced with real assets

    const audioAssets = [
      { key: "typing", path: "assets/audio/typing.wav" },
      { key: "correct_char", path: "assets/audio/correct.wav" },
      { key: "incorrect_char", path: "assets/audio/incorrect.wav" },
      { key: "word_complete", path: "assets/audio/word_complete.wav" },
      { key: "projectile_launch", path: "assets/audio/shoot.wav" },
      { key: "projectile_hit", path: "assets/audio/hit.wav" },
      { key: "enemy_death", path: "assets/audio/enemy_death.wav" },
      { key: "player_hurt", path: "assets/audio/player_hurt.wav" },
      { key: "level_up", path: "assets/audio/level_up.wav" },
      { key: "upgrade_select", path: "assets/audio/upgrade.wav" },
      { key: "pause", path: "assets/audio/pause.wav" },
      { key: "resume", path: "assets/audio/resume.wav" },
      { key: "game_over", path: "assets/audio/game_over.wav" },
      { key: "menu_select", path: "assets/audio/menu_select.wav" },
      { key: "button_click", path: "assets/audio/click.wav" },
      { key: "background_music", path: "assets/audio/background.mp3" },
    ]

    console.log("Audio assets to load:", audioAssets)
    // Commented out actual loading since we don't have the asset files
    // audioAssets.forEach(asset => {
    //   scene.load.audio(asset.key, asset.path)
    // })
  }
}
