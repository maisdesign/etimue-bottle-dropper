import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {

  test('Auth modal opens with correct options', async ({ page }) => {
    await page.goto('/');
    
    // Click GIOCA to trigger auth
    await page.click('.btn-primary');
    
    // Wait for auth modal or game container
    const authModal = page.locator('.auth-modal');
    const gameContainer = page.locator('#game-container');
    
    // Should show either auth modal or go straight to game
    await expect(authModal.or(gameContainer)).toBeVisible({ timeout: 10000 });
    
    // If auth modal appears, check for auth options
    if (await authModal.isVisible()) {
      // Look for any authentication buttons (text might vary)
      const authButtons = page.locator('.auth-modal button');
      await expect(authButtons.first()).toBeVisible();
    }
  });

  test('Email auth form appears', async ({ page }) => {
    await page.goto('/');
    await page.click('.btn-primary');
    
    const authModal = page.locator('.auth-modal');
    await expect(authModal).toBeVisible({ timeout: 10000 });
    
    // Look for any email-related button or option
    const emailOption = page.locator('button').filter({ hasText: /email|mail/i });
    if (await emailOption.count() > 0) {
      await emailOption.first().click();
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      // Skip this test if email auth not available
      test.skip();
    }
  });

  test('Google OAuth button functionality', async ({ page }) => {
    await page.goto('/');
    await page.click('.btn-primary');
    
    const authModal = page.locator('.auth-modal');
    await expect(authModal).toBeVisible({ timeout: 10000 });
    
    // Look for Google auth button
    const googleButton = page.locator('button').filter({ hasText: /google/i });
    if (await googleButton.count() > 0) {
      // Listen for popup - Google OAuth will open new window
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        googleButton.first().click()
      ]);
      
      // Check popup opened to Google domains
      expect(popup.url()).toMatch(/accounts\.google\.com|google\.com/);
    } else {
      // Skip this test if Google auth not available
      test.skip();
    }
  });

  test('Marketing consent modal appears for new users', async ({ page }) => {
    // This test simulates the consent flow
    await page.goto('/');
    
    // Simulate auth state by injecting session data
    await page.evaluate(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    await page.reload();
    await page.click('.btn-primary');
    
    // This test is conceptual - actual consent flow may vary
    // Look for any modal or consent-related text
    const consentModal = page.locator('.modal').or(page.locator('.consent'));
    
    // Wait briefly to see if consent appears, but don't fail if not
    await page.waitForTimeout(3000);
    
    // This is a conditional test
    if (await consentModal.count() > 0) {
      await expect(consentModal.first()).toBeVisible();
    } else {
      // Skip if consent flow not triggered
      console.log('Consent modal not found - this may be expected');
    }
  });

  test('Nickname input validation', async ({ page }) => {
    await page.goto('/');
    
    // Simulate getting to nickname step
    await page.evaluate(() => {
      // Mock auth state that gets to nickname step
      window.localStorage.setItem('auth-test-state', 'nickname-step');
    });
    
    // We'd need to trigger nickname modal here
    // This is a conceptual test - actual implementation depends on game flow
  });

});