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
  
  // Update game language if available (development only)
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
    
    // Check if game is already running
    if (window.game && window.game.scene) {
      // Game already running, go directly to leaderboard
      window.game.scene.start('LeaderboardScene');
    } else if (typeof window.startGame === 'function') {
      // Game not running, start it and then navigate to leaderboard
      window.startGame();
      setTimeout(() => {
        if (window.game?.scene) {
          window.game.scene.start('LeaderboardScene');
        }
      }, 3000);
    }
    return;
  }
  
  // Called from main menu - check authentication first (if available)
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
  
  // AuthManager should always be available now
  
  // User is authenticated - proceed with leaderboard
  console.log('✅ User authenticated, showing leaderboard');
  
  // Check if game is already running
  if (window.game && window.game.scene) {
    // Game already running, go directly to leaderboard
    window.game.scene.start('LeaderboardScene');
  } else if (typeof window.startGame === 'function') {
    // Game not running, start it and then navigate to leaderboard
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
  
  // If game is already running, ensure we start from GameScene (not stuck in LeaderboardScene)
  if (window.game && window.game.scene) {
    console.log('🎮 Game already running, checking if MenuScene is active');

    // CRITICAL: Still need to show the game container!
    const homepage = document.getElementById('homepage');
    const gameContainer = document.getElementById('game-container');

    if (homepage) homepage.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'block';

    // FIX: Always go through MenuScene to avoid conflicts and ensure proper auth flow
    console.log('🎮 Redirecting to MenuScene to handle game start properly');
    window.game.scene.start('MenuScene');

    // Set a flag to tell MenuScene to start the game immediately after auth check
    setTimeout(() => {
      const menuScene = window.game.scene.getScene('MenuScene');
      if (menuScene && menuScene.scene.isActive()) {
        // Trigger the GIOCA button programmatically to ensure proper auth flow
        const event = new CustomEvent('homepageStartGame');
        window.dispatchEvent(event);
      }
    }, 500);
    return;
  }
  
  // Check if user is authenticated (if available)
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
  
  // Initialize Phaser if needed (if available in development mode)
  if (!window.game && typeof window.initializeGame === 'function') {
    window.initializeGame();
  } else if (!window.game) {
    console.log('⚠️ Game initialization not available (production mode)');
    // In production, game should auto-initialize through main.ts
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
  console.log('🌐 Current URL:', window.location.href);
  console.log('🌐 Expected URL should be etimuebottledropper.netlify.app');

  // Check if we're on the wrong domain and redirect if needed
  if (window.location.hostname === 'astounding-rolypoly-fc5137.netlify.app') {
    console.log('🚨 WRONG DOMAIN DETECTED! Redirecting to correct domain...');
    window.location.replace('https://etimuebottledropper.netlify.app/');
    return;
  }

  // Set initial language based on browser or saved preference
  const savedLang = localStorage.getItem('language') ||
                   (navigator.language?.startsWith('it') ? 'it' : 'en');
  setLanguage(savedLang);
});