import { authManager } from '@/net/authManager'
import { t } from '@/i18n'

interface AuthGateConfig {
  timeout?: number
  onTimeout?: () => void
  onAuthenticated?: () => void
  onNeedsLogin?: () => void
  showLoader?: boolean
}

export class AuthGate {
  private timeout: number
  private onTimeout?: () => void
  private onAuthenticated?: () => void
  private onNeedsLogin?: () => void
  private showLoader: boolean
  private timeoutId?: NodeJS.Timeout
  private unsubscribe?: () => void
  private loaderElement?: HTMLElement

  constructor(config: AuthGateConfig = {}) {
    this.timeout = config.timeout || 5000 // 5 secondi default
    this.onTimeout = config.onTimeout
    this.onAuthenticated = config.onAuthenticated
    this.onNeedsLogin = config.onNeedsLogin
    this.showLoader = config.showLoader !== false // true di default
  }

  async check(): Promise<'authenticated' | 'needs_login' | 'timeout'> {
    return new Promise((resolve) => {
      console.log('🔒 AuthGate: Starting authentication check...')
      
      // Mostra il loader se richiesto
      if (this.showLoader) {
        this.showAuthLoader()
      }

      // Controlla se l'auth è già pronto
      const currentState = authManager.getState()
      if (!currentState.isLoading) {
        this.cleanup()
        
        if (currentState.isAuthenticated) {
          console.log('✅ AuthGate: Already authenticated')
          this.onAuthenticated?.()
          resolve('authenticated')
          return
        } else {
          console.log('❌ AuthGate: Not authenticated')
          this.onNeedsLogin?.()
          resolve('needs_login')
          return
        }
      }

      // Imposta il timeout
      this.timeoutId = setTimeout(() => {
        console.log('⏰ AuthGate: Timeout reached after', this.timeout, 'ms')
        this.cleanup()
        this.onTimeout?.()
        resolve('timeout')
      }, this.timeout)

      // Ascolta i cambiamenti dello stato auth
      this.unsubscribe = authManager.subscribe((state) => {
        if (!state.isLoading) {
          console.log('🔄 AuthGate: Auth state resolved')
          this.cleanup()
          
          if (state.isAuthenticated) {
            console.log('✅ AuthGate: User authenticated')
            this.onAuthenticated?.()
            resolve('authenticated')
          } else {
            console.log('❌ AuthGate: User not authenticated')
            this.onNeedsLogin?.()
            resolve('needs_login')
          }
        }
      })
    })
  }

  private showAuthLoader() {
    // Crea un overlay con loader
    this.loaderElement = document.createElement('div')
    this.loaderElement.id = 'auth-gate-loader'
    this.loaderElement.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(135, 206, 235, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
      ">
        <div style="
          width: 50px;
          height: 50px;
          border: 5px solid #ffffff;
          border-top: 5px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        "></div>
        <div style="
          color: #2c3e50;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
        ">
          ${t('auth.loading') || 'Caricamento...'}
        </div>
        <div style="
          color: #666;
          font-size: 14px;
          text-align: center;
          max-width: 300px;
          line-height: 1.4;
        ">
          ${t('auth.checkingStatus') || 'Verifica dello stato di autenticazione in corso...'}
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `
    
    document.body.appendChild(this.loaderElement)
  }

  private cleanup() {
    // Rimuovi timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }

    // Rimuovi subscription
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }

    // Rimuovi loader
    if (this.loaderElement) {
      this.loaderElement.remove()
      this.loaderElement = undefined
    }
  }

  // Metodo per creare un pulsante "Accedi" sempre visibile
  static createAlwaysVisibleLoginButton(): HTMLElement {
    const existingButton = document.getElementById('always-visible-login')
    if (existingButton) {
      return existingButton
    }

    const loginButton = document.createElement('button')
    loginButton.id = 'always-visible-login'
    loginButton.innerHTML = t('auth.login') || 'Accedi'
    loginButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    `

    // Hover effects
    loginButton.addEventListener('mouseenter', () => {
      loginButton.style.backgroundColor = '#0056b3'
      loginButton.style.transform = 'scale(1.05)'
    })
    
    loginButton.addEventListener('mouseleave', () => {
      loginButton.style.backgroundColor = '#007bff'
      loginButton.style.transform = 'scale(1)'
    })

    // Click handler
    loginButton.addEventListener('click', async () => {
      const authState = authManager.getState()
      
      if (authState.isAuthenticated) {
        // Se già autenticato, mostra il profilo o menu
        if ((window as any).game?.scene?.getScene('MenuScene')?.showProfileModal) {
          ;(window as any).game.scene.getScene('MenuScene').showProfileModal()
        }
      } else {
        // Se non autenticato, mostra login
        if ((window as any).AuthModal) {
          const modal = new (window as any).AuthModal()
          modal.show()
        } else {
          // Fallback: redirect alla homepage
          if (typeof window !== 'undefined' && (window as any).returnToHomepage) {
            ;(window as any).returnToHomepage()
          } else {
            window.location.href = '/'
          }
        }
      }
    })

    // Aggiorna il testo del pulsante basato sullo stato auth
    const updateButtonText = (state: any) => {
      if (state.isLoading) {
        loginButton.innerHTML = t('auth.loading') || 'Caricamento...'
        loginButton.disabled = true
      } else if (state.isAuthenticated) {
        const username = state.profile?.username || 'Profile'
        loginButton.innerHTML = username
        loginButton.disabled = false
        loginButton.style.backgroundColor = '#28a745'
      } else {
        loginButton.innerHTML = t('auth.login') || 'Accedi'
        loginButton.disabled = false
        loginButton.style.backgroundColor = '#007bff'
      }
    }

    // Aggiorna inizialmente
    updateButtonText(authManager.getState())

    // Ascolta i cambiamenti
    authManager.subscribe(updateButtonText)

    document.body.appendChild(loginButton)
    return loginButton
  }

  // Metodo per rimuovere il pulsante sempre visibile
  static removeAlwaysVisibleLoginButton() {
    const button = document.getElementById('always-visible-login')
    if (button) {
      button.remove()
    }
  }
}