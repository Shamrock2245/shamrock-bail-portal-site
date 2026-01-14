#!/bin/bash
# Wix Page File Verification Script
# Checks for common filename issues that prevent Wix CLI sync

echo "========================================="
echo "   Wix Page File Verification Script"
echo "========================================="
echo ""

cd "$(dirname "$0")/src/pages" || exit 1

echo "📁 Current directory: $(pwd)"
echo ""

# Check for files with trailing spaces
echo "🔍 Checking for files with trailing spaces..."
found_issues=0

for file in *.js; do
  # Check if filename contains space before the dot
  if [[ "$file" =~ \ \. ]]; then
    echo "⚠️  WARNING: '$file' has a trailing space before the extension"
    found_issues=$((found_issues + 1))
  fi
done

if [ $found_issues -eq 0 ]; then
  echo "✅ No trailing space issues found"
fi

echo ""

# List the three problematic pages
echo "📄 Checking specific page files..."
echo ""

pages=("kyk1r" "lrh65" "y8dfc")
page_names=("Locate" "How Bail Works" "How to Become a Bondsman")

for i in "${!pages[@]}"; do
  page_id="${pages[$i]}"
  expected_name="${page_names[$i]}"
  
  echo "Page ID: $page_id (Expected: ${expected_name}.${page_id}.js)"
  
  # Find files with this page ID
  matching_files=$(ls -1 | grep "\.${page_id}\.js$" 2>/dev/null)
  
  if [ -z "$matching_files" ]; then
    echo "  ❌ No file found with page ID: $page_id"
  else
    while IFS= read -r file; do
      echo "  ✅ Found: $file"
      
      # Extract page name from filename
      page_name="${file%.${page_id}.js}"
      
      if [ "$page_name" = "$expected_name" ]; then
        echo "     ✅ Filename matches expected page name"
      else
        echo "     ⚠️  Page name mismatch!"
        echo "        Expected: $expected_name"
        echo "        Got: $page_name"
      fi
    done <<< "$matching_files"
  fi
  echo ""
done

# List all page files for reference
echo "📋 All page files in src/pages/:"
ls -1 *.js 2>/dev/null | head -20

echo ""
echo "========================================="
echo "   Verification Complete"
echo "========================================="
echo ""
echo "💡 Tips:"
echo "  - Ensure page names in local files match EXACTLY with Wix Editor"
echo "  - Check for trailing spaces, extra characters, or capitalization"
echo "  - After renaming, restart 'wix dev' to force sync"
echo ""
