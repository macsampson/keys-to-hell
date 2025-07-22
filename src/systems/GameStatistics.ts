import type { GameStatistics as IGameStatistics } from "../types/interfaces"

export class GameStatistics implements IGameStatistics {
  public wordsTyped: number = 0
  public charactersTyped: number = 0
  public correctCharacters: number = 0
  public enemiesKilled: number = 0
  public survivalTime: number = 0
  public highestLevel: number = 1
  public totalExperience: number = 0
  public upgradesSelected: number = 0

  private gameStartTime: number = 0
  private sessionStartTime: number = Date.now()

  constructor() {
    this.reset()
  }

  public startSession(): void {
    this.gameStartTime = Date.now()
    this.sessionStartTime = this.gameStartTime
  }

  public updateSurvivalTime(): void {
    if (this.gameStartTime > 0) {
      this.survivalTime = Date.now() - this.gameStartTime
    }
  }

  public addWord(): void {
    this.wordsTyped++
  }

  public addCharacter(isCorrect: boolean): void {
    this.charactersTyped++
    if (isCorrect) {
      this.correctCharacters++
    }
  }

  public addEnemyKill(): void {
    this.enemiesKilled++
  }

  public updateLevel(newLevel: number): void {
    if (newLevel > this.highestLevel) {
      this.highestLevel = newLevel
    }
  }

  public addExperience(amount: number): void {
    this.totalExperience += amount
  }

  public addUpgrade(): void {
    this.upgradesSelected++
  }

  public getAccuracy(): number {
    if (this.charactersTyped === 0) return 0
    return Math.round((this.correctCharacters / this.charactersTyped) * 100)
  }

  public getWordsPerMinute(): number {
    if (this.survivalTime === 0) return 0
    const minutes = this.survivalTime / (1000 * 60)
    return Math.round(this.wordsTyped / minutes)
  }

  public getScore(): number {
    // Score calculation based on multiple factors
    const baseScore = this.enemiesKilled * 10
    const levelBonus = this.highestLevel * 50
    const accuracyBonus = this.getAccuracy() * 2
    const wpmBonus = this.getWordsPerMinute() * 5
    const survivalBonus = Math.floor(this.survivalTime / 1000) // 1 point per second

    return baseScore + levelBonus + accuracyBonus + wpmBonus + survivalBonus
  }

  public getDetailedScore(): {
    total: number
    enemyScore: number
    levelScore: number
    accuracyScore: number
    wpmScore: number
    survivalScore: number
  } {
    const enemyScore = this.enemiesKilled * 10
    const levelScore = this.highestLevel * 50
    const accuracyScore = this.getAccuracy() * 2
    const wpmScore = this.getWordsPerMinute() * 5
    const survivalScore = Math.floor(this.survivalTime / 1000)

    return {
      total: enemyScore + levelScore + accuracyScore + wpmScore + survivalScore,
      enemyScore,
      levelScore,
      accuracyScore,
      wpmScore,
      survivalScore,
    }
  }

  public getSessionDuration(): number {
    return Date.now() - this.sessionStartTime
  }

  public getSummary(): {
    score: number
    accuracy: number
    wpm: number
    wordsTyped: number
    enemiesKilled: number
    level: number
    survivalTime: string
    upgrades: number
  } {
    return {
      score: this.getScore(),
      accuracy: this.getAccuracy(),
      wpm: this.getWordsPerMinute(),
      wordsTyped: this.wordsTyped,
      enemiesKilled: this.enemiesKilled,
      level: this.highestLevel,
      survivalTime: this.formatTime(this.survivalTime),
      upgrades: this.upgradesSelected,
    }
  }

  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  public reset(): void {
    this.wordsTyped = 0
    this.charactersTyped = 0
    this.correctCharacters = 0
    this.enemiesKilled = 0
    this.survivalTime = 0
    this.highestLevel = 1
    this.totalExperience = 0
    this.upgradesSelected = 0
    this.gameStartTime = 0
  }

  // Serialize for storage
  public toJSON(): string {
    return JSON.stringify({
      wordsTyped: this.wordsTyped,
      charactersTyped: this.charactersTyped,
      correctCharacters: this.correctCharacters,
      enemiesKilled: this.enemiesKilled,
      survivalTime: this.survivalTime,
      highestLevel: this.highestLevel,
      totalExperience: this.totalExperience,
      upgradesSelected: this.upgradesSelected,
      gameStartTime: this.gameStartTime,
      sessionStartTime: this.sessionStartTime,
    })
  }

  // Deserialize from storage
  public fromJSON(json: string): void {
    try {
      const data = JSON.parse(json)
      Object.assign(this, data)
    } catch (error) {
      console.error("Failed to load game statistics:", error)
      this.reset()
    }
  }
}