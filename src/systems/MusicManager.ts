import { AudioSystem } from './AudioSystem'

/**
 * Global music manager that persists across scenes
 * Manages music state and transitions between different scenes
 */
export class MusicManager {
  private static instance: MusicManager | null = null
  private currentTrack: string | null = null
  private audioSystem: AudioSystem | null = null
  private volume: number = 0.1

  private constructor() {}

  public static getInstance(): MusicManager {
    if (!MusicManager.instance) {
      MusicManager.instance = new MusicManager()
    }
    return MusicManager.instance
  }

  public setAudioSystem(audioSystem: AudioSystem): void {
    this.audioSystem = audioSystem
  }

  public playTrack(trackKey: string, loop: boolean = true, fadeIn: boolean = false): void {
    if (!this.audioSystem) {
      console.warn('MusicManager: No AudioSystem registered')
      return
    }

    // Don't restart the same track
    if (this.currentTrack === trackKey && this.audioSystem.hasBackgroundMusic()) {
      return
    }

    this.currentTrack = trackKey

    if (fadeIn) {
      this.audioSystem.fadeInMusic(trackKey, 1000, { loop, volume: this.volume })
    } else {
      this.audioSystem.playMusic(trackKey, { loop, volume: this.volume })
    }

    console.log(`MusicManager: Playing track "${trackKey}"`)
  }

  public stopTrack(fadeOut: boolean = false): void {
    if (!this.audioSystem) return

    if (fadeOut) {
      this.audioSystem.fadeOutMusic(1000)
    } else {
      this.audioSystem.stopMusic()
    }

    this.currentTrack = null
    console.log('MusicManager: Stopped current track')
  }

  public crossfadeToTrack(trackKey: string, loop: boolean = true): void {
    if (!this.audioSystem) {
      console.warn('MusicManager: No AudioSystem registered')
      return
    }

    this.currentTrack = trackKey
    this.audioSystem.crossfadeMusic(trackKey, 2000, { loop, volume: this.volume })
    console.log(`MusicManager: Crossfading to track "${trackKey}"`)
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.audioSystem) {
      this.audioSystem.setMusicVolume(this.volume)
    }
  }

  public getCurrentTrack(): string | null {
    return this.currentTrack
  }

  public isPlaying(): boolean {
    return this.audioSystem?.hasBackgroundMusic() || false
  }

  // Predefined track management for different scenes/states
  public playMenuMusic(): void {
    this.playTrack('main_menu', true, true)
  }

  public playGameMusic(level: number = 1): void {
    const trackKey = `level_${Math.min(level, 7)}` // Max 7 levels
    this.playTrack(trackKey, true, false)
  }

  public stopAllMusic(fadeOut: boolean = true): void {
    this.stopTrack(fadeOut)
  }

  // Scene transition helpers
  public onSceneStart(sceneName: string, level?: number): void {
    switch (sceneName) {
      case 'MainScene':
        if (level && level > 0) {
          this.playGameMusic(level)
        } else {
          this.playMenuMusic()
        }
        break
      case 'MenuScene':
        this.playMenuMusic()
        break
      default:
        // For unknown scenes, stop music
        this.stopAllMusic(true)
        break
    }
  }

  public onSceneShutdown(): void {
    // Don't automatically stop music on scene shutdown
    // Let the new scene decide what to do
    console.log('MusicManager: Scene shutdown detected')
  }
}