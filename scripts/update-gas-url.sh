#!/usr/bin/env bash
# ============================================================
# update-gas-url.sh — Propagate GAS Deployment URL Everywhere
# ============================================================
# Single source of truth: .gas-config.json (project root)
#
# Usage:
#   ./scripts/update-gas-url.sh                        # reads from .gas-config.json
#   ./scripts/update-gas-url.sh <NEW_DEPLOYMENT_ID>    # updates config + propagates
#
# What it updates:
#   1. .gas-config.json (if new ID provided)
#   2. Active code files (portal-staff, StaffDashboard, Dashboard.html)
#   3. Bookmarklets.md (all formUrl references)
#   4. MANUS_PROMPT.md (deployment ID references)
#   5. GAS Script Properties (GAS_WEB_APP_URL) via clasp
#   6. README.md (deployment version reference)
# ============================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/.gas-config.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🍀 Shamrock GAS URL Propagation Script${NC}"
echo "========================================"

# ── 1. Determine the deployment ID ─────────────────────────
if [ $# -ge 1 ]; then
    NEW_ID="$1"
    echo -e "${YELLOW}📝 New deployment ID provided: ${NEW_ID:0:20}...${NC}"
else
    if [ ! -f "$CONFIG_FILE" ]; then
        echo -e "${RED}❌ No .gas-config.json found and no ID argument provided.${NC}"
        echo "Usage: $0 <NEW_DEPLOYMENT_ID>"
        exit 1
    fi
    NEW_ID=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['deploymentId'])")
    echo -e "${CYAN}📖 Reading existing deployment ID from .gas-config.json${NC}"
fi

NEW_URL="https://script.google.com/macros/s/${NEW_ID}/exec"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo -e "   Deployment ID: ${GREEN}${NEW_ID:0:30}...${NC}"
echo -e "   Full URL:      ${GREEN}${NEW_URL:0:60}...${NC}"
echo ""

# ── 2. Update .gas-config.json ─────────────────────────────
echo -e "${CYAN}[1/6] Updating .gas-config.json...${NC}"
cat > "$CONFIG_FILE" << EOF
{
  "_comment": "Single source of truth for GAS deployment URL. Run: ./scripts/update-gas-url.sh",
  "deploymentId": "$NEW_ID",
  "gasWebAppUrl": "$NEW_URL",
  "lastUpdated": "$TIMESTAMP"
}
EOF
echo -e "   ${GREEN}✅ Config updated${NC}"

# ── 3. Update active code files ────────────────────────────
echo -e "${CYAN}[2/6] Updating active code files...${NC}"
UPDATED=0

# Files with hardcoded GAS URLs (active code only, not docs/archive)
ACTIVE_FILES=(
    "src/pages/portal-staff.qs9dx.js"
    "src/pages/members/StaffDashboard.js"
    "backend-gas/Dashboard.html"
)

# Also check sibling Telegram app directory
TELEGRAM_DIR="$PROJECT_ROOT/../shamrock-telegram-app"
TELEGRAM_FILES=(
    "shared/brand.js"
    "status/app.js"
    "updates/app.js"
    "defendant/app.js"
    "documents/app.js"
    "payment/app.js"
    "intake/app.js"
)

for FILE in "${ACTIVE_FILES[@]}"; do
    FULL_PATH="$PROJECT_ROOT/$FILE"
    if [ -f "$FULL_PATH" ]; then
        if grep -q 'script.google.com/macros/s/AKfyc' "$FULL_PATH"; then
            sed -i '' -E "s|https://script\.google\.com/macros/s/AKfyc[A-Za-z0-9_-]+/exec|${NEW_URL}|g" "$FULL_PATH"
            UPDATED=$((UPDATED + 1))
            echo -e "   ${GREEN}✅ $(basename "$FILE")${NC}"
        else
            echo -e "   ${YELLOW}⏭  $(basename "$FILE") — no GAS URL found${NC}"
        fi
    else
        echo -e "   ${YELLOW}⚠️  $(basename "$FILE") — file not found${NC}"
    fi
done

