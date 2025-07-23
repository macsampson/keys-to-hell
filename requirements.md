# Requirements Document

## Introduction

A web-based bullet-hell typing game inspired by Vampire Survivors, where players type sentences that scroll across the screen to launch attacks against waves of enemies. The game combines fast-paced typing mechanics with survival gameplay, featuring progression systems and increasing difficulty over time.

## Requirements

### Requirement 1

**User Story:** As a player, I want to type sentences that scroll vertically on screen to attack enemies, so that I can defend myself while improving my typing skills.

#### Acceptance Criteria

1. WHEN text appears on screen THEN the system SHALL display it as a wall of text scrolling vertically with clear visual indication of typing progress
2. WHEN the player types a correct character THEN the system SHALL advance the cursor and provide visual feedback
3. WHEN the player completes a word THEN the system SHALL launch an attack against an automatically selected enemy
4. WHEN the player makes a typing error THEN the system SHALL provide clear visual feedback without breaking the flow
5. IF the player completes a sentence THEN the system SHALL spawn a new sentence after a brief delay

### Requirement 2

**User Story:** As a player, I want to face waves of enemies in a bullet-hell environment, so that I have challenging targets to defeat through typing.

#### Acceptance Criteria

1. WHEN the game starts THEN the system SHALL spawn enemies at regular intervals
2. WHEN enemies are active THEN the system SHALL move them toward the player or in attack patterns
3. WHEN an enemy is hit by a typing attack THEN the system SHALL reduce its health and provide visual feedback
4. WHEN an enemy reaches zero health THEN the system SHALL destroy it and award points
5. WHEN enemies collide with the player THEN the system SHALL reduce player health
6. IF the player health reaches zero THEN the system SHALL end the game

### Requirement 3

**User Story:** As a player, I want to level up and gain power-ups during gameplay, so that I can handle increasing difficulty and enemy numbers.

#### Acceptance Criteria

1. WHEN the player destroys enemies THEN the system SHALL award experience points
2. WHEN the player gains enough experience THEN the system SHALL level up the player and offer 3 random upgrade choices
3. WHEN the player selects an upgrade THEN the system SHALL apply the enhancement and update player stats accordingly
4. WHEN the player reaches higher levels THEN the system SHALL increase enemy spawn rates and difficulty
5. IF the player completes words at higher levels THEN the system SHALL launch attacks based on selected upgrades

#### Upgrade Categories

**Offensive Upgrades:**
- **Projectile-Based**: Multi-shot (multiple projectiles), Piercing (projectiles pass through enemies), Seeking (homing projectiles)
- **Area of Effect**: Word Blast (explosions on word completion), Chain Lightning (attacks jump between enemies)
- **Special Weapons**: Laser Beam (continuous damage beam), Typing Turrets (autonomous attacking turrets)
- **Sentence-Based**: Sentence Slam (massive damage on sentence completion), Word Combos (damage multiplier for consecutive correct words)

**Defensive Upgrades:**
- **Health & Regeneration**: Health Boost (increase max health), Regeneration (heal over time)
- **Shields & Barriers**: Typing Shield (generate shields while typing), Word Barrier (damage absorption on perfect words)
- **Deflection & Reflection**: Projectile Deflector (deflect enemy projectiles when typing correctly), Damage Reflection (reflect damage back to attackers)
- **Aura & Area Control**: Slowing Aura (slow nearby enemies), Damage Aura (damage enemies in close range), Repulsion Field (push enemies away)
- **Temporal & Reality**: Time Dilation (slow time when health is low), Rewind (restore health when taking fatal damage), Stasis Field (freeze enemies on sentence completion)

#### Upgrade Mechanics

1. WHEN upgrades are offered THEN the system SHALL provide 3 choices of different categories when possible
2. WHEN an upgrade is selected THEN the system SHALL check if it can be leveled up (max 5 levels for most upgrades)
3. WHEN upgrades are applied THEN the system SHALL immediately update player capabilities and provide visual feedback
4. WHEN rare upgrades appear THEN the system SHALL use rarity-based weighting (Common 60%, Rare 25%, Epic 12%, Legendary 3%)
5. IF a player has multiple upgrades THEN the system SHALL combine their effects synergistically

### Requirement 4

**User Story:** As a player, I want responsive controls and smooth gameplay, so that my typing performance directly translates to game success.

#### Acceptance Criteria

1. WHEN the player presses keys THEN the system SHALL register input with minimal latency
2. WHEN attacks are launched THEN the system SHALL display smooth projectile animations toward targets
3. WHEN multiple game elements are active THEN the system SHALL maintain consistent frame rate
4. WHEN the player types quickly THEN the system SHALL keep up with rapid input without lag
5. IF the game becomes resource-intensive THEN the system SHALL optimize performance to maintain playability

### Requirement 5

**User Story:** As a player, I want clear visual and audio feedback, so that I can understand game state and feel engaged with the action.

#### Acceptance Criteria

1. WHEN typing events occur THEN the system SHALL provide immediate visual feedback (highlighting, cursor movement)
2. WHEN attacks hit enemies THEN the system SHALL display impact effects and damage numbers
3. WHEN the player levels up THEN the system SHALL show celebration effects and upgrade options
4. WHEN enemies spawn or die THEN the system SHALL play appropriate sound effects
5. WHEN the game state changes THEN the system SHALL update UI elements (health, score, level) in real-time

### Requirement 6

**User Story:** As a player, I want the game to be accessible on web browsers, so that I can play without installing additional software.

#### Acceptance Criteria

1. WHEN the player opens the game URL THEN the system SHALL load and run in modern web browsers
2. WHEN the game runs THEN the system SHALL work on both desktop and tablet devices
3. WHEN the player interacts with the game THEN the system SHALL respond to both keyboard and touch input appropriately
4. WHEN the game loads THEN the system SHALL display properly across different screen sizes
5. IF the browser lacks certain features THEN the system SHALL provide graceful fallbacks or clear error messages
