#!/bin/bash

# 🔍 DEPLOYMENT VERIFICATION SCRIPT
# Checks if both repositories are in sync

echo "🔍 Checking deployment status..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Not in etimue-bottle-dropper directory!"
    exit 1
fi

echo "📊 Current repository status:"
echo "📝 Development repo (etimue-bottle-dropper):"
git log -1 --oneline

echo ""
echo "🌐 Production repo (bottledropper2):"
if [ -d "/d/temp-deployment/bottledropper2" ]; then
    cd /d/temp-deployment/bottledropper2
    git log -1 --oneline

    # Check if index.html files match
    echo ""
    echo "📋 Comparing dist/index.html files..."
    MAIN_HASH=$(md5sum /d/etimue-bottle-dropper/dist/index.html | cut -d' ' -f1)
    PROD_HASH=$(md5sum /d/temp-deployment/bottledropper2/index.html | cut -d' ' -f1)

    if [ "$MAIN_HASH" = "$PROD_HASH" ]; then
        echo "✅ FILES IN SYNC: Both repositories have the same index.html"
    else
        echo "❌ FILES OUT OF SYNC: Different index.html files detected!"
        echo "   Main repo hash: $MAIN_HASH"
        echo "   Prod repo hash: $PROD_HASH"
        echo "   📢 You need to run ./deploy.sh to sync!"
    fi
else
    echo "❌ Production repo not found at /d/temp-deployment/bottledropper2"
    echo "   Run ./deploy.sh to set it up"
fi

echo ""
echo "🌐 Live site: https://etimuebottledropper.netlify.app/"