import { languageManager } from '../i18n/LanguageManager'
import { simpleAuth } from '../systems/SimpleAuth'

export interface LeaderboardEntry {
  id: number
  score: number
  game_duration: number
  created_at: string
  display_name: string
  user_id: string
}

export class LeaderboardModal {
  private modal: HTMLElement | null = null
  private currentView: 'weekly' | 'monthly' = 'weekly'
  private isLoading = false

  constructor() {
    this.createModal()
    this.setupEventListeners()
  }

  private createModal(): void {
    this.modal = document.createElement('div')
    this.modal.id = 'leaderboard-modal'
    this.modal.className = 'leaderboard-modal'
    this.modal.style.display = 'none'

    this.modal.innerHTML = `
      <div class="leaderboard-modal-backdrop"></div>
      <div class="leaderboard-modal-content">
        <button class="leaderboard-close-btn" id="leaderboard-close">&times;</button>

        <div class="leaderboard-header">
          <h2 class="leaderboard-title" data-i18n="prizeLeaderboardTitle">🏆 Classifica Premi (Solo Iscritti Newsletter)</h2>
          <div class="leaderboard-tabs">
            <button class="leaderboard-tab active" data-tab="weekly" data-i18n="leaderboardWeekly">
              📅 Settimanale
            </button>
            <button class="leaderboard-tab" data-tab="monthly" data-i18n="leaderboardMonthly">
              📆 Mensile
            </button>
          </div>
        </div>

        <div class="leaderboard-content">
          <div class="leaderboard-loading" id="leaderboard-loading">
            <div class="spinner"></div>
            <p data-i18n="leaderboardLoading">Caricamento classifica...</p>
          </div>

          <div class="leaderboard-list" id="leaderboard-list">
            <!-- Dynamic content -->
          </div>

          <div class="leaderboard-empty" id="leaderboard-empty" style="display: none">
            <p data-i18n="leaderboardEmpty">Nessun punteggio ancora registrato!</p>
            <p class="leaderboard-encourage" data-i18n="leaderboardEncourage">
              Sii il primo a giocare e stabilire il record!
            </p>
          </div>
        </div>

        <div class="leaderboard-footer">
          <p class="leaderboard-info" data-i18n="prizeEligibilityNote">
            💡 Solo gli iscritti alla newsletter possono vincere i premi
          </p>
        </div>
      </div>
    `

    document.body.appendChild(this.modal)
  }

