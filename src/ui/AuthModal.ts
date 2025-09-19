import { authManager } from '../systems/AuthManager'
import { languageManager } from '../i18n/LanguageManager'

export class AuthModal {
  private element: HTMLElement
  private onAuthCallback?: (success: boolean) => void
  private currentStep: 'welcome' | 'email' | 'verify' | 'profile' = 'welcome'
  private currentEmail: string = ''

  constructor() {
    this.element = this.createElement()
    this.setupEventListeners()
    this.setupLanguageListener()
    document.body.appendChild(this.element)
  }

  private createElement(): HTMLElement {
    const modal = document.createElement('div')
    modal.id = 'auth-modal'
    modal.className = 'auth-modal hidden'
    modal.innerHTML = this.getModalHTML()
    return modal
  }

  private getModalHTML(): string {
    const t = languageManager.getTranslation()
    return `
      <div class="auth-modal-backdrop">
        <div class="auth-modal-content">
          <!-- Welcome Step -->
          <div class="auth-step" id="auth-step-welcome">
            <h2>${t.authWelcome}</h2>
            <p>${t.authSignInToPlay}</p>

            <div class="auth-buttons">
              <button id="auth-google" class="auth-button auth-button-google">
                <span>🔍</span> ${t.authContinueGoogle}
              </button>

              <button id="auth-email" class="auth-button auth-button-email">
                <span>📧</span> ${t.authContinueEmail}
              </button>
            </div>

            <button id="auth-close" class="auth-close-btn">×</button>
          </div>

          <!-- Email Step -->
          <div class="auth-step hidden" id="auth-step-email">
            <h2>${t.authEmailTitle}</h2>
            <p>${t.authEmailSubtitle}</p>

            <div class="auth-form">
              <input
                type="email"
                id="auth-email-input"
                placeholder="${t.authEmailPlaceholder}"
                class="auth-input"
              >
              <button id="auth-send-otp" class="auth-button auth-button-primary">
                ${t.authSendCode}
              </button>
              <button id="auth-back-welcome" class="auth-button auth-button-secondary">
                ${t.authBack}
              </button>
            </div>
          </div>

          <!-- Verify Step -->
          <div class="auth-step hidden" id="auth-step-verify">
            <h2>${t.authVerifyTitle}</h2>
            <p>${t.authVerifySubtitle}</p>

            <div class="auth-form">
              <input
                type="text"
                id="auth-otp-input"
                placeholder="${t.authOtpPlaceholder}"
                class="auth-input auth-input-otp"
                maxlength="6"
              >
              <button id="auth-verify-otp" class="auth-button auth-button-primary">
                ${t.authVerify}
              </button>
              <button id="auth-back-email" class="auth-button auth-button-secondary">
                ${t.authBack}
              </button>
            </div>
          </div>

          <!-- Profile Setup Step -->
          <div class="auth-step hidden" id="auth-step-profile">
            <h2>${t.authProfileTitle}</h2>
            <p>${t.authProfileSubtitle}</p>

            <div class="auth-form">
              <input
                type="text"
                id="auth-nickname-input"
                placeholder="${t.authNicknamePlaceholder}"
                class="auth-input"
                maxlength="20"
              >

              <div class="consent-checkbox">
                <label>
                  <input type="checkbox" id="marketing-consent" class="auth-checkbox">
                  ${t.authMarketingConsent}
                </label>
              </div>

              <button id="auth-complete" class="auth-button auth-button-primary">
                ${t.authStartPlaying}
              </button>
            </div>
          </div>

          <!-- Loading overlay -->
          <div class="auth-loading hidden" id="auth-loading">
            <div class="spinner"></div>
            <p>${t.authProcessing}</p>
          </div>
        </div>
      </div>
    `
  }

