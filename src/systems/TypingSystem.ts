import Phaser from 'phaser';
import type { TypingSystem as ITypingSystem } from '../types/interfaces';
import { GAME_CONSTANTS } from '../config/GameConfig';
import { TextContentManager } from './TextContentManager';
import { GameStateManager } from './GameStateManager';

export class TypingSystem implements ITypingSystem {
    public currentText: string = '';
    public typedText: string = '';
    public scrollPosition: number = 0;
    public wordsCompleted: number = 0;
    public textObject: Phaser.GameObjects.Text;
    
    private scene: Phaser.Scene;
    private typedTextObject: Phaser.GameObjects.Text;
    private currentCharObject: Phaser.GameObjects.Text;
    private remainingTextObject: Phaser.GameObjects.Text;
    private cursorObject: Phaser.GameObjects.Rectangle;
    private errorIndicator: Phaser.GameObjects.Text;
    private backgroundBox: Phaser.GameObjects.Rectangle;
    private textContentManager: TextContentManager | null = null;
    private gameStateManager: GameStateManager | null = null;
    
    // Text content arrays for different difficulties
    private sentences: string[] = [
        "The quick brown fox jumps over the lazy dog",
        "Programming is the art of telling another human what one wants the computer to do",
        "In the midst of chaos there is also opportunity",
        "Code is like humor when you have to explain it its bad",
        "First solve the problem then write the code",
        "The best way to predict the future is to implement it",
        "Talk is cheap show me the code",
        "Any fool can write code that a computer can understand",
        "Good programmers write code that humans can understand",
        "Experience is the name everyone gives to their mistakes"
    ];
    
    private currentSentenceIndex: number = 0;
    private textScrollSpeed: number = GAME_CONSTANTS.TEXT_SCROLL_SPEED;
    private hasTypingError: boolean = false;
    private lastWordCompleteTime: number = 0;
    
    // Visual properties
    private textDisplayArea = {
        get x() { return 50; },
        get y() { return 50; },
        get width() { return GAME_CONSTANTS.CANVAS_WIDTH - 100; },
        height: 200
    };

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        
        // Create background box for text area
        this.backgroundBox = scene.add.rectangle(
            this.textDisplayArea.x,
            this.textDisplayArea.y,
            this.textDisplayArea.width,
            this.textDisplayArea.height,
            0x2a2a4a,
            0.8
        ).setOrigin(0, 0);
        
        // Create text objects for different parts
        const textStyle = {
            fontSize: '24px',
            fontFamily: 'Courier New',
            wordWrap: {
                width: this.textDisplayArea.width - 40
            },
            lineSpacing: 8
        };

        // Main text object (will be hidden, used for measurements)
        this.textObject = scene.add.text(
            this.textDisplayArea.x + 20,
            this.textDisplayArea.y + 20,
            '',
            { ...textStyle, color: '#ffffff' }
        );

        // Typed text (green)
        this.typedTextObject = scene.add.text(
            this.textDisplayArea.x + 20,
            this.textDisplayArea.y + 20,
            '',
            { ...textStyle, color: '#44ff44' }
        );

        // Current character (highlighted)
        this.currentCharObject = scene.add.text(
            this.textDisplayArea.x + 20,
            this.textDisplayArea.y + 20,
            '',
            { ...textStyle, color: '#000000', backgroundColor: '#ffff44' }
        );

        // Remaining text (white)
        this.remainingTextObject = scene.add.text(
            this.textDisplayArea.x + 20,
            this.textDisplayArea.y + 20,
            '',
            { ...textStyle, color: '#cccccc' }
        );
        
        // Create cursor indicator
        this.cursorObject = scene.add.rectangle(
            this.textObject.x,
            this.textObject.y,
            3,
            28,
            0xffff00,
            0.8
        ).setOrigin(0, 0);
        
        // Create error indicator
        this.errorIndicator = scene.add.text(
            this.textDisplayArea.x + this.textDisplayArea.width - 150,
            this.textDisplayArea.y + 10,
            '',
            {
                fontSize: '18px',
                fontFamily: 'Courier New',
                color: '#ff4444'
            }
        );
        
        // Make cursor blink
        this.startCursorBlink();
        
        // Generate initial text
        this.generateNewText();
        
