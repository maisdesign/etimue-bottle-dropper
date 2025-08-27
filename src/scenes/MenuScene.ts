import Phaser from 'phaser'
import { authManager, requireAuth } from '@/net/authManager'
import { t, i18n } from '@/i18n'

export class MenuScene extends Phaser.Scene {
  private playButton!: Phaser.GameObjects.Text
  private leaderboardButton!: Phaser.GameObjects.Text
  private audioButton!: Phaser.GameObjects.Text
  private languageButton!: Phaser.GameObjects.Text
  private profileButton!: Phaser.GameObjects.Text
  private authStatusText!: Phaser.GameObjects.Text
  
  private audioEnabled: boolean = true
  private currentLanguage: string = 'it'

  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Load settings from registry
    const gameSettings = this.registry.get('gameSettings')
    this.audioEnabled = gameSettings?.audioEnabled ?? true
    this.currentLanguage = i18n.getCurrentLanguage()

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x87CEEB)

    // Title
    this.add.text(width / 2, 80, t('game.title'), {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#333333',
      align: 'center'
    }).setOrigin(0.5)

    // Auth status
    this.authStatusText = this.add.text(width / 2, 140, '', {
      fontSize: '14px',
      color: '#666666',
      align: 'center'
    }).setOrigin(0.5)

    // Main buttons
    this.createMainButtons(width, height)

    // Settings buttons
    this.createSettingsButtons(width, height)

    // GDPR notice (if not accepted)
    this.showGDPRBannerIfNeeded(width, height)

    // Update auth status
    this.updateAuthStatus()

    // Listen for auth changes
    authManager.subscribe((state) => {
      this.updateAuthStatus()
    })

    // Listen for language changes
    window.addEventListener('languageChanged', () => {
      this.scene.restart()
    })

    // PWA install prompt
    this.showPWAInstallPrompt(width, height)
  }

  private createMainButtons(width: number, height: number) {
    const buttonY = height / 2 - 50

    // Play button
    this.playButton = this.add.text(width / 2, buttonY, t('game.play'), {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff',
      backgroundColor: '#28a745',
      padding: { x: 30, y: 15 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.startGame())
    .on('pointerover', () => this.playButton.setScale(1.05))
    .on('pointerout', () => this.playButton.setScale(1))

    // Leaderboard button
    this.leaderboardButton = this.add.text(width / 2, buttonY + 70, t('leaderboard.title'), {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#ffc107',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.showLeaderboard())
    .on('pointerover', () => this.leaderboardButton.setScale(1.05))
    .on('pointerout', () => this.leaderboardButton.setScale(1))

    // How to Play button
    const howToPlayButton = this.add.text(width / 2, buttonY + 120, t('menu.howToPlay'), {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#17a2b8',
      padding: { x: 15, y: 8 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.showHowToPlay())
    .on('pointerover', () => howToPlayButton.setScale(1.05))
    .on('pointerout', () => howToPlayButton.setScale(1))
  }

  private createSettingsButtons(width: number, height: number) {
    const settingsY = height - 120

    // Audio toggle
    this.audioButton = this.add.text(50, settingsY, `${t('menu.audio')}: ${this.audioEnabled ? 'ON' : 'OFF'}`, {
      fontSize: '14px',
      color: '#333333',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.toggleAudio())

    // Language toggle
    this.languageButton = this.add.text(50, settingsY + 30, `${t('menu.language')}: ${this.currentLanguage.toUpperCase()}`, {
      fontSize: '14px',
      color: '#333333',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.toggleLanguage())

    // Profile button (show only when authenticated)
    this.profileButton = this.add.text(width - 50, settingsY, t('profile.title'), {
      fontSize: '14px',
      color: '#333333',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.showProfile())

    // Privacy & Terms links
    const privacyButton = this.add.text(50, height - 40, t('menu.privacy'), {
      fontSize: '12px',
      color: '#666666'
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => window.open('https://etimue.it/privacy', '_blank'))

    const termsButton = this.add.text(width - 50, height - 40, t('menu.terms'), {
      fontSize: '12px',
      color: '#666666'
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => window.open('https://etimue.it/terms', '_blank'))
  }

  private async startGame() {
    // Check authentication and consent
    const canPlay = await requireAuth()
    
    if (canPlay) {
      // Start the game
      this.scene.start('GameScene')
    }
  }

  private showLeaderboard() {
    this.scene.launch('LeaderboardScene')
  }

  private showHowToPlay() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Create modal overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    .setInteractive()

    const modal = this.add.rectangle(width / 2, height / 2, width - 40, height - 100, 0xffffff)

    const titleText = this.add.text(width / 2, height / 2 - 150, t('menu.howToPlay'), {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5)

    const instructionsText = this.add.text(width / 2, height / 2 - 50, 
      'Move left and right to catch good bottles (brown)\nand avoid bad bottles (green).\n\n' +
      'Collect yellow stars for bonus points\nand extra time!\n\n' +
      'Desktop: Use ← → or A D keys\nMobile: Tap the left/right buttons\n\n' +
      'You have 3 lives and 60 seconds.\nGood luck!',
      {
        fontSize: '14px',
        color: '#333333',
        align: 'center',
        lineSpacing: 5
      }
    ).setOrigin(0.5)

    const closeButton = this.add.text(width / 2, height / 2 + 120, 'Close', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#28a745',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      overlay.destroy()
      modal.destroy()
      titleText.destroy()
      instructionsText.destroy()
      closeButton.destroy()
    })
  }

  private showProfile() {
    if (!authManager.getState().isAuthenticated) {
      return
    }

    // Launch profile modal (simplified version)
    console.log('Profile modal would open here')
    // TODO: Implement profile editing modal
  }

  private toggleAudio() {
    this.audioEnabled = !this.audioEnabled
    localStorage.setItem('audio-enabled', this.audioEnabled.toString())
    this.audioButton.setText(`${t('menu.audio')}: ${this.audioEnabled ? 'ON' : 'OFF'}`)
    
    // Update registry
    const gameSettings = this.registry.get('gameSettings') || {}
    gameSettings.audioEnabled = this.audioEnabled
    this.registry.set('gameSettings', gameSettings)
  }

  private toggleLanguage() {
    const languages = i18n.getAvailableLanguages()
    const currentIndex = languages.findIndex(lang => lang.code === this.currentLanguage)
    const nextIndex = (currentIndex + 1) % languages.length
    const nextLanguage = languages[nextIndex]
    
    i18n.setLanguage(nextLanguage.code)
    this.currentLanguage = nextLanguage.code
  }

  private updateAuthStatus() {
    const authState = authManager.getState()
    
    if (authState.isLoading) {
      this.authStatusText.setText('Loading...')
      this.playButton.setAlpha(0.5)
      this.profileButton.setVisible(false)
      return
    }

    if (authState.isAuthenticated) {
      const username = authState.profile?.username || 'Player'
      this.authStatusText.setText(`Welcome, ${username}!`)
      this.playButton.setAlpha(authState.hasMarketingConsent ? 1 : 0.5)
      this.profileButton.setVisible(true)
      
      if (!authState.hasMarketingConsent) {
        this.authStatusText.setText(`${this.authStatusText.text}\n(Newsletter subscription required to play)`)
      }
    } else {
      this.authStatusText.setText('Please sign in to play')
      this.playButton.setAlpha(0.5)
      this.profileButton.setVisible(false)
    }
  }

  private showGDPRBannerIfNeeded(width: number, height: number) {
    const gdprConsent = localStorage.getItem('gdpr-consent')
    
    if (!gdprConsent) {
      // Show GDPR banner
      const banner = this.add.rectangle(width / 2, height - 80, width - 20, 60, 0x333333, 0.95)
      
      const bannerText = this.add.text(width / 2, height - 100, t('gdpr.cookieBanner'), {
        fontSize: '12px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 40 }
      }).setOrigin(0.5)

      const acceptButton = this.add.text(width / 2 - 50, height - 60, t('gdpr.accept'), {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#28a745',
        padding: { x: 10, y: 5 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        localStorage.setItem('gdpr-consent', 'true')
        localStorage.setItem('analytics-consent', 'true')
        banner.destroy()
        bannerText.destroy()
        acceptButton.destroy()
        declineButton.destroy()
      })

      const declineButton = this.add.text(width / 2 + 50, height - 60, t('gdpr.decline'), {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#dc3545',
        padding: { x: 10, y: 5 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        localStorage.setItem('gdpr-consent', 'true')
        localStorage.setItem('analytics-consent', 'false')
        banner.destroy()
        bannerText.destroy()
        acceptButton.destroy()
        declineButton.destroy()
      })
    }
  }

  private showPWAInstallPrompt(width: number, height: number) {
    // Check if PWA install prompt is available
    const deferredPrompt = (window as any).deferredPrompt
    
    if (deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
      const installButton = this.add.text(width - 20, 20, '📱 Install App', {
        fontSize: '12px',
        color: '#333333',
        backgroundColor: '#ffffff',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', async () => {
        deferredPrompt.prompt()
        const result = await deferredPrompt.userChoice
        
        if (result.outcome === 'accepted') {
          console.log('PWA install accepted')
          installButton.destroy()
        }
        
        // Clear the stored prompt
        ;(window as any).deferredPrompt = null
      })
    }
  }
}