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
  console.log('🎮 Starting game initialization...')
  console.log('📋 Auth ready status:', authManager.isReady())
  console.log('📊 Current auth state:', authManager.getState())
  
  // Wait for auth to be ready with timeout
  if (!authManager.isReady()) {
    console.log('⏳ Waiting for auth to be ready...')
    
    const authReadyPromise = new Promise<void>(resolve => {
      const unsubscribe = authManager.subscribe(state => {
        console.log('🔄 Auth state update in initGame:', {
          isLoading: state.isLoading,
          isAuthenticated: state.isAuthenticated,
          email: state.user?.email
        })
        if (!state.isLoading) {
          console.log('✅ Auth is ready, starting Phaser game!')
          unsubscribe()
          resolve()
        }
      })
    })
    
    const timeoutPromise = new Promise<void>(resolve => {
      setTimeout(() => {
        console.log('⚠️ Auth timeout reached, starting game anyway...')
        resolve()
      }, 10000) // 10 second timeout
    })
    
    await Promise.race([authReadyPromise, timeoutPromise])
  } else {
    console.log('✅ Auth already ready, starting Phaser game!')
  }

  // Create Phaser game
  console.log('🚀 Creating Phaser game...')
  const game = new Phaser.Game(config)
  
  // Make game globally accessible for debugging and homepage integration
  ;(window as any).game = game
  ;(window as any).gameInstance = game
  ;(window as any).authManager = authManager
  ;(window as any).i18n = i18n
  ;(window as any).AuthModal = AuthModal
  
  // Handle direct navigation from homepage
  game.events.on('ready', () => {
    console.log('🎮 Game ready, checking for homepage navigation flags...')
    if ((window as any).skipToGame) {
      console.log('🎯 Skipping to GameScene as requested from homepage')
      setTimeout(() => {
        game.scene.start('GameScene')
      }, 500)
      ;(window as any).skipToGame = false
    } else if ((window as any).skipToLeaderboard) {
      console.log('📊 Skipping to LeaderboardScene as requested from homepage')
      setTimeout(() => {
        game.scene.start('LeaderboardScene')
      }, 500)
      ;(window as any).skipToLeaderboard = false
    }
  })
  
  // Global function to manage Phaser keyboard conflicts with HTML inputs
  ;(window as any).managePhaserKeyboard = {
    disable: () => {
      console.log('🎹 Globally disabling Phaser keyboard')
      const scenes = game.scene.getScenes()
      scenes.forEach(scene => {
        if (scene.input && scene.input.keyboard) {
          scene.input.keyboard.enabled = false
        }
      })
    },
    enable: () => {
      console.log('🎹 Globally enabling Phaser keyboard') 
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