  private setupEventListeners(): void {
    // Close button
    const closeBtn = this.modal?.querySelector('#leaderboard-close')
    closeBtn?.addEventListener('click', () => this.hide())

    // Backdrop click
    const backdrop = this.modal?.querySelector('.leaderboard-modal-backdrop')
    backdrop?.addEventListener('click', () => this.hide())

    // Tab switching
    const tabs = this.modal?.querySelectorAll('.leaderboard-tab')
    tabs?.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const tabType = target.getAttribute('data-tab') as 'weekly' | 'monthly'
        this.switchTab(tabType)
      })
    })

    // Language change listener
    languageManager.onLanguageChange(() => {
      this.updateTranslations()
    })

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.style.display !== 'none') {
        this.hide()
      }
    })
  }

  private updateTranslations(): void {
    if (!this.modal) return

    const translation = languageManager.getTranslation()
    this.modal.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n')
      if (key && key in translation) {
        element.textContent = (translation as any)[key]
      }
    })
  }

  private switchTab(tab: 'weekly' | 'monthly'): void {
    if (this.currentView === tab || this.isLoading) return

    this.currentView = tab

    // Update tab UI
    const tabs = this.modal?.querySelectorAll('.leaderboard-tab')
    tabs?.forEach(tabEl => {
      tabEl.classList.remove('active')
      if (tabEl.getAttribute('data-tab') === tab) {
        tabEl.classList.add('active')
      }
    })

    // Load new data
    this.loadLeaderboard()
  }

  private async loadLeaderboard(): Promise<void> {
    if (!this.modal || this.isLoading) return

    this.isLoading = true
    this.showLoading()

    try {
      console.log(`🏆 Loading ${this.currentView} leaderboard...`)

      let entries: LeaderboardEntry[] = []

      if (this.currentView === 'weekly') {
        entries = await this.getWeeklyLeaderboard()
      } else {
        entries = await this.getMonthlyLeaderboard()
      }

      this.renderLeaderboard(entries)

    } catch (error) {
      console.error('Error loading leaderboard:', error)
      this.showError()
    } finally {
      this.isLoading = false
      this.hideLoading()
    }
  }

  private async getWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
    console.log('📞 Getting weekly PRIZE leaderboard (newsletter subscribers only)...')

    try {
      // 🎯 Limit to top 10 for better performance and UX
      const entries = await simpleAuth.getPrizeLeaderboard(10, 'weekly')
      console.log('✅ SimpleAuth.getPrizeLeaderboard completed with:', entries?.length, 'entries')
      return entries.map(entry => ({
        id: entry.id,
        score: entry.score,
        game_duration: entry.game_duration,
        created_at: entry.created_at,
        display_name: entry.display_name || 'Anonimo',
        user_id: entry.user_id
      }))
    } catch (error) {
      console.error('❌ SimpleAuth.getPrizeLeaderboard failed:', error)
      throw error
    }
  }

  private async getMonthlyLeaderboard(): Promise<LeaderboardEntry[]> {
    console.log('📞 Getting monthly PRIZE leaderboard (newsletter subscribers only)...')

    try {
      // 🎯 Limit to top 10 for better performance and UX
      const entries = await simpleAuth.getPrizeLeaderboard(10, 'monthly')
      console.log('✅ SimpleAuth.getPrizeLeaderboard (monthly) completed with:', entries?.length, 'entries')
      return entries.map(entry => ({
        id: entry.id,
        score: entry.score,
        game_duration: entry.game_duration,
        created_at: entry.created_at,
        display_name: entry.display_name || 'Anonimo',
        user_id: entry.user_id
      }))
    } catch (error) {
      console.error('❌ SimpleAuth.getPrizeLeaderboard (monthly) failed:', error)
      throw error
    }
  }

  private renderLeaderboard(entries: LeaderboardEntry[]): void {
    if (!this.modal) return

    const listContainer = this.modal.querySelector('#leaderboard-list') as HTMLElement
    const emptyContainer = this.modal.querySelector('#leaderboard-empty') as HTMLElement

    if (entries.length === 0) {
      listContainer.style.display = 'none'
      emptyContainer.style.display = 'block'
      return
    }

    if (emptyContainer) emptyContainer.style.display = 'none'
    if (listContainer) listContainer.style.display = 'block'

    const currentUserId = simpleAuth.getState().user?.id

    listContainer.innerHTML = entries.map((entry, index) => {
      const position = index + 1
      const isCurrentUser = currentUserId === entry.user_id
      const medal = position <= 3 ? this.getMedal(position) : `${position}.`

      const date = new Date(entry.created_at).toLocaleDateString(
        languageManager.getCurrentLanguage() === 'it' ? 'it-IT' : 'en-US',
        { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      )

      return `
        <div class="leaderboard-entry ${isCurrentUser ? 'current-user' : ''}">
          <div class="leaderboard-position">${medal}</div>
          <div class="leaderboard-player">
            <div class="leaderboard-nickname">${entry.display_name}</div>
            <div class="leaderboard-date">${date}</div>
          </div>
          <div class="leaderboard-score">
            <div class="score-value">${entry.score}</div>
            <div class="score-time">${entry.game_duration}s</div>
          </div>
        </div>
      `
    }).join('')
  }

  private getMedal(position: number): string {
    switch (position) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `${position}.`
    }
  }

  private showLoading(): void {
    if (!this.modal) return

    const loading = this.modal.querySelector('#leaderboard-loading') as HTMLElement
    const list = this.modal.querySelector('#leaderboard-list') as HTMLElement
    const empty = this.modal.querySelector('#leaderboard-empty') as HTMLElement

    loading.style.display = 'flex'
    list.style.display = 'none'
    empty.style.display = 'none'
  }

  private hideLoading(): void {
    if (!this.modal) return

    const loading = this.modal.querySelector('#leaderboard-loading') as HTMLElement
    loading.style.display = 'none'
  }

  private showError(): void {
    if (!this.modal) return

    const listContainer = this.modal.querySelector('#leaderboard-list') as HTMLElement
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="leaderboard-error">
          <p>❌ Errore nel caricamento della classifica</p>
          <button onclick="location.reload()" class="retry-btn">🔄 Riprova</button>
        </div>
      `
      listContainer.style.display = 'block'
    }
  }

  public show(): void {
    if (!this.modal) return

    // Check if user is in casual mode or doesn't have newsletter consent
    const gameMode = localStorage.getItem('gameMode')
    const isCasualMode = gameMode === 'casual'
    const authState = simpleAuth.getState()
    const hasNewsletterConsent = authState.profile?.consent_marketing === true

    console.log('🏆 Leaderboard access check:', {
      gameMode,
      isCasualMode,
      hasNewsletterConsent,
      profile: authState.profile,
      isAuthenticated: authState.isAuthenticated
    })

    this.modal.style.display = 'flex'
    this.updateTranslations()

    // Show dark patterns if:
    // 1. User explicitly chose casual mode, OR
    // 2. User is authenticated but doesn't have newsletter consent
    const shouldShowDarkPattern = isCasualMode || (authState.isAuthenticated && !hasNewsletterConsent)

    console.log('🔒 Dark pattern decision:', { shouldShowDarkPattern, reason: isCasualMode ? 'casual' : 'no-newsletter' })

    if (shouldShowDarkPattern) {
      console.log('🔒 Showing blurred leaderboard with dark pattern messaging')
      this.showBlurredLeaderboard(isCasualMode ? 'casual' : 'no-newsletter')
    } else {
      console.log('🏆 Showing full leaderboard - user eligible')
      this.loadLeaderboard()
    }

    console.log('🏆 Leaderboard modal opened')
  }

  private showBlurredLeaderboard(reason: 'casual' | 'no-newsletter'): void {
    if (!this.modal) return

    console.log('🔍 DEBUG: Starting showBlurredLeaderboard with reason:', reason)

    const contentDiv = this.modal.querySelector('.leaderboard-content') as HTMLElement
    const listContainer = this.modal.querySelector('#leaderboard-list') as HTMLElement
    const emptyContainer = this.modal.querySelector('#leaderboard-empty') as HTMLElement

    console.log('🔍 DEBUG: Elements found:', {
      contentDiv: !!contentDiv,
      listContainer: !!listContainer,
      emptyContainer: !!emptyContainer
    })

    if (!contentDiv || !listContainer || !emptyContainer) {
      console.error('❌ DEBUG: Missing elements, cannot show dark patterns')
      return
    }

    console.log('✅ DEBUG: All elements found, proceeding with dark patterns')

    // Hide loading and empty states
    const loadingElement = this.modal.querySelector('#leaderboard-loading') as HTMLElement
    if (loadingElement) {
      loadingElement.style.display = 'none'
    }
    if (emptyContainer) {
      emptyContainer.style.display = 'none'
    }

    // Create fake leaderboard entries for visual effect
    const fakeEntries = [
      { position: 1, nickname: 'ProPlayer123', score: 287, date: '2 giorni fa' },
      { position: 2, nickname: 'GameMaster', score: 245, date: '1 giorno fa' },
      { position: 3, nickname: 'BottleCatcher', score: 198, date: '3 ore fa' },
      { position: 4, nickname: 'ScoreHunter', score: 176, date: '5 ore fa' },
      { position: 5, nickname: 'TopGamer99', score: 154, date: '1 giorno fa' }
    ]

    // Generate blurred leaderboard HTML
    listContainer.innerHTML = fakeEntries.map(entry => `
      <div class="leaderboard-entry blurred-entry">
        <div class="leaderboard-position">${entry.position}</div>
        <div class="leaderboard-player">
          <div class="leaderboard-nickname">${entry.nickname}</div>
          <div class="leaderboard-date">${entry.date}</div>
        </div>
        <div class="leaderboard-score">
          <div class="score-value">${entry.score}</div>
        </div>
      </div>
    `).join('')

    // Add blur effect to content
    contentDiv.classList.add('blurred-leaderboard')

    // Create overlay with dark pattern message
    const translation = languageManager.getTranslation()
    const overlayMessage = reason === 'casual'
      ? translation.casualLeaderboardMessage || 'Subscribe to newsletter to compete and see the leaderboard!'
      : translation.newsletterLeaderboardMessage || 'Subscribe to newsletter to see the leaderboard and compete for prizes!'

    const darkPatternOverlay = document.createElement('div')
    darkPatternOverlay.className = 'dark-pattern-overlay'
    darkPatternOverlay.innerHTML = `
      <div class="dark-pattern-content">
        <h3>🏆 ${translation.leaderboardLocked || 'Leaderboard Locked'}</h3>
        <p>${overlayMessage}</p>
        <div class="dark-pattern-benefits">
          <p>✨ ${translation.darkPatternBenefit1 || 'Compete for weekly and monthly prizes'}</p>
          <p>🎯 ${translation.darkPatternBenefit2 || 'Track your progress on the leaderboard'}</p>
          <p>🏅 ${translation.darkPatternBenefit3 || 'Join the exclusive gaming community'}</p>
        </div>
        <button class="dark-pattern-btn" id="dark-pattern-subscribe">
          ${translation.subscribeNowBtn || '📧 Subscribe Now'}
        </button>
        <p class="dark-pattern-later">
          <span id="dark-pattern-maybe-later">${translation.maybeLater || 'Maybe later'}</span>
        </p>
      </div>
    `

    // Append overlay to modal main container instead of content to ensure it covers everything
    const modalContent = this.modal.querySelector('.leaderboard-modal-content') as HTMLElement
    if (modalContent) {
      modalContent.appendChild(darkPatternOverlay)
    } else {
      // Fallback to contentDiv if modal-content not found
      contentDiv.appendChild(darkPatternOverlay)
    }

    // Add event listeners
    const subscribeBtn = darkPatternOverlay.querySelector('#dark-pattern-subscribe')
    const maybeLaterBtn = darkPatternOverlay.querySelector('#dark-pattern-maybe-later')

    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', () => {
        console.log('🔒 Dark pattern: User clicked subscribe from leaderboard')
        this.hide()

        // Show and scroll to newsletter section (same logic as GameModeModal)
        const newsletterSection = document.getElementById('newsletter-section')
        if (newsletterSection) {
          newsletterSection.style.display = 'block'
          newsletterSection.scrollIntoView({ behavior: 'smooth' })
          console.log('📧 Newsletter section shown and scrolled to')
        } else {
          console.warn('⚠️ Newsletter section not found in DOM')
        }
      })
    }

    if (maybeLaterBtn) {
      maybeLaterBtn.addEventListener('click', () => {
        console.log('🔒 Dark pattern: User declined - switching to casual mode')
        localStorage.setItem('gameMode', 'casual')
        this.hide()
      })
    }

    (listContainer as HTMLElement).style.display = 'block'
  }

  public hide(): void {
    if (!this.modal) return

    // Clean up dark pattern overlay and blur effects
    const contentDiv = this.modal.querySelector('.leaderboard-content')
    const darkPatternOverlay = this.modal.querySelector('.dark-pattern-overlay')

    if (contentDiv) {
      contentDiv.classList.remove('blurred-leaderboard')
    }

    if (darkPatternOverlay) {
      darkPatternOverlay.remove()
    }

    this.modal.style.display = 'none'
    console.log('🏆 Leaderboard modal closed')
  }

  public destroy(): void {
    if (this.modal) {
      this.modal.remove()
      this.modal = null
    }
  }
}