/* =================== src/main.js =================== */
import Phaser from 'phaser'

// Simple game configuration
const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

// Game variables
let player
let bottles
let powerups
let cursors
let score = 0
let lives = 3
let gameTime = 60
let scoreText
let livesText
let timeText
let gameTimer
let spawnTimer
let gameStarted = false

// Mobile controls state
let mobileControls = {
    leftPressed: false,
    rightPressed: false
}

// Object pooling for better performance
let bottlePool = []
let powerupPool = []

function preload() {
    // Create colored rectangles as sprites (no external files needed!)
    
    // Player (gray cat-like rectangle)
    this.add.graphics()
        .fillStyle(0x666666)
        .fillRect(0, 0, 80, 100)
        .generateTexture('player', 80, 100)
    
    // Good bottle (brown)
    this.add.graphics()
        .fillStyle(0x8B4513)
        .fillRect(0, 0, 30, 60)
        .generateTexture('bottle_good', 30, 60)
    
    // Bad bottle (green)
    this.add.graphics()
        .fillStyle(0x228B22)
        .fillRect(0, 0, 30, 60)
        .generateTexture('bottle_bad', 30, 60)
    
    // Power-up (yellow star)
    this.add.graphics()
        .fillStyle(0xFFD700)
        .fillRect(0, 0, 40, 40)
        .generateTexture('powerup', 40, 40)
}

function create() {
    // Create player
    player = this.physics.add.sprite(200, 550, 'player')
    player.setCollideWorldBounds(true)
    
    // Create groups
    bottles = this.physics.add.group()
    powerups = this.physics.add.group()
    
    // Controls
    cursors = this.input.keyboard.createCursorKeys()
    
    // Mobile controls - Optimized for responsiveness
    if (this.sys.game.device.input.touch) {
        const leftBtn = this.add.rectangle(60, 520, 80, 60, 0x000000, 0.5)
            .setInteractive()
            .on('pointerdown', () => {
                mobileControls.leftPressed = true
            })
            .on('pointerup', () => {
                mobileControls.leftPressed = false
            })
            .on('pointerout', () => {
                mobileControls.leftPressed = false
            })
        
        const rightBtn = this.add.rectangle(340, 520, 80, 60, 0x000000, 0.5)
            .setInteractive()
            .on('pointerdown', () => {
                mobileControls.rightPressed = true
            })
            .on('pointerup', () => {
                mobileControls.rightPressed = false
            })
            .on('pointerout', () => {
                mobileControls.rightPressed = false
            })
        
        this.add.text(60, 520, '◀', { fontSize: '24px', color: '#fff' }).setOrigin(0.5)
        this.add.text(340, 520, '▶', { fontSize: '24px', color: '#fff' }).setOrigin(0.5)
    }
    
    // UI
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '18px', color: '#000' })
    livesText = this.add.text(16, 40, 'Lives: ❤️❤️❤️', { fontSize: '18px', color: '#000' })
    timeText = this.add.text(300, 16, 'Time: 60', { fontSize: '18px', color: '#000' })
    
    // Start button
    const startBtn = this.add.rectangle(200, 300, 120, 50, 0x28a745)
        .setInteractive()
        .on('pointerdown', startGame.bind(this))
    
    this.add.text(200, 300, 'START', { fontSize: '20px', color: '#fff' }).setOrigin(0.5)
    
    // Collisions
    this.physics.add.overlap(player, bottles, collectBottle, null, this)
    this.physics.add.overlap(player, powerups, collectPowerup, null, this)
}

function startGame() {
    if (gameStarted) return
    
    gameStarted = true
    
    // Start timers
    gameTimer = this.time.addEvent({
        delay: 1000,
        callback: updateTime,
        callbackScope: this,
        loop: true
    })
    
    // Slower spawn rate for mobile performance
    const spawnDelay = this.sys.game.device.input.touch ? 1000 : 800
    spawnTimer = this.time.addEvent({
        delay: spawnDelay,
        callback: spawnBottle,
        callbackScope: this,
        loop: true
    })
    
    // Spawn power-ups less frequently
    this.time.addEvent({
        delay: 8000,
        callback: spawnPowerup,
        callbackScope: this,
        loop: true
    })
}

