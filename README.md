# Keys to Hell

A web-based bullet-hell typing game built with TypeScript and Phaser.js.

> **Note**: This is primarily a toy project for experimenting with [Claude Code](https://claude.ai/code) and exploring game development patterns.

## Quick Start

**Prerequisites**: [Bun](https://bun.sh) v1.1.8+

```bash
# Install and run
bun install
bun run dev:watch    # Development with hot reload
# or
bun run dev          # Build and serve on localhost:8000
```

## About

Type sentences to attack enemies while dodging bullets. Features include:

- Real-time typing combat
- Upgrade system (multishot, piercing, etc.)
- Dynamic difficulty scaling
- Object pooling and performance optimization

Built with a modular system architecture using 11 specialized managers that communicate via Phaser's event system.
