# Studio element build spec

Build these elements in the Wix Studio editor. Page code keeps every id below and skips an id that is not on the canvas yet (`$w('#id')` throws when the id is missing; each lookup is inside a `try` in the same function).

This pass does not open or save the Studio editor. Compare the tables to your Layers panel.

`$w` does not set a parent. The **Section** column is the layout group, top to bottom, for a phone. About 90% of visitors are on phones, so stack each section in one column. **Starts** is what the code does after load, not a guess about the editor. `show()` reveals a hidden element. The code does not call `expand()` on an element it only `show()`s, so do not `collapse()` those.

**Make a Payment is on hold.** Do not place a native payment button. Rows marked ON HOLD stay in the code so an existing button does not throw, and they must not be added on these Studio pages. Balance text is a case fact, not a pay button.

Indemnitor remains the default portal role. Bail School students are not sent into the bail dashboards. This spec does not change that routing.

## Confirmed on the Studio canvas

Read from the Layers check that started this work. Anything not in that check is **Not confirmed**.

| Page | Id the code uses | On the canvas |
| --- | --- | --- |
| Portal (`portal-landing`) | `#portalLoginEmbed` | Yes |
| First Appearance | `#faScheduleEmbed` | Yes |
| Defendant Portal | `#defendantDashEmbed` | Yes |
| Defendant Portal | 22 native ids in the next section | No. Header/footer boxes and `text4` are on the canvas. The code does not select them. |
| Indemnitor Portal | `#IndemnitorDashEmbed` | Yes. Capital I. The code tries this id first, then `#indemnitorDashEmbed`. |
| Indemnitor Portal | 38 native ids in the indemnitor section | No. The Layers note called this set 37; the names in that note are the 38 rows below. |

---

## 1. Defendant Portal

File: `src/pages/portal-defendant.skg9y.js`. Route: `/portal-defendant`.

The HtmlComponent `#defendantDashEmbed` is the dashboard until the native elements exist. Page code posts display-only case fields into it and handles the actions it posts back. The session token stays in page code.

After a defendant session loads, paperwork status decides two containers:

- Complete, signed, or active: `hide()` `#bannerIncompletePaperwork` and `#boxIntakeWizardFallback`, `show()` `#boxAfterCareModules`.
- Anything else: `show()` `#bannerIncompletePaperwork` and set the banner text. The code does not hide the after-care box in this state.

Empty case fields become `Not on file — call the office`. The code does not invent a court, a balance, or a check-in time.

| Order | ID | Type | Section | Default text or label the code sets | Starts | When it shows |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `#defendantDashEmbed` | HtmlComponent | Dashboard embed | No text. URL is the Netlify defendant dashboard. | Visible. Already on the canvas. | Always. Receives `shamrock-dash-state`. |
| 2 | `#textUserWelcome` | Text | Welcome | `Welcome, {first last}` or `Welcome` | Visible. Code does not hide it. | Signed-in defendant. |
| 3 | `#bannerIncompletePaperwork` | Box | Paperwork banner | No text of its own. | Hidden only after a complete packet. Otherwise `show()`. | Packet not complete, signed, or active. |
| 4 | `#textPaperworkBanner` | Text | Paperwork banner. Place inside the banner box. | `Almost done — tap Continue to finish your signature.` | Same as the banner. | Incomplete packet. |
| 5 | `#btnContinuePaperwork` | Button | Paperwork banner | Label `Continue paperwork` | Same as the banner. | Incomplete packet. Opens the paperwork launchpad as defendant. |
| 6 | `#boxAfterCareModules` | Box | After-care | No text. | `show()` when the packet is complete. | Complete packet. Put the case, court, check-in, and document elements in this box. |
| 7 | `#textCaseNumber` | Text | Case summary card, inside after-care | Case number, or the not-on-file line | Visible inside after-care. | Signed-in defendant. |
| 8 | `#textBondAmount` | Text | Case summary card | Bond as `$1,234.56`, or the not-on-file line | Visible inside after-care. | Signed-in defendant. |
| 9 | `#textCaseStatus` | Text | Case summary card | `caseStatus`, or the not-on-file line | Visible inside after-care. | Signed-in defendant. |
| 10 | `#textNextCourtDate` | Text | Court card | Long date (`weekday, month day, year`) in America/New_York when the value is not `YYYY-MM-DD`, or the not-on-file line | Visible inside after-care. | Signed-in defendant. |
| 11 | `#textCourtLocation` | Text | Court card | `courtLocation`, or the not-on-file line | Visible inside after-care. | Signed-in defendant. |
| 12 | `#textCourtroom` | Text | Court card | `courtroom`, or the not-on-file line | Visible inside after-care. | Signed-in defendant. |
| 13 | `#textLastCheckIn` | Text | Check-in | `Last check-in: {date}` or `Last check-in: Not on file — call the office`. A failed check-in replaces this with the error sentence. | Visible inside after-care. | Signed-in defendant. |
| 14 | `#btnCheckIn` | Button | Check-in | Label `Check in`, then `Checking in…` while it runs | Visible inside after-care. | Defendant tap. One location read, then save. |
| 15 | `#btnViewDocuments` | Button | Documents | Code does not set a label. Use `View documents`. | Visible inside after-care. | Defendant tap. |
| 16 | `#textDocumentsList` | Text | Documents | Bullet list, `No documents on file yet.`, or `We could not load your documents. Call the office and we will help.` | Code calls `show()` after the list loads. It never `hide()` or `collapse()`s this id. Start it hidden, not collapsed. | After View documents. |
| 17 | `#btnAddAnotherBond` | Button | Actions | Code does not set a label. Use `Add another bond`. | Visible inside after-care. | Opens the launchpad in `additional-bond` mode. |
| 18 | `#btnLogout` | Button | Actions | Code does not set a label. Use `Log out`. | Visible inside after-care. | Ends the session and returns to `/portal-landing`. |
| 19 | `#boxIntakeWizardFallback` | Box | Wizard fallback | No text. | `hide()` when the packet is complete. | Incomplete packet. |
| 20 | `#defendantWizard` | HtmlComponent | Wizard fallback. Place inside the fallback box. | No text. | Same as the fallback box. The code does not `show()` or `hide()` this id itself. | Listens for `shamrock-defendant-submitted`. |
| — | `#btnMakePayment` | Button | ON HOLD. Do not place. | Code would send the case payment URL or the office payment link. | Do not add. | Not on this Studio page while payment is on hold. |
| — | `#textBalanceDue` | Text | Case summary, display only | Balance as money, or the not-on-file line | Visible if you place it. Not a pay button. | Signed-in defendant. |
| — | `#textPaymentStatus` | Text | Case summary, display only | Cleared to an empty string. Code does not write "Paid in Full". | Visible if you place it. | Signed-in defendant. |

