// Comprehensive Phaser mock for testing
export default {
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
        return globalThis.Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2)
      }
      normalize() {
        const length = globalThis.Math.sqrt(this.x * this.x + this.y * this.y)
        if (length === 0) return this
        this.x /= length
        this.y /= length
        return this
      }
      length() {
        return globalThis.Math.sqrt(this.x * this.x + this.y * this.y)
      }
      set(x: number, y: number) {
        this.x = x
        this.y = y
        return this
      }
      setLength(length: number) {
        const currentLength = this.length()
        if (currentLength === 0) return this
        this.normalize()
        this.x *= length
        this.y *= length
        return this
      }
      angle() {
        return globalThis.Math.atan2(this.y, this.x)
      }
      scale(scalar: number) {
        this.x *= scalar
        this.y *= scalar
        return this
      }
      lerp(target: any, t: number) {
        this.x += (target.x - this.x) * t
        this.y += (target.y - this.y) * t
        return this
      }
      static Distance(a: any, b: any) {
        return globalThis.Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
      }
    },
    Distance: {
      Between: (x1: number, y1: number, x2: number, y2: number) =>
        globalThis.Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2),
    },
    Between: (min: number, max: number) =>
      globalThis.Math.random() * (max - min) + min,
    FloatBetween: (min: number, max: number) =>
      globalThis.Math.random() * (max - min) + min,
    Angle: {
      Between: (x1: number, y1: number, x2: number, y2: number) =>
        globalThis.Math.atan2(y2 - y1, x2 - x1),
    },
  },
  GameObjects: {
    Sprite: class {
      x = 0
      y = 0
      active = true
      visible = true
      scene: any
      body: any = {
        setVelocity: () => {},
      }

      constructor(scene?: any, x?: number, y?: number) {
        this.scene = scene
        this.x = x || 0
        this.y = y || 0
      }

      setActive(active: boolean) {
        this.active = active
        return this
      }

      setVisible(visible: boolean) {
        this.visible = visible
        return this
      }

      setDisplaySize(width: number, height: number) {
        return this
      }

      setTint(color: number) {
        return this
      }

      setPosition(x: number, y: number) {
        this.x = x
        this.y = y
        return this
      }

      destroy() {}
    },
    Text: class {
      style: any = {}
      width = 100
      height = 20
      x = 0
      y = 0

      constructor() {}

      setVisible() {
        return this
      }
      setText() {
        return this
      }
      setTint() {
        return this
      }
      setPosition(x: number, y: number) {
        this.x = x
        this.y = y
        return this
      }
      setAlpha() {
        return this
      }
      destroy() {}
    },
    Rectangle: class {
      x = 0
      y = 0
      constructor() {}
      setOrigin() {
        return this
      }
      destroy() {}
    },
    Graphics: class {
      constructor() {}
      destroy() {}
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
    events = new (global.Phaser?.Events?.EventEmitter ||
      class {
        on() {}
        emit() {}
      })()
    add = {
      rectangle: () => ({ setOrigin: () => ({}) }),
      text: () => ({
        setVisible: () => {},
        setText: () => {},
        setTint: () => {},
        setPosition: () => {},
        setAlpha: () => {},
        width: 100,
        height: 20,
        style: {},
        x: 0,
        y: 0,
        destroy: () => {},
      }),
    }
    time = {
      now: 0,
      delayedCall: () => {},
    }
    tweens = {
      add: () => {},
    }
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
}

// Export as ES6 module compatible object
export const Math = {
  Vector2: class {
    x: number
    y: number
    constructor(x = 0, y = 0) {
      this.x = x
      this.y = y
    }
    distance(v: any) {
      return globalThis.Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2)
    }
    normalize() {
      const length = globalThis.Math.sqrt(this.x * this.x + this.y * this.y)
      if (length === 0) return this
      this.x /= length
      this.y /= length
      return this
    }
    length() {
      return globalThis.Math.sqrt(this.x * this.x + this.y * this.y)
    }
    set(x: number, y: number) {
      this.x = x
      this.y = y
      return this
    }
    setLength(length: number) {
      const currentLength = this.length()
      if (currentLength === 0) return this
      this.normalize()
      this.x *= length
      this.y *= length
      return this
    }
    angle() {
      return globalThis.Math.atan2(this.y, this.x)
    }
    scale(scalar: number) {
      this.x *= scalar
      this.y *= scalar
      return this
    }
    lerp(target: any, t: number) {
      this.x += (target.x - this.x) * t
      this.y += (target.y - this.y) * t
      return this
    }
    static Distance(a: any, b: any) {
      return globalThis.Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
    }
  },
  Distance: {
    Between: (x1: number, y1: number, x2: number, y2: number) =>
      globalThis.Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2),
  },
  Between: (min: number, max: number) =>
    globalThis.Math.random() * (max - min) + min,
  FloatBetween: (min: number, max: number) =>
    globalThis.Math.random() * (max - min) + min,
  Angle: {
    Between: (x1: number, y1: number, x2: number, y2: number) =>
      globalThis.Math.atan2(y2 - y1, x2 - x1),
  },
}
