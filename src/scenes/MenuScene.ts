import Phaser from "phaser"
import { AudioSystem } from "../systems/AudioSystem"

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text
  private menuOptions: Phaser.GameObjects.Text[] = []
  private selectedIndex: number = 0
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private audioSystem!: AudioSystem

  constructor() {
    super({ key: "MenuScene" })
  }

  preload(): void {
    this.load.audio("main_menu", "assets/audio/main_menu/main_menu.ogg")
  }

  create(): void {
    this.audioSystem = new AudioSystem(this)

    // Create title
    this.titleText = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 4,
        "KEYS TO HELL",
        {
          fontSize: "64px",
          color: "#ff6b6b",
          fontFamily: "OldEnglishGothicPixel",
          stroke: "#000000",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5)

    // Create menu options
    const menuItems = [
      { text: "START GAME", scene: "MainScene" },
      { text: "TESTING MODE", scene: "TestingScene" },
      { text: "OPTIONS", scene: null }, // TODO: Implement options scene
    ]

    const startY = this.cameras.main.height / 2
    const spacing = 80

    menuItems.forEach((item, index) => {
      const menuText = this.add
        .text(
          this.cameras.main.width / 2,
          startY + index * spacing,
          item.text,
          {
            fontSize: "32px",
            color: "#ffffff",
            fontFamily: "OldEnglishGothicPixel",
            stroke: "#000000",
            strokeThickness: 2,
          }
        )
        .setOrigin(0.5)
        .setInteractive()
        .on("pointerdown", () => this.selectOption(index))
        .on("pointerover", () => this.highlightOption(index))

      this.menuOptions.push(menuText)
    })

    // Set up keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.input.keyboard!.on("keydown-ENTER", () => this.confirmSelection())
    this.input.keyboard!.on("keydown-SPACE", () => this.confirmSelection())

    // Initial highlight
    this.highlightOption(0)

    // Add instructions
    this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height - 100,
        "Use ↑↓ Arrow Keys or Mouse • ENTER/SPACE to Select",
        {
          fontSize: "18px",
          color: "#aaaaaa",
          fontFamily: "OldEnglishGothicPixel",
          align: "center",
        }
      )
      .setOrigin(0.5)

    // Start background music
    this.audioSystem.playMusic("main_menu")
  }

  update(): void {
    // Handle keyboard navigation
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.menuOptions.length) %
        this.menuOptions.length
      this.highlightOption(this.selectedIndex)
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length
      this.highlightOption(this.selectedIndex)
    }
  }

  private highlightOption(index: number): void {
    this.selectedIndex = index

    // Reset all options to normal color
    this.menuOptions.forEach((option, i) => {
      if (i === index) {
        option.setColor("#ffff00") // Yellow highlight
        option.setScale(1.1)
      } else {
        option.setColor("#ffffff") // White normal
        option.setScale(1.0)
      }
    })
  }

  private selectOption(index: number): void {
    this.selectedIndex = index
    this.confirmSelection()
  }

  private confirmSelection(): void {
    const selectedOption = this.selectedIndex

    switch (selectedOption) {
      case 0: // Start Game
        this.scene.start("MainScene")
        break
      case 1: // Testing Mode
        this.scene.start("TestingScene")
        break
      case 2: // Options
        // TODO: Implement options scene
        console.log("Options not implemented yet")
        break
    }
  }
}