---

## 2. Indemnitor Portal

File: `src/pages/portal-indemnitor.k53on.js`. Route: `/portal-indemnitor`.

Same embed pattern. The canvas id is `#IndemnitorDashEmbed`. If that lookup throws, the code tries `#indemnitorDashEmbed`. Do not rename the Studio element to the lowercase id.

Roles that load this page: `indemnitor` and `coindemnitor`. Anyone else goes back to `/portal-landing`.

On load, before the case returns, the code sets these text ids to `—` so editor demo copy (`John Smith`, `$50,000`, a fake date) cannot sit on a failed lookup: `#defendantNameText`, `#defendantStatusText`, `#lastCheckInText`, `#nextCourtDateText`, `#balanceDueText`, `#ppRemainingBalanceText`, `#ppPaymentTermsText`, `#ppNextDueDateText`, `#textTotalPremium`, `#textDownPayment`, `#textChargesCount`, `#textTotalLiability`.

Paperwork complete / signed / active hides `#bannerIncompletePaperwork` and `#boxIntakeWizardFallback` and shows `#boxAfterCareModules`. Otherwise it shows the banner. Missing values use `Not on file — call the office`.

Several facts have two ids. The code writes the same string to each one that exists. Build one. The second id is an alias if an older layout still has it.

| Order | ID | Type | Section | Default text or label the code sets | Starts | When it shows |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `#IndemnitorDashEmbed` | HtmlComponent | Dashboard embed | No text. Netlify indemnitor dashboard. | Visible. Already on the canvas. | Always. |
| 2 | `#textUserWelcome` | Text | Welcome. Alias `#welcomeText`. | `Welcome, {first last}` or `Welcome` | Visible. | Signed-in indemnitor or co-indemnitor. |
| 3 | `#bannerIncompletePaperwork` | Box | Paperwork banner | No text of its own. | Hidden only after a complete packet. | Incomplete packet. |
| 4 | `#textPaperworkBanner` | Text | Inside the banner | `Almost done — tap Continue to finish cosigner paperwork.` | Same as the banner. | Incomplete packet. |
| 5 | `#btnContinuePaperwork` | Button | Inside the banner. Alias `#btnResumeBond`. | Label `Continue paperwork` on `#btnContinuePaperwork` only | Same as the banner. | Launchpad as indemnitor. |
| 6 | `#boxAfterCareModules` | Box | After-care | No text. | `show()` when the packet is complete. | Complete packet. |
| 7 | `#textDefendantName` | Text | Case card. Alias `#defendantNameText`. | Defendant name, or the not-on-file line. Cleared to `—` first. | Visible inside after-care. | Signed in. |
| 8 | `#textCaseNumber` | Text | Case card | Case number, or the not-on-file line | Visible inside after-care. | Signed in. |
| 9 | `#textTotalLiability` | Text | Case card | Bond amount as money, or the not-on-file line. Cleared to `—` first. | Visible inside after-care. | Signed in. |
| 10 | `#textDefendantStatus` | Text | Case card. Alias `#defendantStatusText`. | Defendant status, or the not-on-file line | Visible inside after-care. | Signed in. |
| 11 | `#textChargesCount` | Text | Case card | Charge count, or the not-on-file line | Visible inside after-care. | Signed in. |
| 12 | `#nextCourtDateText` | Text | Court | Short date, or the not-on-file line | Visible inside after-care. | Signed in. |
| 13 | `#lastCheckInText` | Text | Check-in display. This page has no check-in button. | Short date, or the not-on-file line | Visible inside after-care. | Signed in. |
| 14 | `#textTotalPremium` | Text | Premium, display only | Money, plus ` (est. at 10%)` when the record says the premium is estimated. Not a pay button. | Visible inside after-care. | Signed in. |
| 15 | `#textDownPayment` | Text | Premium, display only | Money, or the not-on-file line | Visible inside after-care. | Signed in. |
| 16 | `#textBalanceDue` | Text | Balance, display only. Aliases `#balanceDueText`, `#ppRemainingBalanceText`. | Money, or the not-on-file line | Visible if placed. | Signed in. |
| 17 | `#textMonthlyPayment` | Text | Balance, display only. Alias `#ppPaymentTermsText`. | `$12.00/mo`, or the not-on-file line | Visible if placed. | Signed in. |
| 18 | `#textNextDueDate` | Text | Balance, display only. Alias `#ppNextDueDateText`. | `Due: {short date}`, or the not-on-file line | Visible if placed. | Signed in. |
| 19 | `#textPaymentStatus` | Text | Balance, display only | Cleared to an empty string | Visible if placed. | Signed in. |
| 20 | `#btnViewDocuments` | Button | Documents | Code does not set a label. Use `View documents`. | Visible inside after-care. | Tap loads the list. |
| 21 | `#textDocumentsList` | Text | Documents | Same three outcomes as the defendant list. `show()` after load. Do not collapse it. | Start hidden, not collapsed. | After View documents. |
| 22 | `#btnUploadCollateral` | Button | Actions | Code does not set a label. Use `Upload collateral`. | Visible inside after-care. | Opens `IdUploadLightbox` for collateral. |
| 23 | `#btnAddCoIndemnitor` | Button | Actions | Code does not set a label. Use `Add a co-signer`. | Visible inside after-care. | Launchpad as co-indemnitor, `add-cosigner`. |
| 24 | `#btnStartNewBond` | Button | Actions | Code does not set a label. Use `Start a bond`. | Visible inside after-care. | Launchpad as indemnitor, no case id. |
| 25 | `#callBtn` | Button | Actions | Code does not set a label. Use `Call the office`. | Visible inside after-care. | `tel:+12393322245`. |
| 26 | `#btnLogout` | Button | Actions. Alias `#indemnitorLogoutBtn`. | Code does not set a label. Use `Log out`. | Visible inside after-care. | `/portal-landing`. |
| 27 | `#boxIntakeWizardFallback` | Box | Wizard fallback | No text. | `hide()` when the packet is complete. | Incomplete packet. |
| 28 | `#indemnitorWizard` | HtmlComponent | Inside the fallback box | No text. | Same as the box. Code does not show or hide this id itself. | Listens for `indemnitor-submit-phase1`. |
| — | `#btnPayInstallment` | Button | ON HOLD. Do not place. Alias `#makePaymentBtn`. | Would open the case payment URL or the office payment link. | Do not add. | Not while payment is on hold. |

