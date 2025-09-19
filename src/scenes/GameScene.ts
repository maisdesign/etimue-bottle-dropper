import { Scene } from 'phaser'
import { languageManager } from '../i18n/LanguageManager'
import { characterManager } from '../systems/CharacterManager'

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

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    console.log('🎮 GameScene: Initializing game...')

    // Set background
    const { width, height } = this.cameras.main
    this.add.image(width / 2, height / 2, 'background')

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

    // Score display
    this.scoreText = this.add.text(16, 16, `${t.score}: 0`, {
      fontSize: '24px',
      color: '#000000',
      fontFamily: 'Arial'
    })

    // Lives display
    this.livesText = this.add.text(16, 50, `${t.lives}: ❤️❤️❤️`, {
      fontSize: '20px',
      color: '#000000',
      fontFamily: 'Arial'
    })

    // Timer display
    this.timerText = this.add.text(width / 2, 16, `${t.time}: 60s`, {
      fontSize: '24px',
      color: '#000000',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    // Power-up indicator - positioned from right edge with right alignment
    this.powerupText = this.add.text(width - 16, 16, '', {
      fontSize: '18px',
      color: '#FFD700',
      fontFamily: 'Arial'
    }).setOrigin(1, 0) // Right-aligned

    // Instructions
    this.instructionsText = this.add.text(width / 2, height * 0.12, t.gameInstructions, {
      fontSize: Math.min(18, width * 0.025) + 'px',
      color: '#000000',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    this.rulesText = this.add.text(width / 2, height * 0.16, t.gameRules, {
      fontSize: Math.min(14, width * 0.018) + 'px',
      color: '#333333',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    // Listen for language changes and update UI texts
    this.languageChangeCallback = () => {
      this.updateUITexts()
    }
    languageManager.onLanguageChange(this.languageChangeCallback)
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
    this.instructionsText.setText(t.gameInstructions)
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

    // Align all characters at the bottom (feet level) for consistent positioning
    this.character.setOrigin(0.5, 1) // Center horizontally, bottom vertically

    // Listen for character changes
    characterManager.onCharacterChange((newCharacter) => {
      if (this.character) {
        this.character.setTexture(newCharacter)
        // Ensure consistent positioning after texture change
        this.character.setOrigin(0.5, 1) // Maintain bottom alignment
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

    // Mouse/Touch controls
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

      bottle.body.velocity.y = 200
      bottle.body.velocity.x = Phaser.Math.Between(-50, 50)

      // Set collision bounds to detect when bottle hits ground
      bottle.body.setCollideWorldBounds(true)
      bottle.body.setBounce(0)

      // Check for ground collision in update loop
      bottle.setData('checkGround', true)
      bottle.setData('isGreen', isGreen)
    }
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

      // Random velocity for more dynamic movement
      const velocityY = Phaser.Math.Between(120, 180)
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

    // Update UI
    const t = languageManager.getTranslation()
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

    const gameOverText = this.add.text(width / 2, height / 2, t.gameOver, {
      fontSize: Math.min(48, width * 0.06) + 'px',
      color: '#ff0000',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    const finalScoreText = this.add.text(width / 2, height / 2 + 50, `${t.finalScore}: ${this.score}`, {
      fontSize: Math.min(24, width * 0.03) + 'px',
      color: '#000000',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    const restartText = this.add.text(width / 2, height / 2 + 100, t.restartMessage, {
      fontSize: Math.min(18, width * 0.025) + 'px',
      color: '#666666',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    // Store game over texts for cleanup
    this.gameOverTexts.push(gameOverText, finalScoreText, restartText)

    console.log(`🎮 Game Over! Final Score: ${this.score}`)
  }

  update(): void {
    if (this.gameOver) return

    const { width, height } = this.cameras.main

    // Keyboard controls
    const cursors = this.input.keyboard?.createCursorKeys()
    if (cursors) {
      const margin = Math.max(40, width * 0.05) // 5% margin or minimum 40px
      const speed = Math.max(5, width * 0.006) // Responsive speed based on screen width
      if (cursors.left?.isDown) {
        this.character.x = Math.max(margin, this.character.x - speed)
      } else if (cursors.right?.isDown) {
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

    // Auto-start game after a few seconds if not started
    if (!this.gameStarted && !this.gameOver && this.time.now > 3000) {
      this.startGame()
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