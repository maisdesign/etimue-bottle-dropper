import { Game, Types } from 'phaser'
import { BootScene } from '@/scenes/BootScene'
import { GameScene } from '@/scenes/GameScene'
import '@/ui/GlobalFunctions' // Import global functions to attach to window
import { simpleAuth } from '@/systems/SimpleAuth' // New clean auth system
import { disableConsoleLogs } from '@/utils/logger'

// Disable console logs in production
disableConsoleLogs()

// Game configuration
// Detect if device is mobile in portrait mode for optimal game dimensions
const isMobilePortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  // Use taller canvas for mobile portrait, wider for desktop/landscape
  width: isMobilePortrait ? 600 : 800,
  height: isMobilePortrait ? 1000 : 600,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 300,
      height: 400
    },
    max: {
      width: 1200,
      height: 1400
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
let isInitializing = false

export function initializeGame(): Game {
  if (isInitializing) {
    console.warn('🔄 Game initialization already in progress, returning existing instance')
    return game!
  }

  if (game) {
    console.log('🔄 Destroying existing game instance before creating new one')
    isInitializing = true
    game.destroy(true)
    // Wait a frame for cleanup
    setTimeout(() => {
      isInitializing = false
    }, 100)
  }

  isInitializing = true
  game = new Game(config)
  isInitializing = false

  // Development helper - only expose in dev mode
  if (import.meta.env?.MODE === 'development') {
    (window as any).game = game
  }

  // Expose SimpleAuth to global functions
  (window as any).simpleAuth = simpleAuth

  console.log('✅ Game initialized successfully')
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

// DO NOT auto-initialize - wait for user to click GIOCA
// This prevents double initialization issues
// Game will be initialized via startNewGame() function in index.html