---

## 3. Portal (portal-landing)

File: `src/pages/portal-landing.bagfn.js`. Route: `/portal-landing`.

`#portalLoginEmbed` is on the canvas. The other ids were not in the Layers note. The native form and the embed both call the same magic-link function. Indemnitor is the default role. Co-indemnitor is collapsed unless the URL has `role=coindemnitor`, `role=co-indemnitor`, or `coindemnitor=true`. A Bail School address (`@bailschool` or `student@`) is refused and sent toward `/bail-school`.

| Order | ID | Type | Section | Default text or label the code sets | Starts | When it shows |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `#portalLoginEmbed` | HtmlComponent | Login embed | No text. Netlify `portal-login.html`. | Visible. Already on the canvas. | Always, when the element exists. |
| 2 | `#boxRoleSelection` | Box. Alias `#rolePickerContainer`. | Who are you | No text. | `expand()` and `show()` for a new session. | New user with no role yet. |
| 3 | `#textRoleHeading` | Text. Aliases `#rolePickerTitle`, `#portalHeroTitle`, `#textPortalTitle`. | Who are you | `Who are you? Pick one to start — no password needed.` | Set when the role picker runs. | Landing. |
| 4 | `#textRoleSubhead` | Text. Aliases `#rolePickerSubtitle`, `#portalHeroSubtitle`. | Who are you | `Most people helping a loved one tap Family. Already have a case? Send yourself a link below.` | Set when the role picker runs. | Landing. |
| 5 | `#tabIndemnitor` | Button | Role. Default. | Label and text `I'm family / helping someone out` | Visible. `active-tab` class unless a bond needs a co-indemnitor. | Tap opens the indemnitor launchpad. |
| 6 | `#btnRoleIndemnitor` | Button | Role | Same label | Visible | Same destination. |
| 7 | `#cardRoleIndemnitor` | Box | Role | No text | Visible | Same click, if it has `onClick`. |
| 8 | `#tabDefendant` | Button | Role | `I'm the person in jail` | Visible | Defendant launchpad. |
| 9 | `#btnRoleDefendant` | Button | Role | Same label | Visible | Same. |
| 10 | `#cardRoleDefendant` | Box | Role | No text | Visible | Same. |
| 11 | `#tabCoIndemnitor` | Button | Role | `I'm a second cosigner` | `collapse()` unless this bond needs a co-indemnitor. Then `expand()` and `show()`. | Only when the bond asks for one. |
| 12 | `#btnRoleCoIndemnitor` | Button | Role | Same label | Wired with the other role buttons. The tab and card carry the collapse. | Co-indemnitor launchpad. |
| 13 | `#cardRoleCoIndemnitor` | Box | Role | No text | `collapse()` unless needed, then `expand()` and `show()`. | Same condition as the tab. |
| 14 | `#roleDescriptionText` | Text | Role | Indemnitor: `Cosigner / Indemnitor Portal: Review paperwork, manage payment plans, and view receipts.` Defendant and co-indemnitor have their own sentences in the page code. | Set on load to the indemnitor sentence. | Changes with the selected role. |
| 15 | `#textDefendantMustSignNotice` | Text | Role | `Under Florida law, the defendant still signs on every bond. Cosigning provides required financial guarantee.` | Set whenever the role picker runs. | All three roles. |
| 16 | `#textLoginHeading` | Text. Aliases `#loginTitle`, `#textLoginTitle`. | Already started | `Already started? Get your secure link` | Set on load. | Returning clients. |
| 17 | `#boxLoginForm` | Box. Alias `#loginContainer`. | Login form | No text. | `collapse()` when a new user is shown the role picker. | Returning clients, and under the role picker. |
| 18 | `#emailPhoneInput` | Text input | Login form | Code does not set placeholder text. | Visible with the form. `focus()` when the form is wired. | Required before send. |
| 19 | `#getStartedBtn` | Button. Alias `#btnLogin`. | Login form | Label `Send my link`, then `Sending Link...`, then `Sent!` | Visible with the form. | Sends the magic link. |
| 20 | `#googleLoginBtn` | Button | Login form | Code does not set a label. | Optional. Missing id is skipped. | Google auth URL. |
| 21 | `#statusMessage` | Text | Login form | Error and success sentences from the send result. | Code sets it when a send runs. | After submit. |
| 22 | `#loginSpinner` | Box | Also used by the embed-less form path | No text. | Shown while a link is sending. | During send. |
| 23 | `#loginSuccessBox` | Box | Result | No text of its own. | Expanded on success. | After a link is sent. |
| 24 | `#successDetailText` | Text | Inside the success box | `We sent a secure sign-in link to {contact}. Please check your messages.` | With the success box. | Success. |
| 25 | `#loginErrorBox` | Box | Result | No text of its own. | Shown on failure. | Failed send. |
| 26 | `#loginErrorText` | Text | Inside the error box | The server message, or `We could not find an active case for that contact. Please call (239) 332-2245.` | With the error box. | Failure. |
| 27 | `#boxAIChat` | Box | Optional concierge | No text. | Wired only when this and the repeater both exist. | Optional. |
| 28 | `#repChatMessages` | Repeater | Concierge | Item ids are in `public/ai-concierge.js`: `#txtChatContent`, `#boxChatMessage`, `#txtChatRole`. | With the chat box. | Optional. |
| 29 | `#inputAIMessage` | Text input | Concierge | No default. | With the chat box. | Optional. |
| 30 | `#btnAISend` | Button | Concierge | No label from this page. | With the chat box. | Optional. |
| 31 | `#btnAIMinimize` | Button | Concierge | Collapses the chat box. | Optional. | Optional. |
| 32 | `#btnAIOpen` | Button | Concierge | Expands the chat box. | Optional. | Optional. |
| 33 | `#telegramHtml` | HtmlComponent | Optional | No text from this lookup. | Skipped when missing. | Optional. |
| 34 | `#loadingBox` | Box. Alias `#spinnerContainer`. | Session check | No text. | Shown while a token in the URL is checked. | Token links. |
| 35 | `#loadingText` | Text | Session check | Status while the token is checked. | With the loading box. | Token links. |
| 36 | `#portalCallBtn` | Button | Optional call | Link `tel:+12393322245`. Comment in code: "Need help? Call". | Skipped when missing. | Optional. |
| 37 | `#btnSendMagicLink` | Button | Second login form in the Studio bridge block. The first form uses `#getStartedBtn`. | No label from code. | Optional. The bridge returns immediately when this button is missing. | Optional. |
| 38 | `#inputLoginPhone` | Text input | That second form | Read as the phone. | Optional. | Optional. |
| 39 | `#inputLoginEmail` | Text input | That second form | Read as the email. | Optional. | Optional. |

