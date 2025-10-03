// Disable console logs in production
export function disableConsoleLogs() {
  if (import.meta.env.PROD) {
    // Store original console methods
    const noop = () => {}

    // Override console methods in production (keep errors)
    console.log = noop
    console.info = noop
    console.warn = noop
    // Keep console.error for critical issues

    console.error('🔇 Console logs disabled in production mode')
  }
}
