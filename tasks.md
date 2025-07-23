# Implementation Plan

- [x] 1. Set up project structure with Phaser.js

  - Create HTML file and install Phaser.js via npm or CDN
  - Set up TypeScript configuration with Phaser types
  - Create basic Phaser game configuration and scene setup
  - Define core interfaces for GameState and custom game objects
  - _Requirements: 6.1, 6.4_

- [x] 2. Create main game scene and basic Phaser setup

  - Implement main GameScene class extending Phaser.Scene
  - Set up Phaser game loop with preload, create, and update methods
  - Configure game canvas size and rendering settings
  - Add basic scene management and transitions
  - _Requirements: 4.3, 4.4_

- [x] 3. Create entity system foundation
- [x] 3.1 Implement base game objects using Phaser

  - Create base GameObject class extending Phaser.GameObjects.Sprite
  - Utilize Phaser's built-in Vector2 (Phaser.Math.Vector2) for position and velocity
  - Implement entity lifecycle methods using Phaser's update and destroy patterns
  - _Requirements: 2.2, 4.2_

- [x] 3.2 Create EntityManager using Phaser Groups

  - Implement EntityManager using Phaser.GameObjects.Group for efficient management
  - Set up object pooling using Phaser's built-in group pooling for projectiles
  - Write unit tests for entity lifecycle management
  - _Requirements: 4.3, 2.4_

- [x] 4. Build typing system core
- [x] 4.1 Implement text display and scrolling using Phaser

  - Create TypingSystem class using Phaser.GameObjects.Text for rendering
  - Implement vertical text scrolling using Phaser tweens and transforms
  - Add visual cursor/highlight using Phaser graphics and text styling
  - Write tests for text positioning and scrolling mechanics
  - _Requirements: 1.1, 1.2_

- [x] 4.2 Add input handling using Phaser Input

  - Implement keyboard input using Phaser.Input.Keyboard
  - Create input validation logic for correct/incorrect characters
  - Add visual feedback using Phaser text color changes and effects
  - Handle special keys (backspace, space) with Phaser key event handling
  - Write tests for input validation and error handling
  - _Requirements: 1.2, 1.4, 4.1_

- [x] 4.3 Implement word completion detection

  - Add word boundary detection logic
  - Create word completion event system
  - Implement sentence completion and new text generation
  - Write tests for word and sentence completion detection
  - _Requirements: 1.3, 1.5_

- [x] 5. Create basic enemy system
- [x] 5.1 Implement Enemy class and spawning using Phaser

  - Create Enemy class extending Phaser.GameObjects.Sprite
  - Implement enemy movement using Phaser physics or tweens toward player
  - Add enemy spawning system using Phaser timers and groups
  - Create visual sprites and animations for enemies (sprites will be created manually, add placeholders)
  - Write tests for enemy creation and basic movement
  - _Requirements: 2.1, 2.2_

- [x] 5.2 Add enemy health and destruction with Phaser effects

  - Implement enemy health system and damage handling
  - Add enemy destruction with Phaser particle effects and tweens
  - Create experience point rewards for enemy kills
  - Write tests for enemy health management and destruction
  - _Requirements: 2.3, 2.4_

- [x] 6. Implement combat system using Phaser
- [x] 6.1 Create projectile system with Phaser physics

  - Implement Projectile class extending Phaser.GameObjects.Sprite
  - Add projectile movement using Phaser physics or tweens toward targets
  - Implement collision detection using Phaser.Physics.Arcade overlap
  - Create visual effects for projectile impacts using Phaser particles
  - Write tests for projectile movement and collision
  - _Requirements: 1.3, 2.3, 4.2_

- [x] 6.2 Build auto-targeting system

  - Implement target selection algorithms using Phaser geometry utilities
  - Create projectile launching system triggered by word completion events
  - Add multiple projectile support for upgraded attacks
  - Write tests for target selection and attack launching
  - _Requirements: 1.3, 3.5_

- [ ] 7. Add player mechanics
- [ ] 7.1 Implement Player class and collision

  - Create Player class with health and position
  - Add player-enemy collision detection and damage
  - Implement player health UI display
  - Add game over condition when player health reaches zero
  - Write tests for player collision and health management
  - _Requirements: 2.5, 2.6_

- [ ] 7.2 Create player movement (optional dodging)

  - Add basic player movement with arrow keys or WASD
  - Implement smooth player movement within screen boundaries
  - Write tests for player movement and boundary constraints
  - _Requirements: 4.1_