`#EF4444` in this file is a color, not an element.

---

## 4. Home

File: `src/pages/HOME.c1dmp.js`. Two layers, both guarded. Build the Studio row. The classic ids are aliases the same file still binds if they exist.

Studio layer, top to bottom:

| Order | ID | Type | Section | What the code does | Starts |
| --- | --- | --- | --- | --- | --- |
| 1 | `#heroStartOnline` | Button | Hero | `/portal-landing` | Visible |
| 2 | `#heroCallEnglish` | Button | Hero | Link `tel:+12393322245` | Visible |
| 3 | `#heroCallSpanish` | Button | Hero | Link `tel:+17272952245` | Visible |
| 4 | `#heroTextSMS` | Button | Hero | Link `sms:+12399550178` | Visible |
| 5 | `#countyDropdown` | Dropdown | County | Options are the 67 Florida counties, Southwest Florida first. | Visible |
| 6 | `#countyGoBtn` | Button | County | Opens `/florida-bail-bonds/{slug}` for the dropdown value. | Visible |
| 7 | `#calcBailInput` | Text input | Calculator | Bail amount. | Visible |
| 8 | `#calcChargesInput` | Text input | Calculator | Optional charge count. | Visible |
| 9 | `#calcSubmitBtn` | Button | Calculator | Runs the 10% / $100-per-charge estimate. | Visible |
| 10 | `#calcResultBox` | Box | Calculator | `expand()` after a premium is calculated. `collapse()` when the amount is empty. | Start collapsed. The code uses collapse/expand, not show/hide. |
| 11 | `#calcPremiumAmount` | Text | Inside the result box | `$1,234.56` | With the result. |
| 12 | `#calcStatutoryNote` | Text | Inside the result box | `Florida sets the premium at 10% of the bond, with a $100 minimum per charge. This is an estimate; we confirm the exact premium before you sign.` | With the result. |

Classic ids the same file still binds. One control per row is enough if the Studio ids above exist.

| ID | Type | Goes to |
| --- | --- | --- |
| `#heroCallBtn` | Button | Scrolls to the county selector. It does not dial. |
| `#callNowBtn`, `#heroPhoneBtn`, `#headerCallBtn`, `#stickyCallBtn`, `#phoneCtaBtn` | Button | `tel:+12393322245` |
| `#callNowSpanishBtn` | Button | `tel:+17272952245` |
| `#telegramBotBtn`, `#openTelegramBtn`, `#telegramCtaBtn` | Button | `https://t.me/ShamrockBail_bot` |
| `#startOnlineBtn`, `#getStartedBtn`, `#getStartedButton`, `#btnStartBond`, `#startBondBtn`, `#startBondButton` | Button | `/portal-landing`, plus `?county=` when a county was stored |
| `#howBailWorksBtn` | Button | `/how-bail-works` |
| `#firstAppearanceBtn` | Button | `/first-appearance` |
| `#contactUsBtn` | Button | `/contact` |
| `#blogBtn` | Button | Blog route in `DEST.blog` |
| `#bailSchoolBtn`, `#goToBailSchoolBtn`, `#navBailSchool` | Button | `/bail-school` |
| `#bailSchoolRegistrationBtn`, `#bailSchoolScheduleBtn`, `#bailSchoolRegisterBtn`, `#viewBailSchoolScheduleBtn` | Button | `https://school.shamrockbailbonds.biz/schedule#register` |
| `#becomeBondsmanBtn` | Button | `/how-to-become-a-bondsman` |
| `#countySelector` | Dropdown | Alias of the county dropdown |
| `#telegramHubEmbed` | HtmlComponent | Telegram hub. `#telegramHubSection` is the section whose viewport enter can load it. |
| `#testimonialRepeater` | Repeater | Items `#testimonialText`, `#testimonialName`, `#quoteText`, `#authorName`. Code fills these from the testimonial records. |

---

## 5. Contact

File: `src/pages/Contact.ilgty.js`. Route: `/contact`.

Classic buttons and the Studio form are both in this file. Build the Studio block. Classic ids are optional aliases.

| Order | ID | Type | Section | Default text or label | Starts | Purpose |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `#contactCallEnglish` | Button | Call | Link `tel:+12393322245` | Visible | Call the office. |
| 2 | `#contactCallSpanish` | Button | Call | Link `tel:+17272952245` | Visible | Spanish line. |
| 3 | `#contactTextSMS` | Button | Call | Link `sms:+12399550178` | Visible | Text. |
| 4 | `#btnCallNow` | Button | Classic alias of call | `tel:+12393322245` | Optional | Same call. |
| 5 | `#btnTextNow` | Button | Classic alias of text | `sms:+12399550178` | Optional | Same text. |
| 6 | `#btnStartPaperwork`, `#btnGetSomeoneOut` | Button | Start | Paperwork launchpad, source `wix-contact` | Visible | Self-serve intake. |
| 7 | `#btnTelegramBot` | Button | Other channel | `https://t.me/ShamrockBail_bot` | Optional | Telegram. |
| 8 | `#capsTitle` | Text | Office | `Flagship Office · Fort Myers HQ` | Code sets this when the id exists. | Address heading. |
| 9 | `#textCapsTitle` | Text | Office | `1528 Broadway, Fort Myers, FL 33901` | Code sets this. | Street line. |
| 10 | `#officeHeading` | Text | Office | `Southwest Florida Headquarters` | Code sets this. | Heading. |
| 11 | `#inputName` | Text input | Form | Empty after a successful Studio submit. | Visible | Required. |
| 12 | `#inputPhone` | Text input | Form | Empty after success. | Visible | Required. 10 digits on the Studio form. |
| 13 | `#inputEmail` | Text input | Form | Optional on the Studio form. | Visible | Email. |
| 14 | `#dropdownCounty` | Dropdown | Form | 67 counties. Value `Lee` when empty. | Visible | County. |
| 15 | `#dropdownJail` | Dropdown | Form | `{County} Jail` plus `Not sure`, if the editor left it empty. The classic path fills jail names from `getCounties()`. | Visible | Jail or county. |
| 16 | `#inputInmateName` | Text input | Form. Classic alias `#inputDefendantName`. | Required on the Studio form. | Visible | Defendant name. |
| 17 | `#inputMessage` | Text input | Form. Classic alias `#inputNotes`. | Optional. | Visible | Notes. |
| 18 | `#checkboxConsent` | Checkbox | Form | Must be checked on the Studio form. The classic path treats a missing box as consented. | Visible, unchecked. | Consent to be contacted. |
| 19 | `#submitContactBtn` | Button | Form. Classic alias `#btnSubmit`. | Classic path sets the label to `Send Message`, `Submitting...`, then `Message Sent ✅`. | Visible. `#submitSpinner` is `hide()` until submit. | `submitContactForm`. |
| 20 | `#submitSpinner` | Element with `show`/`hide` | Form | No text. | Hidden. | During submit. |
| 21 | `#successBox` | Box | Result | No text. `expand()` on success. | Collapsed until success. | Success. |
| 22 | `#errorBox` | Box | Result | No text. | Collapsed until an error. | Error. |
| 23 | `#errorMsgText` | Text | Inside the error box. Classic alias `#textError`. | Validation sentences, then `Connection error. Please call (239) 332-2245. Phones are answered 24/7.` | Hidden until an error. | Error copy. |
| 24 | `#textSuccess` | Text | Classic result | `Thank you. A bondsman will call you back. Ready to start paperwork? Tap 'Start Paperwork Online'.` | `show()` on classic success. | Classic form only. |

