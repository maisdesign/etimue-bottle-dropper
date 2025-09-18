import { Scene } from 'phaser'

export class BootScene extends Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    console.log('🔧 BootScene: Starting asset loading...')

    // Create simple loading graphics
    this.createLoadingUI()

    // Load basic game assets - using simple rectangles for now
    this.load.image('bottle', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="20" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="40" fill="#8B4513" stroke="#654321" stroke-width="2"/>
        <rect x="5" y="5" width="10" height="30" fill="#A0522D"/>
      </svg>
    `))

    this.load.image('bottle_green', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="20" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="40" fill="#228B22" stroke="#006400" stroke-width="2"/>
        <rect x="5" y="5" width="10" height="30" fill="#32CD32"/>
        <text x="10" y="25" text-anchor="middle" fill="white" font-size="10">X</text>
      </svg>
    `))

    this.load.image('powerup_star', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
        <polygon points="15,2 18,10 27,10 20,16 23,25 15,20 7,25 10,16 3,10 12,10"
                 fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
        <circle cx="15" cy="15" r="3" fill="#FFFF00"/>
      </svg>
    `))

    this.load.image('bucket', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="80" height="60" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,20 L70,20 L65,55 L15,55 Z" fill="#888888" stroke="#666666" stroke-width="2"/>
        <rect x="10" y="15" width="60" height="10" fill="#AAAAAA"/>
      </svg>
    `))

    this.load.image('background', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#E0F6FF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#skyGradient)"/>
      </svg>
    `))
  }

  create(): void {
    console.log('✅ BootScene: Assets loaded, transitioning to GameScene')

    // Smooth transition to game
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene')
    })
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    // Loading bar background
    const progressBg = this.add.graphics()
    progressBg.fillStyle(0x000000, 0.3)
    progressBg.fillRect(width / 2 - 150, height / 2, 300, 20)

    // Loading bar
    const progressBar = this.add.graphics()

    // Update loading bar
    this.load.on('progress', (value: number) => {
      progressBar.clear()
      progressBar.fillStyle(0x00ff00)
      progressBar.fillRect(width / 2 - 150, height / 2, 300 * value, 20)
    })

    this.load.on('complete', () => {
      loadingText.setText('Ready!')
      progressBar.clear()
      progressBg.clear()
    })
  }
}