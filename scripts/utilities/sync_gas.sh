#!/bin/bash
# Sync backend-gas to Google Apps Script

echo "🚀 Syncing backend-gas to Google Apps Script..."
cd "$(dirname "$0")/backend-gas"

# Ensure we are in the right directory
echo "📂 Working directory: $(pwd)"

# Push with force to ensure remote matches local authority
clasp push -f

echo "✅ Sync Complete!"