Classic-only inputs the Studio form does not read: `#dropdownRelationship`, `#datePickerDefendantDOB`, `#inputBookingNumber`, `#inputCharges`, `#dropdownSource`. Safe to omit on the Studio contact page. The code skips a missing id.

---

## 6. Florida Counties (Item)

File: `src/pages/Florida Counties (Item).ygoim.js`. Dynamic item. URL: `/florida-bail-bonds/{countySlug}`.

The file's own note says `#countyFaqRepeater` and `#text65` are the Studio ids. The heading copy "Questions families ask" is that note, not a string the code writes. The code only collapses and expands `#text65`.

On load the code sets `#countyFaqRepeater` data to `[]` and collapses the repeater and `#text65`, so placeholder FAQ rows do not flash. When real FAQs return, it expands both and fills each item. With no FAQs, both stay collapsed.

| Order | ID | Type | Section | Default text | Starts | Purpose |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `#dynamicDataset` | Dataset. Alias `#countyDataset`. | Page data | None. | Connected to FloridaCounties. | `getCurrentItem()` for this county. Build one. |
| 2 | `#text65` | Text | FAQ heading | Code does not set the words. | `collapse()` until at least one FAQ renders, then `expand()`. | Section title. |
| 3 | `#countyFaqRepeater` | Repeater | FAQ | Item data from Import22. | Collapsed and emptied on load. Expanded when FAQs render. | One item per FAQ. |
| 4 | `#faqQuestion` | Text, inside the repeater. Aliases `#questionText`, `#faqTitle`. | FAQ item | The FAQ title. Placeholder text matching `question` / `heading` / `add paragraph text` is cleared and collapsed. | With the item. | Question. Build `#faqQuestion`. |
| 5 | `#faqAnswer` | Text, inside the repeater. Aliases `#answerText`, `#faqBody`. | FAQ item | The FAQ answer. Same placeholder rule. | With the item. | Answer. Build `#faqAnswer`. |

`#x` is only in a comment in other files. It is not an element here.

---

## 7. Counties hub

File: `src/pages/Florida Bail Bonds.liggp.js`. Live URL: `/florida-bail-bonds-1`.

One rich text element. Id: `#comp-mumy2zct`. Type: Text (`.html`). The code does not pick it by a nickname. It looks through `$w('Text')` for that id, then tries `$w('#comp-mumy2zct')`. Do not rename it. The code appends a list of `/florida-bail-bonds/{county}` links and calls `expand()`. The editor H1 is left alone. The directory label in code comments is the existing "SWFL County & Jail Directory" body, not a new H1.

---

## 8. How Bail Works

File: `src/pages/How Bail Works.lrh65.js`. Route: `/how-bail-works`.

Studio buttons, if you add them: `#hbwCallEnglish` (`tel:+12393322245`), `#hbwCallSpanish` (`tel:+17272952245`), `#hbwTextSMS` (`sms:+12399550178`), `#hbwStartOnline` (paperwork launchpad). All optional.

Repeaters the code fills when the id exists. Each starts visible. Item text is the strings in `setupBailProcess`, `setupBailBondsExplained`, `setupTypesOfBail`, and `setupBailAmounts`.

| Order | ID | Type | Children | Purpose |
| --- | --- | --- | --- | --- |
| 1 | `#processRepeater` | Repeater | `#processTitle`, `#processBody` | Five steps, titles `1. Booking & Charges` through `5. Court Appearances`. |
| 2 | `#bondsRepeater` | Repeater | `#cardTitle`, `#cardBody` | Premium, indemnitor, paperwork, ID scan. |
| 3 | `#typesRepeater` | Repeater | `#typeTitle`, `#typeBody`, `#typeProsCons` | Cash bail, surety bond, property bond, own recognizance. |
| 4 | `#factorsRepeater` | Repeater | `#factorTitle`, `#factorBody` | Severity, history, flight risk, public safety. |
| 5 | `#faqRepeater` | Repeater | Question/answer text ids the FAQ binder tries: `#faqQuestion`, `#faqAnswer`, `#question`, `#answer`, `#title`, `#text1`, `#text2`. | CMS FAQs. Alias repeaters: `#repeaterFAQ`, `#listRepeater`, `#repeater1`, `#repeater2`. Build one. |
| 6 | `#chargesTable` | Table. Aliases `#table1`, `#table2`. | Columns Offense or Charge, Typical Bail Range. | CMS common charges. |
| 7 | `#startBailProcessBtn` | Button | Label is whatever the editor sets. | Paperwork launchpad. |
| 8 | `#bottomOnlineBtn` | Button | Editor label. | Same launchpad. |
| 9 | `#bottomCallBtn` | Button | Editor label. | `tel:+12393322245`. |
| 10 | `#text68`, `#faqHeader`, `#step5Text` | Text | Code demotes an H1 inside `.html` to an H2. A comment names `#pageTitle` as the H1 to keep. The code does not select `#pageTitle`. | Do not make these three the page H1. |

