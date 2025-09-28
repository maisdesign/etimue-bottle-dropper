import { initializeGame, getGame, destroyGame } from '@/main'
import { LanguageManager } from '@/i18n/LanguageManager'
import { CharacterManager } from '@/systems/CharacterManager'
import { simpleAuth } from '@/systems/SimpleAuth'
import { LeaderboardModal } from '@/ui/LeaderboardModal'
import { gameModeModal } from '@/ui/GameModeModal'
// AuthModal removed - using direct Google OAuth flow now

// Static imports instead of dynamic imports to avoid 404 errors
const languageManager = LanguageManager.getInstance()
const characterManager = CharacterManager.getInstance()

// Authentication helper - SimpleAuth version
const checkGameAuth = async (): Promise<boolean> => {
  console.log('🎮 Checking auth for game access...')

  const authState = simpleAuth.getState()

  if (authState.isAuthenticated) {
    console.log('✅ User can play!')
    return true
  }

  if (authState.isLoading) {
    console.log('⏳ Waiting for auth to initialize...')
    await new Promise<void>((resolve) => {
      const unsubscribe = simpleAuth.subscribe((state) => {
        if (!state.isLoading) {
          unsubscribe()
          resolve()
        }
      })
    })
  }

  if (!simpleAuth.getState().isAuthenticated) {
    console.log('🔐 Starting Google sign in...')
    const result = await simpleAuth.signInWithGoogle()
    if (!result.success) {
      console.error('❌ Sign in failed:', result.error)
      return false
    }

    // Wait for auth state to update
    console.log('⏳ Waiting for sign in to complete...')
    return new Promise((resolve) => {
      const unsubscribe = simpleAuth.subscribe((state) => {
        if (!state.isLoading) {
          unsubscribe()
          resolve(state.isAuthenticated)
        }
      })
    })
  }

  const canPlay = simpleAuth.getState().isAuthenticated
  console.log('🎯 Final auth check result:', canPlay)
  return canPlay
}

// Game management
let isPaused = false

