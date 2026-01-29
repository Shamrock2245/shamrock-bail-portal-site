# Automation & Testing Usage Guide 🤖
**Date:** January 29, 2026

This guide explains how and when to use the newly installed Agentic Capabilities.

## 1. System Health Automations

### A. The "Pulse Check" (GAS Integrations)
**When to use:** Before starting work, or if users complain about "System Error".
**How to use:**
1.  Open `src/backend/healthCheck.jsw` in Velo.
2.  Click the "Play" button next to `runHealthCheck`.
3.  **Expected:** `{"status": "healthy", "latency": "OK"}`.

### B. The "Mobile Validator" (UI UX)
**When to use:** Automatically runs on every mobile page load.
**What it does:** Checks if `#boxStickyFooter` is visible and expanded.
**Where to check:**
*   **Velo Logs:** Look for `✅ UI Validator: Sticky Footer is present and visible`.
*   **Actionable:** If you see `❌ UI Validator...`, the footer is broken.

## 2. Document & Secrets Management

### A. Adding New Secrets
**Rule:** Never hardcode keys.
1.  Add key to **Wix Secrets Manager**.
2.  In code: `import { getSecureSecret } from 'backend/secretsManager';`
3.  Call: `await getSecureSecret('YOUR_KEY_NAME');`

### B. Updating PDF Templates
**Rule:** Do not edit code logic for field mapping.
1.  Open `backend-gas/PDF_Mappings.js` (local copy) or script editor.
2.  Add your new field to `PDF_TAG_DEFINITIONS`.
3.  Deploy.

## 3. Deployment & Testing Protocol

### Phase 1: Local Hardening
*   Run `runHealthCheck()`.
*   Scan logs for `UI Validator` success.

### Phase 2: User Experience (Tier 2 Counties)
*   The system now uses **Bounding Box Logic** (`backend/data/florida-county-boundaries.json`).
*   **Test:** Spoof a location (e.g., Glades County centroid) in `geolocation-client` or browser devtools.
*   **Verify:** It should return "Glades" *instantly* without hitting the Google Maps API.

## 4. Troubleshooting Agents
If something breaks, tell the AI:
*   *"Use the `wix_gas_bridge_integrity` skill to fix the connection."*
*   *"Use the `audit_security` skill to find leaked keys."*
