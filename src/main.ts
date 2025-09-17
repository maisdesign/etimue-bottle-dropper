import { Game, Types } from 'phaser'
import { BootScene } from '@/scenes/BootScene'
import { GameScene } from '@/scenes/GameScene'

// Game configuration
const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 240
    },
    max: {
      width: 1200,
      height: 900
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false
    }
  },
  scene: [BootScene, GameScene]
}

// Initialize game
let game: Game | null = null

export function initializeGame(): Game {
  if (game) {
    game.destroy(true)
  }

  game = new Game(config)

  // Development helper - only expose in dev mode
  if (import.meta.env?.MODE === 'development') {
    (window as any).game = game
  }

  return game
}

export function getGame(): Game | null {
  return game
}

export function destroyGame(): void {
  if (game) {
    game.destroy(true)
    game = null
  }
}

// Auto-initialize if game container exists
document.addEventListener('DOMContentLoaded', () => {
  const gameContainer = document.getElementById('game-container')
  if (gameContainer) {
    initializeGame()
  }
})