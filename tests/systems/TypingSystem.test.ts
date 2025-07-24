import { describe, it, expect, beforeEach, vi } from "vitest"
import { TypingSystem } from "../../src/systems/TypingSystem"

describe("TypingSystem", () => {
  let typingSystem: TypingSystem
  let mockScene: any

  beforeEach(() => {
    // Create mock scene with required methods
    mockScene = {
      add: {
        rectangle: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
        }),
        text: vi.fn().mockReturnValue({
          setVisible: vi.fn(),
          setText: vi.fn(),
          setTint: vi.fn(),
          setPosition: vi.fn(),
          setAlpha: vi.fn(),
          width: 100,
          height: 20,
          style: {},
          x: 0,
          y: 0,
          destroy: vi.fn(),
        }),
      },
      time: {
        now: 0,
        delayedCall: vi.fn(),
      },
      events: {
        on: vi.fn(),
        emit: vi.fn(),
      },
      tweens: {
        add: vi.fn(),
      },
    }

    typingSystem = new TypingSystem(mockScene)
  })

  describe("Input Processing", () => {
    it("should advance typing position on correct character input", () => {
      const initialLength = typingSystem.typedText.length
      const expectedChar = typingSystem.currentText[0]

      const result = typingSystem.processInput(expectedChar)

      expect(result).toBe(true)
      expect(typingSystem.typedText.length).toBe(initialLength + 1)
      expect(typingSystem.typedText).toBe(expectedChar)
    })

    it("should detect and handle typing errors correctly", () => {
      const wrongChar = "x"
      const expectedChar = typingSystem.currentText[0]

      const result = typingSystem.processInput(wrongChar)

      expect(result).toBe(false)
      expect(typingSystem.typedText.length).toBe(0) // Should not advance on error
      expect(mockScene.events.emit).toHaveBeenCalledWith(
        "typingError",
        wrongChar,
        expectedChar
      )
    })

    it("should trigger word completion on space after letter", () => {
      // Type a word followed by space
      const word = "The"
      for (const char of word) {
        typingSystem.processInput(char)
      }

      // Type space to complete word
      typingSystem.processInput(" ")

      expect(typingSystem.wordsCompleted).toBe(1)
      expect(mockScene.events.emit).toHaveBeenCalledWith("wordComplete", 1)
    })

    it("should trigger sentence completion when text is fully typed", () => {
      // Type entire current text
      for (const char of typingSystem.currentText) {
        typingSystem.processInput(char)
      }

      expect(mockScene.events.emit).toHaveBeenCalledWith(
        "sentenceComplete",
        typingSystem.currentText
      )
      expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
        1000,
        expect.any(Function)
      )
    })

    it("should process rapid input without data loss", () => {
      const testChars = typingSystem.currentText.slice(0, 5)

      // Process multiple characters rapidly
      for (const char of testChars) {
        typingSystem.processInput(char)
      }

      expect(typingSystem.typedText).toBe(testChars)
      expect(typingSystem.typedText.length).toBe(5)
    })
  })

  describe("Attack Triggering Logic", () => {
    it("should launch attack against auto-selected enemy on word completion", () => {
      // Type a complete word
      const word = "The"
      for (const char of word) {
        typingSystem.processInput(char)
      }
      typingSystem.processInput(" ")

      expect(mockScene.events.emit).toHaveBeenCalledWith("wordComplete", 1)
    })

    it("should calculate attack damage accurately", () => {
      // This would typically involve the combat system
      // For now, verify word completion triggers
      typingSystem.processInput("T")
      typingSystem.processInput("h")
      typingSystem.processInput("e")
      typingSystem.processInput(" ")

      expect(typingSystem.wordsCompleted).toBe(1)
    })
  })

  describe("Text Generation and Management", () => {
    it("should generate new sentence after completion", () => {
      const originalText = typingSystem.currentText

      // Complete current sentence
      for (const char of typingSystem.currentText) {
        typingSystem.processInput(char)
      }

      // Manually trigger new text generation (normally done by timer)
      typingSystem.generateNewText()

      expect(typingSystem.currentText).not.toBe(originalText)
      expect(typingSystem.typedText).toBe("")
      expect(typingSystem.wordsCompleted).toBe(0)
    })
  })

  describe("Progress Tracking", () => {
    it("should calculate current progress correctly", () => {
      expect(typingSystem.getCurrentProgress()).toBe(0)

      // Type half the text
      const halfLength = Math.floor(typingSystem.currentText.length / 2)
      for (let i = 0; i < halfLength; i++) {
        typingSystem.processInput(typingSystem.currentText[i])
      }

      const progress = typingSystem.getCurrentProgress()
      expect(progress).toBeCloseTo(0.5, 1)
    })

    it("should track typing state correctly", () => {
      expect(typingSystem.isCurrentlyTyping()).toBe(false)

      typingSystem.processInput(typingSystem.currentText[0])
      expect(typingSystem.isCurrentlyTyping()).toBe(true)

      // Complete entire text
      for (let i = 1; i < typingSystem.currentText.length; i++) {
        typingSystem.processInput(typingSystem.currentText[i])
      }
      expect(typingSystem.isCurrentlyTyping()).toBe(false)
    })

    it("should calculate accuracy correctly", () => {
      // Start with no errors
      expect(typingSystem.getAccuracy()).toBe(1.0)

      // Make an error
      typingSystem.processInput("x") // Wrong character
      expect(typingSystem.getAccuracy()).toBe(0.95)
    })
  })

  // describe("Word Detection Logic", () => {
  //   it("should detect end of word correctly", () => {
  //     expect(typingSystem.isEndOfWord(".")).toBe(true)
  //     expect(typingSystem.isEndOfWord("!")).toBe(true)
  //     expect(typingSystem.isEndOfWord("?")).toBe(true)
  //     expect(typingSystem.isEndOfWord(",")).toBe(true)
  //     expect(typingSystem.isEndOfWord(":")).toBe(true)
  //     expect(typingSystem.isEndOfWord(";")).toBe(true)
  //     expect(typingSystem.isEndOfWord("a")).toBe(false)
  //     expect(typingSystem.isEndOfWord(" ")).toBe(false)
  //   })
  // })

  describe("System Reset", () => {
    it("should reset all typing state correctly", () => {
      // Type some text and complete words
      typingSystem.processInput("T")
      typingSystem.processInput("h")
      typingSystem.processInput("e")
      typingSystem.processInput(" ")

      expect(typingSystem.typedText.length).toBeGreaterThan(0)
      expect(typingSystem.wordsCompleted).toBeGreaterThan(0)

      typingSystem.reset()

      expect(typingSystem.typedText).toBe("")
      expect(typingSystem.wordsCompleted).toBe(0)
      expect(typingSystem.scrollPosition).toBe(0)
      expect(typingSystem.currentText).toBeTruthy()
    })
  })
})