if [ -d "$TELEGRAM_DIR" ]; then
    echo -e "${CYAN}   ── Telegram Mini Apps ──${NC}"
    for FILE in "${TELEGRAM_FILES[@]}"; do
        FULL_PATH="$TELEGRAM_DIR/$FILE"
        if [ -f "$FULL_PATH" ]; then
            if grep -q 'script.google.com/macros/s/AKfyc' "$FULL_PATH"; then
                sed -i '' -E "s|https://script\.google\.com/macros/s/AKfyc[A-Za-z0-9_-]+/exec|${NEW_URL}|g" "$FULL_PATH"
                UPDATED=$((UPDATED + 1))
                echo -e "   ${GREEN}✅ $(basename "$FILE")${NC}"
            else
                echo -e "   ${YELLOW}⏭  $(basename "$FILE") — no GAS URL found${NC}"
            fi
        fi
    done
fi

echo -e "   Updated $UPDATED active code file(s)"

# ── 4. Update Bookmarklets.md ──────────────────────────────
echo -e "${CYAN}[3/6] Updating Bookmarklets.md...${NC}"
BOOKMARKLETS="$PROJECT_ROOT/backend-gas/Bookmarklets.md"
if [ -f "$BOOKMARKLETS" ]; then
    MATCHES=$(grep -c 'script.google.com/macros/s/AKfyc' "$BOOKMARKLETS" 2>/dev/null || echo "0")
    sed -i '' -E "s|https://script\.google\.com/macros/s/AKfyc[A-Za-z0-9_-]+/exec|${NEW_URL}|g" "$BOOKMARKLETS"
    echo -e "   ${GREEN}✅ Updated $MATCHES URL reference(s)${NC}"
else
    echo -e "   ${YELLOW}⚠️  Bookmarklets.md not found${NC}"
fi

# ── 5. Update MANUS_PROMPT.md ──────────────────────────────
echo -e "${CYAN}[4/6] Updating MANUS_PROMPT.md...${NC}"
MANUS="$PROJECT_ROOT/MANUS_PROMPT.md"
if [ -f "$MANUS" ]; then
    # Replace deployment IDs (standalone, not in URLs)
    sed -i '' -E "s/AKfyc[A-Za-z0-9_-]{50,}/${NEW_ID}/g" "$MANUS"
    echo -e "   ${GREEN}✅ Updated${NC}"
else
    echo -e "   ${YELLOW}⚠️  MANUS_PROMPT.md not found${NC}"
fi

# ── 6. Update GAS Script Properties ───────────────────────
echo -e "${CYAN}[5/6] Updating GAS Script Properties (GAS_WEB_APP_URL)...${NC}"
GAS_DIR="$PROJECT_ROOT/backend-gas"
if command -v clasp &> /dev/null && [ -f "$GAS_DIR/.clasp.json" ]; then
    # Use clasp run to set the property (requires a helper function in GAS)
    echo -e "   ${YELLOW}⏭  Skipping auto-update (manual step needed)${NC}"
    echo -e "   ${CYAN}   Run in GAS Script Editor → Script Properties:${NC}"
    echo -e "   ${CYAN}   Key:   GAS_WEB_APP_URL${NC}"
    echo -e "   ${CYAN}   Value: $NEW_URL${NC}"
else
    echo -e "   ${YELLOW}⚠️  clasp not found or .clasp.json missing${NC}"
    echo -e "   ${CYAN}   Manually set in GAS → Script Properties:${NC}"
    echo -e "   ${CYAN}   Key:   GAS_WEB_APP_URL${NC}"
    echo -e "   ${CYAN}   Value: $NEW_URL${NC}"
fi

# ── 7. Summary ─────────────────────────────────────────────
echo -e "${CYAN}[6/6] Updating README.md deployment reference...${NC}"
README="$PROJECT_ROOT/README.md"
if [ -f "$README" ]; then
    # Update the deployment ID if present
    sed -i '' -E "s/AKfyc[A-Za-z0-9_-]{50,}/${NEW_ID}/g" "$README"
    echo -e "   ${GREEN}✅ Updated${NC}"
else
    echo -e "   ${YELLOW}⚠️  README.md not found${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🍀 GAS URL propagation complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Deployment ID: ${CYAN}${NEW_ID:0:40}...${NC}"
echo -e "Full URL:      ${CYAN}${NEW_URL:0:70}...${NC}"
echo ""
echo -e "${YELLOW}📋 MANUAL STEPS REMAINING:${NC}"
echo -e "   1. Update GAS Script Properties → GAS_WEB_APP_URL"
echo -e "   2. Verify Wix Secrets Manager → GAS_WEB_APP_URL"
echo -e "   3. Deploy GAS: clasp push -f && clasp deploy -i $NEW_ID -d 'description'"
echo ""
