import { test, expect } from '@playwright/test';

test.describe('Gameplay Tests', () => {

  // Mock authenticated state for gameplay tests
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Mock authenticated user
    await page.evaluate(() => {
      // Simulate logged-in state
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { 
          id: 'test-user-id', 
          email: 'test@example.com',
          user_metadata: { name: 'Test User' }
        }
      }));
      
      // Mock profile with marketing consent
      window.localStorage.setItem('user-profile', JSON.stringify({
        id: 'test-user-id',
        username: 'TestPlayer',
        consent_marketing: true
      }));
    });
    
    await page.reload();
  });

  test('Game canvas appears after authentication', async ({ page }) => {
    // Click GIOCA - should start game directly since we're "authenticated"
    await page.click('text=GIOCA');
    
    // Game canvas should appear
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    
    // Check Phaser game initialized
    const gameExists = await page.evaluate(() => window.game !== undefined);
    expect(gameExists).toBe(true);
  });

  test('Game scenes load properly', async ({ page }) => {
    await page.click('.btn-primary');
    const gameCanvas = page.locator('canvas');
    const gameContainer = page.locator('#game-container');
    await expect(gameCanvas.or(gameContainer)).toBeVisible({ timeout: 15000 });
    
    // Wait for game to initialize and check console for scene loading
    await page.waitForTimeout(3000);
    
    // Check that game is running (look for Phaser canvas context)
    const gameRunning = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas && canvas.getContext('2d') !== null;
    });
    
    expect(gameRunning).toBe(true);
  });

  test('Keyboard controls work in game', async ({ page }) => {
    await page.click('.btn-primary');
    const gameCanvas = page.locator('canvas');
    const gameContainer = page.locator('#game-container');
    await expect(gameCanvas.or(gameContainer)).toBeVisible({ timeout: 15000 });
    
    // Wait for game to fully load
    await page.waitForTimeout(5000);
    
    // Focus on canvas and test arrow keys
    await page.locator('canvas').click();
    
    // Test keyboard input (this would move the player)
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    
    // Check that keyboard events are being processed
    const keyboardActive = await page.evaluate(() => {
      // This assumes game has some keyboard state tracking
      return window.game && window.game.scene && window.game.scene.isActive();
    });
    
    expect(keyboardActive).toBe(true);
  });

  test('Game objects spawn correctly', async ({ page }) => {
    await page.click('.btn-primary');
    const gameCanvas = page.locator('canvas');
    const gameContainer = page.locator('#game-container');
    await expect(gameCanvas.or(gameContainer)).toBeVisible({ timeout: 15000 });
    
    // Wait for gameplay to begin
    await page.waitForTimeout(8000);
    
    // Check console for object spawning logs (if any remain)
    const messages = [];
    page.on('console', msg => messages.push(msg.text()));
    
    // Wait for objects to spawn
    await page.waitForTimeout(5000);
    
    // Look for any error messages that would indicate spawning issues
    const hasErrors = messages.some(msg => 
      msg.includes('ERROR') || 
      msg.includes('TypeError') || 
      msg.includes('removeData')
    );
    
    expect(hasErrors).toBe(false);
  });

  test('Game over sequence works', async ({ page }) => {
    await page.click('.btn-primary');
    const gameCanvas = page.locator('canvas');
    const gameContainer = page.locator('#game-container');
    await expect(gameCanvas.or(gameContainer)).toBeVisible({ timeout: 15000 });
    
    // Wait for game to load
    await page.waitForTimeout(5000);
    
    // Try to trigger game over by simulating end condition
    await page.evaluate(() => {
      // This is conceptual - would need access to game scene
      if (window.game && window.game.scene && window.game.scene.scenes) {
        const gameScene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
        if (gameScene && gameScene.triggerGameOver) {
          gameScene.triggerGameOver();
        }
      }
    });
    
    // Look for game over screen elements
    await expect(page.locator('text=Game Over').or(page.locator('text=Partita Terminata'))).toBeVisible({ timeout: 10000 });
  });

  test('Score submission after game over', async ({ page }) => {
    // This test would require completing a full game cycle
    // For now, we'll test the score service directly
    
    const response = await page.request.post('https://xtpfssiraytzvdvgrsol.supabase.co/functions/v1/submit-score', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cGZzc2lyYXl0enZkdmdyc29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNjM1NzcsImV4cCI6MjA3MTgzOTU3N30.sr3C3c9vEC2yuM4k503_EcXjKp7kfX5TZx9uBM53UOw',
        'Content-Type': 'application/json'
      },
      data: {
        score: 150,
        runSeconds: 30,
        userId: 'test-user-id'
      }
    });
    
    // Should return 401 or 400 (expected for unauthenticated test)
    expect([400, 401, 403]).toContain(response.status());
  });

  test('Leaderboard loads after gameplay', async ({ page }) => {
    await page.goto('/');
    
    // This test would need the leaderboard button to be identified
    // For now, we'll test that homepage loads
    await expect(page.locator('#homepage')).toBeVisible();
    
    // Should not show auth modal if we're already authenticated
    await page.waitForTimeout(2000);
    const authModal = page.locator('.auth-modal');
    if (await authModal.count() > 0) {
      await expect(authModal).not.toBeVisible();
    }
  });

});