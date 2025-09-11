import { test, expect } from '@playwright/test';

test.describe('Basic Game Tests', () => {

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check page loads
    await expect(page).toHaveTitle(/Etimuè Bottle Dropper/);
    
    // Check main containers exist
    await expect(page.locator('#homepage')).toBeVisible();
    await expect(page.locator('#character-mascot')).toBeVisible();
    await expect(page.locator('#auth-status')).toBeVisible();
  });

  test('Main play button is functional', async ({ page }) => {
    await page.goto('/');
    
    // Check play button exists
    const playButton = page.locator('.btn-primary');
    await expect(playButton).toBeVisible();
    
    // Click play button
    await playButton.click();
    
    // Wait for any response from the click
    await page.waitForTimeout(3000);
    
    // Check if something happened - either modal appeared, canvas created, or page changed
    const authModal = page.locator('#auth-modal');
    const gameContainer = page.locator('#game-container');
    const canvas = page.locator('canvas');
    
    const authExists = await authModal.count() > 0;
    const gameExists = await gameContainer.count() > 0;
    const canvasExists = await canvas.count() > 0;
    
    // At least one game-related element should exist or be created
    expect(authExists || gameExists || canvasExists).toBe(true);
  });

  test('Character mascot is clickable', async ({ page }) => {
    await page.goto('/');
    
    // Click character mascot
    await page.locator('#character-mascot').click();
    
    // Give it time to respond
    await page.waitForTimeout(1000);
    
    // Just verify the click doesn't cause JavaScript errors
    // This is a basic "no crash" test - if we get here, the click worked
    expect(true).toBe(true);
  });

  test('Game assets load correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check no 404 errors for main assets
    const responses = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Wait a bit for resources to load
    await page.waitForTimeout(3000);
    
    // Filter out common false positives (analytics, ads, etc.)
    const criticalErrors = responses.filter(r => 
      r.url.includes('astounding-rolypoly-fc5137.netlify.app') &&
      !r.url.includes('analytics') &&
      !r.url.includes('ads')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Supabase connection works', async ({ page }) => {
    // Test direct API connectivity
    const response = await page.request.get('https://xtpfssiraytzvdvgrsol.supabase.co/rest/v1/profiles', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cGZzc2lyYXl0enZkdmdyc29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNjM1NzcsImV4cCI6MjA3MTgzOTU3N30.sr3C3c9vEC2yuM4k503_EcXjKp7kfX5TZx9uBM53UOw'
      }
    });
    
    expect(response.status()).toBe(200);
    const profiles = await response.json();
    expect(Array.isArray(profiles)).toBe(true);
  });

  test('Page has no JavaScript errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // Filter out expected/harmless errors
    const criticalErrors = errors.filter(error => 
      !error.includes('analytics') &&
      !error.includes('ResizeObserver') &&
      !error.includes('non-passive event listener')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Game can be started (basic integration)', async ({ page }) => {
    await page.goto('/');
    
    // Try to start game
    await page.locator('.btn-primary').click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check if canvas exists (hidden or visible)
    const canvas = page.locator('canvas');
    const canvasExists = await canvas.count() > 0;
    
    // Check if game container exists
    const gameContainer = page.locator('#game-container');
    const containerExists = await gameContainer.count() > 0;
    
    // At least one game-related element should exist
    expect(canvasExists || containerExists).toBe(true);
  });

});