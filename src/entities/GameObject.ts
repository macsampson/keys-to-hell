import Phaser from 'phaser';
import type { GameObject as IGameObject } from '../types/interfaces';

export abstract class GameObject extends Phaser.GameObjects.Sprite implements IGameObject {
    public health: number;
    public maxHealth: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        frame?: string | number
    ) {
        super(scene, x, y, texture, frame);
        
        // Add to scene
        scene.add.existing(this);
        
        // Initialize health
        this.health = 100;
        this.maxHealth = 100;
    }

    public takeDamage(damage: number): boolean {
        this.health = Math.max(0, this.health - damage);
        
        // Create damage flash effect
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
        
        return this.health <= 0;
    }

    public heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    public isAlive(): boolean {
        return this.health > 0;
    }

    public getHealthPercentage(): number {
        return this.health / this.maxHealth;
    }

    public abstract gameUpdate(time: number, delta: number): void;

    protected destroyGameObject(): void {
        this.destroy();
    }
}