function spawnBottle() {
    if (!gameStarted) return
    
    // Limit max bottles on screen for mobile performance
    if (bottles.children.size > 8) return
    
    const x = Phaser.Math.Between(50, 350)
    const isGood = Math.random() > 0.3  // 70% chance of good bottle
    
    const bottle = bottles.create(x, -30, isGood ? 'bottle_good' : 'bottle_bad')
    bottle.setVelocityY(150 + Math.random() * 50)  // Reduced speed variation for smoother performance
    bottle.isGood = isGood
    
    // More efficient cleanup - check bounds instead of timer
    bottle.checkWorldBounds = true
    bottle.outOfBoundsKill = true
}

function spawnPowerup() {
    if (!gameStarted) return
    
    // Limit powerups for performance
    if (powerups.children.size > 2) return
    
    const x = Phaser.Math.Between(50, 350)
    const powerup = powerups.create(x, -30, 'powerup')
    powerup.setVelocityY(120)
    
    // More efficient cleanup
    powerup.checkWorldBounds = true
    powerup.outOfBoundsKill = true
}

function collectBottle(player, bottle) {
    const wasGood = bottle.isGood  // Get the property we set
    bottle.destroy()
    
    if (wasGood) {
        score += 1
        scoreText.setText('Score: ' + score)
        console.log("Good bottle! +1 point")  // Debug
    } else {
        lives -= 1
        updateLivesDisplay()
        console.log("Bad bottle! -1 life")  // Debug
        
        if (lives <= 0) {
            endGame.call(this)
        }
    }
}

function collectPowerup(player, powerup) {
    powerup.destroy()
    score += 5
    scoreText.setText('Score: ' + score)
    
    // Visual effect
    this.cameras.main.flash(200, 255, 255, 0)
}

function updateTime() {
    gameTime -= 1
    timeText.setText('Time: ' + gameTime)
    
    if (gameTime <= 0) {
        endGame.call(this)
    }
}

function updateLivesDisplay() {
    const hearts = '❤️'.repeat(lives) + '🤍'.repeat(3 - lives)
    livesText.setText('Lives: ' + hearts)
}

function endGame() {
    gameStarted = false
    gameTimer?.destroy()
    spawnTimer?.destroy()
    
    // Clear all objects
    bottles.clear(true, true)
    powerups.clear(true, true)
    
    // Game Over screen
    this.add.rectangle(200, 300, 350, 200, 0x000000, 0.8)
    this.add.text(200, 250, 'GAME OVER!', { fontSize: '32px', color: '#fff' }).setOrigin(0.5)
    this.add.text(200, 300, `Final Score: ${score}`, { fontSize: '24px', color: '#fff' }).setOrigin(0.5)
    
    const playAgainBtn = this.add.rectangle(200, 350, 120, 40, 0x28a745)
        .setInteractive()
        .on('pointerdown', () => {
            this.scene.restart()
        })
    
    this.add.text(200, 350, 'PLAY AGAIN', { fontSize: '16px', color: '#fff' }).setOrigin(0.5)
}

function update() {
    if (!gameStarted) return
    
    // Player movement - Combined keyboard and mobile controls
    const leftActive = cursors.left.isDown || mobileControls.leftPressed
    const rightActive = cursors.right.isDown || mobileControls.rightPressed
    
    if (leftActive && !rightActive) {
        player.setVelocityX(-250)  // Slightly faster for better mobile feel
    } else if (rightActive && !leftActive) {
        player.setVelocityX(250)
    } else {
        player.setVelocityX(0)
    }
}

// Start the game
const game = new Phaser.Game(config)