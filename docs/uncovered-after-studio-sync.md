# Logic uncovered after the Studio sync

Commit `e949e9e` is the owner's `wix dev` sync with Wix Studio. It is the page-file source of truth: `uiVersion` 543, classic page files removed, Studio popup and member pages kept.

Element IDs below come from the Studio Layers inventory (PR #97) and from `docs/studio-element-spec.md`. A lookup for an id that is not on the canvas is guarded and does nothing.

## Hub directory builder (page wiring)

**Blocked.** The page code is in place. The canvas element is not.

`src/pages/Counties.p9w2k.js` calls `buildHubCountyDirectoryHtml` and `appendHubCountyDirectory` from `src/public/floridaCountyDirectory.js`. `paintHubDirectory` looks through `$w('Text')` for `HUB_COUNTY_DIRECTORY_ELEMENT_ID` (`#comp-mumy2zct`), then tries that id directly. Both lookups are guarded. `repeater1` is not read.

The Layers inventory found no text or HTML element that replaced `#comp-mumy2zct`. `repeater1` is a button list and is not the crawlable anchor list.

Owner needs to add one rich text element, type Text, with id `comp-mumy2zct`, so `.html` can take the 67 anchors. Until that element exists, the directory does not render.

## County hero resolver and about-directory HTML (page wiring)

**Blocked.** The page code is in place. None of the candidate elements are on the canvas.

`src/pages/Florida Counties (Item).ygoim.js` calls `resolvePrimaryHeroH1(county)`, `resolvePrimaryHeroH1(generatedCounty)`, and `demoteHeadingTag(`. It appends the directory with `aboutHtmlWithDirectory` and `buildFloridaCountyDirectoryHtml`. Lee about and hero text go through `applyLeeDowntownBooking` in `src/public/sanitizeLandingCopy.js`, which says people are booked at the Lee County Jail Downtown facility on Dr. Martin Luther King Jr. Blvd and does not leave a "Core only" booking line.

Candidate ids, all absent from the Layers inventory, each guarded:

- Hero H1: `#countyName`, `#countyNameHeadline`, `#dynamicHeader`
- Hero subtitle: `#heroSubtitle`, `#aboutCountyText`, `#heroDescription`
- About title (H1 demoted to H2): `#aboutHeader`, `#aboutTitle`, `#textAboutCounty`, `#aboutSectionTitle`, `#textAboutTitle`
- About HTML, including the directory: `#aboutBody`, `#aboutText`, `#aboutDescription`, `#aboutContent`, `#textAboutBody`

`#countyFaqRepeater`, `#faqQuestion`, `#faqAnswer`, and `#text65` stay the FAQ block. They are not used for the hero or the directory.

Owner needs one text element for the hero H1 (`countyName`), one for the about title (`aboutHeader`), and one rich text element for the about body (`aboutBody`). The aliases above are accepted if those exact ids are the ones already on the canvas.

## Studio indemnitor embed id

**Done.** `src/pages/Indemnitor Portal.go8lz.js` looks up `#IndemnitorDashEmbed` before `#indemnitorDashEmbed`. Both lookups are guarded. The Layers inventory has `#indemnitorDashEmbed`. The capital id is a no-op until an element with that exact id exists. The lowercase id is the one that receives the dashboard embed.

## Classic indemnitor alias ids

**Blocked.** These ids are not on the Studio canvas, so they are not bound:

- `#welcomeText` (primary on the page: `#textUserWelcome`)
- `#defendantNameText` (primary: `#textDefendantName`)
- `#defendantStatusText` (primary: `#textDefendantStatus`)
- `#balanceDueText` (primary: `#textBalanceDue`)
- `#ppRemainingBalanceText`
- `#ppPaymentTermsText`
- `#ppNextDueDateText`
- `#indemnitorLogoutBtn` (primary: `#btnLogout`)

The primary ids already in `src/pages/Indemnitor Portal.go8lz.js` are the contract. No new elements are required for the dashboard to run.

## Magic-link call shape on the live portal page

**Done.** `src/pages/Portal.ak0ws.js` calls `sendMagicLinkSimplified({ phone: phone, email: email })` from `#emailPhoneInput` / `#getStartedBtn`, from the second login form, and from `#portalLoginEmbed`. The office fallback sentence is `Try email instead, or call (239) 332-2245.` Indemnitor stays the default role.

The Layers inventory has `#portalLoginEmbed` and does not have `#emailPhoneInput` or `#getStartedBtn`. Those two lookups stay guarded. The embed is the form that is on the canvas, and it sends phone and email as separate fields.

## uiVersion floor

Unchanged. `wix.config.json` stays at the Studio sync value. The numeric floor stays retired. The test still requires a present numeric `uiVersion`.

## Still checked

- First-appearance `ok('first-appearance', data)` shape, county slugs, and the sitemap alias ban stay on `src/backend/first-appearance-router.js`, `src/backend/routers.js`, and `src/backend/http-functions.js`. The HtmlComponent type bind stays on `src/pages/First Appearance.eo050.js`.
- Portal role selection, co-indemnitor collapse, defendant-still-signs copy, and Bail School separation stay on `src/pages/Portal.ak0ws.js`. `docs/studio-velo/portal-landing.js` is unchanged.
- Office-hours JSON-LD stays on `Contact.rvjs8.js`, `Privacy Policy.ap91k.js`, `Testimonials.zhezv.js`, `First Appearance.eo050.js`, and `Terms and Conditions.fexk2.js`, plus `scripts/seo/seo-rich-results.jsw` and `src/backend/seoConfig.js`.
- About LocalBusiness JSON-LD stays on `src/pages/About.kc2xn.js`. Home still has no JSON-LD from page code.
- Hub and county schema strings stay on `src/pages/Counties.p9w2k.js` and `src/pages/Florida Counties (Item).ygoim.js`.
- Defendant dashboard ids stay on `src/pages/Defendant Portal.adato.js`.
- Indemnitor primary ids stay on `src/pages/Indemnitor Portal.go8lz.js`.
- Unguarded `$w` / `$item` scans, brand contact, JSON parse, Velo syntax, and backend/public module checks were not reduced.
