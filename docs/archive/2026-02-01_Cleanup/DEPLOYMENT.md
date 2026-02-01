# Deployment Guide - Shamrock Bail Suite

Instructions for deploying and updating the various components of the Shamrock ecosystem.

## 1. Scraper Deployment (GitHub Actions)
The scrapers are hosted in the `swfl-arrest-scrapers` repository and deployed via GitHub Actions.
- **Trigger:** Automated on a cron schedule or manually via the "Actions" tab.
- **Runner:** Ubuntu-latest with Node.js 18.
- **Secrets:** Ensure `SHEETS_SERVICE_ACCOUNT_KEY` is configured in GitHub Secrets.

## 2. Backend Deployment (Google Apps Script)
- **Tooling:** Use `clasp` for local development or copy-paste into the GAS Editor.
- **Version Control:** Ensure the `docs/defendant-locations-gas.gs` matches the production script.
- **Publishing:** Deploy as a **Web App** with access set to "Anyone" (secured via site-specific API keys).

## 3. Frontend Deployment (Wix Velo)
- **Local Dev:** Use the Wix CLI (`wix dev`, `wix pull`, `wix push`).
- **Publishing:** Changes must be published from the Wix Editor after pushing from the local repo.
- **Build Cleanliness:** Always run a lint check (`npm run lint`) before pushing to avoid site-breaking errors.

## 4. Database Migrations
- **CMS Collections:** When adding fields to Wix Collections, always update the corresponding schema in `docs/SCHEMAS.md`.
- **Sheets:** To add a new county, duplicate the `TEMPLATE` tab in the Master Sheet and rename it exactly (e.g., `PalmBeach`).

## 5. Deployment Checklist
- [ ] Verify environment secrets are set.
- [ ] Run local tests (`npm test`).
- [ ] Verify the 34-column schema output.
- [ ] Confirm Webhook URLs are updated (SignNow/Slack).
- [ ] Publish to Production.

> [!IMPORTANT]
> Always perform a "Silent Test" (scraping to a test sheet) before pointing a new scraper at the Master Sheet.
