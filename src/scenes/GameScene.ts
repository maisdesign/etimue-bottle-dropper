import { Scene } from 'phaser'

export class GameScene extends Scene {
  private bucket!: Phaser.Physics.Arcade.Image
  private bottles!: Phaser.Physics.Arcade.Group
  private score: number = 0
  private scoreText!: Phaser.GameObjects.Text
  private spawnTimer!: Phaser.Time.TimerEvent
  private gameStarted: boolean = false

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    console.log('🎮 GameScene: Initializing game...')

    // Set background
    this.add.image(400, 300, 'background')

    this.setupUI()
    this.setupGameObjects()
    this.setupInput()
    this.setupCollisions()

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0)

    console.log('✅ GameScene: Ready to play!')
  }

  private setupUI(): void {
    // Score display
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '24px',
      color: '#000000',
      fontFamily: 'Arial'
    })

    // Instructions
    this.add.text(400, 50, 'Use arrow keys or drag to move the bucket!', {
      fontSize: '18px',
      color: '#000000',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    this.add.text(400, 75, 'Catch the falling bottles to score points', {
      fontSize: '16px',
      color: '#333333',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
  }

  private setupGameObjects(): void {
    // Create bucket
    this.bucket = this.physics.add.image(400, 520, 'bucket')
    this.bucket.setCollideWorldBounds(true)
    this.bucket.setImmovable(true)

    // Create bottles group
    this.bottles = this.physics.add.group({
      defaultKey: 'bottle',
      maxSize: 10
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
        this.bucket.x = Phaser.Math.Clamp(pointer.x, 40, 760)
      }
    })

    this.input.on('pointerdown', () => {
      this.startGame()
    })
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.bucket,
      this.bottles,
      this.catchBottle,
      undefined,
      this
    )
  }

  private startGame(): void {
    if (this.gameStarted) return

    this.gameStarted = true
    console.log('🚀 Game started!')

    // Start spawning bottles
    this.spawnTimer = this.time.addEvent({
      delay: 1000,
      callback: this.spawnBottle,
      callbackScope: this,
      loop: true
    })
  }

  private spawnBottle(): void {
    const x = Phaser.Math.Between(50, 750)

    const bottle = this.bottles.get(x, -50, 'bottle')
    if (bottle) {
      bottle.setActive(true)
      bottle.setVisible(true)
      bottle.body.velocity.y = 200
      bottle.body.velocity.x = Phaser.Math.Between(-50, 50)

      // Remove bottle when it leaves the screen
      bottle.body.world.on('worldbounds', (_event: any, body: Phaser.Physics.Arcade.Body) => {
        if (body.gameObject === bottle && body.y > 600) {
          this.bottles.killAndHide(bottle)
        }
      })
      bottle.body.setCollideWorldBounds(false)
      bottle.body.onWorldBounds = true
    }
  }

  private catchBottle(_bucket: any, bottle: any): void {
    // Remove caught bottle
    this.bottles.killAndHide(bottle)

    // Increase score
    this.score += 10
    this.scoreText.setText(`Score: ${this.score}`)

    // Visual feedback
    this.cameras.main.flash(100, 255, 255, 255, false)

    console.log(`🍶 Bottle caught! Score: ${this.score}`)
  }

  update(): void {
    // Keyboard controls
    const cursors = this.input.keyboard?.createCursorKeys()
    if (cursors) {
      if (cursors.left?.isDown) {
        this.bucket.x = Math.max(40, this.bucket.x - 5)
      } else if (cursors.right?.isDown) {
        this.bucket.x = Math.min(760, this.bucket.x + 5)
      }
    }

    // Auto-start game after a few seconds if not started
    if (!this.gameStarted && this.time.now > 3000) {
      this.startGame()
    }
  }

  shutdown(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy()
    }
  }
}