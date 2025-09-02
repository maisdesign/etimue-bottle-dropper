#!/usr/bin/env node

/**
 * Manual deployment script for testing
 * Usage: node scripts/deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEPLOYMENT_REPO = 'git@github.com:maisdesign/etimue-bottle-dropper-deploy.git';
const DIST_DIR = path.join(__dirname, '..', 'dist');
const TEMP_DIR = path.join(__dirname, '..', 'temp-deploy');

async function deploy() {
    console.log('🚀 Starting deployment process...');
    
    try {
        // Step 1: Build the project
        console.log('📦 Building project...');
        execSync('npm run build', { stdio: 'inherit' });
        
        // Step 2: Verify dist directory exists
        if (!fs.existsSync(DIST_DIR)) {
            throw new Error('❌ Dist directory not found! Build may have failed.');
        }
        
        console.log('✅ Build completed successfully');
        
        // Step 3: Clone or update deployment repository
        console.log('📥 Preparing deployment repository...');
        
        if (fs.existsSync(TEMP_DIR)) {
            console.log('🧹 Cleaning existing temp directory...');
            execSync(`rm -rf "${TEMP_DIR}"`, { stdio: 'inherit' });
        }
        
        execSync(`git clone "${DEPLOYMENT_REPO}" "${TEMP_DIR}"`, { stdio: 'inherit' });
        
        // Step 4: Copy dist files to deployment repo
        console.log('📋 Copying built files...');
        
        // Clear existing files (except .git)
        const tempContents = fs.readdirSync(TEMP_DIR);
        tempContents.forEach(item => {
            if (item !== '.git') {
                execSync(`rm -rf "${path.join(TEMP_DIR, item)}"`, { stdio: 'inherit' });
            }
        });
        
        // Copy dist contents
        execSync(`cp -r "${DIST_DIR}"/* "${TEMP_DIR}"/`, { stdio: 'inherit' });
        
        // Step 5: Commit and push
        console.log('📤 Committing and pushing changes...');
        
        process.chdir(TEMP_DIR);
        
        execSync('git add .', { stdio: 'inherit' });
        
        // Check if there are changes to commit
        try {
            execSync('git diff --staged --quiet');
            console.log('ℹ️  No changes detected, skipping deployment');
            return;
        } catch (error) {
            // There are changes, continue with commit
        }
        
        const commitMessage = `🚀 Deploy: ${new Date().toISOString()}\n\nDeployed from main repository`;
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        execSync('git push origin main', { stdio: 'inherit' });
        
        console.log('✅ Deployment completed successfully!');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    } finally {
        // Cleanup
        if (fs.existsSync(TEMP_DIR)) {
            console.log('🧹 Cleaning up temp directory...');
            execSync(`rm -rf "${TEMP_DIR}"`, { stdio: 'inherit' });
        }
        
        // Return to original directory
        process.chdir(path.join(__dirname, '..'));
    }
}

// Run if called directly
if (require.main === module) {
    deploy().catch(console.error);
}

module.exports = { deploy };