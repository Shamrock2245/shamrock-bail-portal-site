# WhatsApp Message Templates & Configuration
**Shamrock Bail Bonds**

Use this guide to copy/paste configuration directly into the **WhatsApp Manager** > **Message Templates** and **Phone Number** > **Conversational Components** sections.

---

## 1. Message Templates
Create these in **WhatsApp Manager > Message Templates**.

### A. Authentication (OTP)
*Used for the "Login with WhatsApp" button.*

*   **Template Name:** `shamrock_otp_login`
*   **Category:** `AUTHENTICATION`
*   **Language:** `English (US)`
*   **Code Expiration:** `10` minutes (if asked)
*   **Content:**
    *   **Body:** `Your verification code is {{1}}.`
    *   **Button (Copy Code):** `Copy Code`

---

### B. Court Date Reminder (Utility)
*Used for automated daily reminders 7, 3, and 1 day before court.*

*   **Template Name:** `court_date_reminder`
*   **Category:** `UTILITY`
*   **Language:** `English (US)`
*   **Content:**
    *   **Body:** `Hello {{1}}, this is a reminder for your court date on {{2}} at {{3}}. Location: {{4}}. Case #: {{5}}. Failure to appear may result in a warrant.`
    *   **Footer:** `Shamrock Bail Bonds • (239) 332-2245`
    *   **Buttons:**
        *   **Call Phone Number:** `Call Office` (+12393322245)
        *   **Quick Reply:** `I will be there`

---

### C. Document Signature Request (Utility)
*Used when sending SignNow links.*

*   **Template Name:** `document_signature_request`
*   **Category:** `UTILITY`
*   **Language:** `English (US)`
*   **Content:**
    *   **Body:** `Hello {{1}}, your bail documents are ready for signature. Please sign them immediately here: {{2}}`
    *   **Footer:** `Shamrock Bail Bonds`
    *   **Buttons:**
        *   **Visit Website:** `Sign Documents` (Dynamic URL)

---

### D. Payment Request (Utility)
*Used for sending payment links or overdue notices.*

*   **Template Name:** `payment_request`
*   **Category:** `UTILITY`
*   **Language:** `English (US)`
*   **Content:**
    *   **Body:** `Hello {{1}}, this is a notice regarding your payment of {{2}}. Status: {{3}}. Please pay securely here: {{4}}`
    *   **Footer:** `Shamrock Bail Bonds`
    *   **Buttons:**
        *   **Visit Website:** `Pay Now` (Dynamic URL)

---

### E. General Follow-up / Check-in (Utility)
*Used for the "Stealth Ping" and general status checks.*

*   **Template Name:** `general_followup`
*   **Category:** `UTILITY`
*   **Language:** `English (US)`
*   **Content:**
    *   **Body:** `Hello {{1}}, please confirm you received this message regarding your bond status. Reference: {{2}}`
    *   **Buttons:**
        *   **Quick Reply:** `Confirm Receipt`
        *   **Quick Reply:** `Call Me`

---

## 2. Conversational Components (Icebreakers)
Configure these in **Phone Number > Settings > Conversational Components**.

These are the clickable buttons a user sees when they first open a chat with you. They should represent what the **USER wants to say**, not what you are asking them.

1.  **Ice Breaker 1:** `🆘 I need to post bail`
    *   *Auto-Reply (Handled by Bot):* "I can help with that. What is the defendant's name or booking number?"

2.  **Ice Breaker 2:** `📅 Check my court date`
    *   *Auto-Reply (Handled by Bot):* "Please provide your Case Number or Full Name to look up your court date."

3.  **Ice Breaker 3:** `📄 I need forms`
    *   *Auto-Reply (Handled by Bot):* "Which forms do you need? (e.g., Check-in, Travel Request, Credit Card Auth)"

4.  **Ice Breaker 4:** `📞 Speak to an Agent`
    *   *Auto-Reply (Handled by Bot):* "Connecting you to a human agent. Please stand by..."

---

## 3. Supported Commands
Configure these in **Phone Number > Settings > Automations > Commands**.

These are the `/` slash commands typically used in WhatsApp Business.

1.  **Command:** `/help`
    *   **Description:** Show the main menu of options.
    *   *Backend Logic:* Triggers the Help Menu with Quick Replies.

2.  **Command:** `/checkin`
    *   **Description:** Submit a compliance check-in.
    *   *Backend Logic:* Logs check-in to Google Sheets & notifies Slack.

3.  **Command:** `/pay`
    *   **Description:** Get a secure payment link.
    *   *Backend Logic:* Sends the SwipeSimple payment URL.

4.  **Command:** `/stop`
    *   **Description:** Unsubscribe from notifications.
    *   *Backend Logic:* Adds user to the Opt-Out list.

5.  **Command:** `/location` (or `office`, `map`)
    *   **Description:** Get office location and hours.
    *   **Backend Logic:** Sends "1528 Broadway" address with a Google Maps *Directions* link.

6.  **Command:** `/forms` (or `paperwork`)
    *   **Description:** Get links to common forms.
    *   *Backend Logic:* Sends a menu of download links (Check-in, Travel, etc.).

7.  **Command:** `/review` (or `rate`)
    *   **Description:** Request a Google Review.
    *   *Backend Logic:* Sends the direct Google Business Profile short link (`share.google`).
