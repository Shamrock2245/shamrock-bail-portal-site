# 🍀 Manus Prompt — Shamrock Bail Bonds Automation Powerhouse

> **Date:** Feb 27, 2026 · **GAS Deploy:** @365 · **Repo:** `Shamrock2245/shamrock-bail-portal-site`

---

## What Was Just Built (Phase 6 — Telegram Ecosystem)

Antigravity just finished deploying 7 production-ready features to the Telegram bot (`@ShamrockBail_bot`) and the GAS backend. Everything is live, triggers are running, and the codebase is clean and pushed. Here's what's operational:

| Feature | File | What It Does |
|---------|------|-------------|
| **Inline Quote Bot** | `Telegram_InlineQuote.js` | Type `@ShamrockBail_bot 5000 2 lee` in ANY Telegram chat → instant premium quote card. Uses FL bail law: $100/charge min or 10%, transfer fee $125 (waived for Lee/Charlotte or bonds >$25k). |
| **Court Date Reminders** | `Telegram_Notifications.js` | 4-touch sequence: 7-day, 3-day, 1-day, morning-of. Trigger runs every 30 min. Reads from `CourtDates` sheet. |
| **One-Tap Signing** | `Telegram_Notifications.js` | Sends a `web_app` button that deep-links directly into the Documents mini app with case context pre-loaded. |
| **Bot Analytics** | `Telegram_Analytics.js` | `logBotEvent()` tracks all interactions (intake starts, completions, inline queries, OCR, signing). `getBotAnalytics()` returns funnel data for Dashboard. |
| **ID OCR** | `Telegram_OCR.js` | Cloud Vision API extracts name, DOB, DL#, address from FL driver license photos. Falls back to Drive storage if Vision API isn't configured. |
| **Office Locator** | `LocationMetadataService.js` | When user shares GPS → auto-responds with nearest Shamrock office (Fort Myers HQ or Charlotte) with Call/Directions buttons. |
| **Payment Progress** | `Telegram_Notifications.js` | Sends visual progress bars (████░░ 65%) with "Make a Payment" button. Weekly trigger: Mondays 10 AM. |

### Infrastructure Already Configured
- BotFather inline mode: ✅ enabled
- Webhook `allowed_updates`: `[message, edited_message, inline_query, callback_query, my_chat_member]`
- GAS Triggers: `TG_processCourtDateReminders` (30 min), `TG_processWeeklyPaymentProgress` (Mon 10 AM)
- Cloud Vision API: ✅ enabled on `shamrock-bail-suite` GCP project
- All docs updated: `README.md`, `TASKS.md`, `ARCHITECTURE.md`, `AGENTS.md`, `HANDOFF_2026-02-27.md`

---

## What Manus Should Build Next (Phase 7 — Automation Powerhouse)

The foundation is solid. The bot handles intake through delivery. Now it's time to scale coverage, automate revenue, and close every loop. Here are the priorities:

### 🔴 Priority 1: Revenue & Conversion Engines

#### 1. "The Closer" — Abandoned Intake Follow-Up
- **What:** When a Telegram intake is started but not completed within 2 hours, auto-trigger a follow-up sequence (SMS + Telegram).
- **Logic:** Check `IntakeProgress` sheet for sessions with status `in_progress` and `lastActivity > 2 hours ago`.
- **Sequence:** Touch 1 (2 hrs): "Hey [name], we noticed you started your bail bond application..." → Touch 2 (24 hrs): "Your loved one is still waiting..." → Touch 3 (48 hrs): "Last chance — call us at (239) 237-1638."
- **Files to modify:** `TheCloser.js` (exists but needs Telegram integration), `Telegram_Notifications.js`.
- **Trigger:** Every 1 hour.

#### 2. WhatsApp Business Channel
- **What:** Mirror the Telegram bot's core capabilities (intake, reminders, signing links) on WhatsApp via Twilio.
- **Why:** 90%+ of Shamrock's clients are on phones. WhatsApp has 98% open rates.
- **Files:** `twilio-client.jsw` (exists in Wix backend), new `WhatsApp_Webhook.js` in GAS.
- **Approach:** Use Twilio's WhatsApp Sandbox first. Same `doPost` routing, different channel flag.

#### 3. Payment Plan Auto-Collection
- **What:** When a payment plan installment is due, auto-send a SwipeSimple payment link via Telegram + SMS.
- **Logic:** Read `PaymentPlans` sheet. If `nextDueDate <= today + 3 days`, send reminder with payment link.
- **Files:** `Telegram_Notifications.js` (extend `TG_processWeeklyPaymentProgress`).

### 🟡 Priority 2: Geographic Expansion ("The Scout")

#### 4. 5 New County Scrapers
- **What:** Extend `AI_BookingParser.js` to scrape jail rosters for: Manatee, Pinellas, Sarasota, Hendry, and Glades counties.
- **Files:** `AI_BookingParser.js`, new county adapter files.
- **Pattern:** Follow existing Lee County scraper. Each county needs: URL, parse logic, field mapping to the 34-column schema.
- **Trigger:** Daily at 6 AM.
- **Alert:** New arrests → Slack `#new-arrests-[county]` + historical bond cross-reference (already built in `HistoricalBondMonitor.js`).

