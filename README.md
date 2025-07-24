# 🔥 Typing Hell 💀

**A web-based bullet-hell typing game that combines fast-paced combat with typing skills!**

Fight your way through waves of enemies by typing sentences quickly and accurately. The faster and more precise you type, the stronger your attacks become. Survive, level up, and unlock powerful upgrades in this unique fusion of typing practice and arcade action.

## ✨ Features

- **Real-time Typing Combat**: Type sentences to fire projectiles at enemies
- **Progressive Difficulty**: Dynamic enemy scaling based on your performance
- **Upgrade System**: Unlock multishot, piercing projectiles, seeking attacks, and more
- **Responsive Design**: Adapts to different screen sizes and devices
- **Performance Optimized**: Object pooling and dynamic quality scaling for smooth gameplay
- **Accessibility Support**: Screen reader compatibility and high contrast mode

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.1.8 or later (recommended)
- Modern web browser with Canvas 2D support

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/typing_hell.git
cd typing_hell

# Install dependencies
bun install
```

### Development

```bash
# Start development server with hot reload
bun run dev:watch

# Build and serve (production-like)
bun run dev
# or
bun run serve

# Type checking only
bun run typecheck

# Build only
bun run build
```

The game will be available at `http://localhost:8000`

## 🎮 How to Play

1. **Type to Attack**: Complete the sentence shown on screen to fire projectiles
2. **Survive**: Avoid enemy projectiles and contact damage
3. **Level Up**: Gain experience by defeating enemies to unlock upgrades
4. **Choose Upgrades**: Select from various enhancements like multishot, piercing, and health regeneration
5. **Master the Challenge**: Face increasingly difficult waves of enemies

## 🏗️ Architecture

Built with modern web technologies for optimal performance:

- **TypeScript**: Full type safety and modern JavaScript features
- **Phaser.js**: Powerful 2D game framework with WebGL rendering
- **System-Based Design**: 11 specialized managers handling different game aspects
- **Event-Driven**: Loose coupling between systems via Phaser's event system
- **Object Pooling**: Efficient memory management for projectiles and effects

### Key Systems

- `TypingSystem` - Text rendering and input processing
- `EntityManager` - Enemy/projectile lifecycle with collision detection
- `ProgressionSystem` - Experience, leveling, and upgrade management
- `GameStateManager` - State transitions and pause functionality
- `AudioSystem` - Web Audio API with sound pooling
- `VisualEffectsSystem` - Particles, screen shake, and animations
- `PerformanceManager` - Dynamic quality scaling based on frame rate

## 🛠️ Development

### Project Structure

```
src/
├── config/           # Game constants and configuration
├── entities/         # Player, Enemy, Projectile classes
├── scenes/           # MainScene (primary game scene)
├── systems/          # 11 specialized game systems
├── types/            # TypeScript interfaces and enums
├── utils/            # Utilities and browser compatibility
└── index.ts          # Entry point and game initialization
```

### Adding Features

When extending the game:

- Integrate with existing systems rather than creating standalone functionality
- Use event emission for system communication
- Respect `GameStateManager` for pause/resume behavior
- Leverage `EntityManager` for new game object types
- Consider performance impact with 100+ entities on screen

## 🎯 Browser Compatibility

- Modern browsers with Canvas 2D support
- Web Audio API for sound (graceful fallback for unsupported browsers)
- Responsive design for various screen sizes
- Feature detection with clear user messaging

## 📝 License

This project was created using `bun init` in bun v1.1.8. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

**Ready to test your typing skills under fire? Clone the repo and start playing!** 🔥⌨️
