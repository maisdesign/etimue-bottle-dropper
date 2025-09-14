import Phaser from 'phaser'
import { BootScene } from '@/scenes/BootScene'
import { PreloadScene } from '@/scenes/PreloadScene'
import { MenuScene } from '@/scenes/MenuScene'
import { GameScene } from '@/scenes/GameScene'
import { GameOverScene } from '@/scenes/GameOverScene'
import { LeaderboardScene } from '@/scenes/LeaderboardScene'
import { authManager } from '@/net/authManager'
import { i18n } from '@/i18n'
import { AuthModal } from '@/ui/AuthModal'
import { logger } from '@/utils/Logger'
import { gameStateTracker } from '@/utils/GameStateTracker'
import { debugPanel } from '@/utils/DebugPanel'
import { characterManager } from '@/utils/CharacterManager'
import { updateManager } from '@/utils/UpdateManager'
import { AuthGate } from '@/components/AuthGate'

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 400,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 800,
      height: 1200
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    GameScene,
    GameOverScene,
    LeaderboardScene
  ]
}

// Initialize game after auth is ready
async function initGame() {
  logger.info('GAME_INIT', 'Starting game initialization')
  
  try {
    // Wait for auth to be ready with timeout
    if (!authManager.isReady()) {
      logger.info('AUTH_INIT', 'Auth not ready, waiting...')
      
      const authReadyPromise = new Promise<void>(resolve => {
        const unsubscribe = authManager.subscribe(state => {
          logger.debug('AUTH_INIT', 'Auth state update', state)
          
          if (!state.isLoading) {
            logger.info('AUTH_INIT', 'Auth ready, proceeding with game')
            unsubscribe()
            resolve()
          }
        })
      })
      
      const timeoutPromise = new Promise<void>(resolve => {
        setTimeout(() => {
          logger.warn('AUTH_INIT', 'Auth initialization timeout, proceeding anyway')
          resolve()
        }, 8000)
      })
      
      await Promise.race([authReadyPromise, timeoutPromise])
    } else {
      logger.info('AUTH_INIT', 'Auth already ready')
    }
  } catch (error) {
    logger.error('AUTH_INIT', 'Auth initialization failed', error)
    // Show error to user and hide game container
    if (typeof window !== 'undefined' && (window as any).returnToHomepage) {
      ;(window as any).returnToHomepage()
    }
    // Continue anyway to not block the game completely
  }

  // Create Phaser game
  const game = new Phaser.Game(config)
  
  // Essential objects for production functionality
  ;(window as any).authManager = authManager
  ;(window as any).AuthModal = AuthModal
  ;(window as any).i18n = i18n
  ;(window as any).game = game // Needed for homepage navigation and scene control
  
  // Development-only debugging objects
  if (import.meta.env.MODE !== 'production') {
    ;(window as any).gameInstance = game // Alias for development debugging
    ;(window as any).characterManager = characterManager
    ;(window as any).updateManager = updateManager
    ;(window as any).AuthGate = AuthGate
    
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('localhost')) {
      console.log('🧪 TEST MODE: Debug objects exposed to window for testing')
    }
  }
  
  // AuthGate available but not creating always-visible button (conflicts with homepage)
  // AuthGate.createAlwaysVisibleLoginButton()
  
  // Add timeout for game initialization
  let gameReadyTimeout = setTimeout(() => {
    logger.error('GAME_INIT', 'Game initialization timeout')
    if (typeof window !== 'undefined' && (window as any).returnToHomepage) {
      ;(window as any).returnToHomepage()
      alert('Game loading failed. Please try again or refresh the page.')
    }
  }, 15000)
  
  // Handle direct navigation from homepage
  game.events.on('ready', () => {
    clearTimeout(gameReadyTimeout)
    
    logger.info('GAME_INIT', 'Phaser game ready', {
      scenes: game.scene.getScenes().map(s => s.scene.key),
      skipToGame: !!(window as any).skipToGame,
      skipToLeaderboard: !!(window as any).skipToLeaderboard
    })
    
    gameStateTracker.updateNavigation({
      skipToGame: !!(window as any).skipToGame,
      skipToLeaderboard: !!(window as any).skipToLeaderboard,
      cameFromHomepage: !!(window as any).skipToGame || !!(window as any).skipToLeaderboard
    })
    
    // Note: Don't bypass PreloadScene! Let it complete first, then it will handle the skip flags
  })
  
  // Global function to manage Phaser keyboard conflicts with HTML inputs
  ;(window as any).managePhaserKeyboard = {
    disable: () => {
      logger.debug('INPUT', 'Globally disabling Phaser keyboard')
      const scenes = game.scene.getScenes()
      scenes.forEach(scene => {
        if (scene.input && scene.input.keyboard) {
          scene.input.keyboard.enabled = false
        }
      })
    },
    enable: () => {
      logger.debug('INPUT', 'Globally enabling Phaser keyboard')
      const scenes = game.scene.getScenes()
      scenes.forEach(scene => {
        if (scene.input && scene.input.keyboard) {
          scene.input.keyboard.enabled = true
        }
      })
    }
  }
  
  return game
}

// Start the game
initGame().catch(console.error)

export { config }