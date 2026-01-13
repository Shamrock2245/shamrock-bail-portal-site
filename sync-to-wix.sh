#!/bin/bash
# Wix Sync Script
# Purpose: Sync local repository to Wix editor
# Usage: ./sync-to-wix.sh

set -e  # Exit on error

echo "🔄 Shamrock Bail Bonds - Wix Sync Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Ensure we're in the right directory
echo "📂 Checking directory..."
if [ ! -f "wix.config.json" ]; then
    echo -e "${RED}❌ Error: Not in Wix project directory${NC}"
    echo "Please run this script from /home/ubuntu/shamrock-bail-portal-site"
    exit 1
fi
echo -e "${GREEN}✅ In correct directory${NC}"
echo ""

# 2. Check if Wix CLI is installed
echo "🔍 Checking Wix CLI installation..."
if ! command -v wix &> /dev/null; then
    echo -e "${RED}❌ Wix CLI not found${NC}"
    echo "Installing Wix CLI..."
    npm install -g @wix/cli
fi
WIX_VERSION=$(wix --version 2>/dev/null || echo "unknown")
echo -e "${GREEN}✅ Wix CLI installed: $WIX_VERSION${NC}"
echo ""

# 3. Check Wix login status
echo "🔐 Checking Wix login status..."
if ! wix whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Wix${NC}"
    echo "Please login with: wix login"
    echo "Use account: admin@shamrockbailbonds.biz"
    exit 1
fi
WIX_USER=$(wix whoami 2>/dev/null || echo "unknown")
echo -e "${GREEN}✅ Logged in as: $WIX_USER${NC}"
echo ""

# 4. Commit any uncommitted changes to Git
echo "📝 Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes found${NC}"
    echo "Committing changes to Git..."
    git add .
    git commit -m "chore: auto-commit before Wix sync - $(date +%Y-%m-%d_%H:%M:%S)" || echo "No changes to commit"
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi
echo ""

# 5. Pull latest from GitHub
echo "⬇️  Pulling latest from GitHub..."
git pull origin main || echo -e "${YELLOW}⚠️  Could not pull from GitHub (may be up to date)${NC}"
echo ""

# 6. Stop any running Wix dev servers
echo "🛑 Stopping existing Wix dev servers..."
pkill -f "wix dev" 2>/dev/null && echo -e "${GREEN}✅ Stopped existing servers${NC}" || echo "No running servers found"
sleep 2
echo ""

# 7. Force push to Wix
echo "⬆️  Pushing files to Wix..."
echo "This may take a minute..."
if wix push --force; then
    echo -e "${GREEN}✅ Files pushed to Wix successfully${NC}"
else
    echo -e "${RED}❌ Error pushing to Wix${NC}"
    echo "Try running manually: wix push --force"
    exit 1
fi
echo ""

# 8. List files that were synced
echo "📋 Files synced:"
echo "Lightboxes:"
ls -lh src/lightboxes/*.js 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'
echo ""
echo "Pages:"
ls -lh src/pages/*.js 2>/dev/null | head -10 | awk '{print "  - " $9 " (" $5 ")"}'
echo "  ... and more"
echo ""
echo "Backend:"
ls -lh src/backend/*.jsw 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'
echo ""

# 9. Start Wix dev server (optional)
echo "🚀 Starting Wix dev server..."
echo "This will watch for file changes and auto-sync to Wix."
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the dev server${NC}"
echo ""

# Start in background and capture PID
wix dev &
WIX_DEV_PID=$!

echo -e "${GREEN}✅ Wix dev server started (PID: $WIX_DEV_PID)${NC}"
echo ""
echo "========================================"
echo "🎉 Sync Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Open Wix Editor: https://manage.wix.com/dashboard/a00e3857-675a-493b-91d8-a1dbc5e7c499/home"
echo "2. Click 'Code' (</> icon) to verify files"
echo "3. Check lightboxes: SigningLightbox.js should show ~299 lines"
echo "4. Test your changes in Preview mode"
echo "5. Publish when ready"
echo ""
echo "The dev server is running and will auto-sync changes."
echo "To stop it: kill $WIX_DEV_PID"
echo ""

# Wait for dev server (keeps script running)
wait $WIX_DEV_PID
