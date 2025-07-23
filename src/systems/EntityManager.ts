import Phaser from "phaser"
import { Enemy } from "../entities/Enemy"
import { Projectile } from "../entities/Projectile"
import type {
  Enemy as IEnemy,
  Projectile as IProjectile,
} from "../types/interfaces"
import { MovementPattern } from "../types/interfaces"
import { VisualEffectsSystem } from "./VisualEffectsSystem"
import { AudioSystem } from "./AudioSystem"
import { GameBalanceManager } from "./GameBalanceManager"

export class EntityManager {
  private scene: Phaser.Scene
  private enemyGroup: Phaser.GameObjects.Group
  private projectileGroup: Phaser.GameObjects.Group
  private visualEffectsSystem: VisualEffectsSystem | null = null
  private audioSystem: AudioSystem | null = null
  private gameBalanceManager: GameBalanceManager | null = null

  // Enemy spawning
  private lastEnemySpawn: number = 0
  private enemySpawnRate: number = 5000 // milliseconds
  private maxEnemies: number = 50

  // Projectile pooling
  private projectilePool: Projectile[] = []
  private maxProjectilePool: number = 100

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.enemyGroup = scene.add.group()
    this.projectileGroup = scene.add.group()

    this.setupCollisions()
    this.initializeProjectilePool()
  }

  public setVisualEffectsSystem(
    visualEffectsSystem: VisualEffectsSystem
  ): void {
    this.visualEffectsSystem = visualEffectsSystem
  }

  public setAudioSystem(audioSystem: AudioSystem): void {
    this.audioSystem = audioSystem
  }

  public setGameBalanceManager(gameBalanceManager: GameBalanceManager): void {
    this.gameBalanceManager = gameBalanceManager
  }

  private setupCollisions(): void {
    // Set up collision between projectiles and enemies
    try {
      this.scene.physics.add.overlap(
        this.projectileGroup,
        this.enemyGroup,
        (projectileObj: any, enemyObj: any) => {
          try {
            this.handleProjectileEnemyCollision(projectileObj, enemyObj)
          } catch (error) {
            console.error("Error in collision handler:", error)
            // Only clean up if objects are truly problematic
            if (projectileObj && projectileObj.scene && !projectileObj.active) {
              this.returnProjectileToPool(projectileObj as Projectile)
            }
          }
        },
        // Add process callback to validate collision before handling
        (projectileObj: any, enemyObj: any) => {
          // Pre-validate objects before collision processing
          if (!projectileObj || !enemyObj) return false
          if (!projectileObj.active || !enemyObj.active) return false
          if (!projectileObj.scene || !enemyObj.scene) return false
          if (!projectileObj.visible) return false // Skip invisible (pooled) projectiles
          if ((projectileObj as any).hasCollided) return false // Skip already collided projectiles
          return true
        },
        this
      )
    } catch (error) {
      console.error("Error setting up collisions:", error)
    }
  }

  private initializeProjectilePool(): void {
    // Pre-create projectiles for object pooling
    for (let i = 0; i < this.maxProjectilePool; i++) {
      const projectile = new Projectile(this.scene, -100, -100, 0)
      projectile.setActive(false)
      projectile.setVisible(false)
      this.projectilePool.push(projectile)
    }
  }

  public update(time: number, delta: number): void {
    // Update all enemies - use array copy to avoid issues with modification during iteration
    const enemies = [...this.enemyGroup.children.entries]
    for (const enemy of enemies) {
      const enemyObj = enemy as Enemy
      if (enemyObj && enemyObj.active && enemyObj.scene) {
        try {
          enemyObj.gameUpdate(time, delta)
        } catch (error) {
          console.error("Error updating enemy:", error)
          // Remove problematic enemy
          this.enemyGroup.remove(enemyObj)
          enemyObj.destroy()
        }
      }
    }

    // Update all projectiles - use array copy to avoid issues with modification during iteration
    const projectiles = [...this.projectileGroup.children.entries]
    for (const projectile of projectiles) {
      const projectileObj = projectile as Projectile
      if (
        projectileObj &&
        projectileObj.active &&
        projectileObj.scene &&
        projectileObj.visible
      ) {
        try {
          projectileObj.gameUpdate(time, delta)
        } catch (error) {
          console.error("Error updating projectile:", error)
          // Only return to pool if it's a serious error, not just a minor update issue
          if (!projectileObj.scene || !projectileObj.active) {
            this.returnProjectileToPool(projectileObj)
          }
        }
      }
    }

    // Spawn enemies
    this.updateEnemySpawning(time)

    // Clean up destroyed objects
    this.cleanupDestroyedObjects()

    // Debug logging every 5 seconds
    if (Math.floor(time / 5000) !== Math.floor((time - delta) / 5000)) {
      this.logGameState()
    }
  }

  private updateEnemySpawning(time: number): void {
    if (
      time - this.lastEnemySpawn > this.enemySpawnRate &&
      this.getActiveEnemyCount() < this.maxEnemies
    ) {
      this.spawnBalancedEnemy()
      this.lastEnemySpawn = time
    }
  }

  public spawnEnemy(x: number, y: number, enemyType: string = "basic"): Enemy {
    const enemy = new Enemy(this.scene, x, y, enemyType)

    // Apply balanced stats if balance manager is available
    if (this.gameBalanceManager) {
      const currentLevel = this.getCurrentPlayerLevel()
      const balancedStats = this.gameBalanceManager.getEnemyStats(
        currentLevel,
        enemyType
      )
      enemy.setStats(
        balancedStats.health,
        balancedStats.damage,
        balancedStats.speed
      )
    }

    this.enemyGroup.add(enemy)
    return enemy
  }

  public spawnRandomEnemy(): Enemy {
    // Random spawn position at screen edge
    const spawnSide = Math.floor(Math.random() * 4)
    let x: number, y: number

    const camera = this.scene.cameras.main

    switch (spawnSide) {
      case 0: // Top
        x = Math.random() * camera.width
        y = -50
        break
      case 1: // Right
        x = camera.width + 50
        y = Math.random() * camera.height
        break
      case 2: // Bottom
        x = Math.random() * camera.width
        y = camera.height + 50
        break
      case 3: // Left
      default:
        x = -50
        y = Math.random() * camera.height
        break
    }

    // Use balance manager for enemy type selection if available
    let enemyType = "basic"
    if (this.gameBalanceManager) {
      const currentLevel = this.getCurrentPlayerLevel()
      const spawnSettings =
        this.gameBalanceManager.getSpawnSettings(currentLevel)
      enemyType =
        spawnSettings.enemyTypes[
          Math.floor(Math.random() * spawnSettings.enemyTypes.length)
        ]

      // Check for special enemy spawn
      if (this.gameBalanceManager.shouldSpawnSpecialEnemy(currentLevel)) {
        enemyType =
          spawnSettings.enemyTypes[spawnSettings.enemyTypes.length - 1] // Use most advanced enemy type
      }
    } else {
      // Fallback to old system
      const enemyTypes = ["basic", "fast", "tank"]
      const weights = [0.6, 0.3, 0.1]
      enemyType = this.weightedRandomChoice(enemyTypes, weights)
    }

    const enemy = this.spawnEnemy(x, y, enemyType)

    // Set random movement pattern
    const patterns = Object.values(MovementPattern)
    enemy.setMovementPattern(
      patterns[Math.floor(Math.random() * patterns.length)]
    )

    return enemy
  }

  private weightedRandomChoice(items: string[], weights: number[]): string {
    const random = Math.random()
    let sum = 0

    for (let i = 0; i < weights.length; i++) {
      sum += weights[i]
      if (random <= sum) {
        return items[i]
      }
    }

    return items[0]
  }

  public createProjectile(
    x: number,
    y: number,
    damage: number,
    target: Enemy | null = null
  ): Projectile {
    console.log(
      "EntityManager: Creating projectile at",
      x,
      y,
      "with damage",
      damage,
      "target:",
      target ? "exists" : "none"
    )

    // Try to get from pool first
    const projectile = this.getProjectileFromPool()

    if (projectile) {
      // Reset projectile from pool
      projectile.setPosition(x, y)
      projectile.damage = damage
      projectile.setTarget(target)
      projectile.setActive(true)
      projectile.setVisible(true)

      // Reset collision flag
      ;(projectile as any).hasCollided = false
      
      // CRITICAL: Reset timeAlive to prevent "too old" bug
      ;(projectile as any).timeAlive = 0

      // Reset physics body
      const body = projectile.body as Phaser.Physics.Arcade.Body
      if (body) {
        body.setVelocity(0, 0)
      }

      this.projectileGroup.add(projectile)
      console.log(
        `EntityManager: Reused pooled projectile [${projectile.getProjectileId()}]`
      )
      return projectile
    } else {
      // Create new projectile if pool is empty
      const newProjectile = new Projectile(this.scene, x, y, damage, target)
      ;(newProjectile as any).hasCollided = false
      this.projectileGroup.add(newProjectile)
      console.log(
        `EntityManager: Created new projectile [${newProjectile.getProjectileId()}]`
      )
      return newProjectile
    }
  }

  private getProjectileFromPool(): Projectile | null {
    for (const projectile of this.projectilePool) {
      if (!projectile.active) {
        return projectile
      }
    }
    return null
  }

  private returnProjectileToPool(projectile: Projectile): void {
    if (!projectile) {
      console.log("Cannot return projectile to pool - null projectile")
      return
    }

    console.log(
      `EntityManager: Returning projectile [${projectile.getProjectileId()}] to pool from (${projectile.x.toFixed(
        1
      )}, ${projectile.y.toFixed(
        1
      )}), alive: ${projectile.getTimeAlive()}ms, active: ${
        projectile.active
      }, visible: ${projectile.visible}`
    )

    // Don't require scene to exist for pool return (projectile might be in destruction process)

    // Reset collision flag
    ;(projectile as any).hasCollided = false

    // Reset projectile state
    projectile.setActive(false)
    projectile.setVisible(false)
    projectile.setPosition(-100, -100)

    // Reset physics if body exists
    const body = projectile.body as Phaser.Physics.Arcade.Body
    if (body) {
      body.setVelocity(0, 0)
    }

    // Remove from group
    this.projectileGroup.remove(projectile)

    console.log("EntityManager: Projectile returned to pool successfully")
  }

  private handleProjectileEnemyCollision(
    projectileObj: any,
    enemyObj: any
  ): void {
    const projectile = projectileObj as Projectile
    const enemy = enemyObj as Enemy

    console.log("Collision detected between projectile and enemy")

    // Enhanced validation to prevent phantom collisions
    if (!projectile || !enemy) {
      console.log("Collision ignored - null objects")
      return
    }

    // Check if objects are truly active and have valid scenes
    if (
      !projectile.active ||
      !enemy.active ||
      !projectile.scene ||
      !enemy.scene
    ) {
      console.log("Collision ignored - inactive objects or invalid scenes")
      return
    }

    // Check if projectile is visible (pooled projectiles are invisible)
    if (!projectile.visible) {
      console.log("Collision ignored - invisible projectile (likely pooled)")
      return
    }

    // Only check projectile collision flag - enemies should be able to take multiple hits
    if ((projectile as any).hasCollided) {
      console.log("Collision ignored - projectile already hit something")
      return
    }

    // Verify objects are still in their respective groups
    if (
      !this.projectileGroup.children.entries.includes(projectile) ||
      !this.enemyGroup.children.entries.includes(enemy)
    ) {
      console.log("Collision ignored - objects not in groups")
      return
    }

    // Mark projectile as collided to prevent it hitting multiple enemies
    ;(projectile as any).hasCollided = true

    console.log("Processing collision - applying damage")

    // Play projectile hit sound
    if (this.audioSystem) {
      this.audioSystem.playProjectileHitSound()
    }

    // Apply damage to enemy
    const isDead = enemy.takeDamage(projectile.getDamage())

    console.log("Enemy health after damage:", enemy.health, "Is dead:", isDead)

    // Handle enemy death
    if (isDead) {
      this.destroyEnemy(enemy)

      // Award experience points (will be handled by progression system later)
      this.scene.events.emit("enemyKilled", enemy.experienceValue)
    }

    // Destroy projectile
    this.destroyProjectile(projectile)
  }

  private destroyProjectile(projectile: Projectile): void {
    console.log(
      `EntityManager: Destroying projectile [${projectile.getProjectileId()}] at (${projectile.x.toFixed(
        1
      )}, ${projectile.y.toFixed(1)}), alive: ${projectile.getTimeAlive()}ms`
    )

    if (!projectile || !projectile.scene) {
      console.log(
        `EntityManager: Cannot destroy projectile [${projectile.getProjectileId()}] - invalid object`
      )
      return
    }

    try {
      // Hit effect removed - no visual flash
    } catch (error) {
      console.error(
        `EntityManager: Error creating hit effect for [${projectile.getProjectileId()}]:`,
        error
      )
    }

    // Return to pool or destroy
    this.returnProjectileToPool(projectile)
  }

  private destroyEnemy(enemy: Enemy): void {
    console.log("Destroying enemy")

    if (!enemy || !enemy.scene) {
      console.log("Cannot destroy enemy - invalid object")
      return
    }

    try {
      // Use visual effects system if available, otherwise fallback to simple effect
      if (this.visualEffectsSystem) {
        this.visualEffectsSystem.createEnemyDeathEffect(enemy.x, enemy.y)
      } else {
        // Fallback: Create simple death effect
        const explosion = this.scene.add.circle(
          enemy.x,
          enemy.y,
          15,
          0xff4444,
          0.8
        )

        // Simple fade out
        this.scene.tweens.add({
          targets: explosion,
          alpha: 0,
          scale: 2,
          duration: 200,
          onComplete: () => {
            if (explosion && explosion.scene) {
              explosion.destroy()
            }
          },
        })
      }
    } catch (error) {
      console.error("Error creating death effect:", error)
    }

    // Remove from group and destroy
    try {
      this.enemyGroup.remove(enemy)
      enemy.destroy()
    } catch (error) {
      console.error("Error destroying enemy:", error)
    }
  }

  private cleanupDestroyedObjects(): void {
    try {
      // Clean up destroyed enemies - use filter to avoid modifying array during iteration
      const inactiveEnemies = this.enemyGroup.children.entries.filter(
        (enemy) => enemy && (!enemy.active || !enemy.scene)
      )
      if (inactiveEnemies.length > 0) {
        console.log(
          `EntityManager: Cleaning up ${inactiveEnemies.length} inactive enemies`
        )
      }
      for (const enemy of inactiveEnemies) {
        if (enemy) {
          this.enemyGroup.remove(enemy)
          if (enemy.scene) {
            enemy.destroy()
          }
        }
      }

      // Clean up destroyed projectiles - be more careful about what we consider "inactive"
      // Only clean up projectiles that are truly destroyed, not just temporarily inactive
      const destroyedProjectiles = this.projectileGroup.children.entries.filter(
        (projectile) => {
          if (!projectile) return true

          const proj = projectile as Projectile
          // Only consider it destroyed if it has no scene OR if it's both inactive and invisible
          const shouldDestroy = !proj.scene || (!proj.active && !proj.visible)

          if (shouldDestroy && proj.scene) {
            console.log(
              `EntityManager: Marking projectile for cleanup - pos: (${proj.x.toFixed(
                1
              )}, ${proj.y.toFixed(1)}), active: ${proj.active}, visible: ${
                proj.visible
              }, hasScene: ${!!proj.scene}`
            )
          }

          return shouldDestroy
        }
      )

      if (destroyedProjectiles.length > 0) {
        console.log(
          `EntityManager: Cleaning up ${destroyedProjectiles.length} destroyed projectiles`
        )
      }

      for (const projectile of destroyedProjectiles) {
        if (projectile) {
          try {
            // Only return to pool if projectile still has a valid scene
            if (projectile.scene) {
              this.returnProjectileToPool(projectile as Projectile)
            } else {
              // If no scene, just remove from group
              console.log(
                "EntityManager: Removing projectile without scene from group"
              )
              this.projectileGroup.remove(projectile)
            }
          } catch (error) {
            console.error("Error handling destroyed projectile:", error)
            // Force remove if handling fails
            this.projectileGroup.remove(projectile)
          }
        }
      }
    } catch (error) {
      console.error("Error in cleanup:", error)
    }
  }

  public getNearestEnemy(x: number, y: number): Enemy | null {
    let nearestEnemy: Enemy | null = null
    let nearestDistance = Infinity

    this.enemyGroup.children.entries.forEach((enemy) => {
      const enemyObj = enemy as Enemy
      if (enemyObj.active) {
        const distance = Phaser.Math.Distance.Between(
          x,
          y,
          enemyObj.x,
          enemyObj.y
        )
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestEnemy = enemyObj
        }
      }
    })

    return nearestEnemy
  }

  public getWeakestEnemy(): Enemy | null {
    let weakestEnemy: Enemy | null = null
    let lowestHealth = Infinity

    this.enemyGroup.children.entries.forEach((enemy) => {
      const enemyObj = enemy as Enemy
      if (enemyObj.active && enemyObj.health < lowestHealth) {
        lowestHealth = enemyObj.health
        weakestEnemy = enemyObj
      }
    })

    return weakestEnemy
  }

  public getStrongestEnemy(): Enemy | null {
    let strongestEnemy: Enemy | null = null
    let highestHealth = -1

    this.enemyGroup.children.entries.forEach((enemy) => {
      const enemyObj = enemy as Enemy
      if (enemyObj.active && enemyObj.health > highestHealth) {
        highestHealth = enemyObj.health
        strongestEnemy = enemyObj
      }
    })

    return strongestEnemy
  }

  public getEnemiesInRange(x: number, y: number, range: number): Enemy[] {
    const enemiesInRange: Enemy[] = []

    this.enemyGroup.children.entries.forEach((enemy) => {
      const enemyObj = enemy as Enemy
      if (enemyObj.active) {
        const distance = Phaser.Math.Distance.Between(
          x,
          y,
          enemyObj.x,
          enemyObj.y
        )
        if (distance <= range) {
          enemiesInRange.push(enemyObj)
        }
      }
    })

    return enemiesInRange.sort((a, b) => {
      const distA = Phaser.Math.Distance.Between(x, y, a.x, a.y)
      const distB = Phaser.Math.Distance.Between(x, y, b.x, b.y)
      return distA - distB
    })
  }

  public getAllActiveEnemies(): Enemy[] {
    return this.enemyGroup.children.entries
      .filter((enemy) => enemy.active)
      .map((enemy) => enemy as Enemy)
  }

  public getActiveEnemyCount(): number {
    return this.enemyGroup.children.entries.filter((enemy) => enemy.active)
      .length
  }

  public getActiveProjectileCount(): number {
    return this.projectileGroup.children.entries.filter(
      (projectile) => projectile.active
    ).length
  }

  public setEnemySpawnRate(rate: number): void {
    this.enemySpawnRate = rate
  }

  public setMaxEnemies(max: number): void {
    this.maxEnemies = max
  }

  public getEnemyGroup(): Phaser.GameObjects.Group {
    return this.enemyGroup
  }

  public getProjectileGroup(): Phaser.GameObjects.Group {
    return this.projectileGroup
  }

  private logGameState(): void {
    const activeEnemies = this.getActiveEnemyCount()
    const activeProjectiles = this.getActiveProjectileCount()
    const totalEnemies = this.enemyGroup.children.entries.length
    const totalProjectiles = this.projectileGroup.children.entries.length

    console.log(
      `Game State - Active Enemies: ${activeEnemies}/${totalEnemies}, Active Projectiles: ${activeProjectiles}/${totalProjectiles}, Pool Size: ${this.projectilePool.length}`
    )
  }

  public clearAll(): void {
    // Clear all enemies
    const enemies = [...this.enemyGroup.children.entries]
    for (const enemy of enemies) {
      this.enemyGroup.remove(enemy)
      enemy.destroy()
    }

    // Clear all projectiles
    const projectiles = [...this.projectileGroup.children.entries]
    for (const projectile of projectiles) {
      this.returnProjectileToPool(projectile as Projectile)
    }

    console.log("All entities cleared")
  }

  public destroy(): void {
    this.enemyGroup.destroy()
    this.projectileGroup.destroy()
    this.projectilePool.forEach((projectile) => projectile.destroy())
    this.projectilePool = []
  }

  public spawnBalancedEnemy(): Enemy {
    return this.spawnRandomEnemy()
  }

  public updateSpawnSettings(spawnSettings: {
    spawnRate: number
    maxEnemies: number
    enemyTypes: string[]
  }): void {
    this.enemySpawnRate = spawnSettings.spawnRate
    this.maxEnemies = spawnSettings.maxEnemies
    console.log(
      `Updated spawn settings: rate=${spawnSettings.spawnRate}ms, max=${
        spawnSettings.maxEnemies
      }, types=[${spawnSettings.enemyTypes.join(", ")}]`
    )
  }

  private getCurrentPlayerLevel(): number {
    // Get current player level from the scene's progression system
    const mainScene = this.scene as any
    return mainScene.progressionSystem?.level || 1
  }
}