// Global functions
export const globalFunctions = {
  async startNewGame() {
    console.log('🎮 Starting new game...')

    if (!await checkGameAuth()) {
      console.log('❌ User not authenticated, game start cancelled')
      return
    }

    console.log('✅ User authenticated, checking game mode preferences...')

    // Check if user has casual mode preference
    const hasCasualPreference = localStorage.getItem('gameMode') === 'casual'
    console.log('🎯 Casual mode preference:', hasCasualPreference)

    // Check if user has newsletter consent (competitive eligibility)
    const authState = simpleAuth.getState()
    const hasNewsletterConsent = authState.profile?.consent_marketing === true
    console.log('📧 Newsletter consent status:', hasNewsletterConsent)

    // If user has no preference and no newsletter consent, show mode selection
    if (!hasCasualPreference && !hasNewsletterConsent) {
      console.log('🎯 Showing game mode selection modal...')

      return new Promise<void>((resolve) => {
        gameModeModal.show((mode) => {
          console.log('🎯 User selected mode:', mode)

          if (mode === 'competitive') {
            // Competitive mode was selected and newsletter subscription was triggered
            // The subscription process is handled by GameModeModal
            console.log('🏆 Competitive mode selected - checking final consent status')

            // Small delay to let the subscription process complete
            setTimeout(() => {
              globalFunctions.actuallyStartGame()
              resolve()
            }, 500)
          } else {
            // Casual mode selected
            console.log('🎮 Casual mode selected - starting game immediately')
            globalFunctions.actuallyStartGame()
            resolve()
          }
        })
      })
    }

    // User already has preference or newsletter consent - start game directly
    console.log('🚀 Starting game directly (existing preference or consent)')
    globalFunctions.actuallyStartGame()
  },

  actuallyStartGame() {
    console.log('🚀 Actually starting game engine...')

    const overlay = document.getElementById('game-start-overlay')
    if (overlay) {
      overlay.classList.add('hidden')
      console.log('🎮 Game start overlay hidden')
    }

    if (getGame()) {
      console.log('🔄 Destroying existing game instance')
      destroyGame()
    }

    const game = initializeGame()

    let attempts = 0
    const maxAttempts = 20
    const tryAutoStart = () => {
      attempts++
      const gameScene = game.scene.getScene('GameScene') as any
      if (gameScene && gameScene.scene.isActive('GameScene') && gameScene.character) {
        console.log('🚀 Auto-starting game after authentication (attempt ' + attempts + ')')
        gameScene.input.emit('pointerdown', { isDown: true })
      } else if (attempts < maxAttempts) {
        console.log(`⏳ GameScene not ready yet, retrying... (attempt ${attempts}/${maxAttempts})`)
        setTimeout(tryAutoStart, 200)
      } else {
        console.warn('⚠️ GameScene auto-start timeout after ' + (attempts * 200) + 'ms')
      }
    }

    setTimeout(tryAutoStart, 300)
  },

  togglePause() {
    const game = getGame()
    if (!game) return

    isPaused = !isPaused

    if (isPaused) {
      game.scene.pause('GameScene')
      const translation = languageManager.getTranslation()
      document.querySelector('.btn:nth-child(2)')!.textContent = '▶️ ' + translation.resume
      console.log('⏸️ Game paused')
    } else {
      game.scene.resume('GameScene')
      const translation = languageManager.getTranslation()
      document.querySelector('.btn:nth-child(2)')!.textContent = '⏸️ ' + translation.pause
      console.log('▶️ Game resumed')
    }
  },

  showInstructions() {
    const modal = document.getElementById('instructions-modal')
    if (modal) {
      modal.style.display = 'block'
      console.log('📖 Instructions modal opened')
    }
  },

  closeInstructions() {
    const modal = document.getElementById('instructions-modal')
    if (modal) {
      modal.style.display = 'none'
      console.log('📖 Instructions modal closed')
    }
  },

  showLeaderboard() {
    console.log('🏆 Opening leaderboard with STATIC import...')

    // STATIC IMPORT VERSION - NO DYNAMIC IMPORT!
    try {
      const modal = new LeaderboardModal()
      modal.show()
    } catch (error) {
      console.error('❌ Failed to load LeaderboardModal with static import:', error)
      const isAuthenticated = simpleAuth.getState().isAuthenticated
      alert(isAuthenticated ? 'Errore nel caricamento della classifica. Riprova più tardi.' : 'Accedi per vedere la classifica!')
    }
  },

  toggleLanguage() {
    languageManager.toggleLanguage()
    console.log(`🌍 Language toggled to: ${languageManager.getCurrentLanguage()}`)
  },

  cycleCharacter() {
    characterManager.cycleCharacter()
    console.log(`🐱 Character changed to: ${characterManager.getCurrentCharacterName()}`)
  },

  showGameStartOverlay() {
    const overlay = document.getElementById('game-start-overlay')
    if (overlay) {
      overlay.classList.remove('hidden')
      console.log('🎮 Game start overlay shown')
    }
  },

  hideGameStartOverlay() {
    const overlay = document.getElementById('game-start-overlay')
    if (overlay) {
      overlay.classList.add('hidden')
      console.log('🎮 Game start overlay hidden')
    }
  },

  async subscribeToNewsletter() {
    const emailInput = document.getElementById('newsletter-email') as HTMLInputElement
    const consentCheckbox = document.getElementById('newsletter-consent') as HTMLInputElement
    const subscribeBtn = document.getElementById('newsletter-subscribe-btn') as HTMLButtonElement
    const messageDiv = document.getElementById('newsletter-message') as HTMLDivElement

    if (!emailInput || !consentCheckbox || !subscribeBtn || !messageDiv) {
      console.error('Newsletter form elements not found')
      return
    }

    const email = emailInput.value.trim()

    // Validation
    if (!email) {
      this.showNewsletterMessage('Please enter your email address', 'error')
      return
    }

    if (!email.includes('@') || !email.includes('.')) {
      this.showNewsletterMessage('Please enter a valid email address', 'error')
      return
    }

    if (!consentCheckbox.checked) {
      this.showNewsletterMessage('Please agree to receive marketing communications', 'error')
      return
    }

    // Check authentication
    const authState = simpleAuth.getState()
    if (!authState.isAuthenticated) {
      this.showNewsletterMessage('Please log in first to subscribe to the newsletter', 'error')
      return
    }

    // Update UI during request
    subscribeBtn.disabled = true
    subscribeBtn.textContent = 'Subscribing...'

    try {
      console.log('📧 Subscribing to newsletter:', email)
      const result = await simpleAuth.subscribeToNewsletter()

      if (result.success) {
        if (result.alreadySubscribed) {
          const t = languageManager.getTranslation()
          this.showNewsletterMessage(t.newsletterAlreadySubscribed, 'success')
        } else {
          const t = languageManager.getTranslation()
          this.showNewsletterMessage(t.newsletterSuccessMessage, 'success')
          emailInput.value = ''
          consentCheckbox.checked = false
        }
      } else {
        const t = languageManager.getTranslation()
        // DEBUG: Log the exact response from Edge Function
        console.log('🔍 DEBUG: Newsletter error response:', result)
        console.log('🔍 DEBUG: isPermanentlyDeleted flag:', result.isPermanentlyDeleted)

        // Handle specific error cases with appropriate translations
        if (result.isPermanentlyDeleted) {
          console.log('🔗 DEBUG: Showing Mailchimp link message')
          this.showNewsletterMessage(t.newsletterPermanentlyDeleted, 'error')
        } else {
          console.log('⚠️ DEBUG: Showing generic error message')
          this.showNewsletterMessage(result.error || t.newsletterErrorMessage, 'error')
        }
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      const t = languageManager.getTranslation()
      this.showNewsletterMessage(t.newsletterErrorMessage, 'error')
    } finally {
      // Reset button
      subscribeBtn.disabled = false
      const t = languageManager.getTranslation()
      subscribeBtn.textContent = t.newsletterSubscribeButton
    }
  },

  showNewsletterMessage(message: string, type: 'success' | 'error') {
    const messageDiv = document.getElementById('newsletter-message') as HTMLDivElement
    if (messageDiv) {
      // Use innerHTML to support HTML links in messages
      messageDiv.innerHTML = message
      messageDiv.className = `newsletter-message ${type}`
      messageDiv.style.display = 'block'

      // Only auto-hide if message doesn't contain links
      const hasLinks = message.includes('<a')
      if (!hasLinks) {
        setTimeout(() => {
          messageDiv.style.display = 'none'
        }, 5000)
      }
    }
  },

  toggleNewsletterSection() {
    const authState = simpleAuth.getState()
    const newsletterSection = document.getElementById('newsletter-section')

    if (newsletterSection) {
      // Show newsletter section for all authenticated users to inform about prize requirements
      if (authState.isAuthenticated) {
        newsletterSection.style.display = 'block'
        console.log('📧 Newsletter section shown for authenticated user (prize requirement info)')

        // Update UI based on subscription status
        const subscribeBtn = document.getElementById('newsletter-subscribe-btn') as HTMLButtonElement
        const emailInput = document.getElementById('newsletter-email') as HTMLInputElement
        const consentCheckbox = document.getElementById('newsletter-consent') as HTMLInputElement

        if (authState.profile?.consent_marketing) {
          // User already subscribed - show confirmation
          const confirmText = languageManager.getCurrentLanguage() === 'it' ? '✅ Già iscritto alla newsletter!' : '✅ Already subscribed to newsletter!'
          if (subscribeBtn) subscribeBtn.textContent = confirmText
          if (subscribeBtn) subscribeBtn.disabled = true
          if (emailInput) emailInput.style.display = 'none'
          if (consentCheckbox) consentCheckbox.parentElement!.style.display = 'none'
        } else {
          // User not subscribed - show form
          const t = languageManager.getTranslation()
          if (subscribeBtn) subscribeBtn.textContent = t.newsletterSubscribeButton
          if (subscribeBtn) subscribeBtn.disabled = false
          if (emailInput) emailInput.style.display = 'block'
          if (consentCheckbox) consentCheckbox.parentElement!.style.display = 'flex'
        }
      } else {
        newsletterSection.style.display = 'none'
      }
    }
  }
}

// Attach functions to window object
declare global {
  interface Window {
    startNewGame: () => Promise<void>
    togglePause: () => void
    showInstructions: () => void
    closeInstructions: () => void
    showLeaderboard: () => void
    toggleLanguage: () => void
    cycleCharacter: () => void
    showGameStartOverlay: () => void
    hideGameStartOverlay: () => void
    subscribeToNewsletter: () => Promise<void>
  }
}

// Translation and UI management
function updateTranslations() {
  const translation = languageManager.getTranslation()

  // Update all elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n')
    if (key && key in translation) {
      // Use character interpolation for specific keys
      if (key === 'footerControls' || key === 'instructionsObjective' || key === 'gameInstructions') {
        element.textContent = languageManager.translateWithCharacter(key as keyof typeof translation)
      } else {
        element.textContent = (translation as any)[key]
      }
    }
  })

  // Update placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder')
    if (key && key in translation) {
      (element as HTMLInputElement).placeholder = (translation as any)[key]
    }
  })

  // Update language button
  const languageBtn = document.getElementById('language-btn')
  if (languageBtn) {
    const currentLang = languageManager.getCurrentLanguage()
    languageBtn.textContent = `🌍 ${currentLang.toUpperCase()}`
  }

  // Update character button
  const characterBtn = document.getElementById('character-btn')
  if (characterBtn) {
    const currentCharacter = characterManager.getCurrentCharacterName()
    characterBtn.textContent = `🐱 ${currentCharacter}`
  }

  document.documentElement.lang = languageManager.getCurrentLanguage()
}