  private setupEventListeners(): void {
    // Close modal
    this.element.querySelector('#auth-close')?.addEventListener('click', () => {
      this.hide()
    })

    // Google sign in
    this.element.querySelector('#auth-google')?.addEventListener('click', async () => {
      await this.handleGoogleSignIn()
    })

    // Email flow
    this.element.querySelector('#auth-email')?.addEventListener('click', () => {
      this.showStep('email')
    })

    this.element.querySelector('#auth-send-otp')?.addEventListener('click', async () => {
      await this.handleSendOTP()
    })

    this.element.querySelector('#auth-verify-otp')?.addEventListener('click', async () => {
      await this.handleVerifyOTP()
    })

    // Navigation
    this.element.querySelector('#auth-back-welcome')?.addEventListener('click', () => {
      this.showStep('welcome')
    })

    this.element.querySelector('#auth-back-email')?.addEventListener('click', () => {
      this.showStep('email')
    })

    // Profile completion
    this.element.querySelector('#auth-complete')?.addEventListener('click', async () => {
      await this.handleCompleteProfile()
    })

    // Click outside to close
    this.element.querySelector('.auth-modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hide()
      }
    })

    // Enter key handling
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide()
      }
      if (e.key === 'Enter') {
        this.handleEnterKey()
      }
    })
  }

  private setupLanguageListener(): void {
    languageManager.onLanguageChange(() => {
      // Recreate modal content with new translations
      this.element.innerHTML = this.getModalHTML()
      // Re-setup event listeners since we recreated the HTML
      this.setupEventListeners()
      // Restore current step
      this.showStep(this.currentStep)
    })
  }

  private async handleGoogleSignIn(): Promise<void> {
    this.showLoading(true)

    try {
      const result = await authManager.signInWithGoogle()

      if (result.success) {
        // Google OAuth will redirect, so we just wait
        console.log('Google sign in initiated')
      } else {
        const t = languageManager.getTranslation()
        this.showError(result.error || t.authGoogleFailed)
        this.showLoading(false)
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      const t = languageManager.getTranslation()
      this.showError(t.authUnexpectedError)
      this.showLoading(false)
    }
  }

  private async handleSendOTP(): Promise<void> {
    const emailInput = this.element.querySelector('#auth-email-input') as HTMLInputElement
    const email = emailInput?.value.trim()

    if (!email || !email.includes('@')) {
      const t = languageManager.getTranslation()
      this.showError(t.authInvalidEmail)
      return
    }

    this.currentEmail = email
    this.showLoading(true)

    try {
      const result = await authManager.signInWithOTP(email)

      if (result.success) {
        this.showStep('verify')
        const t = languageManager.getTranslation()
        this.showSuccess(t.authCodeSent)
      } else {
        const t = languageManager.getTranslation()
        this.showError(result.error || t.authSendFailed)
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      const t = languageManager.getTranslation()
      this.showError(t.authUnexpectedError)
    } finally {
      this.showLoading(false)
    }
  }

  private async handleVerifyOTP(): Promise<void> {
    const otpInput = this.element.querySelector('#auth-otp-input') as HTMLInputElement
    const token = otpInput?.value.trim()

    if (!token || token.length !== 6) {
      const t = languageManager.getTranslation()
      this.showError(t.authCodeLength)
      return
    }

    this.showLoading(true)

    try {
      const result = await authManager.verifyOTP(this.currentEmail, token)

      if (result.success) {
        // Wait for auth state to update
        await new Promise(resolve => setTimeout(resolve, 1000))

        const state = authManager.getState()
        if (state.isAuthenticated) {
          if (state.profile?.nickname) {
            // User already has profile, complete
            this.completeAuth(true)
          } else {
            // Show profile setup
            this.showStep('profile')
          }
        } else {
          const t = languageManager.getTranslation()
          this.showError(t.authFailed)
        }
      } else {
        const t = languageManager.getTranslation()
        this.showError(result.error || t.authInvalidCode)
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      const t = languageManager.getTranslation()
      this.showError(t.authVerifyFailed)
    } finally {
      this.showLoading(false)
    }
  }

  private async handleCompleteProfile(): Promise<void> {
    const nicknameInput = this.element.querySelector('#auth-nickname-input') as HTMLInputElement
    const consentInput = this.element.querySelector('#marketing-consent') as HTMLInputElement

    const nickname = nicknameInput?.value.trim() || null
    const hasConsent = consentInput?.checked || false

    this.showLoading(true)

    try {
      await authManager.updateProfile({
        nickname,
        consent_marketing: hasConsent,
        consent_timestamp: hasConsent ? new Date().toISOString() : null
      })

      this.completeAuth(true)
    } catch (error) {
      console.error('Profile update error:', error)
      const t = languageManager.getTranslation()
      this.showError(t.authProfileFailed)
      this.showLoading(false)
    }
  }

  private showStep(step: typeof this.currentStep): void {
    // Hide all steps
    this.element.querySelectorAll('.auth-step').forEach(el => {
      el.classList.add('hidden')
    })

    // Show target step
    const stepElement = this.element.querySelector(`#auth-step-${step}`)
    if (stepElement) {
      stepElement.classList.remove('hidden')
      this.currentStep = step

      // Focus first input in new step
      const firstInput = stepElement.querySelector('input') as HTMLInputElement
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100)
      }
    }
  }

  private showLoading(show: boolean): void {
    const loading = this.element.querySelector('#auth-loading')
    if (loading) {
      loading.classList.toggle('hidden', !show)
    }
  }

  private showError(message: string): void {
    // Remove existing alerts
    this.element.querySelectorAll('.auth-alert').forEach(el => el.remove())

    const alert = document.createElement('div')
    alert.className = 'auth-alert auth-alert-error'
    alert.textContent = message

    const currentStep = this.element.querySelector(`.auth-step:not(.hidden)`)
    if (currentStep) {
      currentStep.insertBefore(alert, currentStep.firstChild)
    }

    // Auto-remove after 5 seconds
    setTimeout(() => alert.remove(), 5000)
  }

  private showSuccess(message: string): void {
    // Remove existing alerts
    this.element.querySelectorAll('.auth-alert').forEach(el => el.remove())

    const alert = document.createElement('div')
    alert.className = 'auth-alert auth-alert-success'
    alert.textContent = message

    const currentStep = this.element.querySelector(`.auth-step:not(.hidden)`)
    if (currentStep) {
      currentStep.insertBefore(alert, currentStep.firstChild)
    }

    // Auto-remove after 3 seconds
    setTimeout(() => alert.remove(), 3000)
  }

  private handleEnterKey(): void {
    switch (this.currentStep) {
      case 'email':
        this.element.querySelector('#auth-send-otp')?.dispatchEvent(new Event('click'))
        break
      case 'verify':
        this.element.querySelector('#auth-verify-otp')?.dispatchEvent(new Event('click'))
        break
      case 'profile':
        this.element.querySelector('#auth-complete')?.dispatchEvent(new Event('click'))
        break
    }
  }

  private completeAuth(success: boolean): void {
    if (this.onAuthCallback) {
      this.onAuthCallback(success)
    }
    this.hide()
  }

  // Public API
  public show(): void {
    this.element.classList.remove('hidden')
    this.showStep('welcome')

    // Focus management
    setTimeout(() => {
      const firstButton = this.element.querySelector('.auth-button') as HTMLElement
      firstButton?.focus()
    }, 100)
  }

  public hide(): void {
    this.element.classList.add('hidden')
    // Don't call completeAuth here to avoid infinite loop
  }

  public onAuth(callback: (success: boolean) => void): void {
    this.onAuthCallback = callback
  }

  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}