#!/bin/bash
set -e

# 1. Fix 'Locate An Inmate' filename (remove space)
if [ -f "src/pages/Locate .kyk1r.js" ]; then
    echo "Files found. Renaming 'Locate .kyk1r.js' to 'Locate.kyk1r.js'..."
    mv "src/pages/Locate .kyk1r.js" "src/pages/Locate.kyk1r.js"
else
    echo "Note: 'src/pages/Locate .kyk1r.js' not found. Checking if already correct..."
    if [ -f "src/pages/Locate.kyk1r.js" ]; then
        echo "Success: 'src/pages/Locate.kyk1r.js' already exists."
    else
        echo "Warning: Could not find Locate page file with ID 'kyk1r' in expected variations."
    fi
fi

# 2. Touch files to force 'wix dev' to detect changes and sync
echo "Touching files to trigger Wix CLI sync..."

# How Bail Works
if [ -f "src/pages/How Bail Works.lrh65.js" ]; then
    touch "src/pages/How Bail Works.lrh65.js"
    echo "Touched 'How Bail Works.lrh65.js'"
fi

# How to Become a Bondsman
if [ -f "src/pages/How to Become a Bondsman.y8dfc.js" ]; then
    touch "src/pages/How to Become a Bondsman.y8dfc.js"
    echo "Touched 'How to Become a Bondsman.y8dfc.js'"
fi

# Locate
if [ -f "src/pages/Locate.kyk1r.js" ]; then
    touch "src/pages/Locate.kyk1r.js"
    echo "Touched 'Locate.kyk1r.js'"
fi

echo "Sync trigger complete. Watch your 'npm run dev' terminal for update messages."
