# Telegram Bot: Conversational Paperwork Flow

**Version:** 2.0
**Objective:** To create a more human-like, flexible, and comprehensive conversational flow for the Telegram bot to collect all necessary information for the bail bond paperwork, as defined in the `shamrock_field_mappings.json`.

## Guiding Principles

1.  **Conversational, Not a Form:** The interaction should feel like a conversation with a helpful agent, not like filling out a form. The bot should use natural language, show empathy, and be able to handle minor deviations from the script.
2.  **Flexible & Forgiving:** Users might provide information out of order, ask questions, or make typos. The bot should be able to parse this, ask for clarification, and get back on track.
3.  **Clarity & Confirmation:** The bot must be crystal clear about what information it needs and regularly summarize what it has understood to allow the user to correct any mistakes.
4.  **Integrated Knowledge:** The bot should be able to answer common questions by leveraging the existing RAG/Knowledge Base from `Manus_Brain.js`.
5.  **Prioritized Information:** The flow will be structured to gather the most critical information first, to ensure that even if the user drops off, the most important details are captured.

## New Conversational Flow: State Machine v2.0

This new flow expands on the original `INTAKE_STEPS` to be more granular and flexible. It will be managed by a more advanced state machine in the new `Telegram_IntakeFlow.js`.

### Phase 1: The Core Essentials (Triage)

*Goal: Quickly identify the defendant and their situation.* 

| Step | Bot's Action (Question) | Canonical Fields Captured | User Input Handling & Validation |
| :--- | :--- | :--- | :--- |
| 1. **Greeting & Triage** | `(User starts conversation)` -> "Hi, I'm the Shamrock Bail Bonds assistant. I can help you start the bail process. To begin, what is the full name of the person who has been arrested?" | `DefName`, `DefFirstName`, `DefLastName` | - Parse first and last name. If only one name is given, ask for the full name. |
| 2. **Jail Location** | "Thank you. And which jail are they currently in? (e.g., Lee County Jail)" | `DefFacility`, `DefCounty` | - Use `extractCountyFromJail` to get the county. If the jail is unknown, ask for the city or county where the arrest took place. |
| 3. **Indemnitor Introduction** | "Got it. Now, what is your full name, and what is your relationship to [Defendant's First Name]?" | `IndName`, `IndFirstName`, `IndLastName`, `IndRelation` | - Parse name and relationship. |

### Phase 2: Defendant's Details

*Goal: Gather all necessary information about the defendant.* 

| Step | Bot's Action (Question) | Canonical Fields Captured | User Input Handling & Validation |
| :--- | :--- | :--- | :--- |
| 4. **Defendant's DOB** | "Thanks, [Indemnitor's First Name]. Now I need a few more details about [Defendant's First Name]. What is their date of birth?" | `DefDOB` | - Use `parseDateFlexible`. If invalid, ask again with examples (e.g., MM/DD/YYYY). |
| 5. **Defendant's Contact Info** | "What is their phone number and email address?" | `DefPhone`, `DefEmail` | - Use `parsePhoneNumber` and `parseEmail`. If one is missing, ask for it specifically. |
| 6. **Defendant's Address** | "What is their last known home address?" | `DefAddress`, `DefCity`, `DefState`, `DefZip` | - Basic validation for length and presence of numbers. |
| 7. **Defendant's ID** | "Do you have their Driver's License or State ID number?" | `DefDL` | - Optional field. If they don't have it, the bot says "No problem, we can get that later." |
| 8. **Defendant's SSN** | "And their Social Security Number? This is required for the official paperwork." | `DefSSN` | - Required field. If the user is hesitant, the bot should say: "I understand. This is a required field for the official bond paperwork. All information is kept strictly confidential and secure." |

### Phase 3: Indemnitor's Details

*Goal: Gather all necessary information about the indemnitor (the person paying).* 

| Step | Bot's Action (Question) | Canonical Fields Captured | User Input Handling & Validation |
| :--- | :--- | :--- | :--- |
| 9. **Indemnitor's Contact Info** | "Great. Now for your information. I have your phone number as [user's phone number]. What is your email address?" | `IndEmail`, `IndPhone` | - `IndPhone` is pre-filled. Use `parseEmail` for email. |
| 10. **Indemnitor's Address** | "What is your current home address?" | `IndAddress`, `IndCity`, `IndState`, `IndZip` | - Basic validation. |
| 11. **Indemnitor's DOB & SSN** | "What is your date of birth and Social Security Number?" | `IndDOB`, `IndSSN` | - Required fields. Same reassurance for SSN as with the defendant. |
| 12. **Indemnitor's Employment** | "Please tell me about your employment. I need your employer's name, your job title, and your approximate annual income." | `IndEmployer`, `IndEmpPhone`, `IndEmpAddress`, `IndSupervisor`, `IndYearsAtAddress` | - Flexible parsing. The bot can ask for each piece of information separately if the user provides an incomplete answer. |

