import { authManager } from '../systems/AuthManager'

export class AuthModal {
  private element: HTMLElement
  private isVisible: boolean = false
  private onAuthCallback?: (success: boolean) => void
  private currentStep: 'welcome' | 'email' | 'verify' | 'profile' = 'welcome'
  private currentEmail: string = ''

  constructor() {
    this.element = this.createElement()
    this.setupEventListeners()
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
    return `
      <div class="auth-modal-backdrop">
        <div class="auth-modal-content">
          <!-- Welcome Step -->
          <div class="auth-step" id="auth-step-welcome">
            <h2>🎮 Welcome to Etimuè Bottle Dropper!</h2>
            <p>Sign in to play and compete for prizes</p>

            <div class="auth-buttons">
              <button id="auth-google" class="auth-button auth-button-google">
                <span>🔍</span> Continue with Google
              </button>

              <button id="auth-email" class="auth-button auth-button-email">
                <span>📧</span> Continue with Email
              </button>
            </div>

            <button id="auth-close" class="auth-close-btn">×</button>
          </div>

          <!-- Email Step -->
          <div class="auth-step hidden" id="auth-step-email">
            <h2>📧 Sign in with Email</h2>
            <p>We'll send you a verification code</p>

            <div class="auth-form">
              <input
                type="email"
                id="auth-email-input"
                placeholder="your@email.com"
                class="auth-input"
              >
              <button id="auth-send-otp" class="auth-button auth-button-primary">
                Send Code
              </button>
              <button id="auth-back-welcome" class="auth-button auth-button-secondary">
                ← Back
              </button>
            </div>
          </div>

          <!-- Verify Step -->
          <div class="auth-step hidden" id="auth-step-verify">
            <h2>🔐 Enter Verification Code</h2>
            <p>Check your email for the 6-digit code</p>

            <div class="auth-form">
              <input
                type="text"
                id="auth-otp-input"
                placeholder="000000"
                class="auth-input auth-input-otp"
                maxlength="6"
              >
              <button id="auth-verify-otp" class="auth-button auth-button-primary">
                Verify
              </button>
              <button id="auth-back-email" class="auth-button auth-button-secondary">
                ← Back
              </button>
            </div>
          </div>

          <!-- Profile Setup Step -->
          <div class="auth-step hidden" id="auth-step-profile">
            <h2>👤 Setup Your Profile</h2>
            <p>Choose a nickname for the leaderboard</p>

            <div class="auth-form">
              <input
                type="text"
                id="auth-nickname-input"
                placeholder="Your nickname"
                class="auth-input"
                maxlength="20"
              >

              <div class="consent-checkbox">
                <label>
                  <input type="checkbox" id="marketing-consent" class="auth-checkbox">
                  I want to receive updates and compete for prizes
                </label>
              </div>

              <button id="auth-complete" class="auth-button auth-button-primary">
                Start Playing!
              </button>
            </div>
          </div>

          <!-- Loading overlay -->
          <div class="auth-loading hidden" id="auth-loading">
            <div class="spinner"></div>
            <p>Processing...</p>
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

  private async handleGoogleSignIn(): Promise<void> {
    this.showLoading(true)

    try {
      const result = await authManager.signInWithGoogle()

      if (result.success) {
        // Google OAuth will redirect, so we just wait
        console.log('Google sign in initiated')
      } else {
        this.showError(result.error || 'Google sign in failed')
        this.showLoading(false)
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      this.showError('Unexpected error during Google sign in')
      this.showLoading(false)
    }
  }

  private async handleSendOTP(): Promise<void> {
    const emailInput = this.element.querySelector('#auth-email-input') as HTMLInputElement
    const email = emailInput?.value.trim()

    if (!email || !email.includes('@')) {
      this.showError('Please enter a valid email address')
      return
    }

    this.currentEmail = email
    this.showLoading(true)

    try {
      const result = await authManager.signInWithOTP(email)

      if (result.success) {
        this.showStep('verify')
        this.showSuccess('Verification code sent to your email!')
      } else {
        this.showError(result.error || 'Failed to send verification code')
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      this.showError('Unexpected error sending verification code')
    } finally {
      this.showLoading(false)
    }
  }

  private async handleVerifyOTP(): Promise<void> {
    const otpInput = this.element.querySelector('#auth-otp-input') as HTMLInputElement
    const token = otpInput?.value.trim()

    if (!token || token.length !== 6) {
      this.showError('Please enter the 6-digit verification code')
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
          this.showError('Authentication failed, please try again')
        }
      } else {
        this.showError(result.error || 'Invalid verification code')
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      this.showError('Unexpected error during verification')
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
      this.showError('Failed to update profile')
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
    this.isVisible = true
    this.element.classList.remove('hidden')
    this.showStep('welcome')

    // Focus management
    setTimeout(() => {
      const firstButton = this.element.querySelector('.auth-button') as HTMLElement
      firstButton?.focus()
    }, 100)
  }

  public hide(): void {
    this.isVisible = false
    this.element.classList.add('hidden')
    this.completeAuth(false)
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