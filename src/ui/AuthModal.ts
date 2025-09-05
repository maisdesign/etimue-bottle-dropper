import { supabase, profileService } from '@/net/supabaseClient'
import { mailchimpService } from '@/net/mailchimp'
import { t, i18n } from '@/i18n'

export class AuthModal {
  private element: HTMLElement
  private isVisible: boolean = false
  private onAuthSuccess?: (user: any) => void
  private hasCompletedConsent: boolean = false
  private countdownInterval?: NodeJS.Timeout
  private keyEventHandler?: (event: KeyboardEvent) => void

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
          <div class="auth-step" id="auth-step-welcome">
            <h2>${t('auth.welcome')}</h2>
            <p>${t('game.title')}</p>
            
            <div class="auth-buttons">
              <button id="auth-google" class="auth-button auth-button-google">
                <span>G</span> ${t('auth.continueWithGoogle')}
              </button>
              
              <button id="auth-email" class="auth-button auth-button-email">
                <span>📧</span> ${t('auth.continueWithEmail')}
              </button>
            </div>
          </div>

          <div class="auth-step hidden" id="auth-step-email">
            <h2>${t('auth.signInWithOtp')}</h2>
            
            <div class="auth-form">
              <input 
                type="email" 
                id="auth-email-input" 
                placeholder="${t('auth.email')}"
                class="auth-input"
              >
              <button id="auth-send-otp" class="auth-button auth-button-primary">
                ${t('auth.signInWithOtp')}
              </button>
              <button id="auth-back" class="auth-button auth-button-secondary">
                ← ${t('auth.welcome')}
              </button>
            </div>
          </div>

          <div class="auth-step hidden" id="auth-step-verify">
            <h2>${t('auth.verify')}</h2>
            <p>${t('auth.enterOtpCode')}</p>
            
            <div class="auth-form">
              <input 
                type="text" 
                id="auth-otp-input" 
                placeholder="000000"
                class="auth-input auth-input-otp"
                maxlength="6"
              >
              <button id="auth-verify-otp" class="auth-button auth-button-primary">
                ${t('auth.verify')}
              </button>
              <button id="auth-back-email" class="auth-button auth-button-secondary">
                ← ${t('auth.email')}
              </button>
            </div>
          </div>

          <div class="auth-step hidden" id="auth-step-consent">
            <h2>${t('profile.setupProfile')}</h2>
            
            <div class="auth-form">
              <input 
                type="text" 
                id="nickname-input" 
                placeholder="${t('profile.nickname')}"
                class="auth-input"
                maxlength="20"
              >
              
              <div class="consent-checkbox">
                <input type="checkbox" id="marketing-consent" class="auth-checkbox">
                <label for="marketing-consent">
                  ${t('mailchimp.consent')}
                </label>
              </div>
              
              <p class="consent-info">
                ${t('mailchimp.consentRequired')}
              </p>
              
              <button id="auth-complete" class="auth-button auth-button-primary" disabled>
                ${t('game.play')}
              </button>
            </div>
          </div>

          <div class="auth-loading hidden" id="auth-loading">
            <div class="spinner"></div>
            <p>Loading...</p>
          </div>

          <div class="auth-error hidden" id="auth-error">
            <p class="error-message"></p>
            <button id="auth-retry" class="auth-button auth-button-secondary">
              Try Again
            </button>
          </div>
        </div>
      </div>

      <style>
        .auth-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .auth-modal.hidden {
          display: none;
        }
        
        .auth-modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .auth-modal-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 400px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .auth-step.hidden {
          display: none;
        }
        
        .auth-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .auth-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .auth-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .auth-button-google {
          background: #4285f4;
          color: white;
        }
        
        .auth-button-email {
          background: #6b7280;
          color: white;
        }
        
        .auth-button-primary {
          background: #28a745;
          color: white;
        }
        
