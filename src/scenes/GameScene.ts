import { Scene } from 'phaser'
import { languageManager } from '../i18n/LanguageManager'
import { characterManager } from '../systems/CharacterManager'
import { simpleAuth } from '../systems/SimpleAuth'

export class GameScene extends Scene {
  private character!: Phaser.Physics.Arcade.Image
  private bottles!: Phaser.Physics.Arcade.Group
  private powerups!: Phaser.Physics.Arcade.Group
  private score: number = 0
  private lives: number = 3
  private timeLeft: number = 60 // 60 seconds game
  private scoreText!: Phaser.GameObjects.Text
  private livesText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private powerupText!: Phaser.GameObjects.Text
  private instructionsText!: Phaser.GameObjects.Text
  private rulesText!: Phaser.GameObjects.Text
  private languageChangeCallback?: (language: any) => void
  private spawnTimer!: Phaser.Time.TimerEvent
  private powerupTimer!: Phaser.Time.TimerEvent
  private gameTimer!: Phaser.Time.TimerEvent
  private allGoodTimer!: Phaser.Time.TimerEvent
  private gameStarted: boolean = false
  private gameOver: boolean = false
  private allGoodMode: boolean = false
  private allGoodTimeLeft: number = 0
  private gameOverTexts: Phaser.GameObjects.Text[] = []
  public moveDirection: number = 0 // -1 left, 0 stop, 1 right - controlled by HTML buttons

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    console.log('🎮 GameScene: Initializing game...')

    // Set background - Create radial gradient directly with Phaser Graphics
    const { width, height } = this.cameras.main

    // Create graphics object for radial gradient background
    const graphics = this.add.graphics()

    // First: Fill entire screen with dark green base (#2E4B16)
    graphics.fillStyle(0x2E4B16, 1.0)
    graphics.fillRect(0, 0, width, height)

    // Second: Create radial gradient overlay from center
    const centerX = width / 2
    const centerY = height / 2
    // Calculate diagonal distance to ensure we cover corners
    const maxRadius = Math.sqrt(width * width + height * height)

    // Irish pub green gradient: #64A834 (bright center) fading to edges
    const steps = 100
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps
      const currentRadius = (maxRadius * ratio) * 0.7

      // Interpolate from bright center (#64A834) to transparent (reveals dark base)
      const r = Math.floor(100 - (100 - 46) * ratio)
      const g = Math.floor(168 - (168 - 75) * ratio)
      const b = Math.floor(52 - (52 - 22) * ratio)

      const color = (r << 16) | (g << 8) | b
      const alpha = 1.0 - (ratio * 0.6) // Fade out towards edges

