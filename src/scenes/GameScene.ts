import Phaser from 'phaser'
import { scoreService } from '@/net/supabaseClient'
import { authManager } from '@/net/authManager'
import { t } from '@/i18n'
import { logger } from '@/utils/Logger'
import { gameStateTracker } from '@/utils/GameStateTracker'
import { characterManager } from '@/utils/CharacterManager'

interface MobileControls {
  leftPressed: boolean
  rightPressed: boolean
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private bottles!: Phaser.Physics.Arcade.Group
  private powerups!: Phaser.Physics.Arcade.Group
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: { [key: string]: Phaser.Input.Keyboard.Key }
  
  // Game state
  private score: number = 0
  private lives: number = 3
  private gameTime: number = 60
  private gameStarted: boolean = false
  private gameRunning: boolean = false
  private isPaused: boolean = false
  private allGoodPowerupActive: boolean = false
  private powerupEndTime: number = 0
  private powerupRemainingTime: number = 0
  private powerupTimer!: Phaser.Time.TimerEvent
  private activeTimers: Phaser.Time.TimerEvent[] = []
  
  // UI elements
  private scoreText!: Phaser.GameObjects.Text
  private livesText!: Phaser.GameObjects.Text
  private timeText!: Phaser.GameObjects.Text
  private pauseButton!: Phaser.GameObjects.Image
  private pauseOverlay!: Phaser.GameObjects.Container
  private powerupIndicator!: Phaser.GameObjects.Text
  
  // Timers
  private gameTimer!: Phaser.Time.TimerEvent
  private spawnTimer!: Phaser.Time.TimerEvent
  private powerupSpawnTimer!: Phaser.Time.TimerEvent
  
  // Mobile controls
  private mobileControls: MobileControls = {
    leftPressed: false,
    rightPressed: false
  }
  private leftButton!: Phaser.GameObjects.Image
  private rightButton!: Phaser.GameObjects.Image
  private isMobile: boolean = false
  
  // Audio
  private audioEnabled: boolean = true
  private bgMusic?: Phaser.Sound.BaseSound
  
  // Game start time for anti-cheat
  private gameStartTimestamp: number = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    logger.info('GAME_CREATE', 'GameScene create started')
    
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    // Check texture availability before starting
    const selectedCharacterTexture = characterManager.getSelectedCharacterTextureKey()
    const requiredTextures = [selectedCharacterTexture, 'btn_pause']
    const mobileTextures = ['btn_left', 'btn_right']
    const isMobile = this.isMobile
    
    if (isMobile) {
      requiredTextures.push(...mobileTextures)
    }
    
    const texturesOK = gameStateTracker.checkTextures(this, requiredTextures)
    
    gameStateTracker.updateGame({
      currentScene: 'GameScene',
      isMobile,
      screenSize: { width, height }
    })

    // Get audio setting
    const gameSettings = this.registry.get('gameSettings')
    this.audioEnabled = gameSettings?.audioEnabled ?? true

    // Reset game state
    this.resetGameState()

    // Create game world
    this.createWorld(width, height)
    this.createPlayer()
    this.createGroups()
    this.createControls()
    this.createUI(width, height)
    this.createCollisions()

    // Start background music
    if (this.audioEnabled) {
      this.startBackgroundMusic()
    }

    logger.info('GAME_CREATE', 'GameScene create completed', {
      texturesOK,
      isMobile,
      audioEnabled: this.audioEnabled,
      gameState: { width, height }
    })

    // Auto-start the game (remove countdown for now)
    this.startGame()

