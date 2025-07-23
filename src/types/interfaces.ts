import Phaser from 'phaser';

export interface GameObject extends Phaser.GameObjects.Sprite {
    health: number;
    maxHealth: number;
    gameUpdate(time: number, delta: number): void;
}

export interface Enemy extends GameObject {
    damage: number;
    experienceValue: number;
    movementPattern: MovementPattern;
    target: Phaser.Math.Vector2;
}

export interface Projectile extends GameObject {
    damage: number;
    target: Enemy | null;
    speed: number;
}

export interface Player extends GameObject {
    position: Phaser.Math.Vector2;
    attackPower: number;
    attackMultiplier: number;
    typingSpeed: number;
    level: number;

    // Projectile upgrades
    projectileCount: number;
    piercingCount: number;
    hasSeekingProjectiles: boolean;
    seekingStrength: number;

    // AOE upgrades
    hasWordBlast: boolean;
    blastRadius: number;
    blastDamage: number;
    hasChainLightning: boolean;
    chainJumps: number;
    chainRange: number;

    // Special weapons
    hasLaserBeam: boolean;
    laserDamagePerSecond: number;
    laserWidth: number;
    turretCount: number;
    turretDamage: number;

    // Sentence upgrades
    hasSentenceSlam: boolean;
    sentenceDamageMultiplier: number;
    hasComboSystem: boolean;
    maxComboMultiplier: number;

    // Health & regen
    hasRegeneration: boolean;
    regenRate: number;

    // Shields
    hasTypingShield: boolean;
    shieldPerWord: number;
    maxShield: number;
    currentShield: number;
    hasWordBarrier: boolean;
    barrierStrength: number;

    // Deflection & Reflection
    hasProjectileDeflection: boolean;
    deflectionChance: number;
    hasDamageReflection: boolean;
    reflectionDamage: number;

    // Aura & Area Control
    hasSlowingAura: boolean;
    slowAuraRadius: number;
    slowStrength: number;
    hasDamageAura: boolean;
    auraRadius: number;
    auraDamagePerSecond: number;
    hasRepulsionField: boolean;
    repulsionRadius: number;
    repulsionStrength: number;

    // Temporal & Reality
    hasTimeDilation: boolean;
    dilationStrength: number;
    dilationDuration: number;
    hasRewind: boolean;
    rewindCharges: number;
    rewindHealAmount: number;
    hasStasisField: boolean;
    stasisDuration: number;
    stasisRadius: number;

    // Utility
    magnetRange: number;
    magnetStrength: number;

    // Methods
    onWordCompleted(): void;
    onPerfectWord(): void;
    onSentenceCompleted(): void;
}

export interface GameState {
    player: Player;
    enemies: Enemy[];
    projectiles: Projectile[];
    typingSystem: TypingSystem;
    progressionSystem: ProgressionSystem;
    gameTime: number;
    score: number;
    isGameActive: boolean;
}

export interface TypingSystem {
    currentText: string;
    typedText: string;
    scrollPosition: number;
    wordsCompleted: number;
    textObject: Phaser.GameObjects.Text;

    updateText(deltaTime: number): void;
    processInput(character: string): boolean;
    onWordComplete(): void;
    generateNewText(): void;
}

export interface TextRenderer {
    renderScrollingText(
        textObject: Phaser.GameObjects.Text,
        text: string,
        position: number
    ): void;
    highlightTypedText(
        textObject: Phaser.GameObjects.Text,
        typedLength: number
    ): void;
}

export interface CombatSystem {
    autoTargeting: AutoTargeting;
    projectileManager: ProjectileManager;

    launchAttack(attackPower: number, multiHit: number): void;
    selectTarget(): Enemy | null;
    processCollisions(): void;
}

export interface AutoTargeting {
    findNearestEnemy(): Enemy | null;
    findWeakestEnemy(): Enemy | null;
    prioritizeTarget(enemies: Enemy[]): Enemy;
}

export interface ProjectileManager {
    createProjectile(damage: number, target: Enemy): Projectile;
    updateProjectiles(time: number, delta: number): void;
    destroyProjectile(projectile: Projectile): void;
}

export interface ProgressionSystem {
    level: number;
    experience: number;
    experienceToNext: number;
    availableUpgrades: any[]; // Using any[] to support BaseUpgrade

    addExperience(amount: number): void;
    levelUp(): void;
    selectUpgrade(upgrade: any): void; // Using any to support BaseUpgrade
}

// Legacy interface - keeping for backward compatibility
export interface Upgrade {
    id: string;
    name: string;
    description: string;
    effect: UpgradeEffect;
    apply(player: Player): void;
}

export interface TextContent {
    sentences: string[];
    currentSentenceIndex: number;
    difficulty: TextDifficulty;

    getNextSentence(): string;
    adjustDifficulty(level: number): void;
}

export enum TextDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
    EXPERT = 'expert',
}

export enum MovementPattern {
    STRAIGHT = 'straight',
    SINE_WAVE = 'sine_wave',
    SPIRAL = 'spiral',
    HOMING = 'homing',
}

export enum UpgradeEffect {
    ATTACK_POWER = 'attack_power',
    MULTI_HIT = 'multi_hit',
    TYPING_SPEED = 'typing_speed',
    HEALTH = 'health',
    ATTACK_SPEED = 'attack_speed',
}

export enum GameStateType {
    MENU = 'menu',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'game_over',
    LEVEL_UP = 'level_up',
}

export interface GameStateManager {
    currentState: GameStateType;
    previousState: GameStateType | null;
    
    changeState(newState: GameStateType): void;
    pauseGame(): void;
    resumeGame(): void;
    startGame(): void;
    endGame(): void;
    restartGame(): void;
}

export interface GameStatistics {
    wordsTyped: number;
    charactersTyped: number;
    correctCharacters: number;
    enemiesKilled: number;
    survivalTime: number;
    highestLevel: number;
    totalExperience: number;
    upgradesSelected: number;
    
    getAccuracy(): number;
    getWordsPerMinute(): number;
    getScore(): number;
}