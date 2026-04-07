#!/bin/bash
# Run this once in a fresh Terminal to set up daily clasp token refresh.
# Usage: bash .agent/clasp_keepalive_setup.sh

set -euo pipefail

HOME_DIR="$HOME"
SCRIPT_PATH="$HOME_DIR/.shamrock_clasp_keepalive.sh"
PLIST_PATH="$HOME_DIR/Library/LaunchAgents/com.shamrock.clasp-keepalive.plist"
GAS_DIR="$HOME_DIR/Desktop/shamrock-active-software/shamrock-bail-portal-site/backend-gas"

echo "🔧 Setting up clasp daily keepalive..."

# ── Step 1: Write the keepalive script ──────────────────────────────────────
cat > "$SCRIPT_PATH" << 'SCRIPT'
#!/bin/bash
LOG="$HOME/Library/Logs/clasp-keepalive.log"
GAS_DIR="$HOME/Desktop/shamrock-active-software/shamrock-bail-portal-site/backend-gas"
CLASP="/opt/homebrew/bin/clasp"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] clasp keepalive starting..." >> "$LOG"
cd "$GAS_DIR" && timeout 30 "$CLASP" whoami >> "$LOG" 2>&1
EXIT=$?
if [ $EXIT -eq 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ token OK" >> "$LOG"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  FAILED (exit $EXIT) — run: clasp login" >> "$LOG"
fi
echo "---" >> "$LOG"
SCRIPT
chmod +x "$SCRIPT_PATH"
echo "✓ Keepalive script written to $SCRIPT_PATH"

# ── Step 2: Write the LaunchAgent plist ─────────────────────────────────────
mkdir -p "$HOME_DIR/Library/LaunchAgents"
cat > "$PLIST_PATH" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.shamrock.clasp-keepalive</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/brendan/.shamrock_clasp_keepalive.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
PLIST
echo "✓ LaunchAgent plist written to $PLIST_PATH"

# ── Step 3: Load the LaunchAgent ─────────────────────────────────────────────
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
echo "✓ LaunchAgent loaded"

# ── Step 4: Grant Keychain access (IMPORTANT) ────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  IMPORTANT: Keychain Access Grant Required"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running 'clasp whoami' now to trigger the macOS Keychain prompt."
echo "When the dialog appears, click [Always Allow] so background jobs work."
echo ""
cd "$GAS_DIR" && clasp whoami

echo ""
echo "✅ Setup complete!"
echo "   • Runs daily at 9:00 AM"
echo "   • Logs: ~/Library/Logs/clasp-keepalive.log"
echo "   • Manual run: bash ~/.shamrock_clasp_keepalive.sh"
echo "   • Check status: launchctl list | grep clasp"