        .auth-button-secondary {
          background: #6c757d;
          color: white;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .auth-input {
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 1rem;
        }
        
        .auth-input-otp {
          text-align: center;
          font-size: 1.5rem;
          letter-spacing: 0.1em;
        }
        
        .consent-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .auth-checkbox {
          margin-top: 0.25rem;
          width: 1.25rem;
          height: 1.25rem;
        }
        
        .consent-info {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        
        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #28a745;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          color: #dc3545;
          margin: 0;
          text-align: center;
        }
      </style>
    `
  }

  private setupEventListeners(): void {
    // Google OAuth
    this.element.querySelector('#auth-google')?.addEventListener('click', () => {
      this.signInWithProvider('google')
    })


    // Email flow
    this.element.querySelector('#auth-email')?.addEventListener('click', () => {
      this.showStep('email')
    })

    // Send OTP
    this.element.querySelector('#auth-send-otp')?.addEventListener('click', () => {
      this.sendOTP()
    })

    // Verify OTP
    this.element.querySelector('#auth-verify-otp')?.addEventListener('click', () => {
      this.verifyOTP()
    })

    // Back buttons
    this.element.querySelector('#auth-back')?.addEventListener('click', () => {
      this.showStep('welcome')
    })

    this.element.querySelector('#auth-back-email')?.addEventListener('click', () => {
      this.showStep('email')
    })

    // Consent checkbox
    const consentCheckbox = this.element.querySelector('#marketing-consent') as HTMLInputElement
    const completeButton = this.element.querySelector('#auth-complete') as HTMLButtonElement
    
    consentCheckbox?.addEventListener('change', () => {
      completeButton.disabled = !consentCheckbox.checked
    })

    // Complete auth
    completeButton?.addEventListener('click', () => {
      this.completeAuth()
    })

    // Retry button
    this.element.querySelector('#auth-retry')?.addEventListener('click', () => {
      this.showStep('welcome')
    })

    // Language change listener
    window.addEventListener('languageChanged', () => {
      this.updateTexts()
    })
  }

  private showStep(step: string): void {
    // Hide all steps
    this.element.querySelectorAll('.auth-step').forEach(el => {
      el.classList.add('hidden')
    })

    // Show target step
    this.element.querySelector(`#auth-step-${step}`)?.classList.remove('hidden')
  }

  private showLoading(show: boolean): void {
    const loading = this.element.querySelector('#auth-loading')
    const steps = this.element.querySelectorAll('.auth-step')
    
    if (show) {
      steps.forEach(step => step.classList.add('hidden'))
      loading?.classList.remove('hidden')
    } else {
      loading?.classList.add('hidden')
    }
  }

  private showError(message: string): void {
    const errorEl = this.element.querySelector('#auth-error')
    const errorMessage = errorEl?.querySelector('.error-message')
    
    if (errorMessage) {
      errorMessage.textContent = message
    }
    
    this.element.querySelectorAll('.auth-step').forEach(el => {
      el.classList.add('hidden')
    })
    
    errorEl?.classList.remove('hidden')
  }

  private async signInWithProvider(provider: 'google'): Promise<void> {
    try {
      this.showLoading(true)
      const redirectUrl = `${window.location.origin}/`
      
      console.log(`🔐 Starting ${provider} OAuth...`)
      console.log('📍 Redirect URL:', redirectUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl
        }
      })

      if (error) throw error

