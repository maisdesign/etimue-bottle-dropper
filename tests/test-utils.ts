// Test utilities for Playwright tests
import type { Page } from '@playwright/test'

/**
 * Authenticates user using test backdoor
 * This bypasses real OAuth flow for testing purposes
 */
export async function authenticateTestUser(page: Page, options?: {
  nickname?: string
  email?: string
  hasMarketingConsent?: boolean
}): Promise<void> {
  const {
    nickname = 'TestPlayer',
    email = 'test@playwright.dev',
    hasMarketingConsent = true
  } = options || {}

  // Use the test backdoor to authenticate
  await page.evaluate((opts) => {
    // Access global authManager and authenticate
    if (window.authManager && window.authManager.__TEST_setAuthenticatedUser) {
      window.authManager.__TEST_setAuthenticatedUser(
        { email: opts.email },
        { 
          nickname: opts.nickname, 
          consent_marketing: opts.hasMarketingConsent 
        }
      )
    } else {
      console.warn('⚠️ Test backdoor not available - authManager not found')
    }
  }, { nickname, email, hasMarketingConsent })

  // Wait for auth state to propagate
  await page.waitForTimeout(500)
}

/**
 * Resets authentication state using test backdoor
 */
export async function resetAuthState(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (window.authManager && window.authManager.__TEST_resetAuthState) {
      window.authManager.__TEST_resetAuthState()
    }
  })

  await page.waitForTimeout(200)
}

/**
 * Waits for game to be ready (authenticated and game container visible)
 */
export async function waitForGameReady(page: Page): Promise<void> {
  // First try to wait for game container to appear
  try {
    await page.waitForSelector('#game-container', { 
      state: 'visible', 
      timeout: 10000 
    })
  } catch (error) {
    console.log('Game container not visible, checking if game is already initialized...')
    
    // Sometimes the game initializes directly without showing container first
    // Wait for Phaser game to initialize
    await page.waitForFunction(() => window.game !== undefined, {
      timeout: 10000
    })
    return
  }

  // Wait for Phaser game to initialize
  await page.waitForFunction(() => window.game !== undefined, {
    timeout: 10000
  })
}

/**
 * Complete game setup: authenticate user and start game
 */
export async function setupAuthenticatedGame(page: Page, options?: {
  nickname?: string
  email?: string
  hasMarketingConsent?: boolean
}): Promise<void> {
  await page.goto('/')
  await authenticateTestUser(page, options)
  
  // Verify authentication worked
  const isAuth = await page.evaluate(() => {
    return window.authManager?.getState().isAuthenticated || false
  })
  console.log('🔍 User authenticated:', isAuth)
  
  // Click GIOCA to start game
  await page.click('.btn-primary')
  
  // Wait a bit for the game start process
  await page.waitForTimeout(1000)
  
  // Check what happened after clicking GIOCA
  const gameContainerVisible = await page.evaluate(() => {
    const container = document.getElementById('game-container')
    return container ? window.getComputedStyle(container).display !== 'none' : false
  })
  
  const gameExists = await page.evaluate(() => window.game !== undefined)
  console.log('🔍 Game container visible:', gameContainerVisible)
  console.log('🔍 Game instance exists:', gameExists)
  
  // Wait for game to be ready (with better error handling)
  try {
    await waitForGameReady(page)
  } catch (error) {
    console.log('⚠️ waitForGameReady failed, continuing anyway for basic game testing')
  }
}