`#heroCallBtn`, `#heroCallButton`, and `#heroCallLink` are retargeted to the main office number when their link still contains `2399550301`.

---

## 9. Bail School

File: `src/pages/Bail School.sftg6.js`. Route: `/bail-school`.

This is the public school page, not the bail client portal. Students stay on this side.

| Order | ID | Type | Section | What the code sets | Starts |
| --- | --- | --- | --- | --- | --- |
| 1 | `#bailSchoolEmbed` | HtmlComponent | Page | URL of the Netlify bail-school embed. Height follows the embed's resize message. | Visible |
| 2 | `#bsCallEnglish` | Button | Calls | `tel:+12393322245` | Visible |
| 3 | `#bsCallSpanish` | Button | Calls | `tel:+17272952245` | Visible |
| 4 | `#bsTextSMS` | Button | Calls | `sms:+12399550178` | Visible |
| 5 | `#bsStartOnline` | Button | Calls | Tracks the click. | Visible |
| 6 | `#course120Price` | Text | Courses | `$649` | Visible |
| 7 | `#course120EnrollBtn` | Button | Courses | Click is tracked. The embed owns the enroll destination. | Visible |
| 8 | `#course20Status` | Text | Courses | `Pending course approval` | Visible |

Member pages, separate from this public page:

- `src/pages/members/bail-school-dashboard.js`: `#loadingSpinner` (show, then hide), `#dashboardGroup` (hidden until courses render), `#noCoursesText` (hidden, shown when there are no enrollments), `#errorText` (hidden; text `Failed to load courses. Please contact support.`), `#courseRepeater` with `#courseNameText`, `#progressBar`, `#courseStatusText`, `#continueButton` (`View Certificate` or `Continue Course`).
- `src/pages/members/bail-school-course-player.js`: `#loadingSpinner`, `#contentGroup`, `#lessonRepeater` with `#lessonTitle`, `#lessonIcon`, `#lessonBox`, plus `#lessonHeading`, `#lessonDescription`, `#videoHtmlComponent`, `#nextButton` (hidden until the lesson ends, then shown).

`src/pages/How to Become a Bondsman.y8dfc.js` buttons: `#bailSchoolScheduleBtn`, `#scheduleBtn`, `#viewScheduleBtn` go to the school schedule. `#enrollBailSchoolBtn`, `#bailSchoolEnrollBtn` go to register. `#viewCoursesBtn` and `#bailSchoolBtn` / `#goToBailSchoolBtn` go to `/bail-school`. `#startBailProcessBtn` goes to `/portal-landing`. `#contactUsBtn` goes to `/contact`. `#heroTitle`, `#bailSchoolCtaTitle`, and `#text138` are text the SEO/heading helpers may demote. All optional.

---

## 10. About

File: `src/pages/About.xal5r.js`. Route: `/about`.

One element: `#startBailProcessBtn`, Button. Click goes to `/portal-landing`. The code does not set the label and does not hide it. The rest of the file is SEO. Not confirmed on the Layers panel.

---

## 11. Privacy Policy

File: `src/pages/Privacy Policy.kq1bu.js`. Route: `/privacy-policy`.

No `$w('#id')` calls. SEO only. Nothing to add for the code.

The lightbox `src/pages/PrivacyLightbox.gambc.js` is separate: `#privacyTitle` text `Privacy Policy`, `#privacyContent` the policy text, `#closeBtn` closes the lightbox. All optional.

---

## 12. Terms and Conditions

File: `src/pages/terms-and-conditions.e6rv6.js`.

| ID | Type | Text the code sets | Notes |
| --- | --- | --- | --- |
| `#termsTitle` | Text. Alias `#pageTitle`. | `Terms & Conditions` | Build one. |
| `#termsContent` | Text. Aliases `#textTerms`, `#textContent`. | The terms body from `getDetailedTermsText()`. | Build one. |
| `#lastUpdatedText` | Text. Alias `#textUpdated`. | `Last Revised: August 2026` | Build one. |
| `#btnCallDesk` | Button. Alias `#btnEmergencyCall`. | Click dials `tel:2393322245`. | Build one. |
| `#btnStartIntake` | Button. Alias `#btnGetStarted`. | Click goes to `/portal-landing`. | Build one. |

`src/pages/TermsLightbox.nlr62.js`: `#termsTitle` = `Terms of Service`, `#termsContent` = the short terms text, `#closeBtn` closes, `#acceptBtn` closes with accepted. Optional.

---

## 13. First Appearance

File: `src/pages/first-appearance.h4fpl.js`. Route: `/first-appearance`.

`#faScheduleEmbed` is on the canvas. When that id is the embed, the code loads `first-appearance-schedules.html`. `#firstAppearanceEmbed` is the older full-page embed. Build the Studio id only.

Other ids, all optional, used by the schedule repeater path:

| ID | Type | Behavior |
| --- | --- | --- |
| `#repeaterSchedules` | Repeater | Schedule rows. |
| `#searchCountyInput` | Text input | Filters counties. |
| `#scheduleSpinner` | Element with show/hide | Shown while schedules load. |
| `#noResultsBox` | Box | Shown when the filter matches nothing. |
| `#clearFilterBtn` | Button | Clears the filter. |
| `#textWeekdaysTime`, `#textWeekendsTime`, `#textCourtLocation`, `#textScheduleNotes`, `#textCircuitTitle`, `#textCountiesList` | Text | Filled from the schedule record. |
| `#btnOpenZoomLink` | Button | Opens that county's link. |
| `#crawlableCopy`, `#faIntro`, `#pageIntro`, `#seoBody`, `#textSEO` | Text | Crawlable copy. The code reads or sets HTML on the first of these that exists. |
| `#html1`, `#html2`, `#htmlComponent1`, `#htmlEmbed` | HtmlComponent | Older embed aliases. Do not add them next to `#faScheduleEmbed`. |

---

## 14. Testimonials

File: `src/pages/Testimonials (List).bv3hz.js`. Route: `/testimonials`.

No `$w('#id')` calls. SEO only.

---

## 15. Data Deletion

File: `src/pages/data-deletion.o9dzr.js`.

No `$w('#id')` calls. SEO only. `noindex`.

---

## 16. Communication Preferences

File: `src/pages/Communication Preferences.f870g.js`.