### Phase 4: References & Confirmation

*Goal: Collect personal references and confirm all information.* 

| Step | Bot's Action (Question) | Canonical Fields Captured | User Input Handling & Validation |
| :--- | :--- | :--- | :--- |
| 13. **Personal References** | "We're almost done. I need two personal references (not family members). For the first reference, please provide their name, phone number, and your relationship to them." | `Ref1Name`, `Ref1Phone`, `Ref1Relation`, `Ref1Address` | - Use `parseReference`. Repeat for the second reference (`Ref2...`). |
| 14. **Confirmation** | `(The bot presents a full summary of all collected information)` -> "Please review all the information carefully. Is everything correct?" | - | - User can say "yes" to proceed, or "no" to make corrections. If "no", the bot asks "What needs to be corrected?" and allows the user to specify the field to change. |

### Phase 5: Completion

*Goal: Finalize the intake and trigger the next steps.* 

| Step | Bot's Action (Question) | Canonical Fields Captured | User Input Handling & Validation |
| :--- | :--- | :--- | :--- |
| 15. **Finalization** | "Thank you! I have everything I need. Your paperwork is being generated now. You will receive a link to sign the documents shortly. A member of our team will also be in touch with you soon to discuss the bond amount and payment." | - | - Trigger `triggerDocumentGenerationFromTelegram`. |

## Handling Questions and 
## Handling Questions and Digressions

At any point in the flow, the user can ask a question (e.g., "How much does it cost?", "Where are you located?"). The `Manus_Brain.js` will handle this by:

1.  **Identifying Intent:** The `handleManus` function will first check if the user's message is a direct answer to the bot's last question. 
2.  **RAG Lookup:** If it's a question, it will query the knowledge base (RAG) to find an answer.
3.  **Answering & Re-prompting:** The bot will provide the answer and then gently guide the user back to the current step in the intake flow. For example: "Good question. The cost of the bond is typically 10% of the total bond amount. Now, back to the defendant's information - what is their date of birth?"

## Code Gaps & Implementation Plan

1.  **`Telegram_IntakeFlow.js` v2:**
    *   Expand the `INTAKE_STEPS` enum to include all the new, more granular steps.
    *   Rewrite the `handle...` functions for each step to be more flexible and conversational, using the new questions and validation logic.
    *   Implement the confirmation step (`handleConfirmation`) with the ability to correct individual fields.
    *   Integrate more closely with `Manus_Brain.js` to allow for question-answering during the flow.

2.  **`Manus_Brain.js`:**
    *   Enhance the `checkAndProcessIntake` function to better detect when a user is asking a question versus providing an answer.
    *   Improve the re-prompting logic to seamlessly transition back to the intake flow after answering a question.

3.  **`NotificationService.js`:**
    *   Update the `sendSlack` function to use the new, more specific webhook keys (e.g., `SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY`).
    *   Implement the `sendSms` function using the Twilio API, pulling credentials from the Script Properties.

4.  **`Setup_Properties_Telegram.js`:**
    *   Add all the new Slack webhook keys to the `PROPERTIES` list.
    *   Add the Twilio credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) to the `PROPERTIES` list and the `verifySystemHealth` checks.

This new design will create a much more robust and user-friendly experience, significantly improving the quality and completeness of the data collected through the Telegram bot.
