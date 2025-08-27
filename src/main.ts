import Phaser from 'phaser'
import { BootScene } from '@/scenes/BootScene'
import { PreloadScene } from '@/scenes/PreloadScene'
import { MenuScene } from '@/scenes/MenuScene'
import { GameScene } from '@/scenes/GameScene'
import { GameOverScene } from '@/scenes/GameOverScene'
import { LeaderboardScene } from '@/scenes/LeaderboardScene'
import { authManager } from '@/net/authManager'
import { i18n } from '@/i18n'

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
  // Wait for auth to be ready
  if (!authManager.isReady()) {
    await new Promise<void>(resolve => {
      const unsubscribe = authManager.subscribe(state => {
        if (!state.isLoading) {
          unsubscribe()
          resolve()
        }
      })
    })
  }

  // Create Phaser game
  const game = new Phaser.Game(config)
  
  // Make game globally accessible for debugging
  ;(window as any).game = game
  ;(window as any).authManager = authManager
  ;(window as any).i18n = i18n
  
  return game
}

// Start the game
initGame().catch(console.error)

export { config }