import { languageManager } from '../i18n/LanguageManager'
import { scoreService } from '../systems/SupabaseClient'
import { authManager } from '../systems/AuthManager'

export interface LeaderboardEntry {
  id: number
  score: number
  run_seconds: number
  created_at: string
  nickname: string
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
          <h2 class="leaderboard-title" data-i18n="leaderboardTitle">🏆 Classifica</h2>
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
          <p class="leaderboard-info" data-i18n="leaderboardInfo">
            💡 Accedi per competere per i premi settimanali e mensili!
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
    // Simplified version - get scores directly from scores table
    // TODO: Add proper join with profiles when nickname column is available
    console.log('📞 Calling scoreService.getWeeklyLeaderboard(50)...')

    try {
      const entries = await scoreService.getWeeklyLeaderboard(50)
      console.log('✅ scoreService.getWeeklyLeaderboard completed with:', entries?.length, 'entries')
      return entries.map(entry => ({
        id: entry.id,
        score: entry.score,
        run_seconds: entry.run_seconds,
        created_at: entry.created_at,
        nickname: entry.nickname || 'Anonimo',
        user_id: entry.user_id
      }))
    } catch (error) {
      console.error('❌ scoreService.getWeeklyLeaderboard failed:', error)
      throw error
    }
  }

  private async getMonthlyLeaderboard(): Promise<LeaderboardEntry[]> {
    // Simplified version - get scores directly from scores table
    const entries = await scoreService.getMonthlyLeaderboard(50)
    return entries.map(entry => ({
      id: entry.id,
      score: entry.score,
      run_seconds: entry.run_seconds,
      created_at: entry.created_at,
      nickname: entry.nickname || 'Anonimo',
      user_id: entry.user_id
    }))
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

    emptyContainer.style.display = 'none'
    listContainer.style.display = 'block'

    const currentUserId = authManager.getState().user?.id

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
            <div class="leaderboard-nickname">${entry.nickname}</div>
            <div class="leaderboard-date">${date}</div>
          </div>
          <div class="leaderboard-score">
            <div class="score-value">${entry.score}</div>
            <div class="score-time">${entry.run_seconds}s</div>
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
    listContainer.innerHTML = `
      <div class="leaderboard-error">
        <p>❌ Errore nel caricamento della classifica</p>
        <button onclick="location.reload()" class="retry-btn">🔄 Riprova</button>
      </div>
    `
    listContainer.style.display = 'block'
  }

  public show(): void {
    if (!this.modal) return

    this.modal.style.display = 'flex'
    this.updateTranslations()
    this.loadLeaderboard()

    console.log('🏆 Leaderboard modal opened')
  }

  public hide(): void {
    if (!this.modal) return

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