function updateCharacterDependentTranslations() {
  // Update all elements that depend on character name
  const characterElements = document.querySelectorAll('[data-i18n="footerControls"], [data-i18n="instructionsObjective"], [data-i18n="gameInstructions"]')
  characterElements.forEach((element) => {
    const key = element.getAttribute('data-i18n')
    if (key) {
      element.textContent = languageManager.translateWithCharacter(key as any)
    }
  })
}

// Initialize UI management
function initializeUI() {
  languageManager.onLanguageChange(updateTranslations)
  characterManager.onCharacterChange(() => {
    updateCharacterDependentTranslations()
    const characterBtn = document.getElementById('character-btn')
    if (characterBtn) {
      const currentCharacter = characterManager.getCurrentCharacterName()
      characterBtn.textContent = `🐱 ${currentCharacter}`
    }
  })

  // Initialize newsletter functionality
  const newsletterBtn = document.getElementById('newsletter-subscribe-btn')
  if (newsletterBtn) {
    newsletterBtn.addEventListener('click', () => globalFunctions.subscribeToNewsletter())
  }

  // Set up auth state listener for newsletter visibility
  simpleAuth.subscribe(() => {
    globalFunctions.toggleNewsletterSection()
  })

  updateTranslations()
}

// Window click handler for modal closing
window.onclick = function(event: MouseEvent) {
  const instructionsModal = document.getElementById('instructions-modal')
  if (event.target === instructionsModal) {
    globalFunctions.closeInstructions()
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Etimuè Bottle Dropper v2.0.0 loaded!')
  initializeUI()
})

