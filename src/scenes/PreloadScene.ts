import Phaser from 'phaser'
import { logger } from '@/utils/Logger'
import { gameStateTracker } from '@/utils/GameStateTracker'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // Create loading UI
    this.createLoadingUI()

    // Generate placeholder sprites (since we don't have actual assets yet)
    this.generateSprites()

    // Load placeholder audio (silent files for now)
    this.generateAudio()

    // Load any real assets if they exist
    this.loadRealAssets()
  }

  private createLoadingUI() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x87CEEB)

    // Title
    this.add.text(width / 2, height / 4, 'Etimuè Bottle Dropper', {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5)

    // Loading progress
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(width / 2 - 100, height / 2, 200, 20)

    const progressBar = this.add.graphics()
    
    const loadingText = this.add.text(width / 2, height / 2 - 30, 'Loading Assets...', {
      fontSize: '16px',
      color: '#333333'
    }).setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      progressBar.clear()
      progressBar.fillStyle(0x28a745, 1)
      progressBar.fillRect(width / 2 - 100, height / 2, 200 * value, 20)
    })

    this.load.on('complete', () => {
      loadingText.setText('Ready!')
    })
  }

  private generateSprites() {
    // Player sprite (mascotte placeholder - gray rectangle with rounded corners)
    const playerGraphics = this.add.graphics()
    playerGraphics.fillStyle(0x666666)
    playerGraphics.fillRoundedRect(0, 0, 80, 100, 10)
    playerGraphics.generateTexture('player', 80, 100)
    playerGraphics.destroy()

    // Good bottle (craft beer brown)
    const goodBottleGraphics = this.add.graphics()
    goodBottleGraphics.fillStyle(0x8B4513)
    goodBottleGraphics.fillRoundedRect(0, 0, 30, 60, 3)
    // Add bottle neck
    goodBottleGraphics.fillStyle(0x654321)
    goodBottleGraphics.fillRoundedRect(8, -10, 14, 15, 2)
    goodBottleGraphics.generateTexture('bottle_craft', 30, 70)
    goodBottleGraphics.destroy()

    // Bad bottle (industrial green)
    const badBottleGraphics = this.add.graphics()
    badBottleGraphics.fillStyle(0x228B22)
    badBottleGraphics.fillRoundedRect(0, 0, 30, 60, 3)
    // Add bottle neck
    badBottleGraphics.fillStyle(0x1a6b1a)
    badBottleGraphics.fillRoundedRect(8, -10, 14, 15, 2)
    badBottleGraphics.generateTexture('bottle_industrial_green', 30, 70)
    badBottleGraphics.destroy()

    // Power-up star
    const starGraphics = this.add.graphics()
    starGraphics.fillStyle(0xFFD700)
    // Create star shape
    const star = new Phaser.Geom.Polygon([
      20, 0,   // top
      26, 14,  // top right
      40, 14,  // right
      30, 26,  // bottom right
      34, 40,  // bottom
      20, 32,  // bottom left
      6, 40,   // bottom left
      10, 26,  // left
      0, 14,   // left
      14, 14   // top left
    ])
    starGraphics.fillPoints(star.points, true)
    starGraphics.generateTexture('powerup_star', 40, 40)
    starGraphics.destroy()

    // UI Elements will be generated in create() after all loading is complete
  }

  private generateUISprites() {
    // Mobile control buttons
    const leftBtnGraphics = this.add.graphics()
    leftBtnGraphics.fillStyle(0x000000, 0.6)
    leftBtnGraphics.fillCircle(40, 40, 40)
    leftBtnGraphics.fillStyle(0xffffff)
    // Left arrow
    leftBtnGraphics.fillTriangle(20, 40, 50, 25, 50, 55)
    leftBtnGraphics.generateTexture('btn_left', 80, 80)
    leftBtnGraphics.destroy()

    const rightBtnGraphics = this.add.graphics()
    rightBtnGraphics.fillStyle(0x000000, 0.6)
    rightBtnGraphics.fillCircle(40, 40, 40)
    rightBtnGraphics.fillStyle(0xffffff)
    // Right arrow
    rightBtnGraphics.fillTriangle(60, 40, 30, 25, 30, 55)
    rightBtnGraphics.generateTexture('btn_right', 80, 80)
    rightBtnGraphics.destroy()

    // Pause button
    const pauseBtnGraphics = this.add.graphics()
    pauseBtnGraphics.fillStyle(0x000000, 0.6)
    pauseBtnGraphics.fillCircle(30, 30, 30)
    pauseBtnGraphics.fillStyle(0xffffff)
    pauseBtnGraphics.fillRect(20, 15, 6, 30)
    pauseBtnGraphics.fillRect(34, 15, 6, 30)
    pauseBtnGraphics.generateTexture('btn_pause', 60, 60)
    pauseBtnGraphics.destroy()

    // Heart icon for lives
    const heartGraphics = this.add.graphics()
    heartGraphics.fillStyle(0xff0000)
    // Simple heart shape
    heartGraphics.fillCircle(12, 10, 8)
    heartGraphics.fillCircle(20, 10, 8)
    heartGraphics.fillTriangle(16, 25, 5, 15, 27, 15)
    heartGraphics.generateTexture('heart', 32, 32)
    heartGraphics.destroy()

    // Trophy icon for leaderboard
    const trophyGraphics = this.add.graphics()
    trophyGraphics.fillStyle(0xffd700)
    trophyGraphics.fillRect(10, 5, 20, 15) // top
    trophyGraphics.fillRect(12, 20, 16, 10) // middle
    trophyGraphics.fillRect(8, 30, 24, 4) // base
    trophyGraphics.fillStyle(0xffaa00)
    trophyGraphics.fillRect(14, 0, 12, 8) // handles
    trophyGraphics.generateTexture('trophy', 40, 35)
    trophyGraphics.destroy()
  }

  private generateAudio() {
    try {
      // Create silent audio buffers as placeholders
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        logger.warn('AUDIO_GENERATION', 'AudioContext not supported, skipping audio generation')
        return
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const sampleRate = audioContext.sampleRate
      
      // Create silent audio data
      const createSilentAudio = (duration: number) => {
        const frameCount = sampleRate * duration
        const arrayBuffer = audioContext.createBuffer(1, frameCount, sampleRate)
        return arrayBuffer
      }

      // Store placeholder audio (in real implementation, load actual files)
      this.cache.audio.add('music_bg', createSilentAudio(60))
      this.cache.audio.add('pickup_good', createSilentAudio(0.2))
      this.cache.audio.add('pickup_bad', createSilentAudio(0.3))
      this.cache.audio.add('powerup', createSilentAudio(0.5))
      
      logger.info('AUDIO_GENERATION', 'Silent audio buffers generated successfully')
    } catch (error) {
      logger.error('AUDIO_GENERATION', 'Failed to generate audio buffers', error)
      console.warn('⚠️ Audio generation failed, continuing without audio')
    }
  }

  private loadRealAssets() {
    // Try to load real assets if they exist, fallback to generated ones
    
    // Suppress error logging for missing optional assets
    const originalConsoleError = console.error
    let suppressErrors = false
    console.error = function(...args: any[]) {
      if (suppressErrors && (args[0]?.includes?.('Failed to process file') || args[0]?.includes?.('Unable to decode audio'))) {
        return // Suppress asset loading errors
      }
      originalConsoleError.apply(console, args)
    }
    
    suppressErrors = true
    
    // Player characters - load all available characters
    const characters = ['charlie', 'scrocca', 'irlandese']
    const characterLoadStatus: { [key: string]: boolean } = {}
    
    characters.forEach(character => {
      this.load.image(character, `/characters/${character}.png`)
      this.load.on(`filecomplete-image-${character}`, () => {
        characterLoadStatus[character] = true
      })
    })

    this.load.on('loaderror', (fileObj: any) => {
      const characterKey = fileObj.key as string
      if (characters.includes(characterKey)) {
        console.warn(`❌ Failed to load ${characterKey}.png, using generated player sprite as fallback`)
        characterLoadStatus[characterKey] = false
        
        // Create fallback texture using 'player' texture
        this.load.on('complete', () => {
          if (!this.textures.exists(characterKey) && this.textures.exists('player')) {
            this.textures.addImage(characterKey, this.textures.get('player').source[0].image)
          }
        })
      }
    })

    // Bottles  
    this.load.image('bottle_craft_real', '/assets/bottle_craft.png')
    this.load.image('bottle_industrial_real', '/assets/bottle_industrial_green.png')
    
    this.load.on('filecomplete-image-bottle_craft_real', () => {
      this.textures.remove('bottle_craft')
      this.textures.addImage('bottle_craft', this.textures.get('bottle_craft_real').source[0].image)
    })
    
    this.load.on('filecomplete-image-bottle_industrial_real', () => {
      this.textures.remove('bottle_industrial_green')
      this.textures.addImage('bottle_industrial_green', this.textures.get('bottle_industrial_real').source[0].image)
    })

    // Power-up
    this.load.image('powerup_real', '/assets/powerup_star.png')
    this.load.on('filecomplete-image-powerup_real', () => {
      this.textures.remove('powerup_star')
      this.textures.addImage('powerup_star', this.textures.get('powerup_real').source[0].image)
    })

    // Audio files - disabled as files don't exist, using silent fallbacks
    // this.load.audio('music_real', '/assets/music.ogg')
    // this.load.audio('pickup_good_real', '/assets/pickup.wav')
    // this.load.audio('pickup_bad_real', '/assets/hit.wav')
    // this.load.audio('powerup_real', '/assets/powerup.wav')
    
    // Audio success handlers - disabled as audio files don't exist
    // this.load.on('filecomplete-audio-music_real', () => {
    //   console.log('✅ Loaded real background music')
    // })
    // 
    // this.load.on('filecomplete-audio-pickup_good_real', () => {
    //   console.log('✅ Loaded real pickup sound')
    // })
    
    // Restore console.error after loading
    this.load.on('complete', () => {
      suppressErrors = false
      console.error = originalConsoleError
      })
  }

  create() {
    logger.info('PRELOAD_CREATE', 'PreloadScene create started')
    
    // Generate UI sprites after all loading is complete
    logger.info('PRELOAD_CREATE', 'Generating UI sprites...')
    this.generateUISprites()
    gameStateTracker.updateLoading({ uiSpritesGenerated: true })
    
    // Debug texture status
    const charlieExists = this.textures.exists('charlie')
    const playerExists = this.textures.exists('player')
    
    logger.info('TEXTURE_STATUS', 'Texture availability check', {
      charlie: charlieExists,
      player: playerExists,
      uiSprites: {
        btn_left: this.textures.exists('btn_left'),
        btn_right: this.textures.exists('btn_right'),
        btn_pause: this.textures.exists('btn_pause')
      }
    })
    
    // Ensure all character textures exist as final failsafe
    const characters = ['charlie', 'scrocca', 'irlandese']
    const charactersLoaded = { charlie: charlieExists }
    
    characters.forEach(character => {
      const exists = this.textures.exists(character)
      charactersLoaded[character as keyof typeof charactersLoaded] = exists
      
      if (!exists) {
        if (playerExists) {
          this.textures.addImage(character, this.textures.get('player').source[0].image)
          logger.warn('TEXTURE_FALLBACK', `Created ${character} from player texture (${character} missing)`)
        } else {
          logger.error('TEXTURE_ERROR', `Both ${character} and player textures missing!`)
        }
      } else {
        logger.info('TEXTURE_SUCCESS', `${character} texture loaded successfully`)
      }
    })
    
    gameStateTracker.updateLoading({ charactersLoaded })

    gameStateTracker.updateLoading({ preloadComplete: true })

    // Wait a moment then handle navigation
    this.time.delayedCall(1000, () => {
      const skipToGame = (window as any).skipToGame
      const skipToLeaderboard = (window as any).skipToLeaderboard
      
      logger.info('NAVIGATION', 'Handling post-preload navigation', {
        skipToGame,
        skipToLeaderboard
      })
      
      if (skipToGame) {
        logger.info('NAVIGATION', 'Skipping to GameScene as requested from homepage')
        gameStateTracker.trackSceneTransition('PreloadScene', 'GameScene', 'skipToGame flag')
        ;(window as any).skipToGame = false
        this.scene.start('GameScene')
      } else if (skipToLeaderboard) {
        logger.info('NAVIGATION', 'Skipping to LeaderboardScene as requested from homepage')
        gameStateTracker.trackSceneTransition('PreloadScene', 'LeaderboardScene', 'skipToLeaderboard flag')
        ;(window as any).skipToLeaderboard = false
        this.scene.start('LeaderboardScene')
      } else {
        logger.info('NAVIGATION', 'Going to MenuScene (normal flow)')
        gameStateTracker.trackSceneTransition('PreloadScene', 'MenuScene', 'normal flow')
        this.scene.start('MenuScene')
      }
    })
  }
}