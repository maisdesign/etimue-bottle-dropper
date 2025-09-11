import { test, expect } from '@playwright/test';

test.describe('Detailed Gameplay Tests', () => {

  test('Bottles actually spawn during gameplay', async ({ page }) => {
    await page.goto('/');
    
    // Mock authenticated state
    await page.evaluate(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { 
          id: 'test-user-id', 
          email: 'test@example.com'
        }
      }));
      
      window.localStorage.setItem('user-profile', JSON.stringify({
        id: 'test-user-id',
        username: 'TestPlayer',
        consent_marketing: true
      }));
    });
    
    await page.reload();
    
    // Start game
    await page.click('.btn-primary');
    
    // Wait for game to load
    await page.waitForTimeout(3000);
    
    // Listen to console logs for bottle spawn
    const bottleSpawnLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('🍶 spawnBottle called') || 
          msg.text().includes('🍶 Creating bottle') ||
          msg.text().includes('🍶 Bottle configured')) {
        bottleSpawnLogs.push(msg.text());
      }
    });
    
    // Wait for bottles to spawn (should happen every 1-1.2 seconds)
    await page.waitForTimeout(5000);
    
    console.log('Bottle spawn logs:', bottleSpawnLogs);
    
    // Should have bottle spawn logs
    expect(bottleSpawnLogs.length).toBeGreaterThan(0);
    
    // Should have "Creating bottle" logs (not just "skipping spawn")
    const creatingBottleLogs = bottleSpawnLogs.filter(log => 
      log.includes('🍶 Creating bottle')
    );
    expect(creatingBottleLogs.length).toBeGreaterThan(0);
  });

  test('Game state shows activeBottles count correctly', async ({ page }) => {
    await page.goto('/');
    
    // Mock authenticated state
    await page.evaluate(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
      window.localStorage.setItem('user-profile', JSON.stringify({
        id: 'test-user-id', username: 'TestPlayer', consent_marketing: true
      }));
    });
    
    await page.reload();
    
    // Start game  
    await page.click('.btn-primary');
    await page.waitForTimeout(3000);
    
    // Check console for active bottles count
    const activeBottleInfo = [];
    page.on('console', msg => {
      if (msg.text().includes('activeBottles')) {
        activeBottleInfo.push(msg.text());
      }
    });
    
    await page.waitForTimeout(3000);
    
    console.log('Active bottle info:', activeBottleInfo);
    
    // Should show activeBottles: 0 at start, then increasing numbers
    expect(activeBottleInfo.length).toBeGreaterThan(0);
    
    // Should NOT show bottleCount: 15 preventing spawn
    const blockingLogs = activeBottleInfo.filter(log => 
      log.includes('shouldReturn: true') && log.includes('activeBottles')
    );
    
    // Initially there should be some non-blocking logs
    const nonBlockingLogs = activeBottleInfo.filter(log => 
      log.includes('shouldReturn: false')
    );
    expect(nonBlockingLogs.length).toBeGreaterThan(0);
  });

});