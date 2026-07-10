# Portal Site — True Status

> **Last verified:** 2026-07-10  
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
| Public Bail School pricing aligned to **$649** (embeds, FAQ, schema) | ✅ July 2026 |
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
| **GAS redeploy** | ✅ **@441** — school LMS + dedicated sheet `1yZyk4wXM1kT-Nfjos0CxAMaSFKFdwz_sc6OZhKZ03h8` |
| **Wix publish** | Velo page FAQ/schema $649 |
| **Embed host redeploy** | Netlify site serving `bail-school.html` so public site is not stuck on old $699 |
| **SwipeSimple** | Confirm 120hr link charges **$649.00** |
| **School sheet ID** | ✅ Script Property `BAIL_SCHOOL_SHEET_ID` + CONFIG fallback set (smoke unlock OK) |
| **SwipeSimple Gmail poller** | Confirm `setupSwipeSimpleTrigger()` still firing every 5 min |
| **Certificate Script Properties** | `CERTIFICATE_TEMPLATE_ID` + `CERTIFICATE_FOLDER_ID` (issue_certificate fails closed without them) |
| **Telegram Palmetto appearance-bond ID** | ✅ Aligned with leads TEMPLATE_MAP (2026-07-10) |

---

## Bail School pricing (source of truth for marketing)

| Course | Display | SwipeSimple unlock amount |
|--------|---------|---------------------------|
| 120-Hour Agent Path | **$649** | `$649.00` |
| 20-Hour correspondence | **$199** (school app) | `$199.00` |

Do not reintroduce **$699** on Agent Path.

---

## Related docs

- `README.md`, `SYSTEM.md`, `AGENTS.md`, `SECRETS_ROTATION_GUIDE.md`
- `docs/DEPLOYMENT_CHECKLIST.md`
- School go-live: sibling repo `shamrock-bail-school/docs/GO_LIVE.md`
- Cross-stack: `shamrock-leads/docs/ECOSYSTEM.md` (includes **node-red** as Zapier/n8n layer)
- Automation: sibling `shamrock-node-red` (`STATUS.md`)
