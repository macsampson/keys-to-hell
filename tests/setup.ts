import { vi } from "vitest"

// Mock the problematic Phaser module
vi.mock("phaser3spectorjs", () => ({}))

// Ensure window object exists with comprehensive mocking before anything else loads
Object.defineProperty(globalThis, "window", {
  value: {
    cordova: undefined,
    navigator: {
      userAgent: "test",
      language: "en-US",
    },
    document: {
      createElement: () => ({}),
      body: {},
      addEventListener: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    location: {
      href: "http://localhost:3000",
    },
    performance: {
      now: () => Date.now(),
    },
    requestAnimationFrame: (fn: Function) => setTimeout(fn, 16),
    cancelAnimationFrame: (id: number) => clearTimeout(id),
    DeviceOrientationEvent: undefined,
    DeviceMotionEvent: undefined,
    AudioContext: vi.fn(() => ({
      createOscillator: vi.fn(),
      createGain: vi.fn(),
      destination: {},
    })),
    webkitAudioContext: undefined,
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
  },
  writable: true,
  configurable: true,
})

// Also define these as globals for compatibility
Object.defineProperty(globalThis, "document", {
  value: globalThis.window.document,
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, "navigator", {
  value: globalThis.window.navigator,
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, "importScripts", {
  value: undefined,
  writable: true,
  configurable: true,
})

// Mock Phaser globally since we're testing game logic in isolation
global.Phaser = {
  Scale: {
    RESIZE: "resize",
    CENTER_BOTH: "center_both",
  },
  Math: {
    Vector2: class {
      x: number
      y: number
      constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
      }
      distance(v: any) {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2)
      }
      static Distance(a: any, b: any) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
      }
    },
    Distance: {
      Between: (x1: number, y1: number, x2: number, y2: number) =>
        Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2),
    },
    Between: (min: number, max: number) => Math.random() * (max - min) + min,
    FloatBetween: (min: number, max: number) =>
      Math.random() * (max - min) + min,
  },
  GameObjects: {
    Sprite: class {
      x = 0
      y = 0
      constructor() {}
    },
    Text: class {
      constructor() {}
    },
    Graphics: class {
      constructor() {}
    },
  },
  Events: {
    EventEmitter: class {
      private events = new Map()
      on(event: string, fn: Function) {
        if (!this.events.has(event)) {
          this.events.set(event, [])
        }
        this.events.get(event).push(fn)
      }
      emit(event: string, ...args: any[]) {
        if (this.events.has(event)) {
          this.events.get(event).forEach((fn: Function) => fn(...args))
        }
      }
      off(event: string, fn: Function) {
        if (this.events.has(event)) {
          const listeners = this.events.get(event)
          const index = listeners.indexOf(fn)
          if (index > -1) {
            listeners.splice(index, 1)
          }
        }
      }
    },
  },
  Scene: class {
    events = new global.Phaser.Events.EventEmitter()
  },
  Group: class {
    children = {
      entries: [] as any[],
      size: 0,
    }
    add(child: any) {
      this.children.entries.push(child)
      this.children.size++
    }
    remove(child: any) {
      const index = this.children.entries.indexOf(child)
      if (index > -1) {
        this.children.entries.splice(index, 1)
        this.children.size--
      }
    }
    clear() {
      this.children.entries = []
      this.children.size = 0
    }
  },
} as any

// Mock browser APIs
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

Object.defineProperty(window, "AudioContext", {
  value: vi.fn(() => ({
    createOscillator: vi.fn(),
    createGain: vi.fn(),
    destination: {},
  })),
  writable: true,
})

Object.defineProperty(window, "webkitAudioContext", {
  value: window.AudioContext,
  writable: true,
})