#### 5. Multi-County Dashboard View
- **What:** Add a county filter dropdown to `Dashboard.html` so staff can view arrests by county.
- **Files:** `Dashboard.html`, `StatsService.js`.

### 🟢 Priority 3: Client Experience

#### 6. ElevenLabs Speaking Agent (After-Hours)
- **What:** When a call comes in after hours (6 PM - 8 AM), route to an AI voice agent that can answer FAQs, collect basic info (name, who's in jail, what county), and create a lead in the system.
- **Stack:** ElevenLabs Conversational AI → GAS webhook for lead creation.
- **Voice:** Professional, calm, reassuring. "You've reached Shamrock Bail Bonds. I'm an AI assistant and I can help you get started right away."
- **Note:** Voice STT for Telegram was put on hold — ElevenLabs is reserved for THIS feature.

#### 7. Bail School Landing Page + Auto-Certificate
- **What:** Build `/bail-school` page on Wix with video embed, progress tracking, and auto-generated PDF certificate on completion.
- **Files:** New Wix page, `BailSchoolService.js` in GAS.
- **Skill:** `.agent/skills/bail_school_manager/SKILL.md` already exists — read it.

#### 8. Smart Notification Preferences
- **What:** Let clients choose their preferred channel (Telegram, SMS, WhatsApp, Email) and time windows for notifications.
- **Store:** New `NotificationPreferences` sheet or Wix collection field.
- **Use:** All notification functions check preferences before sending.

### 🔵 Priority 4: Operational Intelligence

#### 9. Daily Ops Summary Bot
- **What:** Every morning at 7 AM, send a Telegram message to the staff channel with:
  - New arrests overnight (count + top 3 by bond amount)
  - Pending intakes (count + oldest)
  - Court dates today
  - Payment plans due this week
  - Bot analytics snapshot (yesterday's conversion rate)
- **Files:** New `DailyOpsReport.js`, uses existing `StatsService.js` + `Telegram_Analytics.js`.

#### 10. Social Media Auto-Posting
- **What:** `SocialPublisher.js` and `SocialMediaPicker.js` exist but need wiring. Auto-post new bond content, county educational content, and client testimonials.
- **Integration:** Pexels API for images (API key pending — user was working on this).
- **Files:** `SocialPublisher.js`, `SocialCalendar.js`, `SocialMediaPicker.js`.

---

## Ground Rules for Manus

1. **Read `AGENTS.md` first** — it has all operational guidelines, premium calculation rules, and the sacred guardrails.
2. **Read `ARCHITECTURE.md`** — it has the full component table and data flow diagrams.
3. **Don't break what works.** The signing flow, intake queue, and Dashboard are production and making money. Test in isolation.
4. **GAS is the factory.** Don't put heavy logic in Wix. Wix collects → GAS processes → GAS delivers.
5. **Secrets go in Script Properties** (GAS) or **Wix Secrets Manager**. Never in code.
6. **Deploy with `clasp push -f && clasp deploy -i <DEPLOYMENT_ID> -d "description"`**. The deployment ID is: `AKfycby5EM_U4d1GRHf_Or64RPGlOFUuOFld4m5ap9DghRm5njoUCTzSmEVmzmwmak9sR6fSFQ`.
7. **Git workflow:** Always use `/wix_safe_sync` workflow to handle Wix CLI filename weirdness.
8. **Mobile first.** 90% of clients are on phones in a crisis. Buttons > 44px. One thumb, one eye.
9. **Aesthetics matter.** If it looks cheap, fix it. Use loading states, animations, and real data.
10. **Premium calculation law:** $100/charge minimum OR 10% of bail (whichever is greater). Lee/Charlotte = no transfer fee ever. Other counties = $125 transfer fee, waived if bond > $25k.

---

## Quick Reference

| Resource | Location |
|----------|----------|
| GAS Project | `backend-gas/` |
| Wix Frontend | `src/` |
| Docs | `docs/` |
| Skills | `.agent/skills/` |
| Workflows | `.agent/workflows/` |
| Handoff | `HANDOFF_2026-02-27.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Agent Handbook | `docs/AGENTS.md` |
| Tasks | `TASKS.md` |
| GAS Deploy ID | `AKfycby5EM_U4d1GRHf_Or64RPGlOFUuOFld4m5ap9DghRm5njoUCTzSmEVmzmwmak9sR6fSFQ` |
| Current GAS Version | @365 |
| Bot | `@ShamrockBail_bot` |
| Webhook URL | `https://www.shamrockbailbonds.biz/_functions/telegramWebhook` |

---

*Written by Antigravity · Feb 27, 2026*  
*"The Website is a Clipboard; The Backend is the Brain."*