    // Handle window focus/blur for auto-pause
    this.setupFocusHandling()
  }

  private resetGameState() {
    this.score = 0
    this.lives = 3
    this.gameTime = 60
    this.gameStarted = false
    this.gameRunning = false
    this.isPaused = false
    this.allGoodPowerupActive = false
    this.powerupEndTime = 0
    this.powerupRemainingTime = 0
    this.gameStartTimestamp = 0
    this.activeTimers = []
  }

  private createWorld(width: number, height: number) {
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x87CEEB)
    
    // Add some simple background elements (clouds, etc.)
    this.createBackgroundElements(width, height)
  }

  private createBackgroundElements(width: number, height: number) {
    // Simple cloud shapes
    for (let i = 0; i < 3; i++) {
      const cloud = this.add.ellipse(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(50, 150),
        Phaser.Math.Between(60, 100),
        Phaser.Math.Between(30, 50),
        0xffffff,
        0.3
      )
      
      // Animate clouds
      this.tweens.add({
        targets: cloud,
        x: width + 100,
        duration: Phaser.Math.Between(20000, 40000),
        repeat: -1,
        onComplete: () => {
          cloud.x = -100
        }
      })
    }
  }

  private createPlayer() {
    const width = this.cameras.main.width
    
    // Get selected character from CharacterManager
    const selectedCharacter = characterManager.getSelectedCharacterTextureKey()
    logger.info('CHARACTER_SELECTION', 'Creating player with selected character', { 
      character: selectedCharacter,
      characterData: characterManager.getSelectedCharacter()
    })
    
    this.player = this.physics.add.sprite(width / 2, 550, selectedCharacter)
    this.player.setCollideWorldBounds(true)
    this.player.setScale(0.4) // 50% smaller for sprite - better hitbox
    
    // Set player body size for more precise collisions
    this.player.body?.setSize(this.player.width * 0.7, this.player.height * 0.7)
  }

  private createGroups() {
    this.bottles = this.physics.add.group()
    this.powerups = this.physics.add.group()
  }

  private createControls() {
    // Keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys()
    
    // WASD controls
    this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D')
    
    // Pause key
    this.input.keyboard!.on('keydown-P', () => {
      this.togglePause()
    })

    // Detect mobile
    this.isMobile = this.sys.game.device.input.touch
    console.log('📱 Mobile detection:', this.isMobile)
    
    if (this.isMobile) {
      console.log('📱 Creating mobile controls...')
      this.createMobileControls()
    } else {
      console.log('🖥️ Desktop mode - no mobile controls')
    }
  }

  private createMobileControls() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    logger.info('MOBILE_CONTROLS', 'Creating mobile controls', { width, height })
    
    // Check if UI sprites exist before creating controls
    const hasLeftBtn = this.textures.exists('btn_left')
    const hasRightBtn = this.textures.exists('btn_right')
    
    logger.info('MOBILE_CONTROLS', 'Checking mobile sprite availability', {
      btn_left: hasLeftBtn,
      btn_right: hasRightBtn
    })
    
    if (!hasLeftBtn || !hasRightBtn) {
      logger.error('MOBILE_CONTROLS', 'Mobile control sprites not ready, skipping mobile controls', {
        btn_left: hasLeftBtn,
        btn_right: hasRightBtn,
        allTextures: this.textures.list
      })
      return
    }
    
    // Left button
    this.leftButton = this.add.image(80, height - 80, 'btn_left')
    if (this.leftButton) {
      console.log('📱 Left button created at', 80, height - 80)
      this.leftButton
        .setInteractive()
        .setAlpha(0.8)
        .on('pointerdown', () => {
          this.mobileControls.leftPressed = true
        })
        .on('pointerup', () => {
          this.mobileControls.leftPressed = false
        })
        .on('pointerout', () => {
          this.mobileControls.leftPressed = false
        })
        .on('pointercancel', () => {
          this.mobileControls.leftPressed = false
        })
    }

    // Right button
    this.rightButton = this.add.image(width - 80, height - 80, 'btn_right')
    if (this.rightButton) {
      console.log('📱 Right button created at', width - 80, height - 80)
      this.rightButton
        .setInteractive()
        .setAlpha(0.8)
      .on('pointerdown', () => {
        this.mobileControls.rightPressed = true
      })
      .on('pointerup', () => {
        this.mobileControls.rightPressed = false
      })
      .on('pointerout', () => {
        this.mobileControls.rightPressed = false
      })
      .on('pointercancel', () => {
        this.mobileControls.rightPressed = false
      })
    }
  }

  private createUI(width: number, height: number) {
    // Score
    this.scoreText = this.add.text(16, 16, t('game.score', { score: this.score }), {
      fontSize: '18px',
      fontFamily: 'Inter, sans-serif',
      color: '#333333',
      fontWeight: 'bold',
      stroke: '#ffffff',
      strokeThickness: 2
    })

    // Lives
    this.livesText = this.add.text(16, 45, this.getLivesText(), {
      fontSize: '18px',
      fontFamily: 'Inter, sans-serif',
      color: '#333333',
      stroke: '#ffffff',
      strokeThickness: 2
    })

    // Time
    this.timeText = this.add.text(width - 16, 16, t('game.time', { time: this.gameTime }), {
      fontSize: '18px',
      fontFamily: 'Inter, sans-serif',
      color: '#333333',
      fontWeight: 'bold',
      stroke: '#ffffff',
      strokeThickness: 2
    }).setOrigin(1, 0)

    // Pause button
    if (this.textures.exists('btn_pause')) {
      this.pauseButton = this.add.image(width - 16, 50, 'btn_pause')
        .setOrigin(1, 0)
        .setScale(0.8)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.togglePause())
      console.log('✅ Pause button created at', width - 16, 50)
    } else {
      console.warn('⚠️ Pause button sprite not ready, skipping pause button')
    }

    // Power-up indicator
    this.powerupIndicator = this.add.text(width / 2, 100, '', {
      fontSize: '16px',
      color: '#FFD700',
      fontWeight: 'bold',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setVisible(false)

    // Create pause overlay
    this.createPauseOverlay(width, height)
  }

  private createPauseOverlay(width: number, height: number) {
    this.pauseOverlay = this.add.container(0, 0)

    // Background
    const pauseBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    
    // Pause text
    const pauseText = this.add.text(width / 2, height / 2 - 50, t('game.pause'), {
      fontSize: '32px',
      color: '#ffffff',
      fontWeight: 'bold'
    }).setOrigin(0.5)

    // Resume button
    const resumeButton = this.add.text(width / 2, height / 2 + 20, t('game.resume'), {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#28a745',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.togglePause())

    // Menu button
    const menuButton = this.add.text(width / 2, height / 2 + 80, 'Menu', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#6c757d',
      padding: { x: 15, y: 8 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      logger.info('NAVIGATION', 'GameScene pause menu -> returning to homepage')
      this.scene.stop()
      
      // Return to homepage instead of MenuScene
      if (typeof window !== 'undefined' && (window as any).returnToHomepage) {
        logger.info('NAVIGATION', 'Using returnToHomepage function from pause menu')
        ;(window as any).returnToHomepage()
      } else {
        // Fallback to MenuScene if homepage function not available
        logger.warn('NAVIGATION', 'returnToHomepage not available, falling back to MenuScene')
        this.scene.start('MenuScene')
      }
    })

    this.pauseOverlay.add([pauseBg, pauseText, resumeButton, menuButton])
    this.pauseOverlay.setVisible(false)
  }

  private createCollisions() {
    // Player vs bottles
    this.physics.add.overlap(this.player, this.bottles, (player, bottle) => {
      this.collectBottle(bottle as Phaser.Physics.Arcade.Sprite)
    }, undefined, this)

    // Player vs powerups
    this.physics.add.overlap(this.player, this.powerups, (player, powerup) => {
      this.collectPowerup(powerup as Phaser.Physics.Arcade.Sprite)
    }, undefined, this)
  }

  private startGame() {
    if (this.gameStarted) return

    this.gameStarted = true
    this.gameRunning = true
    this.gameStartTimestamp = Date.now()

    // Start game timer
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTime,
      callbackScope: this,
      loop: true
    })

    // Start bottle spawning
    const spawnDelay = this.isMobile ? 1200 : 1000
    this.spawnTimer = this.time.addEvent({
      delay: spawnDelay,
      callback: this.spawnBottle,
      callbackScope: this,
      loop: true
    })

    // Start power-up spawning
    this.powerupSpawnTimer = this.time.addEvent({
      delay: 8000,
      callback: this.spawnPowerup,
      callbackScope: this,
      loop: true
    })
  }

  private spawnBottle() {
    if (!this.gameRunning || this.bottles.children.size > 8) return

    const width = this.cameras.main.width
    const x = Phaser.Math.Between(50, width - 50)
    const isGood = Math.random() > 0.3 // 70% chance of good bottle

    const textureKey = isGood ? 'bottle_craft' : 'bottle_industrial_green'
    const bottle = this.bottles.create(x, -30, textureKey) as Phaser.Physics.Arcade.Sprite
    
    // Calculate speed based on time elapsed (difficulty increase)
    const timeElapsed = 60 - this.gameTime
    const speedMultiplier = 1 + (timeElapsed * 0.01) // 1% increase per second
    const baseSpeed = 150
    const speed = baseSpeed * speedMultiplier
    
    bottle.setVelocityY(speed + Math.random() * 30)
    bottle.setData('isGood', isGood)
    
    // Auto-destroy when off screen
    const destroyTimer = this.time.delayedCall(8000, () => {
      if (bottle.active) {
        bottle.destroy()
      }
      // Remove from active timers list
      const index = this.activeTimers.indexOf(destroyTimer)
      if (index > -1) {
        this.activeTimers.splice(index, 1)
      }
    })
    bottle.setData('autoDestroy', destroyTimer)
    this.activeTimers.push(destroyTimer)
  }

  private spawnPowerup() {
    if (!this.gameRunning || this.powerups.children.size > 2) return

    const width = this.cameras.main.width
    const x = Phaser.Math.Between(50, width - 50)
    
    const powerup = this.powerups.create(x, -30, 'powerup_star') as Phaser.Physics.Arcade.Sprite
    powerup.setVelocityY(120)
    
    // Auto-destroy when off screen
    const destroyTimer = this.time.delayedCall(10000, () => {
      if (powerup.active) {
        powerup.destroy()
      }
      // Remove from active timers list
      const index = this.activeTimers.indexOf(destroyTimer)
      if (index > -1) {
        this.activeTimers.splice(index, 1)
      }
    })
    powerup.setData('autoDestroy', destroyTimer)
    this.activeTimers.push(destroyTimer)
  }

  private collectBottle(bottle: Phaser.Physics.Arcade.Sprite) {
    const isGood = bottle.getData('isGood')
    
    // Clear auto-destroy timer
    const autoDestroy = bottle.getData('autoDestroy')
    if (autoDestroy) {
      autoDestroy.destroy()
    }
    
    bottle.destroy()

    if (isGood || this.allGoodPowerupActive) {
      this.score += 1
      this.scoreText.setText(t('game.score', { score: this.score }))
      
      if (this.audioEnabled) {
        this.sound.play('pickup_good', { volume: 0.5 })
      }
    } else {
      this.lives -= 1
      this.livesText.setText(this.getLivesText())
      
      if (this.audioEnabled) {
        this.sound.play('pickup_bad', { volume: 0.5 })
      }
      
      // Screen shake effect
      this.cameras.main.shake(200, 0.01)
      
      if (this.lives <= 0) {
        this.endGame()
      }
    }
  }

  private collectPowerup(powerup: Phaser.Physics.Arcade.Sprite) {
    // Clear auto-destroy timer
    const autoDestroy = powerup.getData('autoDestroy')
    if (autoDestroy) {
      autoDestroy.destroy()
    }
    
    powerup.destroy()
    
    this.score += 5
    this.gameTime += 5 // Add 5 seconds
    this.scoreText.setText(t('game.score', { score: this.score }))
    this.timeText.setText(t('game.time', { time: this.gameTime }))
    
    // Activate "All Good" power-up for 10 seconds
    this.allGoodPowerupActive = true
    this.powerupRemainingTime = 10
    
    // Stop any existing powerup timer
    if (this.powerupTimer) {
      this.powerupTimer.destroy()
    }
    
    // Create a new timer that can be paused
    this.powerupTimer = this.time.addEvent({
      delay: 1000,
      repeat: 9,
      callback: () => {
        this.powerupRemainingTime -= 1
        if (this.powerupRemainingTime <= 0) {
          this.allGoodPowerupActive = false
          this.powerupIndicator.setVisible(false)
        }
      },
      callbackScope: this
    })
    
    this.powerupIndicator.setText('ALL GOOD! 🌟')
    this.powerupIndicator.setVisible(true)
    
    if (this.audioEnabled) {
      this.sound.play('powerup', { volume: 0.7 })
    }
    
    // Visual effect
    this.cameras.main.flash(200, 255, 255, 0)
  }

  private updateTime() {
    this.gameTime -= 1
    this.timeText.setText(t('game.time', { time: this.gameTime }))

    if (this.gameTime <= 0) {
      this.endGame()
    }
  }

  private async endGame() {
    this.gameRunning = false
    
    // Cleanup timers
    if (this.gameTimer) {
      this.gameTimer.destroy()
    }
    if (this.spawnTimer) {
      this.spawnTimer.destroy()
    }
    if (this.powerupSpawnTimer) {
      this.powerupSpawnTimer.destroy()
    }
    if (this.powerupTimer) {
      this.powerupTimer.destroy()
    }

    // Clear all objects
    this.bottles.clear(true, true)
    this.powerups.clear(true, true)

    // Stop background music
    if (this.bgMusic) {
      this.bgMusic.stop()
    }

    // Calculate game duration for anti-cheat
    const gameEndTimestamp = Date.now()
    const actualDuration = (gameEndTimestamp - this.gameStartTimestamp) / 1000

    // Pass game data to GameOver scene
    const gameData = {
      score: this.score,
      lives: this.lives,
      gameEndTimestamp,
      actualDuration: Math.round(actualDuration),
      reason: this.lives <= 0 ? 'lives' : 'time'
    }

    this.scene.start('GameOverScene', gameData)
  }

  private togglePause() {
    if (!this.gameRunning) return

    this.isPaused = !this.isPaused
    
    if (this.isPaused) {
      this.physics.pause()
      this.pauseOverlay.setVisible(true)
      
      // Pause timers
      if (this.gameTimer) this.gameTimer.paused = true
      if (this.spawnTimer) this.spawnTimer.paused = true
      if (this.powerupSpawnTimer) this.powerupSpawnTimer.paused = true
      if (this.powerupTimer) this.powerupTimer.paused = true
      
      // Pause all active destroy timers
      this.activeTimers.forEach(timer => {
        if (timer && timer.paused !== undefined) {
          timer.paused = true
        }
      })
      
      if (this.bgMusic && this.bgMusic.isPlaying) {
        this.bgMusic.pause()
      }
    } else {
      this.physics.resume()
      this.pauseOverlay.setVisible(false)
      
      // Resume timers
      if (this.gameTimer) this.gameTimer.paused = false
      if (this.spawnTimer) this.spawnTimer.paused = false
      if (this.powerupSpawnTimer) this.powerupSpawnTimer.paused = false
      if (this.powerupTimer) this.powerupTimer.paused = false
      
      // Resume all active destroy timers
      this.activeTimers.forEach(timer => {
        if (timer && timer.paused !== undefined) {
          timer.paused = false
        }
      })
      
      if (this.bgMusic && this.bgMusic.isPaused) {
        this.bgMusic.resume()
      }
    }
  }

  private getLivesText(): string {
    const hearts = '❤️'.repeat(this.lives) + '🤍'.repeat(3 - this.lives)
    return `${t('game.lives')} ${hearts}`
  }

  private startBackgroundMusic() {
    // Check if audio is cached before trying to play
    if (this.cache.audio.exists('music_bg')) {
      try {
        this.bgMusic = this.sound.add('music_bg', { volume: 0.3, loop: true })
        this.bgMusic.play()
      } catch (error) {
        console.log('🔇 Background music not available, continuing without audio')
      }
    } else {
      console.log('🔇 Background music cache not found, continuing silently')
    }
  }

  private setupFocusHandling() {
    // Auto-pause when window loses focus
    this.events.on('pause', () => {
      if (this.gameRunning && !this.isPaused) {
        this.togglePause()
      }
    })
  }

  update() {
    if (!this.gameRunning || this.isPaused) return

    try {
      // Update power-up indicator countdown
      if (this.allGoodPowerupActive) {
        this.powerupIndicator.setText(`ALL GOOD! 🌟 (${this.powerupRemainingTime}s)`)
      }

      // Player movement
      const leftActive = this.cursors.left.isDown || 
                        this.input.keyboard!.checkDown(this.input.keyboard!.addKey('A')) ||
                        this.mobileControls.leftPressed
      
      const rightActive = this.cursors.right.isDown || 
                         this.input.keyboard!.checkDown(this.input.keyboard!.addKey('D')) ||
                         this.mobileControls.rightPressed

      if (leftActive && !rightActive) {
        this.player.setVelocityX(-250)
      } else if (rightActive && !leftActive) {
        this.player.setVelocityX(250)
      } else {
        this.player.setVelocityX(0)
      }

      // Clean up off-screen objects (mobile optimization)
      this.bottles.children.entries.forEach(bottle => {
        const sprite = bottle as Phaser.Physics.Arcade.Sprite
        if (sprite.y > this.cameras.main.height + 50) {
          sprite.destroy()
        }
      })

      this.powerups.children.entries.forEach(powerup => {
        const sprite = powerup as Phaser.Physics.Arcade.Sprite
        if (sprite.y > this.cameras.main.height + 50) {
          sprite.destroy()
        }
      })

    } catch (error) {
      console.warn('GameScene update error:', error)
    }
  }

  shutdown() {
    // Clean up keyboard listeners to prevent conflicts with HTML inputs
    if (this.input?.keyboard) {
      // Remove WASD key listeners
      if (this.wasdKeys) {
        Object.values(this.wasdKeys).forEach(key => {
          if (key) {
            this.input.keyboard!.removeKey(key)
          }
        })
      }
      
      // Remove all keyboard listeners for this scene
      this.input.keyboard.removeAllListeners()
    }
    
    console.log('🧹 GameScene keyboard listeners cleaned up')
  }
}