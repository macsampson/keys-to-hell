import Phaser from 'phaser';
import { GameObject } from './GameObject';
import type { Player as IPlayer } from '../types/interfaces';

export class Player extends GameObject implements IPlayer {
    public attackPower: number;
    public attackMultiplier: number;
    public typingSpeed: number;
    public level: number;
    public position: Phaser.Math.Vector2;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Use a simple colored rectangle as placeholder texture
        super(scene, x, y, 'player');
        
        // Initialize player stats
        this.health = 100;
        this.maxHealth = 100;
        this.attackPower = 10;
        this.attackMultiplier = 1;
        this.typingSpeed = 1.0;
        this.level = 1;
        
        // Initialize position vector
        this.position = new Phaser.Math.Vector2(x, y);
        
        // Set up player appearance (placeholder)
        this.setDisplaySize(32, 32);
        this.setTint(0x00ff00); // Green player
        
        // Enable physics if available
        if (scene.physics && scene.physics.world) {
            scene.physics.world.enable(this);
        }
    }

    public gameUpdate(time: number, delta: number): void {
        // Update position vector to match sprite position
        this.position.set(this.x, this.y);
    }

    public takeDamage(damage: number): boolean {
        const isDead = super.takeDamage(damage);
        
        // Add screen shake effect for player damage
        if (this.scene.cameras.main) {
            this.scene.cameras.main.shake(200, 0.01);
        }
        
        return isDead;
    }

    public moveToPosition(x: number, y: number): void {
        this.setPosition(x, y);
        this.position.set(x, y);
    }

    public increaseAttackPower(amount: number): void {
        this.attackPower += amount;
    }

    public increaseAttackMultiplier(multiplier: number): void {
        this.attackMultiplier += multiplier;
    }

    public increaseTypingSpeed(amount: number): void {
        this.typingSpeed += amount;
    }

    public levelUp(): void {
        this.level++;
        
        // Add level up visual effect
        this.scene.add.text(this.x, this.y - 50, 'LEVEL UP!', {
            fontSize: '16px',
            color: '#ffff00'
        }).setDepth(1000);
    }

    public getStats(): {
        health: number;
        maxHealth: number;
        attackPower: number;
        attackMultiplier: number;
        typingSpeed: number;
        level: number;
    } {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            attackPower: this.attackPower,
            attackMultiplier: this.attackMultiplier,
            typingSpeed: this.typingSpeed,
            level: this.level
        };
    }
}