One element: `#html1`, HtmlComponent. The embed draws the form. Page code listens for `savePreferences` and posts `loadPreferences`, `saveSuccess`, or `saveError`. Missing embed: the page still loads and the post is skipped. Not confirmed on the Layers panel.

---

## 17. masterPage

File: `src/pages/masterPage.js`. Site-wide. Every lookup is guarded. Two layers.

Studio layer to build in the header and footer:

| Order | ID | Type | Section | What the code sets | Starts |
| --- | --- | --- | --- | --- | --- |
| 1 | `#headerCallEnglish` | Button | Header | `tel:+12393322245` | Visible |
| 2 | `#headerCallSpanish` | Button | Header | `tel:+17272952245` | Visible |
| 3 | `#headerTextLink` | Button | Header | `sms:+12399550178` | Visible |
| 4 | `#headerPortalLogin` | Button | Header | `/portal-landing` | Visible |
| 5 | `#headerStartOnline` | Button | Header | `/portal-landing` | Visible |
| 6 | `#emergencyBanner` | Box | Optional banner | No text from code. | Visible until `#closeBannerBtn` collapses it. |
| 7 | `#closeBannerBtn` | Button | On the banner | Collapses `#emergencyBanner`. | With the banner. |
| 8 | `#mobileNavDrawer` | Box | Optional drawer. Skip if the native Studio menu is used. | `show('fade')` / `hide('fade')`. | Hidden until `#mobileMenuBtn`. |
| 9 | `#mobileMenuBtn` | Button | Header | Opens the drawer. | Visible if you build the drawer. |
| 10 | `#closeNavBtn` | Button | Drawer | Hides the drawer. | Inside the drawer. |
| 11 | `#footerYear` | Text | Footer | The current year. | Visible |
| 12 | `#footerCallEnglish` | Button | Footer | `tel:+12393322245` | Visible |
| 13 | `#footerCallSpanish` | Button | Footer | `tel:+17272952245` | Visible |
| 14 | `#footerTextLink` | Button | Footer | `sms:+12399550178` | Visible |

ON HOLD, do not place: `#footerPaymentLink` (the code would set it to the office payment link) and `#mobileMakePaymentBtn` (the code would only record a payment click).

Other masterPage ids are optional classic chrome. The code binds them when present: `#mobileMenuButton` / `#mobileMenu` (menu toggle), `#emergencyCallButton`, `#findMyJailBtn`, `#navFindJail`, `#stickyCallBtn`, `#stickyEmergencyBtn`, `#mobileBottomCallBtn`, `#mobileStickyCallBtn`, `#mobileStickyCallBar` (all dial `tel:+12393322245` except the bar, which is a container), `#loginButton` / `#loginBtn` / `#portalButton` / `#headerLoginBtn` (portal), `#copyrightText`, `#footerLinkCounties`, `#footerLinkDirectory`, `#bailSchoolNavLink`, `#navBailSchool`, `#headerBailSchoolBtn`, `#footerBailSchoolBtn`, `#footerLinkBailSchool`, `#bailSchoolRegistrationBtn` (school register URL), `#btnFirstAppearance`, `#firstAppearanceNav`, `#headerFirstAppearance`, `#headerFirstAppearanceBtn`, `#footerFirstAppearance`, `#footerLinkFirstAppearance`, `#menuFirstAppearance`, `#navFirstAppearance` (first appearance), `#footerLinkPrivacy`, `#footerPrivacy`, `#linkPrivacy`, `#privacyLink`, `#footerLinkTerms`, `#footerTerms`, `#linkTerms`, `#termsLink`. `#siteLogoText`, `#headerBrandText`, `#headerTxtShamrock` are logo text the SEO helper may demote from H1. `#marketingBanner`, `#promoTicker`, `#salesAnnouncement`, `#leadPopupTrigger`, `#headerSalesCta`, `#button19` are optional promotional elements the same file guards.

`public/siteHeader.js` and `public/siteFooter.js` are not imported by masterPage (that file cannot import `public`). Their ids (`#navHome`, `#navFindJail`, `#footerPhone`, `#newsletterForm`, and the rest in those files) apply only if a page calls them. They are guarded.

---

## Other Velo pages that select elements

These are not the Studio marketing set. Ids are still guarded.

| Page file | Ids | What the code does |
| --- | --- | --- |
| `Blog.lttyy.js` | `#datasetBlog` or `#dynamicDataset`; category buttons `#btnCatAll`, `#btnCatBailTips`, `#btnCatCountySpotlight`, `#btnCatHowBailWorks`, `#btnCatStatutes`; `#inputNewsroomSearch`; `#btnSubscribeLegalAlerts`, `#inputSubscribeEmail`, `#txtSubscribeMsg`; call buttons `#btnNewsroomCallDesk`, `#btnNewsroomEmergencyCall`, `#btnNewsroomPhone`; intake buttons `#btnNewsroomStartIntake`, `#btnNewsroomStartPaperwork`, `#btnStartIntakeBlog` | Filter, search, subscribe, call, start intake. |
| `Post.nc3ia.js` | Share buttons `#btnArticleShare`, `#btnCopyArticleLink`, `#btnShareCopyLink`, `#btnShareFacebook`, `#btnShareSMS`, `#btnShareText`, `#btnShareWhatsApp`; call `#btnCallHotline`, `#btnPostCallDesk`, `#btnPostEmergencyCall`, `#btnPostPhone`; intake `#btnPostStartIntake`, `#btnPostStartPaperwork`, `#btnStartPaperworkPost`; `#txtArticleReadTime`, `#txtArticleReviewer`; toast `#txtShareFeedback` or `#txtToastMsg` | Article chrome. |
| `Communication Preferences` | Covered above. | |
| `ConsentLightbox.jdcsn.js` | `#htmlConsent` HtmlComponent | Agree / decline messages. |
| `IdUploadLightbox.ihrs0.js` | `#uploadTitle`, `#instructions`, `#cameraGuideOverlay` or `#idCardFrame`, `#frontPreview` / `#frontIdPreview`, `#backPreview` / `#backIdPreview`, upload buttons `#uploadFrontDl`, `#uploadBackDl`, `#idFrontUpload`, `#idBackUpload`, `#frontIdUpload`, `#backIdUpload`, inputs `#inputFullName`, `#inputDob`, `#inputDlNumber`, `#inputStreet`, `#inputCity`, `#inputState`, `#inputZip`, `#inputSex`, `#inputExpiration`, `#inputEmail`, `#inputPhone`, `#inputDefendantCounty`, `#skipScanBtn`, `#submitBtn`, `#closeBtn`, `#cancelBtn`, `#statusMessage`, `#errorMessage`, `#progressBar` | ID scan lightbox. Title and instructions are set in code. |
| `SigningLightbox.sjr0i.js` | `#signingTitle`, `#signingInstructions`, `#sigProgressText`, `#signingFrame`, `#signingProgressBar`, `#loadingIndicator`, `#errorMessage`, `#boxExpiredNotice`, `#expiredTitle`, `#expiredMessage`, `#btnRequestNewLink`, `#boxSigningControls`, `#btnJumpNextSig`, `#cancelBtn`, `#boxSigningSuccess`, `#successTitle`, `#successMessage`, `#btnCloseSuccess` | Signing lightbox. Titles are set in code. `#signingFrame` is the HtmlComponent. |
| `DefendantDetails.jgsv8.js` | `#detailsNameText`, `#detailsCaseNumberText`, `#detailsBondText`, `#detailsStatusText`, `#signingStatusText`, `#closeBtn`, `#approveBtn`, `#sendEmailBtn`, `#sendSmsBtn`, `#openKioskBtn` | Staff case lightbox. Text comes from the case. |
| `portal-staff.qs9dx.js` | Many staff and lobby ids, including `#welcomeText`, `#staffMessage`, `#caseListRepeater` | Retired. On load the page redirects to the CRM. Do not rebuild it on Studio. |
| `Florida Counties.qx7lv.js` | Large alias set. See below. | Older county page. Studio's item page is section 6. |
| Boilerplate only | `Fullscreen Page`, `Search Results`, `Search Suggestions`, `Signup`, `Custom Member Page` | The only `#elementID` is the Wix sample comment. Do not build it. |

