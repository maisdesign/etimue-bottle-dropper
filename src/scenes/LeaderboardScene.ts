import Phaser from 'phaser'
import { scoreService, type Score } from '@/net/supabaseClient'
import { authManager } from '@/net/authManager'
import { t } from '@/i18n'

type LeaderboardPeriod = 'weekly' | 'monthly'

interface LeaderboardEntry extends Score {
  username: string
  position?: number
}

export class LeaderboardScene extends Phaser.Scene {
  private currentPeriod: LeaderboardPeriod = 'weekly'
  private leaderboardData: LeaderboardEntry[] = []
  private isLoading: boolean = false
  
  // UI Elements
  private weeklyTab!: Phaser.GameObjects.Text
  private monthlyTab!: Phaser.GameObjects.Text
  private leaderboardContainer!: Phaser.GameObjects.Container
  private loadingText!: Phaser.GameObjects.Text
  private errorText!: Phaser.GameObjects.Text
  private scrollContainer!: Phaser.GameObjects.Container
  private closeButton!: Phaser.GameObjects.Text
  private refreshButton!: Phaser.GameObjects.Text

  // Scrolling
  private scrollY: number = 0
  private maxScroll: number = 0
  private isDragging: boolean = false
  private lastPointerY: number = 0
  private listY: number = 160

  constructor() {
    super({ key: 'LeaderboardScene' })
  }

  create() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Semi-transparent background
    const background = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    background.setInteractive()

    // Modal background
    const modalBg = this.add.rectangle(width / 2, height / 2, width - 20, height - 60, 0xffffff)
    modalBg.setStrokeStyle(2, 0x333333)

    this.createHeader(width)
    this.createTabs(width)
    this.createScrollableList(width, height)
    this.createControls(width, height)

    // Load initial data
    this.loadLeaderboard()

