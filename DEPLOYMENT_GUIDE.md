# Deployment Guide: Telegram Bot & Automation Overhaul

**Version: 2.0.0**
**Date: 2026-02-20**

This document provides the complete instructions for deploying the new Telegram bot intake system, the durable queue, and the multi-channel notification overhaul.

---

## 1. Overview of New Features

This major update introduces a robust, agent-centric workflow that replaces the previous direct-to-document system. It is designed for reliability, ensuring no lead is ever missed.

- **Conversational Telegram Bot:** The bot now guides users through a full conversational Q&A to collect all necessary paperwork information, based on the approved field classification.

- **Durable Intake Queue:** All completed intakes (from both Telegram and Wix) are now saved to a central `IntakeQueue` Google Sheet. This acts as a persistent, durable store, so no data is lost if the Dashboard is not open.

- **Agent Approval Workflow:** All new intakes now appear in the **Queue** tab of `Dashboard.html`. An agent must manually review the information and click the **Process** button to generate documents. This critical step ensures agent oversight on every single bond.

- **Multi-Channel Alerts:** When a new intake is received, the system automatically sends alerts to three channels to ensure immediate notification:
    1.  **Slack:** A detailed message is sent to the `#intake`, `#new-cases`, and `shamrock bail bonds` channels.
    2.  **Email:** A comprehensive HTML email is sent to `admin@shamrockbailbonds.biz` with all collected data.
    3.  **SMS (Future):** The system is now ready for agent SMS alerts via Twilio.

- **Twilio SMS Integration:** The platform now has a full suite of Twilio SMS capabilities, replacing WhatsApp. This includes functions for:
    -   Sending intake confirmations to clients.
    -   Sending court date reminders.
    -   Sending bond discharge notifications.
    -   Sending urgent forfeiture warnings.

## 2. Deployment Steps

All code has been committed and pushed to the `main` branch of the `shamrock-bail-portal-site` GitHub repository. You will need to deploy the changes to both Google Apps Script and your Wix site.

### Step 2.1: Deploy to Google Apps Script

1.  **Open your Google Apps Script project** for Shamrock Bail Bonds.
2.  Using the `clasp` command-line tool or by copying the code manually, update the following files with the latest versions from the `backend-gas` directory in the repository:
    -   `Code.js` (Modified)
    -   `Dashboard.html` (Modified)
    -   `NotificationService.gs` (Modified)
    -   `Setup_Properties.js` (Modified)
    -   `Telegram_IntakeFlow.js` (Rewritten)
    -   `Telegram_IntakeQueue.js` (**New File**)
3.  **Save all files** in the Apps Script editor.

### Step 2.2: Deploy to Wix

1.  **Open your Wix Editor** for the Shamrock Bail Bonds site.
2.  Navigate to the **Code** panel.
3.  In the `src/backend` directory, update the following file with the latest version from the repository:
    -   `twilio-client.jsw` (Modified)
4.  **Publish** your Wix site to make the changes live.

### Step 2.3: Update Script Properties

This is the most critical step to ensure the new notifications work correctly. You must add the new Slack webhook URLs to your Google Apps Script project properties.

1.  In your Google Apps Script project, go to **Project Settings** (the gear icon ⚙️).
2.  Under **Script Properties**, click **Edit script properties**.
3.  Click **Add script property** and add the following new properties. **You must replace the placeholder URLs with the actual webhook URLs you created.**

| Property Name                        | Value (Your Webhook URL)                               |
| ------------------------------------ | ------------------------------------------------------ |
| `SLACK_WEBHOOK_SIGNING_ERRORS`       | `https://hooks.slack.com/services/T09...`              |
| `SLACK_WEBHOOK_INTAKE`               | `https://hooks.slack.com/services/T09...`              |
| `SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY` | `https://hooks.slack.com/services/T09...`              |
| `SLACK_WEBHOOK_SHAMROCK`             | `https://hooks.slack.com/services/T09...`              |
| `SLACK_WEBHOOK_DRIVE`                | `https://hooks.slack.com/services/T09...`              |
| `SLACK_WEBHOOK_CALENDAR`             | `https://hooks.slack.com/services/T09...`              |
| `SLACK_WEBHOOK_GENERAL`              | `https://hooks.slack.com/services/T09...`              |

4.  **Save** the script properties.

---

## 3. Verification

Once deployed, you can verify the new system:

1.  **Send a message to your Telegram bot** and complete the intake process.
2.  **Check your email** at `admin@shamrockbailbonds.biz` for the new intake alert.
3.  **Check your Slack workspace** in the `#intake`, `#new-cases`, and `shamrock bail bonds` channels for the alert.
4.  **Open `Dashboard.html`** and go to the **Queue** tab. You should see the new Telegram intake listed with a "Telegram" source badge.
5.  **Click the Process button** on the new intake. The form fields on the main page should auto-populate with the data collected by the bot.

This completes the deployment. The system is now fully operational.