      console.log('✅ OAuth request sent, redirect will happen automatically')
      
    } catch (error: any) {
      console.error('❌ OAuth error:', error)
      this.showError(error.message || t('errors.authError'))
      this.showLoading(false)
    }
  }

  private async sendOTP(): Promise<void> {
    const emailInput = this.element.querySelector('#auth-email-input') as HTMLInputElement
    const email = emailInput.value.trim()

    if (!email) {
      this.showError('Please enter your email address')
      return
    }

    try {
      this.showLoading(true)

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      })

      if (error) throw error

      this.showLoading(false)
      this.showStep('verify')

    } catch (error: any) {
      console.error('OTP error:', error)
      
      // Check if it's a rate limit error
      const isRateLimit = error.message && (
        error.message.includes('60') || 
        error.message.includes('55') || 
        error.message.includes('rate') ||
        error.message.includes('security purposes') ||
        error.message.includes('wait')
      )
      
      if (isRateLimit) {
        this.startOTPCountdown()
      } else {
        this.showError(error.message || t('errors.authError'))
      }
      
      this.showLoading(false)
    }
  }

  private async verifyOTP(): Promise<void> {
    const emailInput = this.element.querySelector('#auth-email-input') as HTMLInputElement
    const otpInput = this.element.querySelector('#auth-otp-input') as HTMLInputElement
    
    const email = emailInput.value.trim()
    const otp = otpInput.value.trim()

    if (!otp) {
      this.showError('Please enter the verification code')
      return
    }

    try {
      this.showLoading(true)

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })

      if (error) throw error

      this.showLoading(false)
      this.showStep('consent')

    } catch (error: any) {
      console.error('OTP verification error:', error)
      this.showError(error.message || t('errors.authError'))
      this.showLoading(false)
    }
  }

  private startOTPCountdown(): void {
    const sendButton = this.element.querySelector('#auth-send-otp') as HTMLButtonElement
    const errorEl = this.element.querySelector('.auth-error')
    
    if (!sendButton) return
    
    let countdown = 60 // Supabase rate limit is usually 60 seconds
    
    // Clear any existing countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
    }
    
    // Disable button and show countdown
    sendButton.disabled = true
    
    const updateCountdown = () => {
      if (countdown > 0) {
        sendButton.textContent = `Wait ${countdown}s before retry`
        sendButton.style.opacity = '0.6'
        
        // Show informative error message
        if (errorEl) {
          errorEl.textContent = `For security, you can request a new code in ${countdown} seconds`
          errorEl.classList.remove('hidden')
        }
        
        countdown--
      } else {
        // Reset button when countdown completes
        sendButton.textContent = t('auth.signInWithOtp')
        sendButton.disabled = false
        sendButton.style.opacity = '1'
        
        // Hide error message
        if (errorEl) {
          errorEl.classList.add('hidden')
        }
        
        // Clear interval
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval)
          this.countdownInterval = undefined
        }
      }
    }
    
    // Start countdown immediately
    updateCountdown()
    
    // Continue countdown every second
    this.countdownInterval = setInterval(updateCountdown, 1000)
  }

  private async completeAuth(): Promise<void> {
    const consentCheckbox = this.element.querySelector('#marketing-consent') as HTMLInputElement
    const nicknameInput = this.element.querySelector('#nickname-input') as HTMLInputElement
    
    if (!consentCheckbox.checked) {
      this.showError(t('mailchimp.consentRequired'))
      return
    }

    // Validate and clean nickname
    let nickname = nicknameInput.value.trim()
    if (nickname) {
      nickname = this.validateNickname(nickname)
      if (!nickname) {
        this.showError('Nickname contains inappropriate content')
        return
      }

      // Check nickname availability (exclude current user)
      console.log('🔍 Checking nickname availability during registration:', nickname)
      const { profileService } = await import('@/net/supabaseClient')
      
      // Get current user to exclude from availability check
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        const currentProfile = await profileService.getProfile(currentUser.id)
        
        // If this is the user's current nickname, allow it
        if (currentProfile?.username === nickname) {
          console.log('✅ User is updating with their existing nickname:', nickname)
        } else {
          // Check if nickname is available for other users
          const isAvailable = await profileService.checkNicknameAvailability(nickname)
          if (!isAvailable) {
            this.showError(`The nickname "${nickname}" is already taken. Please choose another one.`)
            return
          }
        }
      }
    }

    try {
      this.showLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      console.log('🔄 Processing consent for user:', user.email)

      // Update profile with consent and nickname with timeout
      const updatePromise = profileService.updateProfile(user.id, {
        username: nickname || null,
        consent_marketing: true,
        consent_ts: new Date().toISOString()
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile update timeout')), 10000)
      )

      const updatedProfile = await Promise.race([updatePromise, timeoutPromise])
      console.log('✅ Profile updated successfully')
      
      // Immediately update AuthManager state
      const { authManager } = await import('@/net/authManager')
      authManager.updateMarketingConsent(true, updatedProfile)

      // Subscribe to Mailchimp (non-blocking with detailed logging)
      console.log('🔄 Starting Mailchimp subscription for:', user.email)
      mailchimpService.subscribe({
        email: user.email!,
        firstName: user.user_metadata?.name?.split(' ')[0] || '',
        lastName: user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
        consent: true
      }).then(subscribeResult => {
        console.log('📧 Mailchimp subscription result:', subscribeResult)
        if (!subscribeResult.success) {
          console.error('❌ Mailchimp subscription failed:', subscribeResult.error)
        } else {
          console.log('✅ Mailchimp subscription successful:', subscribeResult.message)
        }
      }).catch(error => {
        console.error('💥 Mailchimp subscription error (catch block):', error)
      })

      this.showLoading(false)
      this.hasCompletedConsent = true
      this.hide()

      // Notify success
      if (this.onAuthSuccess) {
        this.onAuthSuccess(user)
      }

    } catch (error: any) {
      console.error('Complete auth error:', error)
      this.showError(error.message || t('errors.generic'))
      this.showLoading(false)
    }
  }

  private validateNickname(nickname: string): string | null {
    // Basic validation
    if (nickname.length > 20) {
      nickname = nickname.substring(0, 20)
    }
    
    // Simple profanity filter (expandable)
    const badWords = [
      'merda', 'cazzo', 'puttana', 'stronzo', 'vaffanculo',
      'shit', 'fuck', 'bitch', 'asshole', 'damn',
      'nazi', 'hitler', 'fascist', 'terrorist'
    ]
    
    const lowerNickname = nickname.toLowerCase()
    for (const badWord of badWords) {
      if (lowerNickname.includes(badWord)) {
        return null // Reject nickname
      }
    }
    
    // Remove special characters except letters, numbers, spaces, underscore, dash
    nickname = nickname.replace(/[^a-zA-Z0-9\s_-]/g, '')
    
    // Trim and check if still valid
    nickname = nickname.trim()
    if (nickname.length < 2) {
      return null
    }
    
    return nickname
  }

  private updateTexts(): void {
    // Re-render modal with new translations
    this.element.innerHTML = this.getModalHTML()
    this.setupEventListeners()
  }

  private preventGameKeys(): void {
    // Prevent WASD and arrow keys from being handled by Phaser while modal is open
    this.keyEventHandler = (event: KeyboardEvent) => {
      const gameKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']
      
      if (gameKeys.includes(event.code)) {
        // Only prevent default if the target is not an input field
        const target = event.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          event.stopPropagation()
          console.log('🎹 Prevented game key:', event.code, 'while modal is open')
        }
      }
    }

    document.addEventListener('keydown', this.keyEventHandler, true)
    document.addEventListener('keyup', this.keyEventHandler, true)
    console.log('🎹 Added global key event prevention for game keys')
  }

  private removeGameKeyPrevention(): void {
    if (this.keyEventHandler) {
      document.removeEventListener('keydown', this.keyEventHandler, true)
      document.removeEventListener('keyup', this.keyEventHandler, true)
      this.keyEventHandler = undefined
      console.log('🎹 Removed global key event prevention')
    }
  }

  public show(): void {
    this.isVisible = true
    this.element.classList.remove('hidden')
    
    // Disable Phaser keyboard to allow typing in HTML inputs
    console.log('🚨 WASD FIX TEST - AuthModal show() called - BUILD ENHANCED_KEYBOARD_FIX')
    if (typeof window !== 'undefined' && (window as any).managePhaserKeyboard) {
      console.log('🎹 AuthModal: Disabling Phaser keyboard for HTML inputs - WASD SHOULD WORK NOW')
      ;(window as any).managePhaserKeyboard.disable()
    } else {
      console.log('❌ managePhaserKeyboard not available!')
    }

    // Add global keyboard event prevention for game keys while modal is open
    this.preventGameKeys()

    // Focus first input when modal opens (after a brief delay to ensure DOM is ready)
    setTimeout(() => {
      const firstInput = this.element.querySelector('input:not([type="checkbox"])')
      if (firstInput) {
        (firstInput as HTMLInputElement).focus()
        console.log('🎹 AuthModal: Focused first input element')
      }
    }, 100)
    
    // Check if user is already authenticated but needs consent
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Check if user already has marketing consent
        return profileService.getProfile(user.id).then(profile => {
          // Fix login loop: Check database state directly, not session state
          if (profile?.consent_marketing) {
            console.log('✅ User already has consent - closing auth modal')
            this.hide()
            // Notify success to complete the auth flow
            if (this.onAuthSuccess) {
              this.onAuthSuccess(user)
            }
            return
          }
          
          console.log('📝 User already authenticated, showing consent step')
          this.showStep('consent')
          
          // Pre-fill nickname with existing profile data or user metadata
          const nicknameInput = this.element.querySelector('#nickname-input') as HTMLInputElement
          if (nicknameInput) {
            if (profile?.username) {
              // User already has nickname in profile - pre-fill it
              nicknameInput.value = profile.username
              console.log('📋 Pre-filled nickname from profile:', profile.username)
            } else if (user.user_metadata?.name) {
              // Fall back to user metadata
              nicknameInput.value = user.user_metadata.name
              console.log('📋 Pre-filled nickname from user metadata:', user.user_metadata.name)
            }
          }
        })
      } else {
        console.log('🔐 User not authenticated, showing welcome step')
        this.showStep('welcome')
      }
    }).catch(() => {
      console.log('❌ Error checking user, showing welcome step')
      this.showStep('welcome')
    })
  }

  public hide(): void {
    this.isVisible = false
    this.element.classList.add('hidden')
    
    // Remove global key event prevention
    this.removeGameKeyPrevention()
    
    // Re-enable Phaser keyboard when modal closes
    if (typeof window !== 'undefined' && (window as any).managePhaserKeyboard) {
      console.log('🎹 AuthModal: Re-enabling Phaser keyboard after modal close')
      ;(window as any).managePhaserKeyboard.enable()
    }
    
    // Clear countdown timer when hiding
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = undefined
    }
  }

  public onAuth(callback: (user: any) => void): void {
    this.onAuthSuccess = callback
  }

  public destroy(): void {
    this.hasCompletedConsent = false
    
    // Remove global key event prevention
    this.removeGameKeyPrevention()
    
    // Clear countdown timer when destroying
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = undefined
    }
    
    this.element.remove()
  }
}