- [ ] 8. Build progression system
- [x] 8.1 Implement experience and leveling

  - Create experience point system with level calculation
  - Add level-up detection and event triggering
  - Implement experience UI display and level progression
  - Write tests for experience calculation and level-up logic
  - _Requirements: 3.1, 3.2_

- [x] 8.2 Create comprehensive upgrade system

  - Implement BaseUpgrade abstract class and category inheritance structure
  - Create all offensive upgrade classes (Projectile, AOE, SpecialWeapon, Sentence categories)
  - Create all defensive upgrade classes (Health, Shield, Deflection, Aura, Temporal categories)
  - Implement upgrade rarity system and weighted selection algorithm
  - Implement upgrade selection UI with pause-on-levelup showing 3 choices
  - Add upgrade application logic to modify player stats and capabilities
  - Create visual effects for each upgrade type (projectile trails, explosions, shields, etc.)
  - Implement upgrade synergy system for combining multiple upgrades
  - Write comprehensive tests for all upgrade types and their interactions
  - _Requirements: 3.3, 3.4, 3.5, Upgrade Categories, Upgrade Mechanics_

- [ ] 8.3 Implement specific upgrade mechanics

  - Multi-Shot: Multiple projectiles per word completion
  - Piercing: Projectiles pass through multiple enemies
  - Seeking: Homing projectiles that track enemies
  - Word Blast: AOE explosions centered on target enemy
  - Chain Lightning: Attacks that jump between nearby enemies
  - Laser Beam: Continuous damage beam activated by holding space
  - Typing Turrets: Autonomous turrets that fire based on typing speed
  - Sentence Slam: Massive damage multiplier for completed sentences
  - Word Combos: Escalating damage for consecutive correct words
  - Health Boost & Regeneration: Health management upgrades
  - Typing Shield & Word Barrier: Shield generation mechanics
  - Projectile Deflector & Damage Reflection: Deflection-based defense
  - Slowing/Damage/Repulsion Auras: Area control around stationary player
  - Time Dilation, Rewind & Stasis Field: Temporal manipulation abilities
  - _Requirements: 3.3, 3.4, 3.5, Upgrade Categories, Upgrade Mechanics_

- [ ] 9. Add game state management
- [ ] 9.1 Implement game states and transitions

  - Create game state enum (menu, playing, paused, game over)
  - Implement state transition logic and UI updates
  - Add game start, pause, and restart functionality
  - Write tests for state transitions and game flow
  - _Requirements: 2.6, 5.3_

- [ ] 9.2 Create score and statistics tracking

  - Implement score calculation based on enemies killed and typing accuracy
  - Add statistics tracking (words typed, accuracy percentage, survival time)
  - Create end-game statistics display
  - Write tests for score calculation and statistics tracking
  - _Requirements: 5.5_

- [x] 10. Enhance visual and audio feedback
- [x] 10.1 Add visual effects and animations

  - Implement particle effects for enemy destruction and projectile impacts
  - Add screen shake effects for impactful moments
  - Create smooth animations for UI elements and level-up effects
  - Write tests for visual effect triggering and cleanup
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 10.2 Implement audio system

  - Add Web Audio API setup and sound loading
  - Create sound effects for typing, attacks, enemy destruction, and level-up
  - Implement background music with volume controls
  - Add audio pooling for frequent sound effects
  - Write tests for audio playbook and resource management
  - _Requirements: 5.4_

- [x] 11. Optimize performance and polish
- [x] 11.1 Add performance optimizations

  - Implement viewport culling for off-screen entities
  - Add dynamic quality scaling based on frame rate
  - Optimize rendering with layered canvas approach
  - Write performance tests and benchmarks
  - _Requirements: 4.3, 4.5_

- [x] 11.2 Improve accessibility and browser support

  - Add keyboard navigation for menus and upgrade selection
  - Implement responsive design for different screen sizes
  - Add browser compatibility checks and fallbacks
  - Test across multiple browsers and devices
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 12. Create content and balancing
- [x] 12.1 Add text content system

  - Scaffold text content system to retrieve LLM-generated sentences with varying difficulty, use mock data initially
  - Implement difficulty scaling based on player-controlled difficulty setting
  - Write tests for text selection and difficulty adjustment
  - _Requirements: 1.1, 1.5_

- [x] 12.2 Balance gameplay mechanics
  - Tune enemy spawn rates, health, and damage values
  - Balance upgrade effects and progression curve
  - Adjust attack power scaling
  - _Requirements: 2.1, 3.4, 3.5_
