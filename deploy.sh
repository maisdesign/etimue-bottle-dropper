#!/bin/bash

# Deploy script for Etimuè Bottle Dropper
# Copies dist/ files to bottledropper2 repository and pushes to Netlify

echo "🚀 Starting deployment..."

# Check if we have a deployment directory
if [ ! -d "../bottledropper2" ]; then
    echo "📁 Cloning bottledropper2 repository..."
    cd ..
    git clone https://github.com/maisdesign/bottledropper2.git
    cd etimue-bottle-dropper
fi

echo "🧹 Cleaning deployment directory..."
rm -rf ../bottledropper2/*

echo "📋 Copying dist files..."
cp -r dist/* ../bottledropper2/

echo "📝 Adding deployment commit..."
cd ../bottledropper2
git add .
git commit -m "📱 DEPLOY: Fullscreen button for mobile (manual toggle)"

echo "🚀 Pushing to Netlify..."
git push origin main

echo "✅ Deployment completed!"
echo "🌐 Site should be live at: https://etimuebottledropper.netlify.app/"

cd ../etimue-bottle-dropper
