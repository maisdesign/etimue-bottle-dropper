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

    // Character sprites - Load real mascot images with error handling
    this.load.image('charlie', '/characters/charlie.png')
    this.load.image('scrocca', '/characters/scrocca.png')
    this.load.image('leprecauno', '/characters/leprecauno.png')

    // Add error handling for asset loading
    this.load.on('loaderror', (file: any) => {
      console.error('❌ Asset loading error:', file.key, file.src)
      if (file.key.startsWith('charlie') || file.key.startsWith('scrocca') || file.key.startsWith('leprecauno')) {
        console.warn('⚠️ Character asset failed, creating fallback sprite')
        this.createFallbackCharacterSprite(file.key)
      }
    })

    this.load.image('bucket', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="80" height="60" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,20 L70,20 L65,55 L15,55 Z" fill="#888888" stroke="#666666" stroke-width="2"/>
        <rect x="10" y="15" width="60" height="10" fill="#AAAAAA"/>
      </svg>
    `))

    this.load.image('background', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="1200" height="1400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Gradiente atmosfera pub irlandese: legno scuro e toni caldi -->
          <linearGradient id="irishPubGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#2D5016;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#3E6B1F;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1F3810;stop-opacity:1" />
          </linearGradient>

          <!-- Pattern texture legno -->
          <pattern id="woodTexture" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="#3A2F1B"/>
            <line x1="0" y1="20" x2="100" y2="20" stroke="#4A3F2B" stroke-width="0.5" opacity="0.3"/>
            <line x1="0" y1="40" x2="100" y2="40" stroke="#2A1F0B" stroke-width="0.5" opacity="0.3"/>
            <line x1="0" y1="60" x2="100" y2="60" stroke="#4A3F2B" stroke-width="0.5" opacity="0.3"/>
            <line x1="0" y1="80" x2="100" y2="80" stroke="#2A1F0B" stroke-width="0.5" opacity="0.3"/>
          </pattern>

          <!-- Trifoglio irlandese per pattern decorativo -->
          <g id="clover">
            <circle cx="5" cy="0" r="3" fill="#228B22" opacity="0.15"/>
            <circle cx="0" cy="5" r="3" fill="#228B22" opacity="0.15"/>
            <circle cx="10" cy="5" r="3" fill="#228B22" opacity="0.15"/>
            <circle cx="5" cy="8" r="3" fill="#228B22" opacity="0.15"/>
            <line x1="5" y1="8" x2="5" y2="14" stroke="#228B22" stroke-width="1" opacity="0.15"/>
          </g>
        </defs>

        <!-- Base: gradiente verde irlandese -->
        <rect width="1200" height="1400" fill="url(#irishPubGradient)"/>

        <!-- Overlay texture legno subtle -->
        <rect width="1200" height="1400" fill="url(#woodTexture)" opacity="0.1"/>

        <!-- Trifogli decorativi sparsi -->
        <use href="#clover" x="100" y="150" transform="scale(1.5)"/>
        <use href="#clover" x="900" y="250" transform="scale(1.2)"/>
        <use href="#clover" x="200" y="500" transform="scale(1.8)"/>
        <use href="#clover" x="800" y="700" transform="scale(1.3)"/>
        <use href="#clover" x="400" y="950" transform="scale(1.6)"/>
        <use href="#clover" x="1000" y="1100" transform="scale(1.4)"/>
        <use href="#clover" x="150" y="1250" transform="scale(1.7)"/>
        <use href="#clover" x="700" y="400" transform="scale(1.1)"/>

        <!-- Accenti dorati subtle per atmosfera pub -->
        <circle cx="50" cy="100" r="2" fill="#FFD700" opacity="0.2"/>
        <circle cx="1100" cy="300" r="2" fill="#FFD700" opacity="0.2"/>
        <circle cx="300" cy="800" r="2" fill="#FFD700" opacity="0.2"/>
        <circle cx="950" cy="1200" r="2" fill="#FFD700" opacity="0.2"/>
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

  private createFallbackCharacterSprite(characterKey: string): void {
    // Create fallback character sprites as SVG data URLs
    const fallbackSprites: { [key: string]: string } = {
      charlie: `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="25" fill="#FF6B6B" stroke="#000" stroke-width="2"/>
        <circle cx="25" cy="25" r="3" fill="#000"/>
        <circle cx="39" cy="25" r="3" fill="#000"/>
        <path d="M25,40 Q32,45 39,40" stroke="#000" stroke-width="2" fill="none"/>
        <text x="32" y="55" text-anchor="middle" font-size="8" fill="#000">Charlie</text>
      </svg>`,
      scrocca: `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="25" fill="#4ECDC4" stroke="#000" stroke-width="2"/>
        <circle cx="25" cy="25" r="3" fill="#000"/>
        <circle cx="39" cy="25" r="3" fill="#000"/>
        <path d="M25,40 Q32,45 39,40" stroke="#000" stroke-width="2" fill="none"/>
        <text x="32" y="55" text-anchor="middle" font-size="8" fill="#000">Scrocca</text>
      </svg>`,
      leprecauno: `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="25" fill="#32CD32" stroke="#000" stroke-width="2"/>
        <circle cx="25" cy="25" r="3" fill="#000"/>
        <circle cx="39" cy="25" r="3" fill="#000"/>
        <path d="M25,40 Q32,45 39,40" stroke="#000" stroke-width="2" fill="none"/>
        <text x="32" y="55" text-anchor="middle" font-size="6" fill="#000">Leprecauno</text>
      </svg>`
    }

    if (fallbackSprites[characterKey]) {
      const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(fallbackSprites[characterKey])
      this.load.image(characterKey, svgDataUrl)
    }
  }
}