    // Set up input handling
    this.setupScrolling()
  }

  private createHeader(width: number) {
    // Title
    this.add.text(width / 2, 80, t('leaderboard.title'), {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5)

    // Close button
    this.closeButton = this.add.text(width - 40, 50, '✕', {
      fontSize: '20px',
      color: '#666666'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.close())
    .on('pointerover', () => this.closeButton.setTint(0xff0000))
    .on('pointerout', () => this.closeButton.clearTint())

    // Refresh button
    this.refreshButton = this.add.text(40, 50, '🔄', {
      fontSize: '18px',
      color: '#666666'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.loadLeaderboard())
    .on('pointerover', () => this.refreshButton.setScale(1.1))
    .on('pointerout', () => this.refreshButton.setScale(1))
  }

  private createTabs(width: number) {
    const tabY = 120

    // Weekly tab
    this.weeklyTab = this.add.text(width / 2 - 60, tabY, t('leaderboard.weekly'), {
      fontSize: '16px',
      color: this.currentPeriod === 'weekly' ? '#ffffff' : '#333333',
      backgroundColor: this.currentPeriod === 'weekly' ? '#28a745' : '#e9ecef',
      padding: { x: 15, y: 8 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.switchPeriod('weekly'))

    // Monthly tab
    this.monthlyTab = this.add.text(width / 2 + 60, tabY, t('leaderboard.monthly'), {
      fontSize: '16px',
      color: this.currentPeriod === 'monthly' ? '#ffffff' : '#333333',
      backgroundColor: this.currentPeriod === 'monthly' ? '#28a745' : '#e9ecef',
      padding: { x: 15, y: 8 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.switchPeriod('monthly'))
  }

  private createScrollableList(width: number, height: number) {
    // Container for scrollable content
    this.listY = 180  // Moved down to avoid tab overlap
    const listHeight = height - 240

    // Mask for scrollable area
    const maskShape = this.make.graphics({})
    maskShape.fillRect(20, this.listY, width - 40, listHeight)
    const mask = maskShape.createGeometryMask()

    // Scroll container
    this.scrollContainer = this.add.container(0, 0)
    this.scrollContainer.setMask(mask)

    // Leaderboard container
    this.leaderboardContainer = this.add.container(0, this.listY)
    this.scrollContainer.add(this.leaderboardContainer)

    // Loading text
    this.loadingText = this.add.text(width / 2, this.listY + 50, 'Loading...', {
      fontSize: '16px',
      color: '#666666'
    }).setOrigin(0.5)

    // Error text
    this.errorText = this.add.text(width / 2, this.listY + 50, '', {
      fontSize: '14px',
      color: '#dc3545',
      align: 'center'
    }).setOrigin(0.5).setVisible(false)

    // Header row
    this.createHeaderRow(width, this.listY)
  }

  private createHeaderRow(width: number, listY: number) {
    const headerY = listY - 20
    const headerBg = this.add.rectangle(width / 2, headerY, width - 40, 30, 0xf8f9fa)
    headerBg.setStrokeStyle(1, 0xdee2e6)

    // Better column alignment
    this.add.text(60, headerY, t('leaderboard.position'), {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#495057'
    }).setOrigin(0, 0.5)

    this.add.text(width / 2, headerY, t('leaderboard.player'), {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#495057'
    }).setOrigin(0.5, 0.5)

    this.add.text(width - 40, headerY, t('leaderboard.score'), {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#495057'
    }).setOrigin(1, 0.5)
  }

  private createControls(width: number, height: number) {
    // Show user's best score
    this.showUserBest(width, height - 50)
  }

  private async showUserBest(width: number, y: number) {
    const authState = authManager.getState()
    
    if (authState.isAuthenticated && authState.user) {
      try {
        const bestScore = await scoreService.getUserBestScore(authState.user.id, this.currentPeriod)
        
        if (bestScore > 0) {
          this.add.text(width / 2, y, t('leaderboard.yourBest', { score: bestScore }), {
            fontSize: '14px',
            color: '#28a745',
            fontWeight: 'bold'
          }).setOrigin(0.5)
        }
      } catch (error) {
        console.warn('Failed to load user best score:', error)
      }
    }
  }

  private async switchPeriod(period: LeaderboardPeriod) {
    if (period === this.currentPeriod) return

    this.currentPeriod = period
    this.updateTabs()
    await this.loadLeaderboard()
  }

  private updateTabs() {
    // Update tab styles
    this.weeklyTab.setStyle({
      color: this.currentPeriod === 'weekly' ? '#ffffff' : '#333333',
      backgroundColor: this.currentPeriod === 'weekly' ? '#28a745' : '#e9ecef'
    })

    this.monthlyTab.setStyle({
      color: this.currentPeriod === 'monthly' ? '#ffffff' : '#333333',
      backgroundColor: this.currentPeriod === 'monthly' ? '#28a745' : '#e9ecef'
    })
  }

  private async loadLeaderboard() {
    if (this.isLoading) return

    // Check if user is authenticated
    const authState = authManager.getState()
    if (!authState.isAuthenticated) {
      console.log('⚠️ User not authenticated, showing login message')
      this.leaderboardContainer.removeAll(true)
      this.leaderboardContainer.add(
        this.add.text(this.cameras.main.width / 2, 50, 'Please login to view leaderboard', {
          fontSize: '16px',
          color: '#666666'
        }).setOrigin(0.5)
      )
      this.loadingText.setVisible(false)
      this.errorText.setVisible(false)
      return
    }

    this.isLoading = true
    this.loadingText.setVisible(true)
    this.errorText.setVisible(false)
    this.refreshButton.setAlpha(0.5)

    try {
      console.log('🔄 Loading leaderboard for period:', this.currentPeriod)
      
      // Clear existing data
      this.leaderboardContainer.removeAll(true)
      this.scrollY = 0

      let data: LeaderboardEntry[]
      
      if (this.currentPeriod === 'weekly') {
        console.log('📅 Fetching weekly leaderboard...')
        data = await scoreService.getWeeklyLeaderboard(50)
      } else {
        console.log('📅 Fetching monthly leaderboard...')
        data = await scoreService.getMonthlyLeaderboard(50)
      }

      console.log('✅ Leaderboard data received:', data.length, 'entries')
      this.leaderboardData = data
      this.renderLeaderboard()

    } catch (error: any) {
      console.error('❌ Failed to load leaderboard:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      this.errorText.setText(t('errors.networkError') + '\nTap refresh to try again')
      this.errorText.setVisible(true)
    } finally {
      this.isLoading = false
      this.loadingText.setVisible(false)
      this.refreshButton.setAlpha(1)
    }
  }

  private renderLeaderboard() {
    const width = this.cameras.main.width
    
    if (this.leaderboardData.length === 0) {
      this.leaderboardContainer.add(
        this.add.text(width / 2, 50, t('leaderboard.noData'), {
          fontSize: '16px',
          color: '#666666'
        }).setOrigin(0.5)
      )
      return
    }

    const authState = authManager.getState()
    const currentUserId = authState.user?.id

    this.leaderboardData.forEach((entry, index) => {
      const y = 18 + (index * 40) // Start with small offset from container origin
      const isCurrentUser = entry.user_id === currentUserId
      
      // Background for alternating rows
      const rowBg = this.add.rectangle(width / 2, y, width - 40, 35, 
        isCurrentUser ? 0xfff3cd : (index % 2 === 0 ? 0xf8f9fa : 0xffffff))
      
      if (isCurrentUser) {
        rowBg.setStrokeStyle(2, 0xffc107)
      }

      // Position (trophy for top 3, number for others)
      let positionText
      if (index < 3) {
        const trophyEmojis = ['🥇', '🥈', '🥉']
        positionText = this.add.text(60, y, trophyEmojis[index], {
          fontSize: '16px'
        }).setOrigin(0, 0.5)
      } else {
        positionText = this.add.text(60, y, `#${index + 1}`, {
          fontSize: '14px',
          fontWeight: isCurrentUser ? 'bold' : 'normal',
          color: '#495057'
        }).setOrigin(0, 0.5)
      }

      // Username (centered)
      const displayName = entry.username || t('leaderboard.anonymous')
      const usernameText = this.add.text(width / 2, y, displayName, {
        fontSize: '14px',
        fontWeight: isCurrentUser ? 'bold' : 'normal',
        color: isCurrentUser ? '#856404' : '#495057'
      }).setOrigin(0.5, 0.5)

      // Score (aligned with header)
      const scoreText = this.add.text(width - 40, y, entry.score.toString(), {
        fontSize: '14px',
        fontWeight: 'bold',
        color: isCurrentUser ? '#856404' : '#28a745'
      }).setOrigin(1, 0.5)

      this.leaderboardContainer.add([rowBg, positionText, usernameText, scoreText])
    })

    // Calculate max scroll
    this.maxScroll = Math.max(0, (this.leaderboardData.length * 40) - 300)
  }

  private setupScrolling() {
    const scrollArea = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width - 40,
      300,
      0x000000,
      0
    ).setInteractive()

    // Mouse/touch scroll
    scrollArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true
      this.lastPointerY = pointer.y
    })

    scrollArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return

      const deltaY = pointer.y - this.lastPointerY
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, -this.maxScroll, 0)
      this.leaderboardContainer.y = this.listY + this.scrollY
      this.lastPointerY = pointer.y
    })

    scrollArea.on('pointerup', () => {
      this.isDragging = false
    })

    // Mouse wheel
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY - deltaY * 0.5, -this.maxScroll, 0)
      this.leaderboardContainer.y = this.listY + this.scrollY
    })

    // Keyboard scrolling
    this.input.keyboard?.on('keydown-UP', () => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + 20, -this.maxScroll, 0)
      this.leaderboardContainer.y = this.listY + this.scrollY
    })

    this.input.keyboard?.on('keydown-DOWN', () => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY - 20, -this.maxScroll, 0)
      this.leaderboardContainer.y = this.listY + this.scrollY
    })
  }

  private close() {
    // Return to homepage instead of MenuScene
    if (typeof window !== 'undefined' && (window as any).returnToHomepage) {
      console.log('🏠 LeaderboardScene: Using returnToHomepage function')
      ;(window as any).returnToHomepage()
    } else {
      // Fallback to homepage manually (MenuScene removed)
      console.warn('⚠️ LeaderboardScene: returnToHomepage not available, showing homepage manually')
      const homepage = document.getElementById('homepage')
      const gameContainer = document.getElementById('game-container')
      if (homepage) homepage.style.display = 'grid'
      if (gameContainer) gameContainer.style.display = 'none'
    }
  }

  // Handle ESC key to close
  init() {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.close()
    })
  }
}