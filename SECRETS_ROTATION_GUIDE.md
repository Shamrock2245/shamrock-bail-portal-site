# 🔐 Secrets Rotation Guide

**CRITICAL SECURITY ACTION REQUIRED**

Because some API keys were previously committed to the git repository, they are considered **compromised**. You must rotate (regenerate) them immediately to ensure the security of your platform.

---

## 1. SignNow API Token
**Impact:** Unauthorized access to creating and viewing legal documents.

1.  Log in to your **SignNow** account.
2.  Navigate to **API** settings (usually under Integrations or Developer Console).
3.  Revoke the old token starting with `0c35...`.
4.  Generate a **new** Basic Authorization Token.
5.  **Action (Programmatic Update Required):**
    *   *Note: Your GAS Project properties are "Read-Only" in the UI because there are >50 items.*
    *   Open your Google Apps Script Editor in the browser.
    *   Open `backend-gas/SetProperties.gs` (file may be named `SetProperties`).
    *   **Temporarily** paste your NEW token into the code, replacing `'REPLACE_WITH_SIGNNOW_TOKEN'`.
    *   Select `ADMIN_UpdateAllProperties` from the toolbar and click **Run**.
    *   **CRITICAL:** After it runs, **UNDO** your changes (Cmd+Z) in the browser to remove the secret from the file. The property is now saved in the system; you don't need it in the code anymore.

---

## 2. Twilio Auth Token
**Impact:** Unauthorized SMS sending and potential toll fraud.

1.  Log in to the **Twilio Console**.
2.  Go to the Dashboard for your account (`REPLACE_WITH_TWILIO_SID`).
3.  Find "Auth Token" and click **Rotate** or **Request Secondary Token**.
4.  Promote the secondary token to primary (revoking the old one).
5.  **Action:**
    *   Follow the same method as above:
    *   Edit `SetProperties.gs` in the browser.
    *   Replace `'REPLACE_WITH_TWILIO_TOKEN'` with your new key.
    *   Run `ADMIN_UpdateAllProperties`.
    *   **Undo** changes to keep the file clean.

---

## 3. Google Maps API Key
**Impact:** Unauthorized usage of your Maps quota ($$$ billing risk).

1.  Log in to the **Google Cloud Console**.
2.  Navigate to **APIs & Services > Credentials**.
3.  Find the API Key starting with `AIza...`.
4.  Click **Edit** -> **Regenerate Key** (or create a new one and delete the old one).
5.  **Action:**
    *   This key is used in your frontend code (Dashboards).
    *   Ideally, restrict the new key to **HTTP Referrers** matching `*.shamrockbailbonds.biz` and `shamrock-bail-portal-site.wixstudio.io`.
5.  **Action (Programmatic):**
    *   Edit `SetProperties.gs` in the browser.
    *   Replace `'REPLACE_WITH_GOOGLE_MAPS_KEY'` with your new key.
    *   Run `ADMIN_UpdateAllProperties`.
    *   **Undo** changes to keep the file clean.
    *   *Note: logic has been updated to inject this key into the Dashboard automatically.*

---

## 4. Slack Bot Token
**Impact:** Unauthorized posting to your Slack channels.

1.  Go to **api.slack.com/apps**.
2.  Select your Shamrock Bot.
3.  Go to **OAuth & Permissions**.
4.  Click **Revoke Tokens** or Reinstall the App to Workspace to generate a new `xoxb-` token.
5.  **Action:**
    *   Use the programmatic method with `SetProperties.gs` to update `SLACK_BOT_TOKEN`.

---

## ✅ Final Verification
After rotating all keys:
1.  Run a test flow (e.g., "Start Bail Paperwork") to ensure SignNow and Twilio still work.
2.  Check the Dashboard map to ensure it loads without errors.
