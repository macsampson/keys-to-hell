import Phaser from 'phaser';
import { GAME_CONFIG } from './src/config/GameConfig';
import { BrowserCompatibility } from './src/utils/BrowserCompatibility';

window.addEventListener('load', () => {
    // Initialize browser compatibility checker
    const compatibility = BrowserCompatibility.getInstance();
    
    // Apply polyfills for older browsers
    compatibility.applyPolyfills();
    
    // Show compatibility warnings if needed
    compatibility.showCompatibilityWarning();
    
    // Get recommended settings and apply to game config
    const recommendedSettings = compatibility.getRecommendedSettings();
    const gameConfig = { ...GAME_CONFIG };
    
    // Apply recommended settings to game config if needed
    if (recommendedSettings.targetFPS) {
        gameConfig.fps = { target: recommendedSettings.targetFPS };
    }
    
    // Initialize the game
    const game = new Phaser.Game(gameConfig);
    
    // Make browser info available globally for debugging
    (window as any).browserInfo = compatibility.getBrowserInfo();
    console.log('Browser compatibility:', compatibility.getBrowserInfo());
});