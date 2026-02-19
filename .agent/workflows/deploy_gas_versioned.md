---
description: Deploy backend-gas to Google Apps Script WITH A VERSION DESCRIPTION!
---

This workflow ensures you maintain a proper version history for your GAS backend. 
It pushes the latest code and updates the specific Deployment ID used by the Wix frontend.

1. Navigate to the authoritative backend directory
// turbo
cd /Users/brendan/Desktop/shamrock-bail-portal-site/backend-gas

2. Push changes using Clasp (force to overwrite remote if necessary)
clasp push -f

3. IMPORTANT: Update the Web App deployment with a new version and your provided description!
// You must replace "YOUR DESCRIPTION HERE" with a descriptive string like "V290 - Fixed PDF mapping"
clasp deploy -i AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z -d "YOUR DESCRIPTION HERE"
