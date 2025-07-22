import Phaser from "phaser"

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  renderTime: number
  updateTime: number
  averageFPS: number
  minFPS: number
  maxFPS: number
  droppedFrames: number
}

export interface PerformanceSettings {
  maxEntities: number
  particleQuality: "low" | "medium" | "high"
  effectsEnabled: boolean
  cullDistance: number
  targetFPS: number
  adaptiveQuality: boolean
}

export class PerformanceManager {
  private scene: Phaser.Scene
  private metrics: PerformanceMetrics
  private settings: PerformanceSettings
  
  private frameHistory: number[] = []
  private maxFrameHistory = 60 // Track last 60 frames
  private lastFrameTime = 0
  private updateStartTime = 0
  private renderStartTime = 0
  
  // Culling
  private cullBounds: Phaser.Geom.Rectangle
  private visibleEntities = new Set<Phaser.GameObjects.GameObject>()
  
  // Quality scaling
  private qualityLevel = 1.0
  private lastQualityAdjustment = 0
  private qualityAdjustmentInterval = 1000 // 1 second

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      renderTime: 0,
      updateTime: 0,
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      droppedFrames: 0
    }
    
    this.settings = {
      maxEntities: 200,
      particleQuality: "high",
      effectsEnabled: true,
      cullDistance: 100,
      targetFPS: 60,
      adaptiveQuality: true
    }
    
    // Set up culling bounds (screen + buffer)
    const camera = scene.cameras.main
    this.cullBounds = new Phaser.Geom.Rectangle(
      -this.settings.cullDistance,
      -this.settings.cullDistance,
      camera.width + this.settings.cullDistance * 2,
      camera.height + this.settings.cullDistance * 2
    )
    
    this.loadSettings()
    this.setupPerformanceTracking()
  }

  public startFrame(): void {
    this.lastFrameTime = performance.now()
  }

  public startUpdate(): void {
    this.updateStartTime = performance.now()
  }

  public endUpdate(): void {
    this.metrics.updateTime = performance.now() - this.updateStartTime
  }

  public startRender(): void {
    this.renderStartTime = performance.now()
  }

  public endRender(): void {
    this.metrics.renderTime = performance.now() - this.renderStartTime
  }

  public endFrame(): void {
    const frameTime = performance.now() - this.lastFrameTime
    this.metrics.frameTime = frameTime
    this.metrics.fps = Math.round(1000 / frameTime)
    
    // Track frame history
    this.frameHistory.push(this.metrics.fps)
    if (this.frameHistory.length > this.maxFrameHistory) {
      this.frameHistory.shift()
    }
    
    // Calculate running metrics
    this.updateRunningMetrics()
    
    // Adaptive quality scaling
    if (this.settings.adaptiveQuality) {
      this.updateQualityScaling()
    }
  }

  private updateRunningMetrics(): void {
    if (this.frameHistory.length === 0) return
    
    const sum = this.frameHistory.reduce((a, b) => a + b, 0)
    this.metrics.averageFPS = Math.round(sum / this.frameHistory.length)
    this.metrics.minFPS = Math.min(...this.frameHistory)
    this.metrics.maxFPS = Math.max(...this.frameHistory)
    
    // Count dropped frames (below 85% of target)
    const dropThreshold = this.settings.targetFPS * 0.85
    this.metrics.droppedFrames = this.frameHistory.filter(fps => fps < dropThreshold).length
  }

  private updateQualityScaling(): void {
    const now = performance.now()
    if (now - this.lastQualityAdjustment < this.qualityAdjustmentInterval) {
      return
    }
    
    this.lastQualityAdjustment = now
    
    const targetFPS = this.settings.targetFPS
    const currentFPS = this.metrics.averageFPS
    const fpsRatio = currentFPS / targetFPS
    
    // Adjust quality based on performance
    if (fpsRatio < 0.8 && this.qualityLevel > 0.3) {
      // Performance is poor, reduce quality
      this.qualityLevel = Math.max(0.3, this.qualityLevel - 0.1)
      this.applyQualitySettings()
      console.log(`Performance: Reduced quality to ${this.qualityLevel.toFixed(1)} (FPS: ${currentFPS})`)
    } else if (fpsRatio > 0.95 && this.qualityLevel < 1.0) {
      // Performance is good, increase quality
      this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.05)
      this.applyQualitySettings()
      console.log(`Performance: Increased quality to ${this.qualityLevel.toFixed(1)} (FPS: ${currentFPS})`)
    }
  }

  private applyQualitySettings(): void {
    // Adjust particle quality
    if (this.qualityLevel < 0.5) {
      this.settings.particleQuality = "low"
      this.settings.maxEntities = 100
    } else if (this.qualityLevel < 0.8) {
      this.settings.particleQuality = "medium"
      this.settings.maxEntities = 150
    } else {
      this.settings.particleQuality = "high"
      this.settings.maxEntities = 200
    }
    
    // Disable effects if performance is very poor
    this.settings.effectsEnabled = this.qualityLevel > 0.4
    
    // Emit quality change event
    this.scene.events.emit("qualityChanged", {
      qualityLevel: this.qualityLevel,
      settings: this.settings
    })
  }

  // Viewport culling
  public cullEntities(entities: any[]): any[] {
    this.visibleEntities.clear()
    
    const camera = this.scene.cameras.main
    const viewBounds = new Phaser.Geom.Rectangle(
      camera.scrollX - this.settings.cullDistance,
      camera.scrollY - this.settings.cullDistance,
      camera.width + this.settings.cullDistance * 2,
      camera.height + this.settings.cullDistance * 2
    )
    
    const visibleEntities: any[] = []
    
    for (const entity of entities) {
      if (!entity.active) continue
      
      // Check if entity has position properties
      if (typeof entity.x !== 'number' || typeof entity.y !== 'number') continue
      
      const bounds = entity.getBounds ? entity.getBounds() : 
        new Phaser.Geom.Rectangle(entity.x - 25, entity.y - 25, 50, 50)
      
      if (Phaser.Geom.Rectangle.Overlaps(viewBounds, bounds)) {
        visibleEntities.push(entity)
        this.visibleEntities.add(entity)
        
        // Make sure entity is visible
        if (entity.setVisible && entity.visible === false) {
          entity.setVisible(true)
        }
      } else {
        // Hide off-screen entities
        if (entity.setVisible && entity.visible === true) {
          entity.setVisible(false)
        }
      }
    }
    
    return visibleEntities
  }

  public isEntityVisible(entity: Phaser.GameObjects.GameObject): boolean {
    return this.visibleEntities.has(entity)
  }

  // Object pooling helpers
  public shouldSpawnEntity(): boolean {
    const activeCount = this.scene.children.list.filter(child => child.active).length
    return activeCount < this.settings.maxEntities
  }

  public getOptimalEntityCount(): number {
    return Math.floor(this.settings.maxEntities * this.qualityLevel)
  }

  // Performance monitoring
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public getSettings(): PerformanceSettings {
    return { ...this.settings }
  }

  public updateSettings(newSettings: Partial<PerformanceSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
    this.applyQualitySettings()
  }

  private setupPerformanceTracking(): void {
    // Monitor memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn("Performance: High memory usage detected")
          this.scene.events.emit("highMemoryUsage", memory)
        }
      }, 5000)
    }
  }

  // Debug overlay
  public createDebugDisplay(): Phaser.GameObjects.Text {
    const debugText = this.scene.add.text(10, 10, "", {
      fontSize: "12px",
      color: "#00ff00",
      fontFamily: "monospace",
      backgroundColor: "#000000",
      padding: { x: 5, y: 5 }
    })
    
    debugText.setDepth(10000)
    debugText.setScrollFactor(0)
    
    return debugText
  }

  public updateDebugDisplay(debugText: Phaser.GameObjects.Text): void {
    const metrics = this.getMetrics()
    const visible = this.visibleEntities.size
    const total = this.scene.children.list.filter(child => child.active).length
    
    debugText.setText([
      `FPS: ${metrics.fps} (avg: ${metrics.averageFPS})`,
      `Frame: ${metrics.frameTime.toFixed(1)}ms`,
      `Update: ${metrics.updateTime.toFixed(1)}ms`,
      `Render: ${metrics.renderTime.toFixed(1)}ms`,
      `Quality: ${(this.qualityLevel * 100).toFixed(0)}%`,
      `Entities: ${visible}/${total}`,
      `Dropped: ${metrics.droppedFrames}/${this.maxFrameHistory}`
    ].join('\n'))
  }

  // Benchmark utilities
  public startBenchmark(name: string): void {
    console.time(`Benchmark: ${name}`)
  }

  public endBenchmark(name: string): void {
    console.timeEnd(`Benchmark: ${name}`)
  }

  public measureFunction<T>(name: string, fn: () => T): T {
    this.startBenchmark(name)
    const result = fn()
    this.endBenchmark(name)
    return result
  }

  private saveSettings(): void {
    try {
      localStorage.setItem("typing_hell_performance", JSON.stringify(this.settings))
    } catch (error) {
      console.warn("Failed to save performance settings:", error)
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem("typing_hell_performance")
      if (saved) {
        const settings = JSON.parse(saved)
        this.settings = { ...this.settings, ...settings }
      }
    } catch (error) {
      console.warn("Failed to load performance settings:", error)
    }
  }

  public destroy(): void {
    this.visibleEntities.clear()
    this.frameHistory = []
  }
}