      graphics.fillStyle(color, alpha)
      graphics.fillCircle(centerX, centerY, currentRadius)
    }

    // Set graphics to very bottom layer
    graphics.setDepth(-1000)

    this.setupUI()
    this.setupGameObjects()
    this.setupInput()
    this.setupCollisions()

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0)

    console.log('✅ GameScene: Ready to play!')
  }

  private setupUI(): void {
    const { width, height } = this.cameras.main
    const t = languageManager.getTranslation()

    // Score display - White text with dark shadow for visibility
    this.scoreText = this.add.text(16, 16, `${t.score}: 0`, {
      fontSize: '24px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })

    // Lives display - White text with dark shadow
    this.livesText = this.add.text(16, 50, `${t.lives}: ❤️❤️❤️`, {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })

    // Timer display - White text with dark shadow
    this.timerText = this.add.text(width / 2, 16, `${t.time}: 60s`, {
      fontSize: '24px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    // Power-up indicator - Yellow with dark stroke for maximum visibility
    this.powerupText = this.add.text(width - 16, 16, '', {
      fontSize: '18px',
      color: '#FFD700',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0) // Right-aligned

    // Instructions - White text with dark shadow for readability
    this.instructionsText = this.add.text(width / 2, height * 0.12, languageManager.translateWithCharacter('gameInstructions'), {
      fontSize: Math.min(18, width * 0.025) + 'px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    // Rules - Light yellow with dark shadow
    this.rulesText = this.add.text(width / 2, height * 0.16, t.gameRules, {
      fontSize: Math.min(14, width * 0.018) + 'px',
      color: '#FFEB3B',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    // Listen for language changes and update UI texts
    this.languageChangeCallback = () => {
      this.updateUITexts()
    }
    languageManager.onLanguageChange(this.languageChangeCallback)

    // 🎭 Listen for character changes and update UI texts
    characterManager.subscribe(() => {
      this.updateUITexts()
    })
  }

  private updateUITexts(): void {
    const t = languageManager.getTranslation()

    // Update score text
    this.scoreText.setText(`${t.score}: ${this.score}`)

    // Update lives text
    const hearts = '❤️'.repeat(this.lives)
    this.livesText.setText(`${t.lives}: ${hearts}`)

    // Update timer text
    this.timerText.setText(`${t.time}: ${this.timeLeft}s`)

    // Update instructions and rules
    this.instructionsText.setText(languageManager.translateWithCharacter('gameInstructions'))
    this.rulesText.setText(t.gameRules)

    // Update All Good text if active
    if (this.allGoodMode) {
      this.powerupText.setText(`⭐ ${t.allGood}: ${this.allGoodTimeLeft}s`)
    }
  }

  private setupGameObjects(): void {
    const { width, height } = this.cameras.main

    // Create character (use current selected character)
    const currentCharacter = characterManager.getCurrentCharacter()
    this.character = this.physics.add.image(width / 2, height - 80, currentCharacter)
    this.character.setCollideWorldBounds(true)
    this.character.setImmovable(true)

    // Scale character appropriately for gameplay
    this.character.setScale(0.6) // Reduce size to 60%

    // Listen for character changes
    characterManager.onCharacterChange((newCharacter) => {
      if (this.character) {
        this.character.setTexture(newCharacter)
        console.log(`🐱 Character sprite updated to: ${newCharacter}`)
      }
    })

    // Create bottles group
    this.bottles = this.physics.add.group({
      defaultKey: 'bottle',
      maxSize: 15
    })

    // Create powerups group
    this.powerups = this.physics.add.group({
      defaultKey: 'powerup_star',
      maxSize: 3
    })
  }

  private setupInput(): void {
    // Keyboard controls
    const cursors = this.input.keyboard?.createCursorKeys()
    if (cursors) {
      // Handle keyboard input in update loop
    }

    // Mouse/Touch controls (drag mode for desktop)
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const { width } = this.cameras.main
        const margin = Math.max(40, width * 0.05) // 5% margin or minimum 40px
        this.character.x = Phaser.Math.Clamp(pointer.x, margin, width - margin)
      }
    })

    this.input.on('pointerdown', () => {
      // Only allow game start if not in game over state
      if (!this.gameOver) {
        this.startGame()
      }
    })
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.character,
      this.bottles,
      this.catchBottle,
      undefined,
      this
    )

    this.physics.add.overlap(
      this.character,
      this.powerups,
      this.catchPowerup,
      undefined,
      this
    )
  }

  private startGame(): void {
    if (this.gameStarted) return

    // Clear any previous game over texts
    this.gameOverTexts.forEach(text => text.destroy())
    this.gameOverTexts = []

    // Reset game state for fresh start
    this.lives = 3
    this.score = 0
    this.timeLeft = 60
    this.gameOver = false
    this.allGoodMode = false
    this.allGoodTimeLeft = 0

    // Update UI
    this.updateLivesDisplay()
    const t = languageManager.getTranslation()
    this.scoreText.setText(`${t.score}: ${this.score}`)
    this.timerText.setText(`${t.time}: ${this.timeLeft}s`)
    this.powerupText.setText('')

    this.gameStarted = true
    console.log('🚀 GAME START DEBUG (RESET):')
    console.log(`💗 Starting Lives: ${this.lives}`)
    console.log(`🎯 Starting Score: ${this.score}`)
    console.log(`⏰ Starting Time: ${this.timeLeft}s`)
    console.log(`⭐ All Good Mode: ${this.allGoodMode}`)

    // Start spawning bottles
    this.spawnTimer = this.time.addEvent({
      delay: 1000,
      callback: this.spawnBottle,
      callbackScope: this,
      loop: true
    })

    // Start spawning powerups (random intervals)
    this.scheduleNextPowerup()

    // Start game timer
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    })
  }

  private spawnBottle(): void {
    if (this.gameOver) return

    const { width } = this.cameras.main
    // Ensure bottles spawn well within screen bounds
    const minX = 60
    const maxX = width - 60
    const x = Phaser.Math.Between(minX, maxX)

    // 20% chance for green bottle (poison)
    const isGreen = Math.random() < 0.2

    const bottle = this.bottles.get(x, -50, 'bottle')
    if (bottle) {
      bottle.setActive(true)
      bottle.setVisible(true)

      // Change texture based on bottle type
      if (isGreen) {
        bottle.setTexture('bottle_green')
        console.log(`🟢 GREEN bottle spawned at x:${x}`)
      } else {
        bottle.setTexture('bottle')
        console.log(`🍶 BROWN bottle spawned at x:${x}`)
      }

      // 🎮 PROGRESSIVE DIFFICULTY: Speed increases every 10 seconds
      // Adjust base speed based on screen height (taller screens need faster falling)
      const { height } = this.cameras.main
      const baseSpeed = height > 700 ? 330 : 200 // 65% faster for tall mobile screens
      const bottleSpeed = this.calculateBottleSpeed(baseSpeed)
      bottle.body.velocity.y = bottleSpeed
      bottle.body.velocity.x = Phaser.Math.Between(-50, 50)

      // Set collision bounds to detect when bottle hits ground
      bottle.body.setCollideWorldBounds(true)
      bottle.body.setBounce(0)

      // Check for ground collision in update loop
      bottle.setData('checkGround', true)
      bottle.setData('isGreen', isGreen)
    }
  }

  private calculateBottleSpeed(baseSpeed: number): number {
    // Calculate elapsed time (60 - remaining time)
    const elapsedTime = 60 - this.timeLeft

    // Increase 15% every 10 seconds
    const difficultyLevel = Math.floor(elapsedTime / 10)
    const speedMultiplier = 1 + (difficultyLevel * 0.15)

    const finalSpeed = Math.floor(baseSpeed * speedMultiplier)

    // Log only on level changes (every 10 seconds)
    if (elapsedTime % 10 === 0 && elapsedTime > 0) {
      console.log(`⚡ Difficulty Level ${difficultyLevel}: Speed ${finalSpeed}px/s (${Math.floor(speedMultiplier * 100)}%)`)
    }

    return finalSpeed
  }

  private scheduleNextPowerup(): void {
    if (this.gameOver) return

    // More random delay between 5-30 seconds with weighted distribution
    const minDelay = 5000
    const maxDelay = 30000

    // Use exponential distribution for more variety (favor shorter intervals but allow long ones)
    const random = Math.random()
    const exponentialFactor = Math.pow(random, 1.5) // Creates weighted distribution
    const randomDelay = minDelay + (maxDelay - minDelay) * exponentialFactor

    console.log(`⭐ Next power-up scheduled in ${(randomDelay / 1000).toFixed(1)}s`)

    this.powerupTimer = this.time.addEvent({
      delay: randomDelay,
      callback: () => {
        this.spawnPowerup()
        this.scheduleNextPowerup() // Schedule the next one
      },
      callbackScope: this
    })
  }

  private spawnPowerup(): void {
    if (this.gameOver) return

    const { width } = this.cameras.main
    // Ensure powerups spawn well within screen bounds
    const minX = 80
    const maxX = width - 80
    const x = Phaser.Math.Between(minX, maxX)

    const powerup = this.powerups.get(x, -30, 'powerup_star')
    if (powerup) {
      powerup.setActive(true)
      powerup.setVisible(true)

      // Random velocity for more dynamic movement + progressive difficulty
      // Adjust speed based on screen height (taller screens need faster falling)
      const { height } = this.cameras.main
      const speedMultiplier = height > 700 ? 1.65 : 1.0
      const baseVelocityY = Phaser.Math.Between(Math.floor(120 * speedMultiplier), Math.floor(180 * speedMultiplier))
      const velocityY = this.calculateBottleSpeed(baseVelocityY)
      const velocityX = Phaser.Math.Between(-30, 30)

      powerup.body.velocity.y = velocityY
      powerup.body.velocity.x = velocityX

      // Set collision bounds
      powerup.body.setCollideWorldBounds(true)
      powerup.body.setBounce(0)

      // Check for ground collision in update loop
      powerup.setData('checkGround', true)

      console.log(`⭐ Power-up spawned at x:${x} with velocity(${velocityX}, ${velocityY})`)
    }
  }

  private catchBottle(_bucket: any, bottle: any): void {
    // Check if bottle is already inactive to prevent multiple scoring
    if (!bottle.active) return

    const isGreen = bottle.getData('isGreen')
    console.log(`🎯 BOTTLE CATCH DEBUG:`)
    console.log(`🍶 Bottle type: ${isGreen ? 'GREEN (poison)' : 'BROWN (normal)'}`)
    console.log(`⭐ All Good Mode: ${this.allGoodMode}`)
    console.log(`💗 Lives before catch: ${this.lives}`)

    // Remove caught bottle immediately
    this.bottles.killAndHide(bottle)
    bottle.setActive(false)
    bottle.setVisible(false)

    if (isGreen && !this.allGoodMode) {
      // Green bottle without All Good mode = lose life
      console.log(`🚨 GREEN BOTTLE CAUGHT WITHOUT ALL GOOD - LOSING LIFE!`)
      this.loseLife()
    } else {
      // Normal bottle or All Good mode active = gain points
      this.score += 1
      const t = languageManager.getTranslation()
      this.scoreText.setText(`${t.score}: ${this.score}`)
      console.log(`✅ ${isGreen ? 'Green bottle (All Good active)' : 'Brown bottle'} caught! +1 point. Score: ${this.score}`)
    }
  }

  private catchPowerup(_bucket: any, powerup: any): void {
    // Check if powerup is already inactive
    if (!powerup.active) return

    console.log(`⭐ POWERUP CATCH DEBUG:`)
    console.log(`💗 Lives before powerup: ${this.lives}`)

    // Remove caught powerup immediately
    this.powerups.killAndHide(powerup)
    powerup.setActive(false)
    powerup.setVisible(false)

    // Activate All Good mode for 10 seconds
    this.activateAllGoodMode()

    console.log(`✅ Power-up caught! All Good mode activated! Lives unchanged: ${this.lives}`)
  }

  private loseLife(): void {
    if (this.gameOver) return

    // Get stack trace to see who called this
    const stack = new Error().stack
    console.warn(`🚨 LIFE LOST DEBUG:`)
    console.warn(`💔 Lives before: ${this.lives}`)
    console.warn(`🔍 Called from:`, stack?.split('\n').slice(1, 4))
    console.warn(`⭐ All Good Mode: ${this.allGoodMode}`)

    this.lives -= 1
    this.updateLivesDisplay()

    console.warn(`💔 Lives after: ${this.lives}`)

    if (this.lives <= 0) {
      console.warn(`☠️ GAME OVER - No lives remaining`)
      this.endGame()
    }
  }

  private updateLivesDisplay(): void {
    const hearts = '❤️'.repeat(this.lives)
    const t = languageManager.getTranslation()
    this.livesText.setText(`${t.lives}: ${hearts}`)
  }

  private updateTimer(): void {
    if (this.gameOver) return

    this.timeLeft -= 1
    const t = languageManager.getTranslation()
    this.timerText.setText(`${t.time}: ${this.timeLeft}s`)

    if (this.timeLeft <= 0) {
      this.endGame()
    }
  }

  private activateAllGoodMode(): void {
    this.allGoodMode = true
    this.allGoodTimeLeft = 10

    // 🆕 TIME BONUS: Add 5 seconds to game timer
    this.timeLeft += 5
    console.log(`⏰ Star collected! +5 seconds bonus. New time: ${this.timeLeft}s`)

    // Update UI
    const t = languageManager.getTranslation()
    this.timerText.setText(`${t.time}: ${this.timeLeft}s`) // Update timer display
    this.powerupText.setText(`⭐ ${t.allGood}: ${this.allGoodTimeLeft}s`)

    // Start countdown timer
    if (this.allGoodTimer) {
      this.allGoodTimer.destroy()
    }

    this.allGoodTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateAllGoodMode,
      callbackScope: this,
      loop: true
    })
  }

  private updateAllGoodMode(): void {
    if (!this.allGoodMode) return

    this.allGoodTimeLeft -= 1
    const t = languageManager.getTranslation()
    this.powerupText.setText(`⭐ ${t.allGood}: ${this.allGoodTimeLeft}s`)

    if (this.allGoodTimeLeft <= 0) {
      this.deactivateAllGoodMode()
    }
  }

  private deactivateAllGoodMode(): void {
    this.allGoodMode = false
    this.allGoodTimeLeft = 0
    this.powerupText.setText('')

    if (this.allGoodTimer) {
      this.allGoodTimer.destroy()
    }

    console.log('⭐ All Good mode deactivated')
  }

  private endGame(): void {
    this.gameOver = true
    this.gameStarted = false

    // Stop all timers
    if (this.spawnTimer) this.spawnTimer.destroy()
    if (this.powerupTimer) this.powerupTimer.destroy()
    if (this.gameTimer) this.gameTimer.destroy()
    if (this.allGoodTimer) this.allGoodTimer.destroy()

    // Deactivate any active powerups
    this.deactivateAllGoodMode()

    // Show game over message
    const { width, height } = this.cameras.main
    const t = languageManager.getTranslation()

    const gameOverText = this.add.text(width / 2, height / 2 - 50, t.gameOver, {
      fontSize: Math.min(48, width * 0.06) + 'px',
      color: '#FF1744',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5)

    const finalScoreText = this.add.text(width / 2, height / 2, `${t.finalScore}: ${this.score}`, {
      fontSize: Math.min(24, width * 0.03) + 'px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    const restartText = this.add.text(width / 2, height / 2 + 50, t.restartMessage, {
      fontSize: Math.min(18, width * 0.025) + 'px',
      color: '#FFEB3B',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    // Add clickable "NUOVA PARTITA" button
    const buttonWidth = Math.min(250, width * 0.4)
    const buttonHeight = 50
    const buttonY = height / 2 + 120

    // Button background
    const buttonBg = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x4CAF50, 1)
    buttonBg.setInteractive({ useHandCursor: true })
    buttonBg.setStrokeStyle(3, 0x2E7D32)

    // Button text
    const buttonText = this.add.text(width / 2, buttonY, t.newGame || '🎮 NUOVA PARTITA', {
      fontSize: Math.min(20, width * 0.028) + 'px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Button hover effect
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x66BB6A, 1)
    })

    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x4CAF50, 1)
    })

    // Button click handler
    buttonBg.on('pointerdown', () => {
      console.log('🔄 NUOVA PARTITA clicked from GameOver screen')
      // Clear all game over elements
      this.gameOverTexts.forEach(text => text.destroy())
      this.gameOverTexts = []
      buttonBg.destroy()
      buttonText.destroy()

      // Clear all remaining bottles and powerups
      this.bottles.clear(true, true)
      this.powerups.clear(true, true)

      // Restart the game
      this.startGame()
    })

    // Store game over elements for cleanup
    this.gameOverTexts.push(gameOverText, finalScoreText, restartText, buttonBg as any, buttonText)

    console.log(`🎮 Game Over! Final Score: ${this.score}`)

    // Submit score to database
    this.submitScoreToDatabase()
  }

  update(): void {
    if (this.gameOver) return

    const { width, height } = this.cameras.main
    const margin = Math.max(40, width * 0.05) // 5% margin or minimum 40px
    const speed = Math.max(5, width * 0.006) // Responsive speed based on screen width

    // Keyboard controls
    const cursors = this.input.keyboard?.createCursorKeys()
    if (cursors) {
      if (cursors.left?.isDown) {
        this.character.x = Math.max(margin, this.character.x - speed)
      } else if (cursors.right?.isDown) {
        this.character.x = Math.min(width - margin, this.character.x + speed)
      }
    }

    // Touch button controls
    if (this.moveDirection !== 0) {
      if (this.moveDirection === -1) {
        this.character.x = Math.max(margin, this.character.x - speed)
      } else if (this.moveDirection === 1) {
        this.character.x = Math.min(width - margin, this.character.x + speed)
      }
    }

    // Check bottles that hit the ground
    this.bottles.children.entries.forEach((bottle: any) => {
      if (bottle.active && bottle.getData('checkGround')) {
        // Check if bottle hit the bottom (ground)
        if (bottle.y >= height - 20) { // Near bottom of screen
          const isGreen = bottle.getData('isGreen')
          console.log(`🌍 GROUND HIT: ${isGreen ? 'GREEN' : 'BROWN'} bottle hit ground - NO LIFE LOSS`)

          this.bottles.killAndHide(bottle)
          bottle.setActive(false)
          bottle.setVisible(false)
          // No life loss for bottles hitting ground - only when catching green bottles
        }
      }
    })

    // Check powerups that hit the ground
    this.powerups.children.entries.forEach((powerup: any) => {
      if (powerup.active && powerup.getData('checkGround')) {
        // Check if powerup hit the bottom (ground)
        if (powerup.y >= height - 20) { // Near bottom of screen
          this.powerups.killAndHide(powerup)
          powerup.setActive(false)
          powerup.setVisible(false)
          // No penalty for missing powerups
        }
      }
    })

    // Auto-start is DISABLED to prevent confusion
    // Users must explicitly click to start the game
    // if (!this.gameStarted && !this.gameOver && this.time.now > 3000) {
    //   this.startGame()
    // }
  }

  private async submitScoreToDatabase(): Promise<void> {
    try {
      console.log('📊 CHECKING SCORE SUBMISSION ELIGIBILITY...', {
        score: this.score,
        timeElapsed: 60 - this.timeLeft
      })

      // Check if user is in casual mode
      const isCasualMode = localStorage.getItem('gameMode') === 'casual'
      if (isCasualMode) {
        console.log('🎮 CASUAL MODE: Score submission blocked - user playing for fun only')

        // Show casual mode message
        const { width, height } = this.cameras.main
        const t = languageManager.getTranslation()

        const casualText = this.add.text(width / 2, height / 2 + 150, t.casualModeScoreBlocked || 'Casual Mode: Score not saved', {
          fontSize: Math.min(16, width * 0.022) + 'px',
          color: '#FFA726',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5)

        this.gameOverTexts.push(casualText)
        return
      }

      // Get current user
      const state = simpleAuth.getState()
      if (!state.user || !state.isAuthenticated) {
        console.error('❌ No authenticated user found for score submission')
        return
      }

      // Check newsletter consent for competitive eligibility
      if (!state.profile?.consent_marketing) {
        console.log('📧 NEWSLETTER CONSENT MISSING: Score submission blocked - user not eligible for competition')

        // Show newsletter requirement message
        const { width, height } = this.cameras.main
        const t = languageManager.getTranslation()

        const consentText = this.add.text(width / 2, height / 2 + 150, t.newsletterRequiredForScore || 'Newsletter subscription required for competition', {
          fontSize: Math.min(16, width * 0.022) + 'px',
          color: '#FFA726',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5)

        this.gameOverTexts.push(consentText)
        return
      }

      console.log('🏆 COMPETITIVE MODE: User eligible for score submission')

      // Calculate game duration (minimum 5 seconds for validation)
      const gameSeconds = Math.max(5, 60 - this.timeLeft)

      console.log('📞 Calling simpleAuth.submitScore...', {
        score: this.score,
        duration: gameSeconds
      })

      // Submit score with SimpleAuth
      const result = await simpleAuth.submitScore(this.score, gameSeconds)

      if (result.success) {
        console.log('✅ Score submitted successfully')
      } else {
        console.error('❌ Score submission failed:', result.error)
      }
    } catch (error) {
      console.error('💥 Score submission error:', error)
    }
  }

  shutdown(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy()
    }
    if (this.powerupTimer) {
      this.powerupTimer.destroy()
    }
    if (this.gameTimer) {
      this.gameTimer.destroy()
    }
    if (this.allGoodTimer) {
      this.allGoodTimer.destroy()
    }

    // Cleanup language listener
    if (this.languageChangeCallback) {
      languageManager.offLanguageChange(this.languageChangeCallback)
    }
  }
}