        // Set up input handling
        this.setupInputHandling();
    }
    
    public setTextContentManager(textContentManager: TextContentManager): void {
        this.textContentManager = textContentManager;
    }
    
    public setGameStateManager(gameStateManager: GameStateManager): void {
        this.gameStateManager = gameStateManager;
    }

    private setupInputHandling(): void {
        // Listen for custom events from MainScene instead of directly handling keyboard
        this.scene.events.on('typingInput', (character: string) => {
            this.processInput(character);
        });
        
        this.scene.events.on('backspaceInput', () => {
            this.handleBackspace();
        });
    }

    public processInput(character: string): boolean {
        if (this.currentText.length === 0) return false;
        
        const expectedChar = this.currentText[this.typedText.length];
        const isCorrect = character === expectedChar;
        
        if (isCorrect) {
            this.typedText += character;
            this.hasTypingError = false;
            this.clearErrorIndicator();
            
            // Check for word completion
            this.checkWordCompletion();
            
            // Check for sentence completion
            if (this.typedText === this.currentText) {
                this.onSentenceComplete();
            }
            
            this.updateTextDisplay();
            this.updateCursorPosition();
            
            // Emit typing success event for audio feedback
            this.scene.events.emit('typingSuccess', character);
            
        } else {
            this.hasTypingError = true;
            this.showTypingError(character, expectedChar);
            
            // Emit typing error event for audio/visual feedback
            this.scene.events.emit('typingError', character, expectedChar);
        }
        
        return isCorrect;
    }

    private handleBackspace(): void {
        if (this.typedText.length > 0) {
            this.typedText = this.typedText.slice(0, -1);
            this.hasTypingError = false;
            this.clearErrorIndicator();
            this.updateTextDisplay();
            this.updateCursorPosition();
        }
    }

    private checkWordCompletion(): void {
        const currentChar = this.currentText[this.typedText.length - 1];
        const nextChar = this.currentText[this.typedText.length];
        
        // Word is complete when we finish a word (space or punctuation follows) or at end of sentence
        if (currentChar && (currentChar === ' ' || this.isEndOfWord(currentChar) || !nextChar)) {
            // Don't double-count spaces
            if (currentChar !== ' ' || this.typedText.trim().length > 0) {
                this.onWordComplete();
            }
        }
    }

    private isEndOfWord(char: string): boolean {
        return /[.!?,:;]/.test(char);
    }

    public onWordComplete(): void {
        this.wordsCompleted++;
        this.lastWordCompleteTime = this.scene.time.now;
        
        // Visual feedback for word completion
        this.showWordCompleteEffect();
        
        // Emit word complete event for combat system
        this.scene.events.emit('wordComplete', this.wordsCompleted);
    }

    private onSentenceComplete(): void {
        // Visual feedback for sentence completion
        this.showSentenceCompleteEffect();
        
        // Reset for new sentence after delay
        this.scene.time.delayedCall(1000, () => {
            this.generateNewText();
        });
        
        // Emit sentence complete event
        this.scene.events.emit('sentenceComplete', this.currentText);
    }

    public generateNewText(): void {
        // Use TextContentManager if available, otherwise fallback to built-in sentences
        if (this.textContentManager) {
            this.currentText = this.textContentManager.getNextSentence();
        } else {
            // Fallback to built-in sentences
            this.currentText = this.sentences[this.currentSentenceIndex];
            this.currentSentenceIndex = (this.currentSentenceIndex + 1) % this.sentences.length;
        }
        
        // Reset typing state
        this.typedText = '';
        this.scrollPosition = 0;
        this.hasTypingError = false;
        
        // Update display
        this.updateTextDisplay();
        this.updateCursorPosition();
        this.clearErrorIndicator();
    }

    public updateText(deltaTime: number): void {
        // Only update if game is active (not paused)
        if (this.gameStateManager && !this.gameStateManager.isGameActive()) {
            return;
        }
        
        // Handle text scrolling (for future vertical scrolling feature)
        if (this.shouldScroll()) {
            this.scrollPosition += this.textScrollSpeed * (deltaTime / 1000);
        }
        
        // Update cursor blink
        this.updateCursorBlink();
    }

    private shouldScroll(): boolean {
        // For now, no scrolling - text fits in display area
        return false;
    }

    private updateTextDisplay(): void {
        if (!this.currentText) return;
        
        const typedPart = this.typedText;
        const currentCharIndex = this.typedText.length;
        const currentChar = this.currentText[currentCharIndex] || '';
        const remainingText = this.currentText.slice(currentCharIndex + 1);
        
        // Create styled text display using a single text object
        const displayText = typedPart + (currentChar || '') + remainingText;
        
        // Hide the individual text objects
        this.typedTextObject.setVisible(false);
        this.currentCharObject.setVisible(false);
        this.remainingTextObject.setVisible(false);
        
        // Update main text object with full text
        this.textObject.setText(displayText);
        
        // Apply styling through CSS-like approach (simplified for Phaser)
        if (this.hasTypingError && currentChar) {
            this.textObject.setTint(0xff4444);
        } else {
            this.textObject.setTint(0xffffff);
        }
        
        // Position text objects properly
        this.positionTextObjects();
    }

    private positionTextObjects(): void {
        const baseX = this.textDisplayArea.x + 20;
        const baseY = this.textDisplayArea.y + 20;
        
        // Position main text object
        this.textObject.setPosition(baseX, baseY);
    }

    private updateCursorPosition(): void {
        if (!this.currentText) return;
        
        // Calculate cursor position based on typed text
        const tempText = this.scene.add.text(0, 0, this.typedText, this.textObject.style);
        const typedWidth = tempText.width;
        tempText.destroy();
        
        this.cursorObject.x = this.textObject.x + typedWidth;
        this.cursorObject.y = this.textObject.y;
    }

    private startCursorBlink(): void {
        this.scene.tweens.add({
            targets: this.cursorObject,
            alpha: 0.2,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });
    }

    private updateCursorBlink(): void {
        // Cursor blinking is handled by the tween
    }

    private showTypingError(typed: string, expected: string): void {
        this.errorIndicator.setText(`Expected: '${expected}', Got: '${typed}'`);
        this.errorIndicator.setAlpha(1);
        
        // Fade out error message
        this.scene.tweens.add({
            targets: this.errorIndicator,
            alpha: 0,
            duration: 2000,
            ease: 'Power2'
        });
    }

    private clearErrorIndicator(): void {
        this.errorIndicator.setText('');
        this.errorIndicator.setAlpha(0);
    }

    private showWordCompleteEffect(): void {
        // Create a quick flash effect
        const flash = this.scene.add.rectangle(
            this.textDisplayArea.x,
            this.textDisplayArea.y,
            this.textDisplayArea.width,
            this.textDisplayArea.height,
            0x44ff44,
            0.3
        ).setOrigin(0, 0);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
    }

    private showSentenceCompleteEffect(): void {
        // Create a more prominent effect for sentence completion
        const flash = this.scene.add.rectangle(
            this.textDisplayArea.x,
            this.textDisplayArea.y,
            this.textDisplayArea.width,
            this.textDisplayArea.height,
            0xffff44,
            0.5
        ).setOrigin(0, 0);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
    }

    // Public getters for game state
    public getCurrentProgress(): number {
        return this.currentText.length > 0 ? this.typedText.length / this.currentText.length : 0;
    }

    public getWordsPerMinute(): number {
        const timeElapsed = (this.scene.time.now - this.lastWordCompleteTime) / 60000; // Convert to minutes
        return timeElapsed > 0 ? this.wordsCompleted / timeElapsed : 0;
    }

    public getAccuracy(): number {
        // This would need to track total keystrokes vs correct keystrokes
        // For now, return a placeholder
        return this.hasTypingError ? 0.95 : 1.0;
    }

    public isCurrentlyTyping(): boolean {
        return this.typedText.length > 0 && this.typedText.length < this.currentText.length;
    }

    public reset(): void {
        // Reset typing state
        this.typedText = '';
        this.scrollPosition = 0;
        this.wordsCompleted = 0;
        this.hasTypingError = false;
        this.currentSentenceIndex = 0;
        
        // Generate new text
        this.generateNewText();
        
        console.log('Typing system reset');
    }

    // Cleanup
    public destroy(): void {
        this.textObject.destroy();
        this.typedTextObject.destroy();
        this.currentCharObject.destroy();
        this.remainingTextObject.destroy();
        this.cursorObject.destroy();
        this.errorIndicator.destroy();
        this.backgroundBox.destroy();
    }
}