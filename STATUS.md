# Portal Site — True Status

> **Last verified:** 2026-08-12  
> **Repo:** `Shamrock2245/shamrock-bail-portal-site` · branch `main`  
> **Product URL:** `https://shamrockbailbonds.biz` (Wix)  
> **Role:** Brand clipboard + GAS factory — **Shamrock’s Platform** factory layer  
> **Platform prod checklist:** `shamrock-leads/docs/ECOSYSTEM_PROD_CHECKLIST.md`

---

## What this repo is

| Layer | Tech | Role |
|-------|------|------|
| Frontend | Wix Velo (`src/`) | Public site, portal pages, embeds |
| Backend | Google Apps Script (`backend-gas/`, 190+ files) | Business logic, webhooks, school unlock poller |
| Related | Netlify embeds | `netlify-embeds/bail-school.html` used by Wix `/bail-school` |

**Not** the student LMS (that is `shamrock-bail-school`).  
**Not** the arrest Super CRM (that is `shamrock-leads`).

---

## Code on `main` (recent, implemented)

| Area | Status |
|------|--------|
| Bond portal, Telegram, Shannon, SignNow, multi-channel intake | ✅ Production-shaped |
| Bail School education management in GAS (`BailSchool_Progress.js`, `BailSchoolPayments.js`) | ✅ |
| SwipeSimple Gmail poll → unlock `$199`→20hr / `$649`→120hr | ✅ in code |
| Public Bail School catalog aligned to school LMS (`20hr` / `120hr` / simulator) | ✅ August 2026 |
| Netlify embed hardened (XSS escape, dual postMessage bridge, URL allowlist) | ✅ August 2026 |
| Hardcoded secrets scrubbed from GAS setup/test tooling | ✅ July 2026 |
| Location tracker no longer falls back to hardcoded API key | ✅ |
| Expanded `.gitignore` / `.claspignore` for dumps & secrets | ✅ |
| Ecosystem secrets checklist wrapper | `scripts/check_ecosystem_secrets.py` |
| **Surety realignment (July 2026)** | ✅ |
| &nbsp;&nbsp;`SignNow_SendPaperwork.js` — agent constants locked to Brendan O'Neal / P139768 | ✅ |
| &nbsp;&nbsp;`SignNow_SendPaperwork.js` — `surety_id` extracted from payload; `_resolveTemplateId()` used for all three handlers | ✅ |
| &nbsp;&nbsp;`SignNow_SendPaperwork.js` — PHASE_1_DOCS / PHASE_2_DOCS corrected to match leads implementation | ✅ |
| &nbsp;&nbsp;`Telegram_Documents.js` — Palmetto template IDs added; `surety_id` passed through lookup → signing URL | ✅ |
| &nbsp;&nbsp;`Telegram_IntakeQueue.js` — `surety_id` added to sheet header, `appendRow`, Wix sync, `_mapCanonicalToDashboardFormat` | ✅ |
| &nbsp;&nbsp;`PDF_Mappings.js` — Palmetto filename entries added to `TEMPLATE_FILENAME_MAP` | ✅ |

---

## Ops still required (not proven by git alone)

| Item | Notes |
|------|--------|
| **Secret rotation** | Keys that ever lived in git history — see `SECRETS_ROTATION_GUIDE.md` |
| **GAS redeploy** | ✅ **@445** (leads URL `…CvP-Z`) + **@446** (school Netlify URL `…Qa_DMg`) — 2026-07-10 cert fail-closed + Telegram Palmetto ID; sheet `1yZyk4wXM1kT-Nfjos0CxAMaSFKFdwz_sc6OZhKZ03h8` |
| **Wix publish / leftover $699 FAQ** | Page JS catalog is **$649**. Live `/bail-school` JSON-LD still contains “The Agent Path is $699” (Wix SEO/CMS, not git). **Republish Wix FAQ/SEO** before calling C2 done. |
| **Embed host redeploy** | ✅ `shamrock-embeds` site (`95e4b170…`) serves updated `bail-school.html` |
| **SwipeSimple** | Confirm links charge **$199** / **$649** / **$49** |
| **School sheet ID** | ✅ Script Property `BAIL_SCHOOL_SHEET_ID` + CONFIG fallback set (smoke unlock OK) |
| **SwipeSimple Gmail poller** | Confirm `setupSwipeSimpleTrigger()` still firing every 5 min |
| **Certificate Script Properties** | `CERTIFICATE_TEMPLATE_ID` + `CERTIFICATE_FOLDER_ID` (issue_certificate fails closed without them) |
| **Telegram Palmetto appearance-bond ID** | ✅ Aligned with leads TEMPLATE_MAP (2026-07-10) |

---

## Bail School pricing (source of truth for marketing)

Canonical catalog: **`shamrock-bail-school/lib/courses.ts`**. Portal embeds must match.

| Course ID | Public name | Display | SwipeSimple unlock |
|-----------|-------------|---------|---------------------|
| `20hr` | 20-Hour Correspondence Pre-Licensing | **$199** (list $299) | `$199.00` |
| `120hr` | 120-Hour Basic Certification Training | **$649** (list $1,200) | `$649.00` |
| `simulator` | Simulator & Flashcard Pass | **$49** (list $99; free w/ 120hr) | `$49.00` |

**Do not** reintroduce **$699**, or primary CTAs for retired names (*Indemnitor Basics*, *The Agent Path*, *30-Hour Correspondence*, *Bail Bond Masterclass*).

---

## Related docs

- `README.md`, `SYSTEM.md`, `AGENTS.md`, `SECRETS_ROTATION_GUIDE.md`
- `docs/DEPLOYMENT_CHECKLIST.md`
- School go-live: sibling repo `shamrock-bail-school/docs/GO_LIVE.md`
- Cross-stack: `shamrock-leads/docs/ECOSYSTEM.md` (includes **node-red** as Zapier/n8n layer)
- Automation: sibling `shamrock-node-red` (`STATUS.md`)
