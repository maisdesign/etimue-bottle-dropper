import { logger } from './Logger'

export interface GameState {
  authState: {
    isAuthenticated: boolean
    hasMarketingConsent: boolean
    userEmail?: string
    profileExists?: boolean
  }
  gameState: {
    currentScene: string
    texturesLoaded: string[]
    missingTextures: string[]
    isMobile: boolean
    screenSize: { width: number, height: number }
  }
  loadingState: {
    preloadComplete: boolean
    uiSpritesGenerated: boolean
    charlieLoaded: boolean
    gameInitialized: boolean
  }
  navigationState: {
    cameFromHomepage: boolean
    skipToGame: boolean
    skipToLeaderboard: boolean
    lastScene: string
  }
}

class GameStateTracker {
  private state: Partial<GameState> = {}
  
  updateAuth(authData: Partial<GameState['authState']>) {
    this.state.authState = { ...this.state.authState, ...authData }
    logger.info('AUTH_STATE', 'Auth state updated', this.state.authState)
    this.logFullState()
  }

  updateGame(gameData: Partial<GameState['gameState']>) {
    this.state.gameState = { ...this.state.gameState, ...gameData }
    logger.info('GAME_STATE', 'Game state updated', this.state.gameState)
  }

  updateLoading(loadingData: Partial<GameState['loadingState']>) {
    this.state.loadingState = { ...this.state.loadingState, ...loadingData }
    logger.info('LOADING_STATE', 'Loading state updated', this.state.loadingState)
    
    // Check if we have everything needed for a stable game
    if (this.state.loadingState.preloadComplete && 
        this.state.loadingState.uiSpritesGenerated && 
        this.state.loadingState.charlieLoaded) {
      logger.info('LOADING_STATE', '✅ All critical resources loaded - game should be stable')
    }
  }

  updateNavigation(navData: Partial<GameState['navigationState']>) {
    this.state.navigationState = { ...this.state.navigationState, ...navData }
    logger.info('NAV_STATE', 'Navigation state updated', this.state.navigationState)
  }

  checkTextures(scene: any, requiredTextures: string[]) {
    const loaded = requiredTextures.filter(key => scene.textures.exists(key))
    const missing = requiredTextures.filter(key => !scene.textures.exists(key))
    
    this.updateGame({ 
      texturesLoaded: loaded, 
      missingTextures: missing,
      currentScene: scene.scene.key
    })
    
    if (missing.length > 0) {
      logger.error('TEXTURE_CHECK', `Missing textures in ${scene.scene.key}`, { missing, loaded })
      return false
    }
    
    logger.info('TEXTURE_CHECK', `All textures available in ${scene.scene.key}`, { loaded })
    return true
  }

  trackSceneTransition(fromScene: string, toScene: string, reason: string) {
    logger.info('SCENE_TRANSITION', `${fromScene} → ${toScene}`, { reason })
    this.updateNavigation({ lastScene: fromScene })
    this.updateGame({ currentScene: toScene })
  }

  trackAuthFlow(step: string, success: boolean, data?: any) {
    logger.info('AUTH_FLOW', `${step}: ${success ? '✅ SUCCESS' : '❌ FAILED'}`, data)
    
    if (step === 'oauth_redirect' && success) {
      // Track if we came back from OAuth properly
      this.updateNavigation({ cameFromHomepage: false })
    }
  }

  logFullState() {
    logger.debug('FULL_STATE', 'Complete game state snapshot', this.state)
  }

  getState(): Partial<GameState> {
    return { ...this.state }
  }

  // Debug helpers
  diagnoseLoadingIssues() {
    logger.warn('DIAGNOSTICS', 'Running loading issues diagnosis')
    
    const issues = []
    
    if (!this.state.loadingState?.preloadComplete) {
      issues.push('PreloadScene not completed')
    }
    
    if (!this.state.loadingState?.uiSpritesGenerated) {
      issues.push('UI sprites not generated')
    }
    
    if (!this.state.loadingState?.charlieLoaded) {
      issues.push('Charlie texture not loaded')
    }
    
    if (this.state.gameState?.missingTextures?.length) {
      issues.push(`Missing textures: ${this.state.gameState.missingTextures.join(', ')}`)
    }
    
    if (!this.state.authState?.isAuthenticated && this.state.navigationState?.cameFromHomepage) {
      issues.push('User should be authenticated but is not')
    }
    
    if (issues.length > 0) {
      logger.error('DIAGNOSTICS', 'Issues found', issues)
    } else {
      logger.info('DIAGNOSTICS', '✅ No issues detected')
    }
    
    return issues
  }

  // Generate debug report
  generateDebugReport() {
    const report = {
      timestamp: new Date().toISOString(),
      state: this.getState(),
      recentLogs: logger.getLogs(),
      issues: this.diagnoseLoadingIssues(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    logger.info('DEBUG_REPORT', 'Generated debug report', report)
    return report
  }
}

export const gameStateTracker = new GameStateTracker()

// Make tracker globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).gameStateTracker = gameStateTracker
}