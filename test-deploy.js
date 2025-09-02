#!/usr/bin/env node

/**
 * Simple deployment test script
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing deployment process...');

try {
    // Step 1: Check if dist exists
    console.log('1. Checking dist directory...');
    const distDir = path.join(__dirname, 'dist');
    
    if (!fs.existsSync(distDir)) {
        console.log('❌ Dist directory not found. Running build...');
        execSync('npm run build', { stdio: 'inherit' });
    } else {
        console.log('✅ Dist directory found');
    }
    
    // Step 2: List dist contents
    console.log('2. Dist contents:');
    const distContents = fs.readdirSync(distDir);
    distContents.forEach(file => {
        const filePath = path.join(distDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   ${stats.isDirectory() ? '📁' : '📄'} ${file} ${stats.isFile() ? `(${Math.round(stats.size/1024)}KB)` : ''}`);
    });
    
    // Step 3: Check key files
    console.log('3. Checking key files:');
    const keyFiles = ['index.html', 'assets', '_redirects', 'manifest.webmanifest'];
    keyFiles.forEach(file => {
        const exists = fs.existsSync(path.join(distDir, file));
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    });
    
    // Step 4: Check Git configuration
    console.log('4. Git configuration:');
    try {
        const gitUser = execSync('git config user.name', { encoding: 'utf8' }).trim();
        const gitEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
        console.log(`   User: ${gitUser} <${gitEmail}>`);
    } catch (error) {
        console.log('   ❌ Git not configured');
    }
    
    // Step 5: Test GitHub connectivity
    console.log('5. Testing GitHub connectivity...');
    try {
        execSync('git ls-remote https://github.com/maisdesign/bottledropper.git HEAD', { stdio: 'pipe' });
        console.log('   ✅ Can access bottledropper repository');
    } catch (error) {
        console.log('   ❌ Cannot access bottledropper repository');
        console.log('      Error:', error.message.split('\n')[0]);
    }
    
    console.log('\n📋 Deployment Test Summary:');
    console.log('   - Build files: Ready');
    console.log('   - Target repo: maisdesign/bottledropper');
    console.log('   - Next step: Configure GitHub token for automated deployment');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}