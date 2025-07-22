export interface BrowserInfo {
  name: string
  version: string
  isSupported: boolean
  warnings: string[]
  features: {
    webAudio: boolean
    webGL: boolean
    localStorage: boolean
    gamepad: boolean
    fullscreen: boolean
    pointerLock: boolean
  }
}

export class BrowserCompatibility {
  private static instance: BrowserCompatibility
  private browserInfo: BrowserInfo | null = null

  public static getInstance(): BrowserCompatibility {
    if (!BrowserCompatibility.instance) {
      BrowserCompatibility.instance = new BrowserCompatibility()
    }
    return BrowserCompatibility.instance
  }

  private constructor() {
    this.detectBrowser()
  }

  private detectBrowser(): void {
    const userAgent = navigator.userAgent
    const warnings: string[] = []
    
    // Detect browser name and version
    let browserName = "Unknown"
    let browserVersion = "Unknown"
    
    if (userAgent.includes("Chrome")) {
      browserName = "Chrome"
      const match = userAgent.match(/Chrome\/(\d+)/)
      browserVersion = match ? match[1] : "Unknown"
    } else if (userAgent.includes("Firefox")) {
      browserName = "Firefox"
      const match = userAgent.match(/Firefox\/(\d+)/)
      browserVersion = match ? match[1] : "Unknown"
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browserName = "Safari"
      const match = userAgent.match(/Version\/(\d+)/)
      browserVersion = match ? match[1] : "Unknown"
    } else if (userAgent.includes("Edge")) {
      browserName = "Edge"
      const match = userAgent.match(/Edge\/(\d+)/)
      browserVersion = match ? match[1] : "Unknown"
    } else if (userAgent.includes("Opera")) {
      browserName = "Opera"
      const match = userAgent.match(/Opera\/(\d+)/)
      browserVersion = match ? match[1] : "Unknown"
    }

    // Check feature support
    const features = {
      webAudio: this.checkWebAudioSupport(),
      webGL: this.checkWebGLSupport(),
      localStorage: this.checkLocalStorageSupport(),
      gamepad: this.checkGamepadSupport(),
      fullscreen: this.checkFullscreenSupport(),
      pointerLock: this.checkPointerLockSupport()
    }

    // Check for known compatibility issues
    const isSupported = this.checkOverallSupport(browserName, browserVersion, features, warnings)

    this.browserInfo = {
      name: browserName,
      version: browserVersion,
      isSupported,
      warnings,
      features
    }
  }

