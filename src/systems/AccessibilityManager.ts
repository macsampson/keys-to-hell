import Phaser from "phaser"

export interface AccessibilityOptions {
  keyboardNavigation: boolean
  highContrast: boolean
  reducedMotion: boolean
  screenReaderSupport: boolean
  fontSize: "small" | "medium" | "large"
  colorBlindMode: "none" | "deuteranopia" | "protanopia" | "tritanopia"
}

export interface FocusableElement {
  gameObject: Phaser.GameObjects.GameObject & { x: number; y: number }
  onActivate: () => void
  onFocus?: () => void
  onBlur?: () => void
  ariaLabel?: string
  tabIndex?: number
}

export class AccessibilityManager {
  private scene: Phaser.Scene
  private options: AccessibilityOptions
  private focusableElements: FocusableElement[] = []
  private currentFocusIndex = -1
  private isKeyboardNavigating = false

  // Screen reader support
  private ariaLiveRegion: HTMLElement | null = null
  private statusElement: HTMLElement | null = null

  // Color filters for color blind support
  private colorFilters = new Map<string, string>()

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    this.options = {
      keyboardNavigation: true,
      highContrast: false,
      reducedMotion: false,
      screenReaderSupport: true,
      fontSize: "medium",
      colorBlindMode: "none",
    }

