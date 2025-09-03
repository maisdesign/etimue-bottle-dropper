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
  private profileModalCleanup: (() => void) | null = null
  private closeModal!: () => void

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
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      color: '#333333',
      align: 'center'
    }).setOrigin(0.5)

    // Auth status
    this.authStatusText = this.add.text(width / 2, 140, '', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#666666',
      align: 'center'
    }).setOrigin(0.5)

    // Main buttons
    this.createMainButtons(width, height)

    // Settings buttons
    this.createSettingsButtons(width, height)

    // GDPR notice (if not accepted)
    this.showGDPRBannerIfNeeded(width, height)

    // Handle OAuth callback
    this.handleOAuthCallback()

    // Update auth status
    this.updateAuthStatus()

    // Listen for auth changes
    authManager.subscribe((state) => {
      this.updateAuthStatus()
      this.checkConsentAfterOAuth(state)
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
      fontFamily: 'Arial, sans-serif',
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
      fontFamily: 'Arial, sans-serif',
      fontWeight: '600',
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
      fontFamily: 'Arial, sans-serif',
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: '#17a2b8',
      padding: { x: 15, y: 8 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.showHowToPlay())
    .on('pointerover', () => howToPlayButton.setScale(1.05))
    .on('pointerout', () => howToPlayButton.setScale(1))

    // Prizes button
    const prizesButton = this.add.text(width / 2, buttonY + 170, t('menu.prizes'), {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: '#ffc107',
      padding: { x: 15, y: 8 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.showPrizes())
    .on('pointerover', () => prizesButton.setScale(1.05))
    .on('pointerout', () => prizesButton.setScale(1))
  }

  private createSettingsButtons(width: number, height: number) {
    const settingsY = height - 120

    // Audio toggle
    this.audioButton = this.add.text(50, settingsY, `${t('menu.audio')}: ${this.audioEnabled ? 'ON' : 'OFF'}`, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '600',
      color: '#333333',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.toggleAudio())

    // Language toggle
    this.languageButton = this.add.text(50, settingsY + 30, `${t('menu.language')}: ${this.currentLanguage.toUpperCase()}`, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '600',
      color: '#333333',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.toggleLanguage())

    // Profile button (show only when authenticated)
    this.profileButton = this.add.text(width - 50, settingsY, t('profile.title'), {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '600',
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

    const modal = this.add.rectangle(width / 2, height / 2 - 20, width - 40, height - 60, 0xffffff)

    const titleText = this.add.text(width / 2, height / 2 - 210, t('menu.howToPlay'), {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5)

    const instructionsText = this.add.text(width / 2, height / 2 - 50, 
      t('rules.instructions'),
      {
        fontSize: '14px',
        color: '#333333',
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: width - 80, useAdvancedWrap: true }
      }
    ).setOrigin(0.5)

    const closeButton = this.add.text(width / 2, height / 2 + 120, t('rules.close'), {
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

  private showPrizes() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Create modal overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    .setInteractive()

    const modal = this.add.rectangle(width / 2, height / 2 - 20, width - 40, height - 60, 0xffffff)

    const titleText = this.add.text(width / 2, height / 2 - 200, t('prizes.title'), {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5)

    // Weekly prize section
    const weeklyTitle = this.add.text(width / 2, height / 2 - 120, t('prizes.weeklyPrize'), {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffc107'
    }).setOrigin(0.5)

    const weeklyDesc = this.add.text(width / 2, height / 2 - 90, t('prizes.weeklyDescription'), {
      fontSize: '13px',
      color: '#333333',
      align: 'center',
      wordWrap: { width: width - 80, useAdvancedWrap: true }
    }).setOrigin(0.5)

    // Monthly prize section
    const monthlyTitle = this.add.text(width / 2, height / 2 - 30, t('prizes.monthlyPrize'), {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#28a745'
    }).setOrigin(0.5)

    const monthlyDesc = this.add.text(width / 2, height / 2, t('prizes.monthlyDescription'), {
      fontSize: '13px',
      color: '#333333',
      align: 'center',
      wordWrap: { width: width - 80, useAdvancedWrap: true }
    }).setOrigin(0.5)

    // Footer
    const footerText = this.add.text(width / 2, height / 2 + 60, t('prizes.footer'), {
      fontSize: '12px',
      fontStyle: 'italic',
      color: '#222222',
      align: 'center'
    }).setOrigin(0.5)

    const closeButton = this.add.text(width / 2, height / 2 + 120, t('prizes.close'), {
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
      weeklyTitle.destroy()
      weeklyDesc.destroy()
      monthlyTitle.destroy()
      monthlyDesc.destroy()
      footerText.destroy()
      closeButton.destroy()
    })
  }

  private showProfile() {
    if (!authManager.getState().isAuthenticated) {
      return
    }

    this.showProfileModal()
  }

  private showProfileModal() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    const authState = authManager.getState()

    // Create modal overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    .setInteractive()

    const modal = this.add.rectangle(width / 2, height / 2, width - 40, 300, 0xffffff)
    modal.setStrokeStyle(2, 0x007bff)

    // Title
    const titleText = this.add.text(width / 2, height / 2 - 120, t('profile.title'), {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5)

    // Current nickname display
    const currentNickname = authState.profile?.username || t('leaderboard.anonymous')
    const currentNicknameText = this.add.text(width / 2, height / 2 - 80, `Current: ${currentNickname}`, {
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5)

    // Nickname input
    const inputBg = this.add.rectangle(width / 2, height / 2 - 30, 250, 40, 0xf8f9fa)
    inputBg.setStrokeStyle(1, 0xdee2e6)

    // Create HTML input for nickname
    const inputElement = document.createElement('input')
    inputElement.type = 'text'
    inputElement.placeholder = t('profile.nickname')
    inputElement.value = authState.profile?.username || ''
    inputElement.maxLength = 20
    
    // Get canvas position for correct placement
    const canvasElement = this.game.canvas
    const canvasRect = canvasElement.getBoundingClientRect()
    
    inputElement.style.cssText = `
      position: absolute;
      left: ${canvasRect.left + width / 2 - 125}px;
      top: ${canvasRect.top + height / 2 - 50}px;
      width: 250px;
      height: 40px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 0 10px;
      font-size: 16px;
      z-index: 10001;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `
    document.body.appendChild(inputElement)
    
    // Disable Phaser keyboard input when focusing on HTML input
    const originalKeyboardEnabled = this.input.keyboard?.enabled
    
    inputElement.addEventListener('focus', () => {
      ;(window as any).managePhaserKeyboard?.disable()
    })
    
    inputElement.addEventListener('blur', () => {
      ;(window as any).managePhaserKeyboard?.enable()
    })
    
    // Prevent event propagation for common game keys
    inputElement.addEventListener('keydown', (e) => {
      // Stop Phaser from receiving WASD and arrow key events
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.stopPropagation()
      }
    })
    
    inputElement.focus()

    // Nickname availability indicator
    const availabilityIndicator = this.add.text(width / 2, height / 2 - 5, '', {
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(0.5)

    // Real-time nickname availability check
    let checkTimeout: NodeJS.Timeout
    inputElement.addEventListener('input', () => {
      clearTimeout(checkTimeout)
      const currentNickname = inputElement.value.trim()
      
      if (!currentNickname) {
        availabilityIndicator.setText('')
        return
      }

      const validatedNickname = this.validateNickname(currentNickname)
      if (!validatedNickname) {
        availabilityIndicator.setText('❌ Invalid nickname')
        availabilityIndicator.setColor('#dc3545')
        return
      }

      if (validatedNickname === authState.profile?.username) {
        availabilityIndicator.setText('✅ Current nickname')
        availabilityIndicator.setColor('#28a745')
        return
      }

      availabilityIndicator.setText('⏳ Checking availability...')
      availabilityIndicator.setColor('#ffc107')

      // Debounce the API call
      checkTimeout = setTimeout(async () => {
        try {
          const { profileService } = await import('@/net/supabaseClient')
          const isAvailable = await profileService.checkNicknameAvailability(validatedNickname, authState.user?.id)
          
          if (isAvailable) {
            availabilityIndicator.setText('✅ Available')
            availabilityIndicator.setColor('#28a745')
          } else {
            availabilityIndicator.setText('❌ Already taken')
            availabilityIndicator.setColor('#dc3545')
          }
        } catch (error) {
          availabilityIndicator.setText('⚠️ Check failed')
          availabilityIndicator.setColor('#ffc107')
        }
      }, 500) // Wait 500ms after user stops typing
    })

    // Save button
    const saveButton = this.add.text(width / 2 - 60, height / 2 + 30, t('profile.save'), {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#28a745',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', async () => {
      const newNickname = inputElement.value.trim()
      
      if (newNickname && newNickname !== authState.profile?.username) {
        try {
          // Apply same validation as registration
          const validatedNickname = this.validateNickname(newNickname)
          
          if (!validatedNickname) {
            alert('Nickname contains inappropriate content or is too short')
            return
          }

          // Check nickname availability
          console.log('🔍 Checking nickname availability:', validatedNickname)
          const { profileService } = await import('@/net/supabaseClient')
          const isAvailable = await profileService.checkNicknameAvailability(validatedNickname, authState.user?.id)
          
          if (!isAvailable) {
            alert(`The nickname "${validatedNickname}" is already taken. Please choose another one.`)
            return
          }

          console.log('✅ Nickname is available, updating profile...')
          await authManager.updateProfile({ username: validatedNickname })
          alert(t('profile.saved'))
          
          // Close modal
          this.closeModal()
          
        } catch (error) {
          console.error('Error updating nickname:', error)
          alert('Error updating nickname')
        }
      } else {
        this.closeModal()
      }
    })

    // Cancel/Close button
    const closeButton = this.add.text(width / 2 + 60, height / 2 + 30, t('rules.close'), {
      fontSize: '16px',
      color: '#ffffff', 
      backgroundColor: '#6c757d',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.closeModal())

    // Store cleanup function
    this.profileModalCleanup = () => {
      // Re-enable keyboard input when modal closes
      ;(window as any).managePhaserKeyboard?.enable()
      
      // Clear any pending timeout
      if (checkTimeout) {
        clearTimeout(checkTimeout)
      }
      
      inputElement.remove()
      overlay.destroy()
      modal.destroy()
      titleText.destroy()
      currentNicknameText.destroy()
      inputBg.destroy()
      availabilityIndicator.destroy()
      saveButton.destroy()
      closeButton.destroy()
    }

    const closeModal = () => {
      if (this.profileModalCleanup) {
        this.profileModalCleanup()
        this.profileModalCleanup = null
      }
    }

    this.closeModal = closeModal
  }

  private validateNickname(nickname: string): string | null {
    // Same validation as AuthModal
    if (nickname.length > 20) {
      nickname = nickname.substring(0, 20)
    }
    
    const badWords = [
      'merda', 'cazzo', 'puttana', 'stronzo', 'vaffanculo',
      'shit', 'fuck', 'bitch', 'asshole', 'damn',
      'nazi', 'hitler', 'fascist', 'terrorist'
    ]
    
    const lowerNickname = nickname.toLowerCase()
    for (const badWord of badWords) {
      if (lowerNickname.includes(badWord)) {
        return null
      }
    }
    
    nickname = nickname.replace(/[^a-zA-Z0-9\s_-]/g, '')
    nickname = nickname.trim()
    
    if (nickname.length < 2) {
      return null
    }
    
    return nickname
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
      // Show improved GDPR banner
      const banner = this.add.rectangle(width / 2, height - 50, width - 30, 80, 0x000000, 0.85)
      .setStrokeStyle(2, 0x333333)
      
      const bannerText = this.add.text(width / 2, height - 75, t('gdpr.cookieBanner'), {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 50, useAdvancedWrap: true }
      }).setOrigin(0.5)

      const acceptButton = this.add.text(width / 2 - 60, height - 35, t('gdpr.accept'), {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        backgroundColor: '#28a745',
        padding: { x: 15, y: 8 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => acceptButton.setScale(1.05))
      .on('pointerout', () => acceptButton.setScale(1))
      .on('pointerdown', () => {
        localStorage.setItem('gdpr-consent', 'true')
        localStorage.setItem('analytics-consent', 'true')
        banner.destroy()
        bannerText.destroy()
        acceptButton.destroy()
        declineButton.destroy()
      })

      const declineButton = this.add.text(width / 2 + 60, height - 35, t('gdpr.decline'), {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        backgroundColor: '#dc3545',
        padding: { x: 15, y: 8 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => declineButton.setScale(1.05))
      .on('pointerout', () => declineButton.setScale(1))
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

  private handleOAuthCallback() {
    // Check if we're returning from OAuth
    const hash = window.location.hash
    const url = window.location.href
    
    console.log('🔍 Current URL:', url)
    console.log('🔍 Hash:', hash)
    
    if (hash.includes('access_token')) {
      console.log('🔑 OAuth tokens detected in URL!')
      console.log('⏳ Waiting for Supabase to process tokens...')
      
      // Wait for auth state to change or timeout
      let timeoutReached = false
      const timeout = setTimeout(() => {
        timeoutReached = true
        console.log('⚠️ OAuth processing timeout, cleaning URL...')
        window.history.replaceState(null, '', window.location.pathname)
      }, 8000) // Increased timeout to 8 seconds
      
      // Subscribe to auth changes to clean URL when auth completes
      const unsubscribe = authManager.subscribe((state) => {
        console.log('🔄 Auth state change during OAuth callback:', {
          isAuthenticated: state.isAuthenticated,
          isLoading: state.isLoading,
          email: state.user?.email
        })
        
        if (!timeoutReached && (state.isAuthenticated || !state.isLoading)) {
          console.log('✅ OAuth processing complete, cleaning URL...')
          clearTimeout(timeout)
          window.history.replaceState(null, '', window.location.pathname)
          unsubscribe()
        }
      })
      
    } else if (hash.includes('provider_token') || hash.includes('refresh_token') || hash.includes('expires_at')) {
      console.log('🔄 OAuth tokens detected without processing, forcing refresh...')
      // These are OAuth tokens that haven't been processed yet
      setTimeout(() => {
        console.log('🔄 Refreshing page to complete OAuth...')
        window.location.reload()
      }, 1000)
    } else if (hash.includes('auth-callback') || (hash.length > 1 && hash !== '#')) {
      console.log('🔄 Auth callback or unknown hash detected, cleaning URL immediately')
      // Clean URL immediately for any auth-related hash
      window.history.replaceState(null, '', window.location.pathname)
      console.log('✅ URL cleaned')
    }
  }

  private checkConsentAfterOAuth(authState: any) {
    console.log('🔍 Auth state check:', {
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      hasMarketingConsent: authState.hasMarketingConsent,
      userEmail: authState.user?.email,
      profile: authState.profile
    })
    
    // Don't automatically show consent modal - user will trigger it by clicking Play
    if (authState.isAuthenticated && authState.hasMarketingConsent) {
      console.log('✅ User is fully authenticated and has consent!')
    } else if (authState.isAuthenticated && !authState.hasMarketingConsent) {
      console.log('⚠️ User authenticated but needs consent - will be handled on Play button click')
    }
  }
}