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

## 📏 RULES OF ENGAGEMENT

1.  **Exact Match**: IDs MUST match exactly (case-sensitive).
2.  **No Wix Auto-IDs**: Never use `button1`, `box5`, `text12`. Rename immediately.
3.  **No Duplicates**: IDs must be unique per page.
4.  **Immutable**: Do not rename IDs after deployment.

> [!TIP]
> If an element is missing or named incorrectly in the Editor, **fix the Editor**, do not change the code.
