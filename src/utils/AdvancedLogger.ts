export interface LogEntry {
  timestamp: number
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NUCLEAR'
  category: string
  message: string
  data?: any
  stackTrace?: string
}

export class AdvancedLogger {
  private static instance: AdvancedLogger
  private logs: LogEntry[] = []
  private maxLogs: number = 1000
  private logModal: HTMLElement | null = null
  private isModalVisible: boolean = false

  private constructor() {
    this.setupGlobalErrorHandling()
    this.createLogModal()
  }

  public static getInstance(): AdvancedLogger {
    if (!AdvancedLogger.instance) {
      AdvancedLogger.instance = new AdvancedLogger()
    }
    return AdvancedLogger.instance
  }

  private setupGlobalErrorHandling(): void {
    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      this.error('GLOBAL_ERROR', 'Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      })
    })

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('PROMISE_REJECTION', 'Unhandled promise rejection', {
        reason: event.reason
      })
    })
  }

  private createLogModal(): void {
    this.logModal = document.createElement('div')
    this.logModal.id = 'advanced-log-modal'
    this.logModal.style.cssText = `
      position: fixed; top: 10px; right: 10px; width: 400px; height: 500px;
      background: rgba(0,0,0,0.95); color: #00ff00; font-family: 'Courier New', monospace;
      font-size: 11px; border: 2px solid #00ff00; border-radius: 8px; z-index: 99999;
      display: none; overflow: hidden; flex-direction: column;
    `

    this.logModal.innerHTML = `
      <div style="padding: 8px; border-bottom: 1px solid #00ff00; display: flex; justify-content: between; align-items: center; background: rgba(0,255,0,0.1);">
        <h3 style="margin: 0; font-size: 14px; font-weight: bold;">🚀 ADVANCED LOGGER</h3>
        <div style="margin-left: auto; display: flex; gap: 5px;">
          <button id="clear-logs" style="background: #ff0000; color: white; border: none; padding: 2px 6px; font-size: 10px; cursor: pointer;">CLEAR</button>
          <button id="export-logs" style="background: #0066cc; color: white; border: none; padding: 2px 6px; font-size: 10px; cursor: pointer;">EXPORT</button>
          <button id="close-logs" style="background: #666; color: white; border: none; padding: 2px 6px; font-size: 10px; cursor: pointer;">✕</button>
        </div>
      </div>
      <div id="log-content" style="flex: 1; overflow-y: auto; padding: 8px; line-height: 1.3;"></div>
      <div style="padding: 4px 8px; border-top: 1px solid #00ff00; background: rgba(0,255,0,0.1); font-size: 10px;">
        Logs: <span id="log-count">0</span> | WASD Bug Tracker Active
      </div>
    `

    document.body.appendChild(this.logModal)

    // Add event listeners
    this.logModal.querySelector('#clear-logs')?.addEventListener('click', () => this.clearLogs())
    this.logModal.querySelector('#export-logs')?.addEventListener('click', () => this.exportLogs())
    this.logModal.querySelector('#close-logs')?.addEventListener('click', () => this.hideModal())

    // Add keyboard shortcut to toggle modal (Ctrl+Shift+L) - DISABLED FOR NOW
    // document.addEventListener('keydown', (event) => {
    //   if (event.ctrlKey && event.shiftKey && event.code === 'KeyL') {
    //     this.toggleModal()
    //   }
    // })
  }

  public log(level: LogEntry['level'], category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      stackTrace: level === 'ERROR' ? new Error().stack : undefined
    }

    this.logs.push(entry)

    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Log to console as well
    const consoleMessage = `[${level}] ${category}: ${message}`
    switch (level) {
      case 'DEBUG':
        console.debug(consoleMessage, data)
        break
      case 'INFO':
        console.info(consoleMessage, data)
        break
      case 'WARN':
        console.warn(consoleMessage, data)
        break
      case 'ERROR':
        console.error(consoleMessage, data)
        break
      case 'NUCLEAR':
        console.error(`💥 ${consoleMessage}`, data)
        break
    }

    // Update modal if visible
    this.updateModal()
  }

  public debug(category: string, message: string, data?: any): void {
    this.log('DEBUG', category, message, data)
  }

  public info(category: string, message: string, data?: any): void {
    this.log('INFO', category, message, data)
  }

  public warn(category: string, message: string, data?: any): void {
    this.log('WARN', category, message, data)
  }

  public error(category: string, message: string, data?: any): void {
    this.log('ERROR', category, message, data)
  }

  public nuclear(category: string, message: string, data?: any): void {
    this.log('NUCLEAR', category, message, data)
  }

  private updateModal(): void {
    if (!this.logModal || !this.isModalVisible) return

    const content = this.logModal.querySelector('#log-content')
    const count = this.logModal.querySelector('#log-count')
    
    if (content && count) {
      // Show last 100 logs
      const recentLogs = this.logs.slice(-100)
      
      content.innerHTML = recentLogs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString()
        const levelColor = this.getLevelColor(log.level)
        const dataStr = log.data ? JSON.stringify(log.data, null, 2) : ''
        
        return `
          <div style="margin-bottom: 4px; padding: 2px; border-left: 3px solid ${levelColor};">
            <div style="color: ${levelColor}; font-weight: bold;">
              [${time}] ${log.level} ${log.category}
            </div>
            <div style="color: #ffffff; margin-left: 10px;">
              ${log.message}
            </div>
            ${dataStr ? `<pre style="color: #ffff00; font-size: 10px; margin: 2px 0 0 10px; white-space: pre-wrap;">${dataStr}</pre>` : ''}
          </div>
        `
      }).join('')

      count.textContent = this.logs.length.toString()
      
      // Auto-scroll to bottom
      content.scrollTop = content.scrollHeight
    }
  }

  private getLevelColor(level: LogEntry['level']): string {
    switch (level) {
      case 'DEBUG': return '#888888'
      case 'INFO': return '#00ff00'
      case 'WARN': return '#ffaa00'
      case 'ERROR': return '#ff0000'
      case 'NUCLEAR': return '#ff00ff'
      default: return '#ffffff'
    }
  }

  public showModal(): void {
    if (this.logModal) {
      this.logModal.style.display = 'flex'
      this.isModalVisible = true
      this.updateModal()
    }
  }

  public hideModal(): void {
    if (this.logModal) {
      this.logModal.style.display = 'none'
      this.isModalVisible = false
    }
  }

  public toggleModal(): void {
    if (this.isModalVisible) {
      this.hideModal()
    } else {
      this.showModal()
    }
  }

  public clearLogs(): void {
    this.logs = []
    this.updateModal()
  }

  public exportLogs(): void {
    const logData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: this.logs
    }

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wasd-bug-logs-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    this.info('LOGGER', 'Logs exported successfully')
  }

  public getLogs(): LogEntry[] {
    return [...this.logs]
  }
}

// Export singleton instance
export const advancedLogger = AdvancedLogger.getInstance()