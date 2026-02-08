# Shamrock Bail Bonds Portal

This project is the official **Shamrock Bail Bonds Portal**. It runs on **Wix Velo** (Frontend) and connects to a **Google Apps Script (GAS)** backend for secure workflows (AI Agents, PDFs, Signatures, Arrest Scrapers).

**Current Status:** Production (Active) 🟢

---

## 📌 Goals
*   **AI-Powered Workflow Automation:** Intelligent lead scoring, booking data extraction, risk assessment, and background checks using OpenAI.
*   **Automated Paperwork:** Digital intake for Indemnitors and Defendants with SignNow integration.
*   **Role-Based Portals:** Secure access for Defendants (Check-ins), Indemnitors (Financing), and Staff (Dashboard).
*   **Compliance:** SOC II aligned, audit trails, encrypted PII storage.

---

## 🛠 Tech Stack
*   **Frontend:** Wix Velo (JavaScript), Wix CMS Collections, Wix Members Area.
*   **Backend:** Google Apps Script (GAS) Web App (Serverless).
*   **AI/LLM:** OpenAI GPT-4o-mini (via GAS `UrlFetchApp`).
*   **Database:** Wix Collections (`IntakeQueue`, `Cases`, `PortalSessions`, `MagicLinks`) + Google Sheets (Operational Data).
*   **Signatures:** SignNow API.
*   **Deployment:** `clasp` (GAS) + GitHub Integration (Wix).
*   **Notifications:** Slack (Internal) + Twilio (External SMS).

---

## 🤖 AI Agents & Capabilities
The system employs specialized AI agents (powered by OpenAI) to automate complex tasks:

*   **"The Clerk" (`AI_BookingParser.js`)**: Data Entry & OCR. Reads booking sheets, mugshots, and websites. Extracts structured JSON (Charges, Bond Amounts, Court Dates).
*   **"The Analyst" (`AI_FlightRisk.js`)**: Risk Assessment & Underwriting. Evaluates flight risk based on charges, residency, and history. Returns 0-100 Score + Rationale.
*   **"The Investigator" (`AI_Investigator.js`)**: Deep Vetting & Background Checks. Analyzes comprehensive background reports (TLO, IRB). Cross-references Defendant vs. Indemnitor data.
*   **"The Concierge" (`ai-service.jsw`)**: Interactive AI chat assistant. Answers bail bond questions, looks up county/jail info, and provides case status (authenticated users only).

---

## 💳 SwipeSimple Integration
The GAS Dashboard includes a direct integration with **SwipeSimple** for payment processing:
*   **Virtual Terminal:** Embedded credentials and direct link mechanism.
*   **Credentials:** Managed securely via Dashboard UI (non-hardcoded).

---

## 🚀 Workflows

### 1. AI Concierge (Web Chat)
1.  **User Access:** Available on Portal Landing page (`/portal-landing`).
2.  **Interactive Chat:** Users can ask questions about bail bonds, court dates, jail locations.
3.  **Tool-Augmented:** AI can search county data, look up user cases (if authenticated).
4.  **Backend:** Wix backend (`ai-service.jsw`) calls OpenAI with function calling.

### 2. Lead Scoring & Arrest Monitoring
1.  **Arrest Scraper:** GAS scripts monitor Lee County, Collier County jail websites.
2.  **Auto-Scoring:** Leads are scored based on urgency, bond amount, and county.
3.  **Slack Alerts:** High-priority arrests trigger Slack notifications to `#new-arrests-lee-county`.

### 3. Defendant Portal
1.  Log in via magic link (email/SMS).
2.  Complete Appearance Application.
3.  GPS/Selfie Check-in (verified via browser geolocation).

### 4. Indemnitor Portal
1.  Log in via magic link (email/SMS).
2.  Complete Financial Indemnity form.
3.  Upload Government ID.
4.  SignNow integration for document signing.

---

## 📦 Setup & Configuration

### Wix Side
*   **Secrets Manager:**
    *   `GAS_WEB_APP_URL` (Latest deployed GAS endpoint).
    *   `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`.
    *   `GOOGLE_MAPS_API_KEY`.
    *   `OPENAI_API_KEY` (for AI Concierge).
    *   `WIX_API_KEY` (for GAS → Wix integration).

### GAS Side (Backend)
The backend is in `backend-gas/`.
1.  **Deploy:** `clasp push` → `clasp deploy`.
2.  **Config:** Run `SetProperties.js` functions to set keys:
    *   `forceUpdateConfig()`: Sets basic infrastructure keys.
    *   `SAFE_updateOpenAIKey()`: Sets `OPENAI_API_KEY` securely.
3.  **Update Wix:** After deploying, update `GAS_WEB_APP_URL` in Wix Secrets Manager.

---

## 📂 Documentation Index
*   **[GEMINI.md](../../.gemini/GEMINI.md):** 📜 **The Supreme Authority** (Project Guidelines & Architecture).
*   **[TESTING_GUIDE.md](./TESTING_GUIDE.md):** Protocols for verification.
*   **[AI_CAPABILITIES.md](./docs/AI_CAPABILITIES.md):** 🦾 Guide to the AI Agents.
*   **[SCHEMAS.md](./docs/SCHEMAS.md):** Data models for CMS collections.
*   **[API_SPEC.md](./docs/API_SPEC.md):** Backend interfaces.
*   **[More Docs...](./docs/INDEX.md):** Full documentation index.

---

## 🔒 Security & Compliance
*   **PII Encryption:** All sensitive data encrypted at rest in Wix Collections.
*   **API Keys:** Never committed to code. Managed via Wix Secrets Manager and GAS Script Properties.
*   **Audit Trails:** All SignNow documents tracked with Case IDs.
*   **10DLC Compliance:** Twilio SMS follows carrier regulations (no marketing spam).

---

## 🐛 Known Issues & Limitations
*   **AI Concierge Visibility:** The chat widget only appears on `/portal-landing` if the required Wix Editor elements (`#boxAIChat`, `#repChatMessages`, etc.) are present. If you don't see it, check the Wix Editor for these IDs.
*   **Mobile Optimization:** Ensure input fields are at least 16px font size to prevent iOS auto-zoom. Set this in **Wix Editor > Site Design > Typography**.

---

*Maintained by the Shamrock Dev Team & Antigravity Agents.*