### Florida Counties.qx7lv.js alias rule

`setText` writes the same string to every alias that exists and then `expand()`s it. `setTextOrCollapse` collapses the whole alias list when the value is empty. Build **one** element, using the first id. Extra aliases repeat the same line.

Hero and about, in order: `#countyName` (aliases `#countyNameHeadline`, `#dynamicHeader`, and on the error path the text `Bail Bonds in Florida`); `#heroSubtitle` (`#aboutCountyText`, `#heroDescription`); `#aboutHeader` (`#aboutTitle`, `#textAboutCounty`, `#aboutSectionTitle`, `#textAboutTitle`); `#aboutBody` (`#aboutText`, `#aboutDescription`, `#aboutContent`, `#textAboutBody`); `#whyChooseHeader` (`#whyChooseTitle`); `#whyChooseBody` (`#whyChooseText`); `#serviceAreasText` (`#textServiceAreas`, `#serviceAreas`).

Facts, each `Label: value`, collapsed when empty: `#factCountySeat`, `#factCircuit`, `#factJailName`, `#factJailAddress`, `#factCourthouse`, `#factFirstAppearance`, `#factMajorCities`. The `#facts…` twins are aliases. `#factsBox` (`#factsSection`, `#boxFacts`) collapses when no fact is shown. `#factsLastVerified` (`#textFactsLastVerified`) is the verified date. `#factInmateSearchBtn` (`#findSomeoneInJailBtn`, `#btnFindInJail`) links the inmate search.

Jail and clerk: `#jailName` (`#jailTitle`, `#textJailName`) with label `#jailNameLabel`; `#sheriffPhone` (`#jailPhone`, `#textJailPhone`) with `#jailPhoneLabel`; `#jailAddress` (`#textJailAddress`, `#jailLocation`) with `#jailAddressLabel`; `#clerkName` (`#clerkTitle`, `#textClerkName`) with `#clerkNameLabel`; `#clerkPhone` (`#clerkContact`, `#textClerkPhone`) with `#clerkPhoneLabel`; `#sheriffName` (`#sheriffTitle`, `#textSheriffName`) with `#sheriffNameLabel`; `#sheriffContactPhone` (`#textSheriffPhone`) with `#sheriffPhoneLabel`.

Buttons: `#heroCallButton` and aliases `#callShamrockBtn`, `#callCountiesBtn`, `#btnEmergencyCall`, `#ctaCallOfficeBtn` dial the main office. `#ctaCallAutoBtn` (`#heroAutoLineButton`) is the Spanish line. `#ctaTextBtn` (`#heroTextButton`) is the text line. `#heroStartButton` and `#startBailBtn`, `#getSomeoneOutBtn`, `#btnGetOut`, `#startOnlineBtn`, `#btnGetSomeoneOut` open the launchpad. `#inmateSearchBtn` and its aliases open inmate search. `#firstAppearanceBtn` and `#faScheduleBtn`, `#btnFirstAppearance`, `#viewCourtScheduleBtn` open first appearance.

Links: `#countyHubBtn`, `#jailPageBtn`, `#courtRecordsBtn`, `#callSheriffBtn`, `#sheriffWebsite`, `#callClerkBtn`, `#directoryLink` (`View All 67 Florida Counties`), `#howBailWorksLink`, `#aboutUsLink`, `#contactLink`, `#blogLink`, `#testimonialsLink`. City pages go in `#cityPagesText` (`#textCityPages`, `#communitiesLinks`) as HTML.

FAQ repeater: one of `#faqRepeater`, `#repeaterFAQ`, `#countyFaqRepeater`, `#listRepeater`. Children `#textQuestion` / `#faqQuestion` and `#textAnswer` / `#faqAnswer`. `#sectionFAQ` and `#faqSection` expand when there are FAQs. `#loadingIndicator` hides and `#countyContent` expands after the county loads.

The ids in the "left over" scan (`#answerBox`, `#leeAnswersRepeater`, `#nearbyCountiesRepeater`, `#neighborName`, `#spanishCallBtn`, `#smsBondsmanBtn`, and the rest of that set) are optional siblings the same file collapses or fills when present. Do not add them on the ygoim item page. That page's list is section 6.

---

## How the missing-element check was made

`scripts/test_studio_element_guards.mjs` reads every file under `src/pages` and `src/public`. It fails if `$w(...)`, `$item(...)`, or `this._$w(...)` is not inside a `try` in that same function. A `try` around the caller does not count, because a click handler runs later. `$w('Text')` and other type selectors are allowed: Wix returns an empty selection instead of throwing. The test also requires `#IndemnitorDashEmbed` to appear before `#indemnitorDashEmbed`, and requires both portal pages to keep every native id.
