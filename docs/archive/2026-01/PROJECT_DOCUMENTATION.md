# Shamrock Bail Bonds - Project Documentation

**Version:** 2.0 (Post-Redesign)
**Last Updated:** January 2026

---

## 🏗️ Architecture Overview

This project is a **Wix Velo** site synced to a local Git repository.

### Backend Structure (`src/backend/`)
*   **CORE**:
    *   `portal-auth.jsw`: Authentication logic (Magic Link, Custom Sessions).
    *   `twilio-client.jsw`: Centralized Twilio SMS/OTP service.
    *   `notificationService.jsw`: Handles email/SMS notifications (SignNow, Case Updates).
*   **DATA**:
    *   `counties.jsw`: Validates and retrieves Florida county data.
    *   `county-generator.jsw`: Generates dynamic content for `/bail-bonds/{countySlug}`.
    *   `schema-sync.jsw`: Utilities to verify database schema matches code expectations.
*   **INTEGRATIONS**:
    *   `signNowIntegration.jsw`: Handles document generation and signing flows.
    *   `call-tracking.jsw`: Logs call button clicks for analytics.

### Frontend Structure (`src/pages/`)
*   **Public**:
    *   `Home.js`: Main landing page with County Selector.
    *   `Florida Counties.js`: Dynamic Page template for all 67 counties.
    *   `Locate.js`: Inmate search / Jail lookup page.
*   **Portal (Secure)**:
    *   `portal-landing.js`: Login entry point (Magic Link / Social).
    *   `portal-defendant.js`: Dashboard for active clients.
    *   `portal-indemnitor.js`: Dashboard for cosigners (Payment/Liabilities).

---

## 🚀 Key Workflows

### 1. Safe Wix Sync (Prevent Overwrites)
Wix's CLI is sensitive to file changes. **ALWAYS** use this workflow to sync:

1.  **Check Status**: `git status` (Ensure clean state)
2.  **Pull Remote**: `git pull --rebase origin main`
3.  **Run Fix Script**: `./fix_wix_sync.sh` (Fixes file naming/quoting issues)
4.  **Push**: `git push origin main`

### 2. Standard Development Cycle
1.  **Edit Code** locally in VS Code.
2.  **Dev Mode**: Run `npm run dev` to see changes in the "Local Editor" (Preview).
3.  **Publish**: Run `wix publish` to push local code to the live site.

---

## 🧩 Feature Status

### ✅ Authentication
*   **Magic Link**: Fully implemented (`portal-auth.jsw`). Prioritizes token over session.
*   **Role-Based Access**: Defendant, Indemnitor, and Staff roles defined.

### ✅ Dynamic Content
*   **County Pages**: Powered by `Florida Counties` collection.
*   **SEO**: Dynamic meta tags and Schema.org (LocalBusiness) injection.
*   **Twilio SMS**: Integration active for notifications.

### 🚧 In Progress / Known Issues
*   **Locate Page**: Repeater data population needs verification.
*   **Browser Caching**: Dynamic pages may require Incognito mode to test latest publishes immediately.

---

## 📂 Directory Map
*   `src/`: All Velo code.
*   `content/`: Markdown content for static pages.
*   `docs/`: Detailed reference documentation.
    *   `archive/`: Old/Superseded implementation plans.
*   `wix.config.json`: Project configuration (Do not edit manually unless bumping version).

---

## 🆘 Troubleshooting

**"Page Code Not Loading"**
*   Check `wix.config.json` UI Version.
*   Run `./fix_wix_sync.sh` to ensure file names match Wix's internal ID structure.

**"Secret Not Found"**
*   Check Wix Secrets Manager (Dashboard > Developer Tools > Secrets).
*   Ensure keys like `TWILIO_ACCOUNT_SID` and `TWILIO_FROM_NUMBER` are set.
