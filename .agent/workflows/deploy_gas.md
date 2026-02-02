---
description: Deploy a new version of the Google Apps Script backend and report the new URL.
---

This workflow automates the deployment of the GAS backend. It increments the version number in `Code.js`, pushes the code to Google via `clasp`, creates a new deployment version, and **automatically updates valid GAS URL references** throughout the project.

1. Navigate to the backend-gas directory
// turbo
2. cd backend-gas

3. Auto-increment the version number in Code.js (e.g., 7.1 -> 7.2)
4. node -e "const fs = require('fs'); let c = fs.readFileSync('Code.js', 'utf8'); c = c.replace(/Version: (\d+\.\d+)/, (m, v) => 'Version: ' + (parseFloat(v) + 0.1).toFixed(1)); fs.writeFileSync('Code.js', c); console.log('Version bumped!');"

5. Push the code to Google Apps Script
// turbo
6. clasp push -f

7. Create a new immutable version deployment and capture the URL
8. clasp deploy --description "Automated Deployment via Agent" > deployment_output.txt

9. Read the new URL
10. export NEW_GAS_URL=$(grep -o 'https://script.google.com/macros/s/[a-zA-Z0-9_-]*/exec' deployment_output.txt | head -n 1)

11. Update local references to the new URL
12. echo "Updating project files with new URL: $NEW_GAS_URL"

// turbo
13. cd ..

// Update Utils (Backend)
14. sed -i '' "s|const FALLBACK_GAS_URL = '.*';|const FALLBACK_GAS_URL = '$NEW_GAS_URL';|" src/backend/utils.jsw

// Update GAS Integration (Backend)
15. sed -i '' "s|GAS Web App URL: https://script.google.com/.*|GAS Web App URL: $NEW_GAS_URL|" src/backend/gasIntegration.jsw

// Update Test Files
16. sed -i '' "s|const GAS_URL = '.*';|const GAS_URL = '$NEW_GAS_URL';|" test_signnow.mjs
17. sed -i '' "s|const GAS_URL = '.*';|const GAS_URL = '$NEW_GAS_URL';|" test_gas_email.mjs

// Update Bookmarklets (Documentation)
18. sed -i '' "s|https://script.google.com/macros/s/[a-zA-Z0-9_-]*/exec|$NEW_GAS_URL|g" backend-gas/Bookmarklets.md

// Update Dashboard.html Fallback (GAS)
19. sed -i '' "s|https://script.google.com/macros/s/[a-zA-Z0-9_-]*/exec|$NEW_GAS_URL|" backend-gas/Dashboard.html

// Update Router (GAS)
20. sed -i '' "s|dashboardBaseUrl = 'https://script.google.com/macros/s/[a-zA-Z0-9_-]*/exec'|dashboardBaseUrl = '$NEW_GAS_URL'|" backend-gas/QualifiedTabRouter.js

21. Clean up and Push Update to Repo
// turbo
22. rm backend-gas/deployment_output.txt
23. git add .
24. git commit -m "chore: deploy GAS version and update URLs"
25. git push origin main

26. echo "✅ Deployment Complete & synced!"
27. echo "👇 COPY THIS URL TO WIX SECRETS MANAGER (GAS_WEB_APP_URL) 👇"
28. echo $NEW_GAS_URL
