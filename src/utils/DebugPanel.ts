import { logger } from './Logger'
import { gameStateTracker } from './GameStateTracker'

class DebugPanel {
  private isVisible = false
  private panel: HTMLDivElement | null = null
  private logContainer: HTMLDivElement | null = null
  
  constructor() {
    this.createPanel()
    this.setupKeyboardShortcut()
  }

  private createPanel() {
    this.panel = document.createElement('div')
    this.panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 400px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      border-radius: 8px;
      padding: 16px;
      z-index: 10000;
      display: none;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `
    
    // Header
    const header = document.createElement('div')
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #333;
    `
    header.innerHTML = `
      <strong>🔧 Debug Panel</strong>
      <button id="close-debug" style="background: #ff4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">×</button>
    `
    
    // Controls
    const controls = document.createElement('div')
    controls.style.cssText = `margin-bottom: 12px;`
    controls.innerHTML = `
      <button id="export-logs" style="background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 4px 8px; margin-right: 8px; cursor: pointer;">Export Logs</button>
      <button id="clear-logs" style="background: #ff9800; color: white; border: none; border-radius: 4px; padding: 4px 8px; margin-right: 8px; cursor: pointer;">Clear</button>
      <button id="diagnose" style="background: #2196F3; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">Diagnose</button>
    `
    
    // State display
    const stateContainer = document.createElement('div')
    stateContainer.id = 'debug-state'
    stateContainer.style.cssText = `
      background: #1a1a1a;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 12px;
      max-height: 200px;
      overflow-y: auto;
    `
    
    // Log container
    this.logContainer = document.createElement('div')
    this.logContainer.id = 'debug-logs'
    this.logContainer.style.cssText = `
      background: #1a1a1a;
      padding: 8px;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
      font-size: 11px;
      line-height: 1.4;
    `
    
    this.panel.appendChild(header)
    this.panel.appendChild(controls)
    this.panel.appendChild(stateContainer)
    this.panel.appendChild(this.logContainer)
    document.body.appendChild(this.panel)
    
    // Event listeners
    this.panel.querySelector('#close-debug')?.addEventListener('click', () => this.hide())
    this.panel.querySelector('#export-logs')?.addEventListener('click', () => logger.exportLogs())
    this.panel.querySelector('#clear-logs')?.addEventListener('click', () => {
      logger.clear()
      this.updateLogs()
    })
    this.panel.querySelector('#diagnose')?.addEventListener('click', () => this.runDiagnosis())
  }