  private checkWebAudioSupport(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext)
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    } catch (e) {
      return false
    }
  }

  private checkLocalStorageSupport(): boolean {
    try {
      const testKey = '__localStorage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (e) {
      return false
    }
  }

  private checkGamepadSupport(): boolean {
    return !!(navigator.getGamepads || (navigator as any).webkitGetGamepads)
  }

  private checkFullscreenSupport(): boolean {
    const element = document.documentElement as any
    return !!(
      element.requestFullscreen ||
      element.requestFullScreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen
    )
  }

  private checkPointerLockSupport(): boolean {
    const element = document.documentElement as any
    return !!(
      element.requestPointerLock ||
      element.webkitRequestPointerLock ||
      element.mozRequestPointerLock
    )
  }

  private checkOverallSupport(
    browserName: string,
    browserVersion: string,
    features: BrowserInfo['features'],
    warnings: string[]
  ): boolean {
    let isSupported = true
    const version = parseInt(browserVersion, 10)

    // Check minimum browser versions
    switch (browserName) {
      case "Chrome":
        if (version < 60) {
          isSupported = false
          warnings.push(`Chrome ${browserVersion} is too old. Please update to Chrome 60 or newer.`)
        } else if (version < 80) {
          warnings.push(`Chrome ${browserVersion} may have performance issues. Consider updating.`)
        }
        break
        
      case "Firefox":
        if (version < 55) {
          isSupported = false
          warnings.push(`Firefox ${browserVersion} is too old. Please update to Firefox 55 or newer.`)
        } else if (version < 75) {
          warnings.push(`Firefox ${browserVersion} may have performance issues. Consider updating.`)
        }
        break
        
      case "Safari":
        if (version < 11) {
          isSupported = false
          warnings.push(`Safari ${browserVersion} is too old. Please update to Safari 11 or newer.`)
        } else if (version < 13) {
          warnings.push(`Safari ${browserVersion} may have audio issues. Consider updating.`)
        }
        break
        
      case "Edge":
        if (version < 79) { // Legacy Edge
          warnings.push("Legacy Microsoft Edge detected. Consider switching to Chrome-based Edge.")
        }
        break
        
      default:
        warnings.push(`${browserName} is not officially supported. The game may not work correctly.`)
    }

    // Check critical features
    if (!features.webAudio) {
      warnings.push("Web Audio API not supported. Audio will not work.")
    }
    
    if (!features.webGL) {
      warnings.push("WebGL not supported. Graphics performance will be poor.")
    }
    
    if (!features.localStorage) {
      warnings.push("Local Storage not supported. Settings will not be saved.")
    }

    // Check for mobile browsers (generally not supported)
    if (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
      warnings.push("Mobile browsers are not officially supported. Performance may be poor.")
    }

    // Check for very old or unsupported browsers
    if (browserName === "Unknown") {
      isSupported = false
      warnings.push("Unsupported browser detected. Please use Chrome, Firefox, Safari, or Edge.")
    }

    return isSupported
  }

  public getBrowserInfo(): BrowserInfo | null {
    return this.browserInfo
  }

  public isSupported(): boolean {
    return this.browserInfo?.isSupported ?? false
  }

  public getWarnings(): string[] {
    return this.browserInfo?.warnings ?? []
  }

  public hasFeature(feature: keyof BrowserInfo['features']): boolean {
    return this.browserInfo?.features[feature] ?? false
  }

  public showCompatibilityWarning(): void {
    const info = this.getBrowserInfo()
    if (!info || (info.isSupported && info.warnings.length === 0)) {
      return
    }

    const messages = []
    
    if (!info.isSupported) {
      messages.push("⚠️ Your browser is not supported!")
    }
    
    if (info.warnings.length > 0) {
      messages.push(...info.warnings)
    }

    // Create warning dialog
    const warningDiv = document.createElement('div')
    warningDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff6b6b;
      color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      text-align: center;
      font-family: Arial, sans-serif;
    `
    
    const title = document.createElement('h3')
    title.textContent = 'Browser Compatibility Warning'
    title.style.margin = '0 0 15px 0'
    
    const messageList = document.createElement('ul')
    messageList.style.cssText = 'text-align: left; margin: 15px 0;'
    
    messages.forEach(message => {
      const listItem = document.createElement('li')
      listItem.textContent = message
      listItem.style.marginBottom = '5px'
      messageList.appendChild(listItem)
    })
    
    const continueButton = document.createElement('button')
    continueButton.textContent = 'Continue Anyway'
    continueButton.style.cssText = `
      background: white;
      color: #ff6b6b;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      margin-right: 10px;
    `
    
    const updateButton = document.createElement('button')
    updateButton.textContent = 'Update Browser'
    updateButton.style.cssText = `
      background: #333;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    `
    
    continueButton.onclick = () => {
      document.body.removeChild(warningDiv)
    }
    
    updateButton.onclick = () => {
      window.open('https://browsehappy.com/', '_blank')
    }
    
    warningDiv.appendChild(title)
    warningDiv.appendChild(messageList)
    warningDiv.appendChild(continueButton)
    warningDiv.appendChild(updateButton)
    
    document.body.appendChild(warningDiv)
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (document.body.contains(warningDiv)) {
        document.body.removeChild(warningDiv)
      }
    }, 10000)
  }

  public applyPolyfills(): void {
    // RequestAnimationFrame polyfill
    if (!window.requestAnimationFrame) {
      (window as any).requestAnimationFrame = 
        window.webkitRequestAnimationFrame ||
        (window as any).mozRequestAnimationFrame ||
        function(callback: FrameRequestCallback) {
          return window.setTimeout(callback, 1000 / 60)
        }
    }

    // Performance.now polyfill
    if (!window.performance || !window.performance.now) {
      const performanceNow = Date.now || function() { return new Date().getTime() }
      if (!window.performance) {
        (window as any).performance = {}
      }
      window.performance.now = function() {
        return performanceNow()
      }
    }

    // AudioContext polyfill
    if (!window.AudioContext && (window as any).webkitAudioContext) {
      (window as any).AudioContext = (window as any).webkitAudioContext
    }
  }

  public getRecommendedSettings(): Partial<{
    quality: 'low' | 'medium' | 'high'
    enableEffects: boolean
    enableAudio: boolean
    targetFPS: number
  }> {
    const info = this.getBrowserInfo()
    if (!info) return {}

    const settings: any = {}

    // Set quality based on browser and features
    if (!info.features.webGL || info.name === "Safari") {
      settings.quality = 'medium'
    } else if (!info.isSupported) {
      settings.quality = 'low'
      settings.enableEffects = false
    } else {
      settings.quality = 'high'
    }

    // Disable audio if not supported
    if (!info.features.webAudio) {
      settings.enableAudio = false
    }

    // Lower target FPS for older browsers
    const version = parseInt(info.version, 10)
    if (
      (info.name === "Chrome" && version < 80) ||
      (info.name === "Firefox" && version < 75) ||
      (info.name === "Safari" && version < 13)
    ) {
      settings.targetFPS = 30
    }

    return settings
  }
}