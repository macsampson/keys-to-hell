# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Keys to Hell** is a web-based bullet-hell typing game built with TypeScript and Phaser.js. Players type sentences to attack enemies while surviving in a fast-paced environment. The game combines responsive typing mechanics with real-time combat and progression systems.

## Development Commands

**Prerequisites**: Bun v1.1.8+ (preferred over npm)

```bash
# Install dependencies
bun i

# Development server with hot reload
bun run dev

# Build only
bun run build

# Type checking
bun run typecheck
```

## Architecture Overview

### System-Based Architecture

The game uses a modular system design with 12 specialized managers that communicate via Phaser's event system:

**Core Systems**:

- `TypingSystem` - Text rendering, input processing, word completion tracking

- `EntityManager` - Enemy/projectile lifecycle, spawning, collision detection with object pooling
- `ProgressionSystem` - Experience, leveling, upgrade management
- `GameStateManager` - State transitions (menu, playing, paused, game over)

**Supporting Systems**:

- `AudioSystem` - Web Audio API with sound pooling for performance
- `MusicManager` - Global music management with scene transitions and crossfading
- `VisualEffectsSystem` - Particle effects, screen shake, UI animations
- `PerformanceManager` - Frame rate monitoring with dynamic quality scaling
- `AccessibilityManager` - Screen reader support, high contrast mode
- `GameBalanceManager` - Dynamic difficulty scaling based on player level
- `TextContentManager` - Sentence generation with difficulty adjustment
- `GameStatistics` - Score tracking, accuracy metrics, performance stats

### Entity Architecture

- **Base Class**: `GameObject` extends `Phaser.GameObjects.Sprite` with custom `gameUpdate()` method
- **Entities**: `Player`, `Enemy`, `Projectile` inherit from `GameObject`
- **Management**: Phaser Groups handle entity collections with built-in object pooling

### Event-Driven Communication

Systems communicate through Phaser's event system for loose coupling:

```typescript
// In MainScene.ts
this.events.on("wordComplete", this.handleWordComplete, this)
this.events.on("enemyKilled", this.handleEnemyKilled, this)
this.events.on("levelUp", this.handleLevelUp, this)
```

## Key Technical Patterns

### Performance Optimizations

- **Object Pooling**: Projectiles and particles reused from managed pools
- **Viewport Culling**: Only renders entities within screen bounds
- **Dynamic Quality**: Automatically reduces effects when FPS drops below 45
- **Efficient Text Rendering**: Multi-layered text objects for typed/untyped content

### Collision Detection and Hitboxes

- **Precise Hitboxes**: Physics bodies are smaller than visual sprites for accurate collision detection
- **Entity-Specific Sizing**: Each enemy type has appropriately scaled hitboxes relative to their visual size
- **Projectile Precision**: 16×16 pixel hitboxes ensure projectiles only hit when visually touching enemies
- **Hitbox Configuration**:
  - Basic enemies: 24×24 pixels
  - Fast enemies: 20×20 pixels
  - Tank enemies: 36×36 pixels
  - Large enemies (yokai, werewolf, gorgon): 48×48 pixels
  - Minotaur boss: 64×64 pixels
  - Projectiles: 16×16 pixels with 64×64 display size

### Music and Audio Management

- **MusicManager Singleton**: Global music state persists across scene transitions
- **Scene-Aware Tracks**: Automatic music selection based on current scene and level
- **Audio Integration**: Works with AudioSystem for seamless music playback and effects
- **Available Tracks**:
  - `main_menu` - Menu background music with fade-in
  - `level_1`, `level_2`, `level_3` - Level-specific background tracks
  - Auto-selects appropriate level music based on player progression
- **Transition Effects**:
  - Fade-in/fade-out for smooth scene transitions
  - Crossfading between different tracks
  - Volume control and persistence
- **Scene Integration**:
  - MenuScene: Plays main menu music
  - MainScene: Auto-selects level music based on current level
  - Automatic track management on scene changes

### TypeScript Integration

- Strong interface-first design with comprehensive type coverage
- All major systems have corresponding interfaces in `/src/types/`
- Phaser objects extended with custom properties while maintaining type safety

### Browser Compatibility

- Feature detection for Canvas 2D and Web Audio API support
- Graceful fallbacks with clear user messaging for unsupported features
- Responsive design adapting to different screen sizes

## File Structure

```
src/
├── config/           # Game constants and configuration
├── entities/         # GameObject, Player, Enemy, Projectile classes
├── scenes/           # MainScene (primary game scene)
├── systems/          # 12 specialized game systems
├── types/            # TypeScript interfaces and enums
├── utils/            # BrowserCompatibility, TextRenderer utilities
└── index.ts          # Entry point and Phaser game initialization
```

## Development Guidelines

### System Integration

When adding new features, integrate with existing systems rather than creating standalone functionality:

- Use event emission for system communication
- Respect the `GameStateManager` for pause/resume behavior
- Leverage `PerformanceManager` for resource-intensive operations
- Utilize `EntityManager` for any new game object types

### UI and Visual Effects

- Health/XP bars are positioned at bottom center, taking 50% of screen width
- All screen flash effects have been removed - use particle effects, screen shake, and audio for feedback
- Visual effects system provides comprehensive particle and animation support

### Game State Management

- The game implements complete pause functionality that freezes all systems
- Use `gameStateManager.isGameActive()` to check if systems should update
- Input handling respects pause state automatically

### Performance Considerations

- Always test with 100+ entities on screen
- Use object pooling for frequently created/destroyed objects
- Monitor frame rate and memory usage during development
- Consider performance impact when adding new visual effects

## Configuration

Game constants are viewport-aware and responsive:

- Canvas dimensions scale to `window.innerWidth/Height`
- UI elements calculate positions relative to screen size
- Physics and movement values are frame-rate independent

Health bar color is configured as `#710000` and positioning uses responsive calculations for cross-device compatibility.

** IMPORTANT **
** Always update this file to reflect any architectural changes you make. **
