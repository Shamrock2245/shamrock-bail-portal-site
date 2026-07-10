#!/usr/bin/env bash
# ============================================================
# update-gas-url.sh — Propagate GAS Deployment URL Everywhere
# ============================================================
# Single source of truth: .gas-config.json (project root)
#
# ECOSYSTEM LAW (see shamrock-leads/docs/policies/gas-url-policy.md):
#   Prefer keeping the Web App URL stable and only re-deploying the
#   existing deployment (clasp deploy -i <EXISTING_ID>).
#   Changing the URL requires human approval + Wix Secrets Manager.
#
# Usage:
#   ./scripts/update-gas-url.sh
#       Re-propagate the EXISTING ID from .gas-config.json (no URL change).
#   ./scripts/update-gas-url.sh <NEW_DEPLOYMENT_ID> --i-know-this-changes-wix
#       Exception path: mint/propagate a new URL. Agents must have already
#       notified the human; Wix Secrets Manager must be updated outside git.
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

NEW_ID=""
FORCE_URL_CHANGE=0
for arg in "$@"; do
    case "$arg" in
        --i-know-this-changes-wix) FORCE_URL_CHANGE=1 ;;
        -h|--help)
            echo "Usage:"
            echo "  $0                                      # re-propagate existing URL from .gas-config.json"
            echo "  $0 <NEW_DEPLOYMENT_ID> --i-know-this-changes-wix"
            echo ""
            echo "URL changes require human notice for Wix Secrets Manager."
            exit 0
            ;;
        *)
            if [ -z "$NEW_ID" ]; then
                NEW_ID="$arg"
            else
                echo -e "${RED}❌ Unknown argument: $arg${NC}"
                exit 1
            fi
            ;;
    esac
done

# ── 1. Determine the deployment ID ─────────────────────────
if [ -n "$NEW_ID" ]; then
    OLD_ID=""
    if [ -f "$CONFIG_FILE" ]; then
        OLD_ID=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['deploymentId'])" 2>/dev/null || true)
    fi
    if [ -n "$OLD_ID" ] && [ "$OLD_ID" != "$NEW_ID" ] && [ "$FORCE_URL_CHANGE" -ne 1 ]; then
        echo -e "${RED}❌ Refusing to change GAS deployment URL.${NC}"
        echo ""
        echo "  Existing ID: ${OLD_ID:0:40}..."
        echo "  Proposed ID: ${NEW_ID:0:40}..."
        echo ""
        echo "Ecosystem policy: keep the Web App URL stable; re-deploy the existing ID only."
        echo "If a URL change is truly required:"
        echo "  1. Notify the human (they must update Wix Secrets Manager)"
        echo "  2. Re-run with: $0 $NEW_ID --i-know-this-changes-wix"
        echo ""
        echo "Policy: shamrock-leads/docs/policies/gas-url-policy.md"
        exit 2
    fi
    if [ -n "$OLD_ID" ] && [ "$OLD_ID" != "$NEW_ID" ]; then
        echo -e "${YELLOW}⚠️  URL CHANGE ACKNOWLEDGED (--i-know-this-changes-wix)${NC}"
        echo -e "${YELLOW}   Human MUST update Wix Secrets Manager before cutover.${NC}"
        echo -e "   Old: ${OLD_ID:0:40}..."
        echo -e "   New: ${NEW_ID:0:40}..."
    else
        echo -e "${YELLOW}📝 Deployment ID provided: ${NEW_ID:0:20}...${NC}"
    fi
else
    if [ ! -f "$CONFIG_FILE" ]; then
        echo -e "${RED}❌ No .gas-config.json found and no ID argument provided.${NC}"
        echo "Usage: $0 [<NEW_DEPLOYMENT_ID> --i-know-this-changes-wix]"
        exit 1
    fi
    NEW_ID=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['deploymentId'])")
    echo -e "${CYAN}📖 Re-propagating EXISTING deployment ID from .gas-config.json (URL stable)${NC}"
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
echo -e "   1. Prefer same URL forever: clasp push -f && clasp deploy -i $NEW_ID -d 'description'"
echo -e "   2. If this was a NEW URL: human updates Wix Secrets Manager → GAS_WEB_APP_URL / GAS_WEBHOOK_URL"
echo -e "   3. If URL changed: also Netlify GAS_WEBHOOK_URL, VPS GAS_WEB_APP_URL, Node-RED env"
echo -e "   4. GAS Script Properties → GAS_WEB_APP_URL (if used)"
echo -e "   Policy: shamrock-leads/docs/policies/gas-url-policy.md"
echo ""