// Attach to window
window.startNewGame = globalFunctions.startNewGame
window.togglePause = globalFunctions.togglePause
window.showInstructions = globalFunctions.showInstructions
window.closeInstructions = globalFunctions.closeInstructions
window.showLeaderboard = globalFunctions.showLeaderboard
window.toggleLanguage = globalFunctions.toggleLanguage
window.cycleCharacter = globalFunctions.cycleCharacter
window.showGameStartOverlay = globalFunctions.showGameStartOverlay
window.hideGameStartOverlay = globalFunctions.hideGameStartOverlay
window.subscribeToNewsletter = globalFunctions.subscribeToNewsletter

// 🔧 DEBUG FUNCTIONS - Development only
if (import.meta.env.MODE === 'development' || window.location.hostname === 'localhost') {
  (window as any).debugAuthBypass = () => {
    localStorage.setItem('debug-auth-bypass', 'etimue-debug-2024')
    console.log('🔧 DEBUG: Auth bypass activated! Reload the page.')
    console.log('🔧 Now you can play without logging in!')
  }

  (window as any).debugAuthRestore = () => {
    localStorage.removeItem('debug-auth-bypass')
    console.log('🔧 DEBUG: Auth bypass deactivated! Normal auth required.')
  }

  console.log('🔧 DEBUG FUNCTIONS AVAILABLE:')
  console.log('  debugAuthBypass() - Skip login requirement')
  console.log('  debugAuthRestore() - Restore normal auth')
}