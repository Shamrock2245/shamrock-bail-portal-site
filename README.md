# Shamrock Bail Bonds Portal

This project is the official **Shamrock Bail Bonds Portal**. It runs on **Wix Velo** (Frontend) and connects to a **Google Apps Script (GAS)** backend for secure workflows (AI Agents, PDFs, Signatures, Arrest Scrapers).

**Current Status:** Production (Active) 🟢

---

## 📌 Core Features

*   **Telegram-First Client Intake:** A conversational bot guides clients through the entire intake process, collecting all necessary information for the bail bond packet.
*   **Automated Document Generation:** One-click packet generation from the staff dashboard, pulling data directly from the intake conversation.
*   **Mobile-First Electronic Signing:** Clients receive a link to sign all documents on their mobile device via an embedded SignNow session.
*   **Automated ID Verification:** After signing, the bot automatically requests and guides the client through uploading photos of their ID (front, back, and selfie) for compliance.
*   **Closed-Loop Document Delivery:** Once signing is complete, the final, executed documents are automatically processed (merged, watermarked) and sent back to the client via Telegram.
*   **Wix Staff Dashboard:** A central hub for staff to monitor the intake queue, manage cases, and oversee the automation process.

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

## 🚀 System Architecture

The system is built on a robust, deduplicated architecture that prioritizes a single source of truth for all business logic.

For a detailed breakdown of all system components, data flows, and architectural decisions, please see the [**System Architecture Document**](./docs/ARCHITECTURE.md).

## 🚀 Workflows

### 1. Telegram Intake & Signing
1.  **Initiation:** Client starts a conversation with the Shamrock Bail Bonds Telegram bot.
2.  **Intake:** The bot (`Telegram_IntakeFlow.js`) guides the user through a conversational form, collecting all required defendant and indemnitor data.
3.  **Signing:** Upon completion, a SignNow signing link is generated and sent to the client via Telegram.
4.  **ID Verification:** After signing, the bot (`PDF_Processor.js`) automatically requests and guides the user through uploading their ID photos (front, back, selfie).
5.  **Completion:** The final, executed documents are processed and sent back to the client via Telegram.

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

### Prerequisites

*   Google Workspace account with access to Google Apps Script, Google Drive, and Google Sheets.
*   Wix account with an active site and Velo enabled.
*   API keys for all required services (Telegram, SignNow, ElevenLabs, etc.).

### Deployment

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Shamrock2245/shamrock-bail-portal-site.git
    ```

2.  **Configure Secrets:**
    *   Add all required API keys to the **Wix Secrets Manager**.

3.  **Deploy Google Apps Script:**
    *   Use `clasp` to push the `backend-gas` code to your Google Apps Script project.
    *   Open the GAS editor.
    *   Run the `setupTelegramProperties` function in `Setup_Properties_Telegram.js`. This will pull all secrets from Wix and configure the script properties automatically.
    *   Deploy the script as a Web App, ensuring it has access to "Anyone" and executes as "Me".

4.  **Deploy Wix Velo Code:**
    *   Use the Wix CLI or copy/paste the code from the `src` directory into your Velo editor.
    *   Ensure the `http-functions.js` endpoint is configured with the correct GAS Web App URL.

5.  **Register Webhooks:**
    *   Run the `setTelegramWebhook` function in `SetupUtilities.js` to register your GAS endpoint with Telegram.
    *   Configure your SignNow account to send webhooks to the same GAS endpoint for `document.complete` events.

For a complete, step-by-step guide, refer to the [**Deployment Checklist**](./docs/DEPLOYMENT_CHECKLIST.md).

---

## 📂 Documentation Index
*   **[ARCHITECTURE.md](./docs/ARCHITECTURE.md):** 📜 **System Architecture** (The new source of truth).
*   **[DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md):** Step-by-step deployment guide.
*   **[PDF_BOT_SKILLS.md](./docs/PDF_BOT_SKILLS.md):** Catalog of PDF handling skills integrated from open-source bots.
*   **[TASKS.md](./TASKS.md):** Current project task list.

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