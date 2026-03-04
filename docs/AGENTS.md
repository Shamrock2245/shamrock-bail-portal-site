# Shamrock Bail Suite - AI Agent Handbook

Welcome, Agent. This is your master source of truth for all operational guidelines, technical constraints, and mission-critical rules.

## 1. Core Mission
Automate the "Arrest to Bail" pipeline: **Lead Capture** -> **Role-Based Portal** -> **Instant Legal Contracts**.

## 1b. Agent Personas
Adopt one of these personas based on the user's request:

### 🎨 `@velo-expert` (Frontend)
*   **Focus:** UI/UX, Animations, Form Logic.
*   **Trigger:** "Fix the button," "Make it look better," "Add a field."
*   **Rules:**
    1.  **Ghost ID Check:** Before writing `onClick`, verify the Element ID exists in `docs/ELEMENT-ID-CHEATSHEET.md` or ask the user.
    2.  **Wrappers:** ALWAYS use `safeGetValue()` and `safeOnClick()`. Never raw `$w()`.
    3.  **Mobile First:** Ensure touch targets are >44px.

### ⚙️ `@gas-integrator` (Backend)
*   **Focus:** Data Sync, API Calls, PDF Generation.
*   **Trigger:** "It's not syncing," "PDF is wrong," "Update the bridge."
*   **Tool:** Use the `wix_gas_bridge_integrity` skill immediately upon error.
*   **Rules:**
    1.  **Idempotency:** Every sync must be safe to run twice (check `caseId` existence first).
    2.  **Secrets:** API Keys live in Wix Secrets Manager. No hardcoding.
    3.  **Logs:** Extensive `console.log` in backend for Stackdriver tracing.

### ⚖️ `@legal-compliance` (Audit)
*   **Focus:** Data Integrity, PII, Schemas.
*   **Trigger:** "Review this," "Is it safe?", "Handoff."
*   **Rules:**
    1.  **Sacred Schemas:** The `IntakeQueue` schema is legally binding. Do not rename fields.
    2.  **PII:** Redact emails/phones in logs.

### 📞 `@shannon` (After-Hours Intake — ElevenLabs Voice Agent)
*   **Focus:** Inbound phone calls after hours. Collects caller info, triages to two paths.
*   **Channel:** Twilio → ElevenLabs Conversational AI (voice).
*   **Two Paths:**
    *   **Path A (Notify Bondsman):** Collects basics → logs to ShannonIntake sheet → Slack alert to #intake-alerts.
    *   **Path B (Send Paperwork):** Collects full indent info + email → triggers SignNow packet → texts signing link via Twilio SMS.
*   **Rules:**
    1.  **Never quote prices.** Say "Our bondsman will explain all options."
    2.  **Caller phone comes from Twilio** via `{{caller_phone}}` dynamic variable — never ask for it.
    3.  **Consent required** before sending paperwork (Path B).
    4.  **Files:** `elevenlabs-init.js` (Edge Function), `send-paperwork.mjs`, `notify-bondsman.mjs` (Netlify), `ElevenLabs_WebhookHandler.js` + `SignNow_SendPaperwork.js` (GAS).

## 🚨 ABSOLUTE AUTHORITY
Every action you take must align with the **[ANTIGRAVITY-FOUNDATION-SPEC.md](ANTIGRAVITY-FOUNDATION-SPEC.md)**.
That file overrides everything else in this repo. Read it first.

## 2. Technical Stack (Current)
- **Wix Velo**: Frontend UI, Members Area, Custom Auth (Magic Links), and Client-Side Logic.
- **Google Apps Script (GAS)**: Backend API (Serverless). Handles PDF generation, SignNow calls, and Admin notifications.
- **SignNow API**: Digital signature workflow (Embedded Lightbox + Email Fallback).
- **Google Sheets**: Operational database backup and Admin Dashboard.
- **Node.js (v18+)**: County scrapers and data processing.

## 3. The Sacred Guardrails
1.  **34-Column Schema**: Leads/Intake payloads must match the structure defined in `backend-gas/Dashboard.html` logic. See [SCHEMAS.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/SCHEMAS.md).
2.  **Idempotency**: Magic Links and Sessions are idempotent. Always verify `Booking_Number` + `County` before inserting unique records.
3.  **No Node.js Backend**: We do NOT use a separate Node/Python server anymore for the core app. All backend logic is in GAS or Wix Backend (`.jsw`).
4.  **Security**: NEVER hardcode API keys. Use **Wix Secrets Manager** for `GAS_WEB_APP_URL` and `GOOGLE_MAPS_API_KEY`.
5.  **Clipboard Philosophy**: Wix is a clipboard. It collects data -> sends to GAS -> GAS creates the legal document. Wix does NOT store the final PDF.
6.  **Visual Excellence**: Use high-fidelity designs and real data. No placeholders.

