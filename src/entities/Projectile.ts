import Phaser from 'phaser';
import { GameObject } from './GameObject';
import type { Projectile as IProjectile, Enemy } from '../types/interfaces';

export class Projectile extends GameObject implements IProjectile {
    public damage: number;
    public target: Enemy | null;
    public speed: number;
    
    private timeAlive: number = 0;
    private maxLifetime: number = 3000; // 3 seconds

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        damage: number,
        target: Enemy | null = null
    ) {
        super(scene, x, y, 'projectile');
        
        this.damage = damage;
        this.target = target;
        this.speed = 400;
        this.health = 1;
        this.maxHealth = 1;
        
        // Set sprite properties
        this.setDisplaySize(8, 8);
        this.setTint(0xffff44);
        
        // Add to physics
        scene.physics.add.existing(this);
        
        // Set initial velocity towards target
        this.launchTowardsTarget();
    }

    private launchTowardsTarget(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        if (this.target && this.target.active) {
            // Calculate direction to target
            const direction = new Phaser.Math.Vector2(
                this.target.x - this.x,
                this.target.y - this.y
            ).normalize();
            
            body.setVelocity(
                direction.x * this.speed,
                direction.y * this.speed
            );
            
            // Rotate projectile to face target
            this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        } else {
            // No target, just shoot upward
            body.setVelocity(0, -this.speed);
        }
    }

    public gameUpdate(_time: number, delta: number): void {
        this.timeAlive += delta;
        
        if (!this.active) return;
        
        // Update homing behavior if target exists and is alive
        if (this.target && this.target.active) {
            this.updateHoming(delta);
        }
        
        // Destroy if too old or off screen
        if (this.timeAlive > this.maxLifetime || this.isOffScreen()) {
            this.destroyGameObject();
        }
    }

    private updateHoming(_delta: number): void {
        if (!this.target || !this.target.active) return;
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        // Calculate new direction to target
        const direction = new Phaser.Math.Vector2(
            this.target.x - this.x,
            this.target.y - this.y
        ).normalize();
        
        // Apply some homing behavior (not perfect tracking)
        const currentVelocity = new Phaser.Math.Vector2(body.velocity.x, body.velocity.y).normalize();
        const targetVelocity = direction.scale(this.speed);
        
        // Interpolate between current and target velocity for smooth homing
        const homingStrength = 0.05; // Adjust for stronger/weaker homing
        const newVelocity = currentVelocity.lerp(targetVelocity.normalize(), homingStrength).scale(this.speed);
        
        body.setVelocity(newVelocity.x, newVelocity.y);
        
        // Update rotation
        this.rotation = Phaser.Math.Angle.Between(0, 0, newVelocity.x, newVelocity.y);
    }

    private isOffScreen(): boolean {
        const camera = this.scene.cameras.main;
        return (
            this.x < -50 ||
            this.x > camera.width + 50 ||
            this.y < -50 ||
            this.y > camera.height + 50
        );
    }

    public onHitTarget(): void {
        // Create hit effect
        this.createHitEffect();
        
        // Destroy the projectile
        this.destroyGameObject();
    }

    private createHitEffect(): void {
        // Create a simple flash effect
        const flash = this.scene.add.circle(this.x, this.y, 20, 0xffff00, 0.7);
        
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    public setTarget(target: Enemy | null): void {
        this.target = target;
        if (target) {
            this.launchTowardsTarget();
        }
    }

    public getDamage(): number {
        return this.damage;
    }

    public getTimeAlive(): number {
        return this.timeAlive;
    }
}