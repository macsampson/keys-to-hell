import Phaser from 'phaser';
import type { TextRenderer as ITextRenderer } from '../types/interfaces';

export class TextRenderer implements ITextRenderer {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public renderScrollingText(
        textObject: Phaser.GameObjects.Text,
        text: string,
        position: number
    ): void {
        // Apply scrolling offset to text position
        const baseY = textObject.y;
        textObject.setY(baseY - position);
        
        // Update text content if needed
        if (textObject.text !== text) {
            textObject.setText(text);
        }
    }

    public highlightTypedText(
        textObject: Phaser.GameObjects.Text,
        typedLength: number
    ): void {
        const fullText = textObject.text;
        if (typedLength <= 0) {
            textObject.setText(fullText);
            return;
        }

        // Split text into typed and untyped portions
        const typedPart = fullText.substring(0, typedLength);
        const untypedPart = fullText.substring(typedLength);

        // Create formatted text with different colors
        const formattedText = `[color=#44ff44]${typedPart}[/color][color=#ffffff]${untypedPart}[/color]`;
        textObject.setText(formattedText);
    }

    public createTextWithHighlight(
        x: number,
        y: number,
        text: string,
        typedLength: number,
        currentCharHighlight: boolean = false
    ): Phaser.GameObjects.Text {
        let formattedText = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (i < typedLength) {
                // Already typed (green)
                formattedText += `[color=#44ff44]${char}[/color]`;
            } else if (i === typedLength && currentCharHighlight) {
                // Current character to type (highlighted)
                formattedText += `[bgcolor=#ffff44][color=#000000]${char}[/color][/bgcolor]`;
            } else {
                // Not yet typed (white)
                formattedText += `[color=#ffffff]${char}[/color]`;
            }
        }

        return this.scene.add.text(x, y, formattedText, {
            fontSize: '24px',
            fontFamily: 'DotGothic16',
            wordWrap: { width: 800 }
        });
    }

    public createTypingProgressBar(
        x: number,
        y: number,
        width: number,
        height: number,
        progress: number
    ): Phaser.GameObjects.Graphics {
        const graphics = this.scene.add.graphics();
        
        // Background
        graphics.fillStyle(0x333333);
        graphics.fillRect(x, y, width, height);
        
        // Progress fill
        graphics.fillStyle(0x44ff44);
        graphics.fillRect(x, y, width * progress, height);
        
        // Border
        graphics.lineStyle(2, 0xffffff);
        graphics.strokeRect(x, y, width, height);
        
        return graphics;
    }

    public createFloatingText(
        x: number,
        y: number,
        text: string,
        color: string = '#ffffff',
        duration: number = 1000
    ): void {
        const floatingText = this.scene.add.text(x, y, text, {
            fontSize: '20px',
            fontFamily: 'DotGothic16',
            color: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Animate floating text
        this.scene.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }

    public createWordCompleteEffect(x: number, y: number): void {
        // Create multiple particles for word completion
        for (let i = 0; i < 5; i++) {
            const particle = this.scene.add.circle(
                x + (Math.random() - 0.5) * 40,
                y + (Math.random() - 0.5) * 20,
                4,
                0x44ff44
            );

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 100,
                y: particle.y - Math.random() * 50,
                alpha: 0,
                scale: 0.5,
                duration: 800,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    public createErrorShakeEffect(textObject: Phaser.GameObjects.Text): void {
        const originalX = textObject.x;
        
        this.scene.tweens.add({
            targets: textObject,
            x: originalX + 5,
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Power2',
            onComplete: () => {
                textObject.setX(originalX);
            }
        });
    }

    public createTextBoxWithBorder(
        x: number,
        y: number,
        width: number,
        height: number,
        backgroundColor: number = 0x2a2a4a,
        borderColor: number = 0xffffff,
        alpha: number = 0.8
    ): Phaser.GameObjects.Graphics {
        const graphics = this.scene.add.graphics();
        
        // Background
        graphics.fillStyle(backgroundColor, alpha);
        graphics.fillRect(x, y, width, height);
        
        // Border
        graphics.lineStyle(2, borderColor, 1);
        graphics.strokeRect(x, y, width, height);
        
        return graphics;
    }

    public wrapText(text: string, maxWidth: number, style: Phaser.Types.GameObjects.Text.TextStyle): string[] {
        // Create a temporary text object to measure width
        const tempText = this.scene.add.text(0, 0, '', style);
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            tempText.setText(testLine);
            
            if (tempText.width <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    // Single word is too long, break it
                    lines.push(word);
                }
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        tempText.destroy();
        return lines;
    }

    public animateTextAppearance(
        textObject: Phaser.GameObjects.Text,
        duration: number = 500
    ): void {
        const originalText = textObject.text;
        textObject.setText('');
        
        let currentIndex = 0;
        const timer = this.scene.time.addEvent({
            delay: duration / originalText.length,
            callback: () => {
                if (currentIndex < originalText.length) {
                    textObject.setText(originalText.substring(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    timer.destroy();
                }
            },
            repeat: originalText.length - 1
        });
    }
}