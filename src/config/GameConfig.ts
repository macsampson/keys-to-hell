import Phaser from 'phaser';
import { MenuScene } from '../scenes/MenuScene';
import { MainScene } from '../scenes/MainScene';
import { TestingScene } from '../scenes/TestingScene';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: '100%',
    height: '100%',
    parent: 'game',
    backgroundColor: '#1a1a2e',
    scene: [MenuScene, MainScene, TestingScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    audio: {
        disableWebAudio: false
    },
    input: {
        keyboard: true
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

export const GAME_CONSTANTS = {
    get CANVAS_WIDTH() { return window.innerWidth; },
    get CANVAS_HEIGHT() { return window.innerHeight; },
    PLAYER_SPEED: 200,
    PROJECTILE_SPEED: 400,
    ENEMY_SPAWN_RATE: 2000,
    TEXT_SCROLL_SPEED: 50,
    BASE_ATTACK_POWER: 10,
    BASE_HEALTH: 100,
    EXPERIENCE_BASE: 100,
    EXPERIENCE_MULTIPLIER: 1.5
};