export interface LogEntry {
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  category: string
  message: string
  data?: any
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private isDevelopment = import.meta.env.MODE === 'development'
  private consoleEnabled = this.isDevelopment || import.meta.env.VITE_ENABLE_CONSOLE === 'true'
  
  private createEntry(level: LogEntry['level'], category: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined
    }
  }

  debug(category: string, message: string, data?: any) {
    const entry = this.createEntry('DEBUG', category, message, data)
    this.logs.push(entry)
    if (this.consoleEnabled) {
      console.log(`🔍 [${category}] ${message}`, data || '')
    }
    this.trimLogs()
  }

  info(category: string, message: string, data?: any) {
    const entry = this.createEntry('INFO', category, message, data)
    this.logs.push(entry)
    if (this.consoleEnabled) {
      console.log(`ℹ️ [${category}] ${message}`, data || '')
    }
    this.trimLogs()
  }

  warn(category: string, message: string, data?: any) {
    const entry = this.createEntry('WARN', category, message, data)
    this.logs.push(entry)
    if (this.consoleEnabled || this.isDevelopment) {
      console.warn(`⚠️ [${category}] ${message}`, data || '')
    }
    this.trimLogs()
  }

  error(category: string, message: string, data?: any) {
    const entry = this.createEntry('ERROR', category, message, data)
    this.logs.push(entry)
    // Always log errors to console regardless of environment
    console.error(`❌ [${category}] ${message}`, data || '')
    this.trimLogs()
  }

  private trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  getLogs(category?: string, level?: LogEntry['level']) {
    let filtered = this.logs
    
    if (category) {
      filtered = filtered.filter(log => log.category === category)
    }
    
    if (level) {
      filtered = filtered.filter(log => log.level === level)
    }
    
    return filtered
  }

  getLogsAsText(category?: string, level?: LogEntry['level']) {
    const logs = this.getLogs(category, level)
    return logs.map(log => 
      `[${log.timestamp}] ${log.level} [${log.category}] ${log.message}` + 
      (log.data ? ` - ${JSON.stringify(log.data)}` : '')
    ).join('\n')
  }

  exportLogs() {
    const blob = new Blob([this.getLogsAsText()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `etimue-logs-${new Date().toISOString().slice(0, 19)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  clear() {
    this.logs = []
    console.clear()
  }
}

export const logger = new Logger()

// Make logger globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger
}