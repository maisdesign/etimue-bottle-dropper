// Homepage JavaScript - Estratto da dist/index.html per miglior manutenibilità
// Fixes: setLanguage event.target bug, showLeaderboard duplicate functions

// Global state
let currentLang = 'it';
let pendingAction = null; // 'startGame' or 'showLeaderboard'

// Language management
function setLanguage(lang) {
  console.log('🌍 Setting language to:', lang);
  currentLang = lang;
  
  // Update language chips - FIX: find chip by content instead of event.target
  document.querySelectorAll('.lang .chip').forEach(chip => {
    const isSelected = chip.textContent.trim().toLowerCase() === lang.toLowerCase();
    chip.setAttribute('aria-selected', isSelected.toString());
  });
  
  // Update flag
  const flag = document.getElementById('current-lang');
  if (flag) {
    flag.textContent = lang === 'it' ? '🇮🇹' : '🇺🇸';
  }
  
  // Translate page
  if (typeof translatePage === 'function') {
    translatePage();
  }
  
  // Update click hint text based on language
  const clickHint = document.getElementById('click-hint');
  if (clickHint) {
    clickHint.textContent = lang === 'it' ? '🎭 Cambia' : '🎭 Change';
  }
  
  // Update Charlie tooltip
  const charlieLink = document.querySelector('a[title*="Clicca per cambiare"], a[title*="Click to change"]');
  if (charlieLink) {
    charlieLink.title = lang === 'it' ? 
      '🎭 Clicca per cambiare personaggio' : 
      '🎭 Click to change character';
  }
  
  // Update auth status after language change
  if (typeof updateAuthStatus === 'function') {
    updateAuthStatus();
  }
  
  // Update game language if available
  if (window.gameLanguage) {
    window.gameLanguage.setLanguage(lang);
  }
}

function toggleLanguage() {
  setLanguage(currentLang === 'it' ? 'en' : 'it');
}

// Leaderboard management - FIX: single definition with context detection
function showLeaderboard(fromProfile = false) {
  console.log('📊 showLeaderboard called, fromProfile:', fromProfile);
  
  if (fromProfile) {
    // Called from profile menu - close menu first
    if (typeof closeProfileMenu === 'function') {
      closeProfileMenu();
    }
    
    // Start Phaser and navigate to leaderboard
    if (typeof window.startGame === 'function') {
      window.startGame();
      // Wait for game to load, then navigate to leaderboard
      setTimeout(() => {
        if (window.game?.scene) {
          window.game.scene.start('LeaderboardScene');
        }
      }, 3000);
    }
    return;
  }
  
  // Called from main menu - check authentication first
  if (window.authManager && !window.authManager.getState().isAuthenticated) {
    console.log('🔒 Not authenticated, showing auth modal');
    
    // Set pending action and show auth modal
    pendingAction = 'showLeaderboard';
    
    if (window.homepageAuthModal) {
      window.homepageAuthModal.show();
    } else if (window.AuthModal) {
      // Create auth modal if it doesn't exist yet
      window.homepageAuthModal = new window.AuthModal();
      window.homepageAuthModal.onAuth((user) => {
        console.log('✅ Authentication successful, executing pending action:', pendingAction);
        
        if (typeof updateAuthStatus === 'function') {
          updateAuthStatus(); // Update homepage status
        }
        
        if (pendingAction === 'startGame') {
          startGame(); // Retry starting the game
        } else if (pendingAction === 'showLeaderboard') {
          showLeaderboard(); // Retry showing leaderboard
        }
        
        pendingAction = null; // Reset pending action
      });
      window.homepageAuthModal.show();
    } else {
      // Fallback to alert
      alert(currentLang === 'it' ? 
        'Per visualizzare la classifica devi prima effettuare il login.' :
        'You need to login first to view the leaderboard.'
      );
    }
    return;
  }
  
  // User is authenticated - proceed with leaderboard
  console.log('✅ User authenticated, showing leaderboard');
  if (typeof window.startGame === 'function') {
    window.startGame();
    setTimeout(() => {
      if (window.game?.scene) {
        window.game.scene.start('LeaderboardScene');
      }
    }, 3000);
  }
}

// Profile menu leaderboard - uses context parameter
function showLeaderboardFromProfile() {
  showLeaderboard(true);
}

// Game start function
function startGame() {
  console.log('🎮 startGame called');
  
  // Check if user is authenticated 
  if (window.authManager && !window.authManager.getState().isAuthenticated) {
    console.log('🔒 Not authenticated, showing auth modal');
    
    // Set pending action and show auth modal
    pendingAction = 'startGame';
    
    if (window.homepageAuthModal) {
      window.homepageAuthModal.show();
    } else if (window.AuthModal) {
      // Create auth modal if it doesn't exist yet
      window.homepageAuthModal = new window.AuthModal();
      window.homepageAuthModal.onAuth((user) => {
        console.log('✅ Authentication successful, executing pending action:', pendingAction);
        
        if (typeof updateAuthStatus === 'function') {
          updateAuthStatus(); // Update homepage status  
        }
        
        if (pendingAction === 'startGame') {
          startGame(); // Retry starting the game
        } else if (pendingAction === 'showLeaderboard') {
          showLeaderboard(); // Retry showing leaderboard
        }
        
        pendingAction = null; // Reset pending action
      });
      window.homepageAuthModal.show();
    } else {
      // Fallback to alert
      alert(currentLang === 'it' ? 
        'Per giocare devi prima effettuare il login.' :
        'You need to login first to play.'
      );
    }
    return;
  }
  
  // User is authenticated, start the game
  console.log('✅ User authenticated, starting game');
  
  // Hide homepage and show game
  const homepage = document.getElementById('homepage');
  const gameContainer = document.getElementById('game-container');
  
  if (homepage) homepage.style.display = 'none';
  if (gameContainer) gameContainer.style.display = 'block';
  
  // Initialize Phaser if needed
  if (!window.game && typeof window.initializeGame === 'function') {
    window.initializeGame();
  }
}

// Export functions to global scope for onclick handlers
window.setLanguage = setLanguage;
window.toggleLanguage = toggleLanguage;
window.showLeaderboard = showLeaderboard;
window.showLeaderboardFromProfile = showLeaderboardFromProfile;
window.startGame = startGame;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Homepage JavaScript initialized');
  
  // Set initial language based on browser or saved preference
  const savedLang = localStorage.getItem('language') || 
                   (navigator.language?.startsWith('it') ? 'it' : 'en');
  setLanguage(savedLang);
});