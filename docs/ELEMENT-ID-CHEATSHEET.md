# ELEMENT ID CHEATSHEET — DO NOT DEVIATE

> [!CAUTION]
> **BINDING CONTRACT**
> Element IDs are case-sensitive and binding.
> Changing an ID without updating the corresponding code is a **BREAKING CHANGE**.
> **Violation = Broken Functionality.**

---

## 🌍 GLOBAL (MASTER PAGE)
Elements valid on **every** page.

| ID | Description |
| :--- | :--- |
| `#phoneNumber` | Primary contact number display. |
| `#callButton` | Desktop call CTA. |
| `#headerCallBtn` | Header navigation call button. |
| `#loginBtn` | Member portal login button. |
| `#stickyMobileCTA` | Floating CTA for mobile users. |

---

## 🏠 HOMEPAGE
Main landing page elements.

| ID | Description |
| :--- | :--- |
| `#countyDropdown` | Main county selector. |
| `#getStartedButton` | Primary hero CTA. |
| `#startBondButton` | Secondary CTA. |
| `#featuredCountiesRepeater` | Grid of top counties. |
| `#heroTitle` | Main H1 header. |
| `#heroSubtitle` | H2 subheader. |

---

## 📂 COUNTY DIRECTORY
Search and listing page for all service areas.

| ID | Description |
| :--- | :--- |
| `#countySearch` | Text input for filtering. |
| `#regionFilter` | Dropdown/tag filter for regions. |
| `#countyRepeater` | The list of results. |
| `#countyCount` | Text element showing number of results. |
| `#noResultsMessage` | Empty state display. |

---

## 📍 DYNAMIC COUNTY PAGE
Individual county detail pages (e.g., `/bail-bonds/lee`).

| ID | Description |
| :--- | :--- |
| `#nearbyCountiesRepeater` | Sidebar or footer list of neighbors. |
| `#callShamrockBtn` | Direct line to Shamrock. |
| `#callSheriffBtn` | External link to Sheriff / Jail. |
| `#callClerkBtn` | External link to Clerk of Court. |

---

## 🔐 MEMBER PORTAL
Secure area for indemnitors and defendants.

> [!IMPORTANT]
> These elements control the legal workflow. Do not alter.

| ID | Description |
| :--- | :--- |
| `#geolocationConsent` | GPS location consent toggle/button. |
| `#termsConsent` | Terms of Service checkbox. |
| `#startPaperworkBtn` | **THE TRIGGER**. Initiates SignNow handoff. |
| `#pendingDocsRepeater` | List of unsigned documents. |
| `#requiredDocsRepeater` | List of completed/required uploads. |
| `#errorMessage` | Universal error feedback text. |
| `#btnSubmitInfo` | Indemnitor portal intake submit button. |
| `#btnSubmitLink` | Indemnitor portal "Find My Paperwork" button. |
| `#inputLinkCaseNumber` | Indemnitor portal case number lookup input. |
| `#inputLinkIndemnitorName` | Indemnitor portal indemnitor last name lookup input. |
| `#county` | Indemnitor portal county dropdown. |

---

## 📞 CONTACT PAGE
General inquiry form.

| ID | Description |
| :--- | :--- |
| `#contactName` | Input: User name. |
| `#contactEmail` | Input: User email. |
| `#contactPhone` | Input: User phone. |
| `#contactMessage` | Input: Message body. |
| `#contactSubmitBtn` | Form submit action. |
| `#formSuccess` | Success message container. |
| `#formError` | Error message container. |

---

## 🧑‍💼 STAFF PORTAL (`/portal-staff`)

| ID | Description |
| :--- | :--- |
| `#staffPortal` | HtmlComponent hosting `public/staff-portal.html` (Command Center). Required for the in-iframe staff prompt. |
| `#staffPromptElement` | Optional Custom Element `shamrock-staff-prompt` if the iframe is not on the page. |
| `#welcomeText` | Staff greeting / connection status. |

### StaffPromptLightbox (create in Wix Editor)

Lightbox **name:** `StaffPromptLightbox`. Bind `src/lightboxes/StaffPromptLightbox.js`.

| ID | Description |
| :--- | :--- |
| `#promptTitle` | Prompt heading |
| `#promptHint` | Helper text |
| `#promptInput` | Text input (input mode) |
| `#promptSelect` | Dropdown (select mode) |
| `#promptConfirmBtn` | Continue — min 44px |
| `#promptCancelBtn` | Cancel — min 44px |

---

## 📱 PROPOSED STUDIO INTAKE WIZARD (`/portal-start`)
Proposed IDs for future Wix Studio canvas layout. (Backend is wired in `portal-start.js`; canvas elements to be placed in Studio).

| ID | Description |
| :--- | :--- |
| `#roleSelectDefendant` | Role Selection: Defendant button |
| `#roleSelectIndemnitor` | Role Selection: Primary Indemnitor button |
| `#roleSelectCoIndemnitor` | Role Selection: Co-Indemnitor button |
| `#btnStartCamera` | Step 1: Launch camera / file picker |
| `#uploadIdInput` | Step 1: Native file/image upload input |
| `#btnSwitchCameraSide` | Step 1: Toggle front/back ID capture |
| `#ocrConfidenceBadge` | Step 1: OCR confidence score indicator |
| `#step0RoleBox` | Wizard Step 0 container (Role Selection) |
| `#step1CameraBox` | Wizard Step 1 container (ID Camera Scan) |
| `#step2ReviewBox` | Wizard Step 2 container (Identity Review) |
| `#step3CaseFactsBox` | Wizard Step 3 container (Charges & Bond Facts) |
| `#step4DeltaBox` | Wizard Step 4 container (Employment & References) |
| `#step5PreviewBox` | Wizard Step 5 container (Plain Paperwork Preview) |
| `#btnNextStep` | Wizard primary navigation: Next Step |
| `#btnPrevStep` | Wizard primary navigation: Previous Step |
| `#btnSaveDraft` | Wizard secondary action: Save Draft |
| `#btnLaunchDocuSeal` | Step 5 Final CTA: Sign Paperwork Launchpad |
| `#wizardStatusMessage` | Real-time status / error message text |

---

## 📏 RULES OF ENGAGEMENT

1.  **Exact Match**: IDs MUST match exactly (case-sensitive).
2.  **No Wix Auto-IDs**: Never use `button1`, `box5`, `text12`. Rename immediately.
3.  **No Duplicates**: IDs must be unique per page.
4.  **Immutable**: Do not rename IDs after deployment.

> [!TIP]
> If an element is missing or named incorrectly in the Editor/Studio, **fix the Editor/Studio**, do not change the code.
