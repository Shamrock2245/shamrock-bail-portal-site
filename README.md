# Shamrock Bail Bonds Portal (Wix + External API)

This project is the official Shamrock Bail Bonds Portal. It runs on **Wix Velo** (Frontend) and connects to a **Google Apps Script (GAS)** backend for secure workflows (AI Concierge, PDFs, Signatures).

**Current Status:** Phase 4: System Verification (Current Focus). 🟡

---

## 📌 Goals
*   **AI-Powered Concierge:** Intelligent SMS responses via Google Vertex AI using RAG (Retention Augmented Generation) for 12+ Florida counties.
*   **Automated Paperwork:** Digital intake for Indemnitors and Defendants.
*   **Role-Based Portals:** Secure access for Defendants (Check-ins), Indemnitors (Financing), and Staff.
*   **Compliance:** SOC II aligned, SignNow integration for audit trails.

---

## 🛠 Tech Stack
*   **Frontend:** Wix Velo (JS), Members Area, Wix Forms.
*   **Backend:** Google Apps Script (GAS) Web App (Serverless).
*   **AI/LLM:** OpenAI 4o-mini (via GAS `UrlFetchApp`). 
*   **Database:** Wix Collections (`IntakeQueue`, `Cases`) + Google Sheets (Backups).
*   **Signatures:** SignNow API.
*   **Deployment:** `clasp` (GAS) + GitHub Integration (Wix).

---

## 🤖 AI Concierge & RAG System
The system now includes a "Headless" AI Agent that monitors leads and sends intelligent SMS.

*   **Brain:** `backend-gas/RAGService.js` (Vertex AI Integration).
*   **Knowledge Base:** `backend-gas/KnowledgeBase.js` (Protocols for Lee, Collier, Miami-Dade, etc.).
*   **Trigger:** New row in "Hot Leads" sheet -> AI analyzes context -> Generates SMS.
*   **Fallback:** If the API Key is missing, it reverts to rule-based templates.

## 💳 SwipeSimple Integration
The dashboard now includes a direct integration with **SwipeSimple** for payment processing.
*   **Virtual Terminal:** Embedded credentials and direct link mechanism.
*   **Credentials:** Managed securely via UI (non-hardcoded in repo).

---

## 🚀 Workflows

### 1. AI Concierge (New)
1.  **Lead Capture:** User submits form on Wix.
2.  **Scoring:** Lead score calculated based on urgency/county.
3.  **AI Response:** Generates a custom SMS based on the specific County Jail protocol (e.g., "Park at Gun Club Rd," "Signatures must be wet").
4.  **Handoff:** If user accepts, link to `indemnitor-portal` is sent.

### 2. Defendant Portal
1.  Log in via magic link.
2.  Complete Appearance Application.
3.  GPS/Selfie Check-in (verified via browser geolocation).

### 3. Indemnitor Portal
1.  Log in via magic link.
2.  Complete Financial Indemnity.
3.  SignNow Lightbox session (embedded).

---

## 📦 Setup & Configuration

### Wix Side
*   **Secrets Manager:**
    *   `GAS_WEB_APP_URL` (Managed via `backend/secretsManager.jsw`).
    *   `TWILIO_ACCOUNT_SID` / `AUTH_TOKEN`.
    *   `GOOGLE_MAPS_API_KEY`.
    *   *Note: See `PHASE1_SUMMARY.md` for new centralized config details.*

### GAS Side (Backend)
The backend is in `backend-gas/`.
1.  **Deploy:** `clasp push` -> `clasp deploy`.
2.  **Config:** Run `SetProperties.js` functions to set keys.
    *   `SAFE_updateVertexKey()`: Sets `VERTEX_API_KEY` securely.
    *   `forceUpdateConfig()`: Sets basic infrastructure keys.

---

## 📂 Documentation Index
*   **[ANTIGRAVITY-FOUNDATION-SPEC.md](./docs/ANTIGRAVITY-FOUNDATION-SPEC.md):** 📜 The Supreme Authority for the system.
*   **[TESTING_GUIDE.md](./TESTING_GUIDE.md):** Protocols for verification.
*   **[AI_CAPABILITIES.md](./docs/AI_CAPABILITIES.md):** 🦾 Guide to the 5 AI Agents.
*   **[AGENTS.md](./AGENTS.md):** Persona definitions for development.
*   **[SCHEMAS.md](./docs/SCHEMAS.md):** Data models for collections.
*   **[API_SPEC.md](./docs/API_SPEC.md):** Backend interfaces.
*   **[PHASE1_SUMMARY.md](./PHASE1_SUMMARY.md):** 🚀 Summary of Tenant Config & Secret Refactoring.
*   **[More Docs...](./docs/INDEX.md):** Full documentation index.

---

## 👮 code-security-advisor says:
*   PII is encrypted at rest.
*   API Keys are never committed to code (use ScriptProperties).
*   `SetProperties.js` must be kept clean of secrets after running.

---
*Maintained by the Shamrock Dev Team & Antigravity Agents.*