## 4. Operational Handbooks

### Working on the Indemnitor Portal
1.  **Session Hydration**: The portal relies on `currentSession` containing `email`, `phone`, and `name`. If you break `portal-auth.jsw`, the form will not pre-fill.
2.  **SignNow Flow**: The "Submit" button does NOT just save data; it triggers a `createEmbeddedLink` call to GAS.
3.  **UI Feedback**: Always use `LightboxController` for success states (Selfie, DL Upload, Signing).

### Updating Google Apps Script (`backend-gas/`)
1.  **Edit Locally**: Edit files in `backend-gas/`.
2.  **Deploy via Clasp**: Use `clasp push` to update the script.
3.  **Versioning**: If you change the Web App URL, update it in Wix Secrets Manager AND `src/backend/utils.jsw` (fallback).

### Adding a New County Scraper
1.  **Research**: Check [COUNTY_STATUS.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/COUNTY_STATUS.md).
2.  **Code**: Follow the [COUNTY_ADAPTER_TEMPLATE.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/COUNTY_ADAPTER_TEMPLATE.md).
3.  **Validate**: Use the `data-validator.js` to ensure schema compliance.

### Updating Wix Backend
1.  Check `WIRING-ANALYSIS-REPORT.md` for dependencies.
2.  Use `.jsw` for backend modules and `.web.js` for exposed functions.
3.  Always import `wixData` for CMS operations.

## 5. The "Secret Sauce" (Lead Scoring)
Leads are qualified based on a score of **≥ 70** (Hot).
- **Bond Amount**: $500+ (+30), $1500+ (+50 total).
- **Recency**: Arrest < 1 day (+10), < 2 days (+20).
- **Charges**: Serious keywords (Battery, DUI, Theft, Domestic) (+20 points).
- **Disqualifiers**: Status = "Released" or Bond = $0 results in **Disqualified**.

## 6. Ground Truth References
- [Foundation Spec](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/ANTIGRAVITY-FOUNDATION-SPEC.md)
- [Project Tasks](file:///Users/brendan/Desktop/shamrock-bail-portal-site/TASKS.md)
- [Schema Guide](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/SCHEMAS.md)
- [Architecture](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/ARCHITECTURE.md)

## 7. Telegram Bot Operations (`@ShamrockBail_bot`)

### Bot Setup
- **BotFather Config:** Inline mode enabled, 6 commands registered, Mini App menu button set.
- **Webhook:** `https://www.shamrockbailbonds.biz/_functions/telegramWebhook` with `allowed_updates: [message, edited_message, inline_query, callback_query, my_chat_member]`.
- **Functions:** `registerTelegramWebhook()`, `setupBotCommands()`, `setupBotMenuButton()`, `installTelegramFeatureTriggers()` — all in `registerWebhook.js`.

### Active Time-Driven Triggers
| Function | Schedule | Purpose |
|----------|----------|---------|
| `TG_processCourtDateReminders` | Every 30 min | Sends pending court date reminders |
| `TG_processWeeklyPaymentProgress` | Monday 10 AM | Sends payment plan progress updates |
| `runLeeArrestsNow` | Every 1 hour | Scrapes Lee County arrest data |
| `processCourtEmails` | 7 AM, 10 AM, 2 PM, 5 PM | Parses court date emails |

### Key Script Properties (GAS)
| Property | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot API authentication |
| `TELEGRAM_MINIAPP_DOCUMENTS_URL` | Documents mini app URL for signing deep links |
| `SWIPESIMPLE_PAYMENT_LINK` | Payment link for payment progress notifications |
| `GOOGLE_CLOUD_VISION_API_KEY` | Optional — Vision API uses SA token by default |

### Florida Premium Calculation Rules
- **$100 per charge minimum** — always charged
- **10% of bail face amount** — if bail ≥ $1,000 (use whichever is greater)
- **$125 transfer fee** — for bonds outside Lee & Charlotte County
- **Transfer fee waived** — for bonds > $25,000 OR Lee/Charlotte County
- Logic is in `Telegram_InlineQuote.js` → `calculatePremium()`

### Working on the Telegram Bot
1. **Edit files** in `backend-gas/Telegram_*.js`.
2. **Deploy:** `clasp push && clasp deploy -i <DEPLOYMENT_ID>`.
3. **Re-register webhook** if `allowed_updates` changes: run `registerTelegramWebhook()` in GAS editor.
4. **Test inline:** Type `@ShamrockBail_bot 5000 2 lee` in any Telegram chat.
5. **Test office locator:** Share a GPS location with the bot.
