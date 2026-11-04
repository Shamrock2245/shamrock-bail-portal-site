# Logic uncovered after the Studio sync

Commit `e949e9e` is the owner's `wix dev` sync with Wix Studio. It is the page-file source of truth: `uiVersion` 543, classic page files removed, Studio popup and member pages kept. This note lists behavior that tests no longer cover and that still needs a home. It does not move any page code.

Checks that still apply were repointed at `src/backend`, `src/public`, or the current Studio page file. Those are listed at the end.

## Hub directory builder (page wiring)

The classic hub `src/pages/Florida Bail Bonds.liggp.js` called `buildHubCountyDirectoryHtml` and `appendHubCountyDirectory` from `src/public/floridaCountyDirectory.js`, then wrote the 67-county list onto `$w('Text')` at `#comp-mumy2zct`.

`scripts/test_hub_county_anchors.mjs` and `scripts/test_gsc_search_console.mjs` used to read that page. `scripts/test_sitemap_schema_copy.mjs` used to require `comp-mumy2zct` or `HUB_COUNTY_DIRECTORY_ELEMENT_ID` in the hub file.

The pure functions are still tested. `src/pages/Counties.p9w2k.js` only sets LocalBusiness JSON-LD. Its comment says Studio has no `#comp-mumy2zct` and that `repeater1` is the county list and should be left alone.

Suggested home: `src/pages/Counties.p9w2k.js`. Paint the directory HTML onto the Studio text or HTML element that replaced `#comp-mumy2zct`. Do not walk `repeater1` for that list. Keep building the HTML in `src/public/floridaCountyDirectory.js`.

## County hero resolver and about-directory HTML (page wiring)

`src/pages/Florida Counties.qx7lv.js` set the hero with `resolvePrimaryHeroH1` from `src/public/cityHeroHeadline.js` and demoted extra H1s with `demoteHeadingTag`. It also appended the county directory inside the about HTML via `aboutHtmlWithDirectory`.

`scripts/testing/test-city-hero-h1.mjs` required `resolvePrimaryHeroH1(county)`, `resolvePrimaryHeroH1(generatedCounty)`, and `demoteHeadingTag(`. `scripts/test_gsc_search_console.mjs` required `aboutHtmlWithDirectory` and `buildFloridaCountyDirectoryHtml` in that page.

`resolvePrimaryHeroH1` and `formatCityHeroHeadline` are still tested, and `src/backend/county-generator.jsw` plus `src/backend/local-landings.js` still call the formatter. `src/pages/Florida Counties (Item).ygoim.js` does not call the resolver, demote headings, or append the directory.

Suggested home: `src/pages/Florida Counties (Item).ygoim.js`.

- Hero text: `#countyName`, `#countyNameHeadline`, `#dynamicHeader`
- Hero subtitle: `#heroSubtitle`, `#aboutCountyText`, `#heroDescription`
- Demote H1 to H2: `#aboutHeader`, `#aboutTitle`, `#textAboutCounty`, `#aboutSectionTitle`, `#textAboutTitle`
- About HTML, including the directory: `#aboutBody`, `#aboutText`, `#aboutDescription`, `#aboutContent`, `#textAboutBody`

## Studio indemnitor embed id

`src/pages/portal-indemnitor.k53on.js` looked up `#IndemnitorDashEmbed` before the lowercase `#indemnitorDashEmbed`.

`scripts/test_studio_element_guards.mjs` required the capital id to appear first. That test was removed.

`src/pages/Indemnitor Portal.go8lz.js` only lists `#indemnitorDashEmbed`.

Suggested home: `src/pages/Indemnitor Portal.go8lz.js`. Try `#IndemnitorDashEmbed` first, then `#indemnitorDashEmbed`.

## Classic indemnitor alias ids

