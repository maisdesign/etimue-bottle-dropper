import { Game, Types } from 'phaser'
import { BootScene } from '@/scenes/BootScene'
import { GameScene } from '@/scenes/GameScene'
import '@/ui/GlobalFunctions' // Import global functions to attach to window
import { simpleAuth } from '@/systems/SimpleAuth' // New clean auth system
import { disableConsoleLogs } from '@/utils/logger'

// Disable console logs in production
disableConsoleLogs()

// 📱 Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

// Game configuration
const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scale: {
    // 📱 Mobile: Use RESIZE for fullscreen, Desktop: Use FIT for windowed
    mode: isMobile ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // 📱 Mobile fullscreen target
    fullscreenTarget: 'game-container',
    min: {
      width: 300,
      height: 400
    },
    max: {
      width: isMobile ? window.innerWidth : 1200,
      height: isMobile ? window.innerHeight : 900
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

  // 📱 Mobile fullscreen setup
  if (isMobile) {
    setupMobileFullscreen(game)
  }

  // Development helper - only expose in dev mode
  if (import.meta.env?.MODE === 'development') {
    (window as any).game = game
  }

  // Expose SimpleAuth to global functions
  (window as any).simpleAuth = simpleAuth

  console.log('✅ Game initialized successfully')
  return game
}

// 📱 Setup mobile fullscreen experience
function setupMobileFullscreen(game: Game): void {
  console.log('📱 Setting up mobile fullscreen...')

  // Add game container class for mobile styling
  const gameContainer = document.getElementById('game-container')
  if (gameContainer) {
    gameContainer.classList.add('mobile-fullscreen')
  }

  // Handle orientation changes
  const handleResize = () => {
    if (game && game.scale) {
      game.scale.resize(window.innerWidth, window.innerHeight)
      console.log(`📱 Resized to: ${window.innerWidth}x${window.innerHeight}`)
    }
  }

  // Listen for resize and orientation change
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', () => {
    // Delay to ensure browser UI updates first
    setTimeout(handleResize, 100)
  })

  // Initial resize
  handleResize()

  console.log('✅ Mobile fullscreen enabled')
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