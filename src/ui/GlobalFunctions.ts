import { initializeGame, getGame, destroyGame } from '@/main'
import { LanguageManager } from '@/i18n/LanguageManager'
import { CharacterManager } from '@/systems/CharacterManager'
import { simpleAuth } from '@/systems/SimpleAuth'
import { LeaderboardModal } from '@/ui/LeaderboardModal'
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

    console.log('✅ User authenticated, starting game...')

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