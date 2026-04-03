#!/bin/bash
echo "=== Checking for merge conflict markers ==="
echo ""

# Check for conflict markers
CONFLICTS=$(find src backend-gas -type f \( -name "*.js" -o -name "*.jsw" \) -exec grep -l "^<<<<<<< \|^=======$\|^>>>>>>> " {} \; 2>/dev/null)

if [ -z "$CONFLICTS" ]; then
    echo "✅ NO MERGE CONFLICTS FOUND"
    echo ""
    echo "Latest commits:"
    git log --oneline -5
    echo ""
    echo "Current branch status:"
    git status
    echo ""
    echo "✅ Repository is clean and ready for Wix sync"
else
    echo "❌ MERGE CONFLICTS FOUND IN:"
    echo "$CONFLICTS"
    exit 1
fi
