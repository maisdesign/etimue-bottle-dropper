import { languageManager } from '../i18n/LanguageManager'

export class GameModeModal {
  private modal: HTMLDivElement | null = null
  private isVisible = false
  private onModeSelected: ((mode: 'competitive' | 'casual') => void) | null = null

  constructor() {
    this.createModal()
  }

  private createModal() {
    // Create modal container
    this.modal = document.createElement('div')
    this.modal.id = 'game-mode-modal'
    this.modal.className = 'modal-overlay'
    this.modal.style.display = 'none'

    // Modal content
    this.modal.innerHTML = `
      <div class="modal-content game-mode-content">
        <div class="game-mode-header">
          <h2 id="game-mode-title" class="game-mode-title"></h2>
          <p id="game-mode-subtitle" class="game-mode-subtitle"></p>
        </div>

        <div class="game-mode-options">
          <!-- Competitive Mode -->
          <div class="game-mode-option competitive">
            <div class="game-mode-option-header">
              <h3 id="competitive-title" class="game-mode-option-title"></h3>
            </div>
            <div class="game-mode-option-content">
              <p id="competitive-desc" class="game-mode-option-desc"></p>
              <ul class="prize-list">
                <li id="prize-weekly" class="prize-item"></li>
                <li id="prize-monthly" class="prize-item"></li>
              </ul>
              <button id="competitive-btn" class="game-mode-btn competitive-btn">
              </button>
            </div>
          </div>

          <!-- Casual Mode -->
          <div class="game-mode-option casual">
            <div class="game-mode-option-header">
              <h3 id="casual-title" class="game-mode-option-title"></h3>
            </div>
            <div class="game-mode-option-content">
              <p id="casual-desc" class="game-mode-option-desc"></p>
              <button id="casual-btn" class="game-mode-btn casual-btn">
                🎮 Play for Fun
              </button>
            </div>
          </div>
        </div>
      </div>
    `

    // Add to document
    document.body.appendChild(this.modal)

    // Bind events
    this.bindEvents()
    this.updateTranslations()
  }

  private bindEvents() {
    if (!this.modal) return

    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide()
      }
    })

    // Competitive mode button
    const competitiveBtn = this.modal.querySelector('#competitive-btn')
    competitiveBtn?.addEventListener('click', () => {
      this.handleCompetitiveChoice()
    })

    // Casual mode button
    const casualBtn = this.modal.querySelector('#casual-btn')
    casualBtn?.addEventListener('click', () => {
      this.handleCasualChoice()
    })

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide()
      }
    })
  }

  private async handleCompetitiveChoice() {
    console.log('🏆 User chose competitive mode - showing newsletter signup')

    // Hide game mode modal first
    this.hide()

    // Show newsletter section on homepage
    const newsletterSection = document.getElementById('newsletter-section')
    if (newsletterSection) {
      newsletterSection.style.display = 'block'
      // Scroll to newsletter section
      newsletterSection.scrollIntoView({ behavior: 'smooth' })
      console.log('📧 Newsletter section shown and scrolled to')
    }

    // Call callback to indicate competitive mode was chosen
    // The actual newsletter subscription will happen through the regular form
    if (this.onModeSelected) {
      this.onModeSelected('competitive')
    }
  }

  private handleCasualChoice() {
    console.log('🎮 User chose casual mode')

    // Save casual preference to localStorage
    localStorage.setItem('gameMode', 'casual')
    console.log('💾 Saved casual mode preference to localStorage')

    // Hide modal
    this.hide()

    // Notify callback
    if (this.onModeSelected) {
      this.onModeSelected('casual')
    }
  }

  public show(onModeSelected?: (mode: 'competitive' | 'casual') => void) {
    if (!this.modal) return

    this.onModeSelected = onModeSelected || null
    this.isVisible = true
    this.modal.style.display = 'flex'

    // Update translations in case language changed
    this.updateTranslations()

    console.log('🎯 Game mode modal shown')
  }

  public hide() {
    if (!this.modal) return

    this.isVisible = false
    this.modal.style.display = 'none'
    this.onModeSelected = null

    console.log('🎯 Game mode modal hidden')
  }

  private updateTranslations() {
    if (!this.modal) return

    const t = languageManager.getTranslation()

    // Update text content
    const elements = [
      { id: 'game-mode-title', text: t.gameModeTitle },
      { id: 'game-mode-subtitle', text: t.gameModeSubtitle },
      { id: 'competitive-title', text: t.gameModeCompetitiveTitle },
      { id: 'competitive-desc', text: t.gameModeCompetitiveDesc },
      { id: 'prize-weekly', text: t.gameModePrizeWeekly },
      { id: 'prize-monthly', text: t.gameModePrizeMonthly },
      { id: 'competitive-btn', text: t.gameModeCompetitiveButton },
      { id: 'casual-title', text: t.gameModeCasualTitle },
      { id: 'casual-desc', text: t.gameModeCasualDesc },
      { id: 'casual-btn', text: t.gameModeCasualButton }
    ]

    elements.forEach(({ id, text }) => {
      const element = this.modal?.querySelector(`#${id}`)
      if (element) {
        element.textContent = text
      }
    })
  }

  public destroy() {
    if (this.modal) {
      this.modal.remove()
      this.modal = null
    }
    this.isVisible = false
    this.onModeSelected = null
  }
}

// Create global instance
export const gameModeModal = new GameModeModal()