    this.loadOptions()
    this.setupAccessibility()
    this.setupColorFilters()
    this.setupKeyboardNavigation()
    this.detectSystemPreferences()
  }

  private setupAccessibility(): void {
    // Create ARIA live region for screen reader announcements
    this.createAriaLiveRegion()

    // Set up proper ARIA attributes on canvas
    this.setupCanvasAccessibility()

    // Handle browser resize for responsive design
    window.addEventListener("resize", this.handleResize.bind(this))

    // Handle focus and blur events
    window.addEventListener("focus", this.handleWindowFocus.bind(this))
    window.addEventListener("blur", this.handleWindowBlur.bind(this))
  }

  private createAriaLiveRegion(): void {
    if (!this.options.screenReaderSupport) return

    // Create live region for announcements
    this.ariaLiveRegion = document.createElement("div")
    this.ariaLiveRegion.setAttribute("aria-live", "polite")
    this.ariaLiveRegion.setAttribute("aria-atomic", "true")
    this.ariaLiveRegion.style.position = "absolute"
    this.ariaLiveRegion.style.left = "-10000px"
    this.ariaLiveRegion.style.width = "1px"
    this.ariaLiveRegion.style.height = "1px"
    this.ariaLiveRegion.style.overflow = "hidden"
    document.body.appendChild(this.ariaLiveRegion)

    // Create status element for game state announcements
    this.statusElement = document.createElement("div")
    this.statusElement.setAttribute("role", "status")
    this.statusElement.setAttribute("aria-live", "assertive")
    this.statusElement.style.position = "absolute"
    this.statusElement.style.left = "-10000px"
    this.statusElement.style.width = "1px"
    this.statusElement.style.height = "1px"
    this.statusElement.style.overflow = "hidden"
    document.body.appendChild(this.statusElement)
  }

  private setupCanvasAccessibility(): void {
    const canvas = this.scene.game.canvas
    if (!canvas) return

    // Set proper ARIA attributes
    canvas.setAttribute("role", "application")
    canvas.setAttribute(
      "aria-label",
      "Keys to Hell - A typing-based action game"
    )
    canvas.setAttribute("tabindex", "0")

    // Add keyboard event listeners
    canvas.addEventListener("keydown", this.handleCanvasKeyDown.bind(this))
  }

  private setupKeyboardNavigation(): void {
    if (!this.options.keyboardNavigation) return

    this.scene.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      // Handle navigation keys
      switch (event.code) {
        case "Tab":
          event.preventDefault()
          this.navigateToNext(!event.shiftKey)
          break
        case "Enter":
        case "Space":
          if (this.isKeyboardNavigating) {
            event.preventDefault()
            this.activateCurrentFocus()
          }
          break
        case "Escape":
          this.clearFocus()
          break
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          if (this.isKeyboardNavigating) {
            event.preventDefault()
            this.handleArrowNavigation(event.code)
          }
          break
      }
    })
  }

  private setupColorFilters(): void {
    this.colorFilters.set("deuteranopia", "url(#deuteranopia-filter)")
    this.colorFilters.set("protanopia", "url(#protanopia-filter)")
    this.colorFilters.set("tritanopia", "url(#tritanopia-filter)")

    // Create SVG filters for color blindness simulation
    this.createColorBlindFilters()
  }

  private createColorBlindFilters(): void {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.style.position = "absolute"
    svg.style.width = "0"
    svg.style.height = "0"

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")

    // Deuteranopia filter (green-blind)
    const deuteranopiaFilter = this.createColorMatrix(
      "deuteranopia-filter",
      [
        0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1,
        0,
      ]
    )

    // Protanopia filter (red-blind)
    const protanopiaFilter = this.createColorMatrix(
      "protanopia-filter",
      [
        0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0,
        0, 0, 1, 0,
      ]
    )

    // Tritanopia filter (blue-blind)
    const tritanopiaFilter = this.createColorMatrix(
      "tritanopia-filter",
      [
        0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0,
        0, 1, 0,
      ]
    )

    defs.appendChild(deuteranopiaFilter)
    defs.appendChild(protanopiaFilter)
    defs.appendChild(tritanopiaFilter)
    svg.appendChild(defs)
    document.body.appendChild(svg)
  }

  private createColorMatrix(id: string, values: number[]): SVGFilterElement {
    const filter = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "filter"
    )
    filter.setAttribute("id", id)

    const matrix = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feColorMatrix"
    )
    matrix.setAttribute("type", "matrix")
    matrix.setAttribute("values", values.join(" "))

    filter.appendChild(matrix)
    return filter
  }

  private detectSystemPreferences(): void {
    // Check for reduced motion preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      this.options.reducedMotion = true
      console.log("Accessibility: Reduced motion detected")
    }

    // Check for high contrast preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-contrast: high)").matches
    ) {
      this.options.highContrast = true
      console.log("Accessibility: High contrast detected")
    }

    // Apply detected preferences
    this.applyOptions()
  }

  // Focusable element management
  public registerFocusable(element: FocusableElement): void {
    this.focusableElements.push(element)
    this.sortFocusableElements()
  }

  public unregisterFocusable(gameObject: Phaser.GameObjects.GameObject): void {
    this.focusableElements = this.focusableElements.filter(
      (el) => el.gameObject !== gameObject
    )
  }

  private sortFocusableElements(): void {
    // Sort by tabIndex, then by position (top-to-bottom, left-to-right)
    this.focusableElements.sort((a, b) => {
      const tabA = a.tabIndex ?? 0
      const tabB = b.tabIndex ?? 0

      if (tabA !== tabB) {
        return tabA - tabB
      }

      // Sort by Y position, then X position
      const yDiff = a.gameObject.y - b.gameObject.y
      if (Math.abs(yDiff) > 10) {
        // 10px tolerance
        return yDiff
      }

      return a.gameObject.x - b.gameObject.x
    })
  }

  private navigateToNext(forward: boolean = true): void {
    if (this.focusableElements.length === 0) return

    this.isKeyboardNavigating = true

    const direction = forward ? 1 : -1
    this.currentFocusIndex =
      (this.currentFocusIndex + direction + this.focusableElements.length) %
      this.focusableElements.length

    this.applyFocus()
  }

  private handleArrowNavigation(direction: string): void {
    if (this.focusableElements.length === 0) return

    const currentElement = this.focusableElements[this.currentFocusIndex]
    if (!currentElement) return

    // Find best element in the given direction
    let bestElement: FocusableElement | null = null
    let bestDistance = Infinity

    for (const element of this.focusableElements) {
      if (element === currentElement) continue

      const dx = element.gameObject.x - currentElement.gameObject.x
      const dy = element.gameObject.y - currentElement.gameObject.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      let isInDirection = false
      switch (direction) {
        case "ArrowUp":
          isInDirection = dy < -10
          break
        case "ArrowDown":
          isInDirection = dy > 10
          break
        case "ArrowLeft":
          isInDirection = dx < -10
          break
        case "ArrowRight":
          isInDirection = dx > 10
          break
      }

      if (isInDirection && distance < bestDistance) {
        bestDistance = distance
        bestElement = element
      }
    }

    if (bestElement) {
      this.currentFocusIndex = this.focusableElements.indexOf(bestElement)
      this.applyFocus()
    }
  }

  private applyFocus(): void {
    // Clear previous focus
    this.focusableElements.forEach((element, index) => {
      if (index !== this.currentFocusIndex && element.onBlur) {
        element.onBlur()
      }
    })

    // Apply current focus
    const currentElement = this.focusableElements[this.currentFocusIndex]
    if (currentElement) {
      if (currentElement.onFocus) {
        currentElement.onFocus()
      }

      // Announce to screen reader
      if (currentElement.ariaLabel) {
        this.announce(currentElement.ariaLabel)
      }
    }
  }

  private activateCurrentFocus(): void {
    const currentElement = this.focusableElements[this.currentFocusIndex]
    if (currentElement && currentElement.onActivate) {
      currentElement.onActivate()
    }
  }

  private clearFocus(): void {
    if (
      this.currentFocusIndex >= 0 &&
      this.currentFocusIndex < this.focusableElements.length
    ) {
      const element = this.focusableElements[this.currentFocusIndex]
      if (element.onBlur) {
        element.onBlur()
      }
    }

    this.currentFocusIndex = -1
    this.isKeyboardNavigating = false
  }

  // Screen reader support
  public announce(
    message: string,
    priority: "polite" | "assertive" = "polite"
  ): void {
    if (!this.options.screenReaderSupport) return

    const element =
      priority === "assertive" ? this.statusElement : this.ariaLiveRegion
    if (element) {
      element.textContent = message

      // Clear after a delay to allow re-announcing the same message
      setTimeout(() => {
        if (element) element.textContent = ""
      }, 1000)
    }
  }

  public announceGameState(state: string, details?: string): void {
    let message = `Game state: ${state}`
    if (details) {
      message += `. ${details}`
    }
    this.announce(message, "assertive")
  }

  // Visual accessibility
  public applyHighContrast(): void {
    const canvas = this.scene.game.canvas
    if (!canvas) return

    if (this.options.highContrast) {
      canvas.style.filter = "contrast(150%) brightness(110%)"
    } else {
      canvas.style.filter = "none"
    }
  }

  public applyColorBlindFilter(): void {
    const canvas = this.scene.game.canvas
    if (!canvas) return

    const filter = this.colorFilters.get(this.options.colorBlindMode)
    if (filter && this.options.colorBlindMode !== "none") {
      canvas.style.filter = `${canvas.style.filter || ""} ${filter}`.trim()
    }
  }

  public getFontScale(): number {
    switch (this.options.fontSize) {
      case "small":
        return 0.8
      case "large":
        return 1.3
      default:
        return 1.0
    }
  }

  // Responsive design
  private handleResize(): void {
    const canvas = this.scene.game.canvas
    if (!canvas) return

    // Ensure game remains accessible at different screen sizes
    const minWidth = 320 // Minimum mobile width
    const gameWidth = this.scene.game.config.width as number
    const gameHeight = this.scene.game.config.height as number

    if (window.innerWidth < minWidth) {
      console.warn("Accessibility: Screen too narrow for optimal experience")
    }

    // Emit resize event for game to handle
    this.scene.events.emit("accessibilityResize", {
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      gameWidth,
      gameHeight,
      scale: Math.min(
        window.innerWidth / gameWidth,
        window.innerHeight / gameHeight
      ),
    })
  }

  private handleWindowFocus(): void {
    // Resume game if it was paused due to focus loss
    this.scene.events.emit("windowFocus")
  }

  private handleWindowBlur(): void {
    // Pause game when window loses focus
    this.scene.events.emit("windowBlur")
  }

  private handleCanvasKeyDown(event: KeyboardEvent): void {
    // Prevent default browser shortcuts that might interfere
    const preventKeys = [
      "Space",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ]
    if (preventKeys.includes(event.code)) {
      event.preventDefault()
    }
  }

  // Options management
  public updateOptions(newOptions: Partial<AccessibilityOptions>): void {
    this.options = { ...this.options, ...newOptions }
    this.applyOptions()
    this.saveOptions()
  }

  private applyOptions(): void {
    this.applyHighContrast()
    this.applyColorBlindFilter()

    // Emit options change event
    this.scene.events.emit("accessibilityOptionsChanged", this.options)
  }

  public getOptions(): AccessibilityOptions {
    return { ...this.options }
  }

  private saveOptions(): void {
    try {
      localStorage.setItem(
        "typing_hell_accessibility",
        JSON.stringify(this.options)
      )
    } catch (error) {
      console.warn("Failed to save accessibility options:", error)
    }
  }

  private loadOptions(): void {
    try {
      const saved = localStorage.getItem("typing_hell_accessibility")
      if (saved) {
        const options = JSON.parse(saved)
        this.options = { ...this.options, ...options }
      }
    } catch (error) {
      console.warn("Failed to load accessibility options:", error)
    }
  }

  public destroy(): void {
    // Clean up DOM elements
    if (this.ariaLiveRegion) {
      document.body.removeChild(this.ariaLiveRegion)
    }
    if (this.statusElement) {
      document.body.removeChild(this.statusElement)
    }

    // Remove event listeners
    window.removeEventListener("resize", this.handleResize.bind(this))
    window.removeEventListener("focus", this.handleWindowFocus.bind(this))
    window.removeEventListener("blur", this.handleWindowBlur.bind(this))

    // Clear references
    this.focusableElements = []
  }
}