The same classic page, and the same test, also required these alias ids: `#welcomeText`, `#defendantNameText`, `#defendantStatusText`, `#balanceDueText`, `#ppRemainingBalanceText`, `#ppPaymentTermsText`, `#ppNextDueDateText`, `#indemnitorLogoutBtn`.

They are not in `src/pages/Indemnitor Portal.go8lz.js`. The primary ids that file does use are still tested.

Suggested home: add an alias on `src/pages/Indemnitor Portal.go8lz.js` only when the Studio layout still has that element. Otherwise the primary id already on that file is the contract.

## Magic-link call shape on the live portal page

`src/pages/portal-landing.bagfn.js` called `sendMagicLinkSimplified` with separate phone and email fields, and it had a fallback sentence telling the visitor to try email or call the office.

`scripts/test_portal_signin_dispatch.mjs` required both on that page. Those two assertions were retired. The same call shape is still required in `docs/studio-velo/portal-landing.js`. The delivery chain in `src/backend/portal-auth.jsw` and `src/backend/portal-signin-dispatch.js` is still tested. The embed and GAS relay checks are unchanged.

`src/pages/Portal.ak0ws.js` calls `sendMagicLinkSimplified(emailOrPhone)` and `sendMagicLinkSimplified(contact)` instead.

Suggested home: `src/pages/Portal.ak0ws.js`, elements `#emailPhoneInput` and `#getStartedBtn`. Pass phone and email as separate fields if the backend contract still expects that object. Keep the office fallback copy next to the send button.

## uiVersion floor

`scripts/test_first_appearance_router.js` required `uiVersion` of at least 2775. The Studio sync set `wix.config.json` to 543, which is the source of truth. The numeric floor was retired. The test still requires a present numeric `uiVersion`. `wix.config.json` was not edited.

## Still checked after this PR

- First-appearance `ok('first-appearance', data)` shape, county slugs, and the sitemap alias ban stay on `src/backend/first-appearance-router.js`, `src/backend/routers.js`, and `src/backend/http-functions.js`. The HtmlComponent type bind moved to `src/pages/First Appearance.eo050.js` (`$w('HtmlComponent')`, `#firstAppearanceEmbed`).
- Portal role selection, co-indemnitor collapse, defendant-still-signs copy, and Bail School separation moved to `src/pages/Portal.ak0ws.js` (`#tabDefendant`, `#tabIndemnitor`, `#tabCoIndemnitor`, `#emailPhoneInput`, `#getStartedBtn`, `#btnRoleDefendant`, `#cardRoleDefendant`, `#btnRoleIndemnitor`, `#cardRoleIndemnitor`, `#btnRoleCoIndemnitor`, `#cardRoleCoIndemnitor`, `#statusMessage`, `#textDefendantMustSignNotice`). `docs/studio-velo/portal-landing.js` is unchanged.
- Office-hours JSON-LD moved to `Contact.rvjs8.js`, `Privacy Policy.ap91k.js`, `Testimonials.zhezv.js`, `First Appearance.eo050.js`, and `Terms and Conditions.fexk2.js`, plus `scripts/seo/seo-rich-results.jsw` and `src/backend/seoConfig.js`.
- About LocalBusiness JSON-LD moved to `src/pages/About.kc2xn.js`. Home and `Florida Counties (Item).ygoim.js` JSON-LD checks are unchanged.
- Hub and county schema strings (address, both published phone lines, Mon–Fri office hours, hub URL with the `-1` suffix) moved to `src/pages/Counties.p9w2k.js` and `src/pages/Florida Counties (Item).ygoim.js`.
- Defendant dashboard ids moved to `src/pages/Defendant Portal.adato.js` (`#defendantDashEmbed`, `#defendantWizard`, and the case, court, payment, and paperwork ids the test already listed).
- Indemnitor ids that the Studio file still references stay on `src/pages/Indemnitor Portal.go8lz.js`.
- Unguarded `$w` / `$item` scans, brand contact, JSON parse, Velo syntax, and backend/public module checks were not reduced.
