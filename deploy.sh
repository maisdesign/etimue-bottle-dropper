#!/bin/bash

# 🚀 AUTOMATED DEPLOYMENT SCRIPT FOR ETIMUE BOTTLE DROPPER
# This script prevents repo deployment errors by automating the full process

set -e  # Exit on any error

echo "🚀 Starting automated deployment process..."

# Step 1: Build the project
echo "📦 Building project..."
npm run build

# Step 2: Commit to main repository (etimue-bottle-dropper)
echo "💾 Committing to main repository..."
git add .

# Get commit message from user or use default
if [ -z "$1" ]; then
    COMMIT_MSG="✅ BUILD UPDATED: Automated deployment $(date '+%Y-%m-%d %H:%M')"
else
    COMMIT_MSG="✅ BUILD UPDATED: $1"
fi

echo "📝 Commit message: $COMMIT_MSG"

# Add the required footer
FULL_COMMIT_MSG="$COMMIT_MSG

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git commit -m "$FULL_COMMIT_MSG"
git push

# Step 3: Deploy to Netlify via bottledropper2
echo "🌐 Deploying to Netlify via bottledropper2..."

# Check if temp deployment directory exists
if [ ! -d "/d/temp-deployment/bottledropper2" ]; then
    echo "📁 Cloning bottledropper2 repository..."
    mkdir -p /d/temp-deployment
    cd /d/temp-deployment
    git clone https://github.com/maisdesign/bottledropper2.git
fi

cd /d/temp-deployment/bottledropper2

# Pull latest changes
echo "🔄 Pulling latest changes from bottledropper2..."
git pull

# Copy all dist files
echo "📋 Copying dist files to bottledropper2..."
cp -r /d/etimue-bottle-dropper/dist/* .

# Commit and push to bottledropper2
echo "💾 Committing to bottledropper2 (Netlify deployment)..."
git add .
git commit -m "🚀 DEPLOY: $COMMIT_MSG" || echo "No changes to commit"
git push

echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Live site: https://etimuebottledropper.netlify.app/"
echo "📊 Main repo: https://github.com/maisdesign/etimue-bottle-dropper"
echo "🚀 Deploy repo: https://github.com/maisdesign/bottledropper2"