import Phaser from 'phaser'
import { scoreService } from '@/net/supabaseClient'
import { authManager } from '@/net/authManager'
import { t } from '@/i18n'

interface GameData {
  score: number
  lives: number
  gameEndTimestamp: number
  actualDuration: number
  reason: 'lives' | 'time'
}

export class GameOverScene extends Phaser.Scene {
  private gameData!: GameData
  private submitButton!: Phaser.GameObjects.Text
  private submitStatus!: Phaser.GameObjects.Text
  private scoreSubmitted: boolean = false

  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data: GameData) {
    this.gameData = data
    this.scoreSubmitted = false
  }

  create() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Background overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)

    // Game Over modal
    const modalBg = this.add.rectangle(width / 2, height / 2, width - 40, height - 100, 0xffffff)
    modalBg.setStrokeStyle(4, 0x333333)

    // Title
    const titleText = this.add.text(width / 2, height / 2 - 150, t('game.gameOver'), {
      fontSize: '32px',
      fontFamily: 'Playfair Display, serif',
      fontWeight: 'bold',
      color: '#333333',
      resolution: 2
    }).setOrigin(0.5)
    
    // Enhance title rendering
    titleText.setFill('#333333')
    titleText.setStroke('#ffffff', 1)

    // Final Score
    const scoreText = this.add.text(width / 2, height / 2 - 100, t('game.finalScore', { score: this.gameData.score }), {
      fontSize: '24px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: '600',
      color: '#333333',
      resolution: 2
    }).setOrigin(0.5)
    
    // Fix text rendering quality
    scoreText.setFill('#333333')
    scoreText.setStroke('#ffffff', 1)

    // Game stats
    const reason = this.gameData.reason === 'lives' ? 'No lives left!' : 'Time\'s up!'
    this.add.text(width / 2, height / 2 - 60, reason, {
      fontSize: '16px',
      fontFamily: 'Inter, sans-serif',
      color: '#666666'
    }).setOrigin(0.5)

    // Submit status text
    this.submitStatus = this.add.text(width / 2, height / 2 - 20, '', {
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      color: '#666666',
      align: 'center',
      wordWrap: { width: width - 80 }
    }).setOrigin(0.5)

    // Buttons
    this.createButtons(width, height)

    // Show leaderboard position if available
    this.showLeaderboardPreview(width, height)

    // Auto-submit score if authenticated
    this.checkAndSubmitScore()

    // Setup keyboard controls
    this.setupKeyboardControls()
  }

  private createButtons(width: number, height: number) {
    const buttonY = height / 2 + 40

    // Submit Score button
    this.submitButton = this.add.text(width / 2, buttonY, t('game.submitScore'), {
      fontSize: '18px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      color: '#ffffff',
      backgroundColor: '#28a745',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.submitScore())
    .on('pointerover', () => this.submitButton.setScale(1.05))
    .on('pointerout', () => this.submitButton.setScale(1))

    // Play Again button
    const playAgainButton = this.add.text(width / 2 - 80, buttonY + 60, t('game.playAgain'), {
      fontSize: '16px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: '#007bff',
      padding: { x: 15, y: 8 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.playAgain())
    .on('pointerover', () => playAgainButton.setScale(1.05))
    .on('pointerout', () => playAgainButton.setScale(1))

    // Leaderboard button
    const leaderboardButton = this.add.text(width / 2 + 80, buttonY + 60, t('leaderboard.title'), {
      fontSize: '16px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: '#ffc107',
      padding: { x: 15, y: 8 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.showLeaderboard())
    .on('pointerover', () => leaderboardButton.setScale(1.05))
    .on('pointerout', () => leaderboardButton.setScale(1))

    // Menu button
    const menuButton = this.add.text(width / 2, buttonY + 120, 'Menu', {
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: '#6c757d',
      padding: { x: 12, y: 6 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.goToMenu())
    .on('pointerover', () => menuButton.setScale(1.05))
    .on('pointerout', () => menuButton.setScale(1))
  }

  private async showLeaderboardPreview(width: number, height: number) {
    try {
      // Get current user's best scores
      const authState = authManager.getState()
      if (authState.isAuthenticated && authState.user) {
        const weeklyBest = await scoreService.getUserBestScore(authState.user.id, 'weekly')
        const monthlyBest = await scoreService.getUserBestScore(authState.user.id, 'monthly')

        if (weeklyBest > 0 || monthlyBest > 0) {
          const previewText = `Your best: Weekly ${weeklyBest}, Monthly ${monthlyBest}`
          
          this.add.text(width / 2, height / 2 + 10, previewText, {
            fontSize: '12px',
            color: '#888888'
          }).setOrigin(0.5)
        }
      }
    } catch (error) {
      console.warn('Failed to load leaderboard preview:', error)
    }
  }

  private async checkAndSubmitScore() {
    const authState = authManager.getState()
    
    if (!authState.isAuthenticated) {
      this.submitStatus.setText(t('auth.signInToSubmit'))
      this.submitButton.setText(t('auth.signInAndSubmit'))
      return
    }
    
    if (!authState.hasMarketingConsent) {
      this.submitStatus.setText(t('auth.newsletterRequired'))
      this.submitButton.setText(t('auth.signInAndSubmit'))
      return
    }

    // Auto-submit if user is authenticated
    this.submitScore()
  }

  private async submitScore() {
    console.log('🎯 INVIA PUNTEGGIO clicked!')
    
    if (this.scoreSubmitted) {
      console.log('📊 Score already submitted, showing leaderboard')
      this.showLeaderboard()
      return
    }

    const authState = authManager.getState()
    console.log('🔍 Auth state:', {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      hasMarketingConsent: authState.hasMarketingConsent,
      userEmail: authState.user?.email
    })
    
    // Check authentication
    if (!authState.isAuthenticated || !authState.user) {
      console.log('❌ User not authenticated, showing auth modal')
      // Show auth modal
      try {
        await authManager.showAuthModal()
        // After auth, retry submission
        console.log('🔄 Retrying submission after auth')
        this.submitScore()
      } catch (error) {
        console.error('❌ Authentication failed:', error)
        this.submitStatus.setText('Authentication failed')
      }
      return
    }

    if (!authState.hasMarketingConsent) {
      console.log('❌ No marketing consent, showing auth modal for consent')
      // Show auth modal for consent
      try {
        await authManager.showAuthModal()
        // After consent, retry submission
        console.log('🔄 Retrying submission after consent')
        this.submitScore()
      } catch (error) {
        console.error('❌ Consent failed:', error)
        this.submitStatus.setText(t('auth.newsletterRequired'))
      }
      return
    }

    console.log('✅ All checks passed, submitting score:', this.gameData.score)

    try {
      this.submitStatus.setText('Submitting score...')
      this.submitButton.setAlpha(0.5)

      // Validate score before submission
      if (!this.validateScore()) {
        throw new Error('Invalid score data')
      }

      // Add timeout to prevent infinite loading
      const submitPromise = scoreService.submitScore(
        authState.user.id,
        this.gameData.score,
        this.gameData.actualDuration
      )
      
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Submit timeout after 15 seconds')), 15000)
      })
      
      const result = await Promise.race([submitPromise, timeoutPromise])

      if (result) {
        this.scoreSubmitted = true
        this.submitStatus.setText('Score submitted successfully!')
        this.submitButton.setText(t('leaderboard.title'))
        this.submitButton.setAlpha(1)
        
        // Show success effect
        this.cameras.main.flash(300, 0, 255, 0)
      } else {
        throw new Error('Score submission failed')
      }

    } catch (error) {
      console.error('Score submission error:', error)
      this.submitStatus.setText(t('errors.scoreSubmissionFailed'))
      this.submitButton.setAlpha(1)
    }
  }

  private validateScore(): boolean {
    // Basic client-side validation
    if (this.gameData.score < 0 || this.gameData.score > 600) {
      console.warn('Invalid score range:', this.gameData.score)
      return false
    }

    // Anti-cheat: Only reject very short games (likely crashes or bots)
    // No upper limit - skilled players deserve their high scores!
    if (this.gameData.actualDuration < 5) {
      console.warn('Game too short, likely invalid:', this.gameData.actualDuration)
      return false
    }
    
    // Log very long games for monitoring (but don't reject them)
    if (this.gameData.actualDuration > 180) { // 3 minutes
      console.info('🏆 Impressive game duration:', this.gameData.actualDuration, 'seconds!')
    }

    // Check for impossible scores (more than 10 points per second sustained)
    const maxPossibleScore = this.gameData.actualDuration * 10
    if (this.gameData.score > maxPossibleScore) {
      console.warn('Impossible score detected:', this.gameData.score, 'vs max:', maxPossibleScore)
      return false
    }

    return true
  }

  private playAgain() {
    this.scene.start('GameScene')
  }

  private showLeaderboard() {
    this.scene.launch('LeaderboardScene')
  }

  private goToMenu() {
    this.scene.start('MenuScene')
  }

  private setupKeyboardControls() {
    // Add keyboard shortcuts
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (!this.scoreSubmitted) {
        this.submitScore()
      } else {
        this.playAgain()
      }
    })

    this.input.keyboard?.on('keydown-ESC', () => {
      this.goToMenu()
    })

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.playAgain()
    })
  }
}