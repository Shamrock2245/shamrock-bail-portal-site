# Shamrock Bail Bonds Portal (Wix + External API)

This project is the official Shamrock Bail Bonds Portal. It runs on **Wix Velo** (Frontend) and connects to a **Google Apps Script (GAS)** backend for secure workflows (AI Concierge, PDFs, Signatures).

**Current Status:** Phase 3 Complete (AI Concierge Live). 🟢

---

## 📌 Goals
*   **AI-Powered Concierge:** Intelligent SMS responses via Gemini 1.5 Flash using RAG (Retention Augmented Generation) for 12+ Florida counties.
*   **Automated Paperwork:** Digital intake for Indemnitors and Defendants.
*   **Role-Based Portals:** Secure access for Defendants (Check-ins), Indemnitors (Financing), and Staff.
*   **Compliance:** SOC II aligned, SignNow integration for audit trails.

---

## 🛠 Tech Stack
*   **Frontend:** Wix Velo (JS), Members Area, Wix Forms.
*   **Backend:** Google Apps Script (GAS) Web App (Serverless).
*   **AI/LLM:** Google Gemini 1.5 Flash (via GAS `UrlFetchApp`).
*   **Database:** Wix Collections (`IntakeQueue`, `Cases`) + Google Sheets (Backups).
*   **Signatures:** SignNow API.
*   **Deployment:** `clasp` (GAS) + GitHub Integration (Wix).

---

## 🤖 AI Concierge & RAG System
The system now includes a "Headless" AI Agent that monitors leads and sends intelligent SMS.

*   **Brain:** `backend-gas/RAGService.js` (Gemini Integration).
*   **Knowledge Base:** `backend-gas/KnowledgeBase.js` (Protocols for Lee, Collier, Miami-Dade, etc.).
*   **Trigger:** New row in "Hot Leads" sheet -> AI analyzes context -> Generates SMS.
*   **Fallback:** If the API Key is missing, it reverts to rule-based templates.

---

## 🚀 Workflows

### 1. AI Concierge (New)
1.  **Lead Capture:** User submits form on Wix.
2.  **Scoring:** Lead score calculated based on urgency/county.
3.  **AI Response:** Gemini generates a custom SMS based on the specific County Jail protocol (e.g., "Park at Gun Club Rd," "Signatures must be wet").
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
    *   `GAS_WEB_APP_URL`: The deployed executable URL.
    *   `TWILIO_ACCOUNT_SID` / `AUTH_TOKEN`.
    *   `GOOGLE_MAPS_API_KEY`.

### GAS Side (Backend)
The backend is in `backend-gas/`.
1.  **Deploy:** `clasp push` -> `clasp deploy`.
2.  **Config:** Run `SetProperties.js` functions to set keys.
    *   `SAFE_updateGeminiKey()`: Sets `GEMINI_API_KEY` securely.
    *   `forceUpdateConfig()`: Sets basic infrastructure keys.

---

## 📂 Documentation Index
*   **[TESTING_GUIDE.md](./TESTING_GUIDE.md):** Protocols for Phase 4 verification.
*   **[AGENTS.md](./AGENTS.md):** Persona definitions for development.
*   **[SCHEMAS.md](./docs/SCHEMAS.md):** Data models for collections.

---

## 👮 code-security-advisor says:
*   PII is encrypted at rest.
*   API Keys are never committed to code (use ScriptProperties).
*   `SetProperties.js` must be kept clean of secrets after running.

---
*Maintained by the Shamrock Dev Team & Antigravity Agents.*