  private setupKeyboardShortcut() {
    let keySequence: string[] = []
    const targetSequence = ['d', 'e', 'b', 'u', 'g']
    
    document.addEventListener('keydown', (e) => {
      // Only listen for key sequence when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      keySequence.push(e.key.toLowerCase())
      
      // Keep only the last 5 keys
      if (keySequence.length > targetSequence.length) {
        keySequence = keySequence.slice(-targetSequence.length)
      }
      
      // Check if sequence matches
      if (keySequence.join('') === targetSequence.join('')) {
        this.toggle()
        keySequence = []
      }
      
      // Reset sequence after a delay
      setTimeout(() => {
        if (keySequence.length > 0 && e.key.toLowerCase() !== keySequence[keySequence.length - 1]) {
          keySequence = []
        }
      }, 1000)
    })
    
    // Also allow Ctrl+Alt+D to avoid conflict with browser DevTools
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.key === 'd') {
        e.preventDefault()
        this.toggle()
      }
    })
  }

  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  show() {
    if (!this.panel) return
    
    this.isVisible = true
    this.panel.style.display = 'block'
    this.updateState()
    this.updateLogs()
    
    logger.info('DEBUG_PANEL', 'Debug panel opened')
    
    // Auto-refresh every 2 seconds
    this.startAutoRefresh()
  }

  hide() {
    if (!this.panel) return
    
    this.isVisible = false
    this.panel.style.display = 'none'
    this.stopAutoRefresh()
    
    logger.info('DEBUG_PANEL', 'Debug panel closed')
  }

  private autoRefreshInterval: number | null = null

  private startAutoRefresh() {
    this.stopAutoRefresh()
    this.autoRefreshInterval = window.setInterval(() => {
      if (this.isVisible) {
        this.updateState()
        this.updateLogs()
      }
    }, 2000)
  }

  private stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval)
      this.autoRefreshInterval = null
    }
  }

  private updateState() {
    const stateContainer = this.panel?.querySelector('#debug-state')
    if (!stateContainer) return

    const state = gameStateTracker.getState()
    const authState = (window as any).authManager?.getState() || {}
    
    stateContainer.innerHTML = `
      <div style="color: #4CAF50; font-weight: bold;">🎮 Game State:</div>
      <div style="margin-left: 12px;">
        <div>Scene: ${state.gameState?.currentScene || 'Unknown'}</div>
        <div>Mobile: ${state.gameState?.isMobile ? 'Yes' : 'No'}</div>
        <div>Screen: ${state.gameState?.screenSize?.width || '?'}×${state.gameState?.screenSize?.height || '?'}</div>
        <div>Missing Textures: ${state.gameState?.missingTextures?.length || 0}</div>
      </div>
      
      <div style="color: #FF9800; font-weight: bold; margin-top: 8px;">🔐 Auth State:</div>
      <div style="margin-left: 12px;">
        <div>Authenticated: ${authState.isAuthenticated ? 'Yes' : 'No'}</div>
        <div>Has Consent: ${authState.hasMarketingConsent ? 'Yes' : 'No'}</div>
        <div>Email: ${authState.user?.email || 'None'}</div>
      </div>
      
      <div style="color: #2196F3; font-weight: bold; margin-top: 8px;">⚡ Loading State:</div>
      <div style="margin-left: 12px;">
        <div>Preload Complete: ${state.loadingState?.preloadComplete ? '✅' : '❌'}</div>
        <div>UI Sprites: ${state.loadingState?.uiSpritesGenerated ? '✅' : '❌'}</div>
        <div>Charlie Loaded: ${state.loadingState?.charlieLoaded ? '✅' : '❌'}</div>
      </div>
    `
  }

  private updateLogs() {
    if (!this.logContainer) return

    const recentLogs = logger.getLogs().slice(-50) // Last 50 logs
    this.logContainer.innerHTML = recentLogs.map(log => {
      const color = this.getLogColor(log.level)
      const time = log.timestamp.split('T')[1]?.split('.')[0] || ''
      return `<div style="color: ${color}; margin-bottom: 2px;">[${time}] ${log.level} [${log.category}] ${log.message}</div>`
    }).join('')
    
    // Auto-scroll to bottom
    this.logContainer.scrollTop = this.logContainer.scrollHeight
  }

  private getLogColor(level: string): string {
    switch (level) {
      case 'ERROR': return '#ff4444'
      case 'WARN': return '#ffaa00'
      case 'INFO': return '#4CAF50'
      case 'DEBUG': return '#888'
      default: return '#fff'
    }
  }

  private runDiagnosis() {
    logger.info('DEBUG_PANEL', 'Running system diagnosis...')
    
    const issues = gameStateTracker.diagnoseLoadingIssues()
    const report = gameStateTracker.generateDebugReport()
    
    if (issues.length === 0) {
      logger.info('DIAGNOSIS', '✅ No issues detected - system appears healthy')
    } else {
      logger.error('DIAGNOSIS', `Found ${issues.length} issues`, issues)
    }
    
    // Also log some helpful debug info
    logger.debug('DIAGNOSIS', 'Window flags', {
      skipToGame: !!(window as any).skipToGame,
      skipToLeaderboard: !!(window as any).skipToLeaderboard,
      gameInstance: !!(window as any).gameInstance,
      authManager: !!(window as any).authManager
    })
    
    this.updateLogs()
  }
}

export const debugPanel = new DebugPanel()

// Make debug panel globally available
if (typeof window !== 'undefined') {
  (window as any).debugPanel = debugPanel
  (window as any).showDebug = () => debugPanel.show()
}