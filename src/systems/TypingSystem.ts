import Phaser from "phaser"
import type { TypingSystem as ITypingSystem } from "../types/interfaces"
import { GAME_CONSTANTS } from "../config/GameConfig"
import { TextContentManager } from "./TextContentManager"
import { GameStateManager } from "./GameStateManager"

export class TypingSystem implements ITypingSystem {
  public currentText: string = ""
  public typedText: string = ""
  public scrollPosition: number = 0
  public wordsCompleted: number = 0
  public textObject: Phaser.GameObjects.Text

  private scene: Phaser.Scene
  private typedTextObject: Phaser.GameObjects.Text
  private currentCharObject: Phaser.GameObjects.Text
  private remainingTextObject: Phaser.GameObjects.Text
  private cursorObject: Phaser.GameObjects.Rectangle
  private errorIndicator: Phaser.GameObjects.Text
  private backgroundBox: Phaser.GameObjects.Rectangle
  private textContentManager: TextContentManager | null = null
  private gameStateManager: GameStateManager | null = null

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
    "Experience is the name everyone gives to their mistakes",
  ]

  private currentSentenceIndex: number = 0
  private textScrollSpeed: number = GAME_CONSTANTS.TEXT_SCROLL_SPEED
  private hasTypingError: boolean = false
  private lastWordCompleteTime: number = 0

  // Visual properties
  private textDisplayArea = {
    get x() {
      return (GAME_CONSTANTS.CANVAS_WIDTH - this.width) / 2
    },
    get y() {
      return 20
    },
    get width() {
      return Math.min(600, GAME_CONSTANTS.CANVAS_WIDTH - 100)
    },
    height: 200,
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    // Create background box for text area
    this.backgroundBox = scene.add
      .rectangle(
        this.textDisplayArea.x,
        this.textDisplayArea.y,
        this.textDisplayArea.width,
        this.textDisplayArea.height,
        0x2a2a4a,
        0.8
      )
      .setOrigin(0, 0)
      .setVisible(false) // Initially hidden

    // Create text objects for different parts
    const textStyle = {
      fontSize: "24px",
      fontFamily: "DotGothic16",
      wordWrap: {
        width: this.textDisplayArea.width - 40,
      },
      lineSpacing: 8,
    }

    // Main text object (will be hidden, used for measurements)
    this.textObject = scene.add.text(
      this.textDisplayArea.x + 20,
      this.textDisplayArea.y + 20,
      "",
      { ...textStyle, color: "#ffffff" }
    )
    .setVisible(false) // Initially hidden

    // Typed text (green)
    this.typedTextObject = scene.add.text(
      this.textDisplayArea.x + 20,
      this.textDisplayArea.y + 20,
      "",
      { ...textStyle, color: "#44ff44" }
    )
    .setVisible(false) // Initially hidden

    // Current character (highlighted)
    this.currentCharObject = scene.add.text(
      this.textDisplayArea.x + 20,
      this.textDisplayArea.y + 20,
      "",
      { ...textStyle, color: "#000000", backgroundColor: "#ffff44" }
    )
    .setVisible(false) // Initially hidden

    // Remaining text (white)
    this.remainingTextObject = scene.add.text(
      this.textDisplayArea.x + 20,
      this.textDisplayArea.y + 20,
      "",
      { ...textStyle, color: "#cccccc" }
    )
    .setVisible(false) // Initially hidden

    // Create cursor indicator
    this.cursorObject = scene.add
      .rectangle(this.textObject.x, this.textObject.y, 3, 28, 0xffff00, 0.8)
      .setOrigin(0, 0)
      .setVisible(false) // Initially hidden

    // Create error indicator
    this.errorIndicator = scene.add.text(
      this.textDisplayArea.x + this.textDisplayArea.width - 150,
      this.textDisplayArea.y + 10,
      "",
      {
        fontSize: "18px",
        fontFamily: "DotGothic16",
        color: "#ff4444",
      }
    )
    .setVisible(false) // Initially hidden

    // Make cursor blink
    this.startCursorBlink()

    // Don't generate initial text - wait for showTextBox() to be called
    
    // Set up input handling
    this.setupInputHandling()
  }

  public setTextContentManager(textContentManager: TextContentManager): void {
    this.textContentManager = textContentManager
  }

  public setGameStateManager(gameStateManager: GameStateManager): void {
    this.gameStateManager = gameStateManager
  }

  public showTextBox(): void {
    // Show all typing interface elements
    this.backgroundBox.setVisible(true)
    this.textObject.setVisible(true)
    this.typedTextObject.setVisible(true)
    this.currentCharObject.setVisible(true)
    this.remainingTextObject.setVisible(true)
    this.cursorObject.setVisible(true)
    this.errorIndicator.setVisible(true)
    
    // Generate initial text now that text box is visible
    this.generateNewText()
  }

  private setupInputHandling(): void {
    // Listen for custom events from MainScene instead of directly handling keyboard
    this.scene.events.on("typingInput", (character: string) => {
      this.processInput(character)
    })

    // Backspace functionality disabled - players cannot retype words
  }

  public processInput(character: string): boolean {
    if (this.currentText.length === 0) return false

    // Don't process input if game is paused
    if (this.gameStateManager && !this.gameStateManager.isGameActive()) {
      return false
    }

    const expectedChar = this.currentText[this.typedText.length]
    const isCorrect = character === expectedChar

    if (isCorrect) {
      this.typedText += character
      this.hasTypingError = false
      this.clearErrorIndicator()

      // Check for word completion
      this.checkWordCompletion()

      // Check for sentence completion
      if (this.typedText === this.currentText) {
        this.onSentenceComplete()
      }

      this.updateTextDisplay()
      this.updateCursorPosition()

      // Emit typing success event for audio feedback
      this.scene.events.emit("typingSuccess", character)
    } else {
      this.hasTypingError = true
      this.showTypingError(character, expectedChar)

      // Emit typing error event for audio/visual feedback
      this.scene.events.emit("typingError", character, expectedChar)
    }

    return isCorrect
  }


  private checkWordCompletion(): void {
    const currentChar = this.currentText[this.typedText.length - 1]
    const nextChar = this.currentText[this.typedText.length]

    if (currentChar) {
      if (currentChar === " ") {
        // Check if the character before this space was a letter/number (indicating end of word)
        const charBeforeSpace =
          this.typedText.length > 1
            ? this.typedText[this.typedText.length - 2]
            : ""
        if (charBeforeSpace && /[a-zA-Z0-9]/.test(charBeforeSpace)) {
          this.onWordComplete()
        }
      } else if (this.isEndOfWord(currentChar) || !nextChar) {
        // Punctuation or end of sentence completes the current word
        this.onWordComplete()
      }
    }
  }

  private isEndOfWord(char: string): boolean {
    return /[.!?,:;]/.test(char)
  }

  public onWordComplete(): void {
    this.wordsCompleted++
    this.lastWordCompleteTime = this.scene.time.now

    // Visual feedback for word completion
    this.showWordCompleteEffect()

    // Emit word complete event for combat system
    this.scene.events.emit("wordComplete", this.wordsCompleted)
  }

  private onSentenceComplete(): void {
    // Visual feedback for sentence completion
    this.showSentenceCompleteEffect()

    // Reset for new sentence after delay
    this.scene.time.delayedCall(1000, () => {
      this.generateNewText()
    })

    // Emit sentence complete event
    this.scene.events.emit("sentenceComplete", this.currentText)
  }

  public generateNewText(): void {
    // Use TextContentManager if available, otherwise fallback to built-in sentences
    if (this.textContentManager) {
      this.currentText = this.textContentManager.getNextSentence()
    } else {
      // Fallback to built-in sentences
      this.currentText = this.sentences[this.currentSentenceIndex]
      this.currentSentenceIndex =
        (this.currentSentenceIndex + 1) % this.sentences.length
    }

    // Reset typing state
    this.typedText = ""
    this.scrollPosition = 0
    this.hasTypingError = false

    // Update display
    this.updateTextDisplay()
    this.updateCursorPosition()
    this.clearErrorIndicator()
  }

  public updateText(deltaTime: number): void {
    // Only update if game is active (not paused)
    if (this.gameStateManager && !this.gameStateManager.isGameActive()) {
      return
    }

    // Handle text scrolling (for future vertical scrolling feature)
    if (this.shouldScroll()) {
      this.scrollPosition += this.textScrollSpeed * (deltaTime / 1000)
    }

    // Update cursor blink
    this.updateCursorBlink()
  }

  private shouldScroll(): boolean {
    // For now, no scrolling - text fits in display area
    return false
  }

  private updateTextDisplay(): void {
    if (!this.currentText) return

    const typedPart = this.typedText
    const currentCharIndex = this.typedText.length
    const currentChar = this.currentText[currentCharIndex] || ""
    const remainingText = this.currentText.slice(currentCharIndex + 1)

    // Create styled text display using a single text object
    const displayText = typedPart + (currentChar || "") + remainingText

    // Hide the individual text objects
    this.typedTextObject.setVisible(false)
    this.currentCharObject.setVisible(false)
    this.remainingTextObject.setVisible(false)

    // Update main text object with full text
    this.textObject.setText(displayText)

    // Apply styling through CSS-like approach (simplified for Phaser)
    if (this.hasTypingError && currentChar) {
      this.textObject.setTint(0xff4444)
    } else {
      this.textObject.setTint(0xffffff)
    }

    // Position text objects properly
    this.positionTextObjects()
  }

  private positionTextObjects(): void {
    const baseX = this.textDisplayArea.x + 20
    const baseY = this.textDisplayArea.y + 20

    // Position main text object
    this.textObject.setPosition(baseX, baseY)
  }

  private updateCursorPosition(): void {
    if (!this.currentText) return

    const textStyle = {
      ...this.textObject.style,
      wordWrap: {
        width: this.textDisplayArea.width - 40,
      }
    }

    // Create temporary text object to analyze wrapping of the full current text
    const tempFullText = this.scene.add.text(
      this.textObject.x,
      this.textObject.y,
      this.currentText,
      textStyle
    )

    // Get wrapped lines of the full text
    const wrappedFullLines = tempFullText.getWrappedText(this.currentText)
    
    // Now we need to find which line and position the cursor should be at
    // based on how many characters have been typed
    let totalCharsProcessed = 0
    let cursorLineIndex = 0
    let cursorPositionInCurrentLine = 0
    
    // Go through each wrapped line and find where our typed text ends
    for (let lineIndex = 0; lineIndex < wrappedFullLines.length; lineIndex++) {
      const currentLine = wrappedFullLines[lineIndex]
      const lineLength = currentLine.length
      
      // Check if the cursor position falls within this line
      if (totalCharsProcessed + lineLength >= this.typedText.length) {
        // The cursor is somewhere in this line
        cursorLineIndex = lineIndex
        cursorPositionInCurrentLine = this.typedText.length - totalCharsProcessed
        break
      }
      
      // Move to next line - account for the characters in this line
      totalCharsProcessed += lineLength
      
      // Account for spaces that are implicit at line breaks
      // When text wraps, Phaser removes trailing spaces from lines
      // but those spaces still exist in the original text
      if (lineIndex < wrappedFullLines.length - 1) {
        const nextLineStartInOriginal = totalCharsProcessed
        // If there's a space at the line break position in original text, count it
        if (nextLineStartInOriginal < this.currentText.length && 
            this.currentText[nextLineStartInOriginal] === ' ') {
          totalCharsProcessed += 1
        }
      }
    }
    
    // Handle edge case where we're at the very end or have no wrapped lines
    if (wrappedFullLines.length === 0) {
      cursorLineIndex = 0
      cursorPositionInCurrentLine = 0
    } else if (this.typedText.length >= this.currentText.length) {
      // If we've typed everything, cursor should be at the end of the last line
      const lastLineIndex = wrappedFullLines.length - 1
      cursorLineIndex = lastLineIndex
      cursorPositionInCurrentLine = wrappedFullLines[lastLineIndex].length
    }
    
    // Calculate cursor X position by measuring the text up to cursor position in current line
    const currentLineText = wrappedFullLines[cursorLineIndex] || ''
    const textBeforeCursor = currentLineText.substring(0, cursorPositionInCurrentLine)
    
    const measureText = this.scene.add.text(0, 0, textBeforeCursor, textStyle)
    const textWidth = measureText.width
    
    // Position cursor
    this.cursorObject.x = this.textObject.x + textWidth
    this.cursorObject.y = this.textObject.y + (cursorLineIndex * (24 + 8)) // 24px font + 8px line spacing
    
    // Clean up temporary objects
    tempFullText.destroy()
    measureText.destroy()
  }

  private startCursorBlink(): void {
    this.scene.tweens.add({
      targets: this.cursorObject,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Power2",
    })
  }

  private updateCursorBlink(): void {
    // Cursor blinking is handled by the tween
  }

  private showTypingError(typed: string, expected: string): void {
    this.errorIndicator.setText(`Expected: '${expected}', Got: '${typed}'`)
    this.errorIndicator.setAlpha(1)

    // Fade out error message
    this.scene.tweens.add({
      targets: this.errorIndicator,
      alpha: 0,
      duration: 2000,
      ease: "Power2",
    })
  }

  private clearErrorIndicator(): void {
    this.errorIndicator.setText("")
    this.errorIndicator.setAlpha(0)
  }

  private showWordCompleteEffect(): void {
    // Flash effect removed - no visual flash
  }

  private showSentenceCompleteEffect(): void {
    // Flash effect removed - no visual flash
  }

  // Public getters for game state
  public getCurrentProgress(): number {
    return this.currentText.length > 0
      ? this.typedText.length / this.currentText.length
      : 0
  }

  public getWordsPerMinute(): number {
    const timeElapsed =
      (this.scene.time.now - this.lastWordCompleteTime) / 60000 // Convert to minutes
    return timeElapsed > 0 ? this.wordsCompleted / timeElapsed : 0
  }

  public getAccuracy(): number {
    // This would need to track total keystrokes vs correct keystrokes
    // For now, return a placeholder
    return this.hasTypingError ? 0.95 : 1.0
  }

  public isCurrentlyTyping(): boolean {
    return (
      this.typedText.length > 0 &&
      this.typedText.length < this.currentText.length
    )
  }

  public reset(): void {
    // Reset typing state
    this.typedText = ""
    this.scrollPosition = 0
    this.wordsCompleted = 0
    this.hasTypingError = false
    this.currentSentenceIndex = 0

    // Generate new text
    this.generateNewText()

    console.log("Typing system reset")
  }

  // Cleanup
  public destroy(): void {
    this.textObject.destroy()
    this.typedTextObject.destroy()
    this.currentCharObject.destroy()
    this.remainingTextObject.destroy()
    this.cursorObject.destroy()
    this.errorIndicator.destroy()
    this.backgroundBox.destroy()
  }
}
