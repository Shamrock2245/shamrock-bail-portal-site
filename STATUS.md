# Portal Site — True Status

> **Last verified:** 2026-08-16
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
| Bond portal, Telegram, Shannon, DocuSeal, multi-channel intake | ⚠️ Code and public-surface checks complete; staff end-to-end smoke remains required |
| Bail School education management in GAS (`BailSchool_Progress.js`, `BailSchoolPayments.js`) | ✅ |
| SwipeSimple Gmail poll → unlock `$199`→20hr / `$649`→120hr | ✅ in code |
| Public Bail School catalog aligned to school LMS (`20hr` / `120hr` / simulator) | ✅ August 2026 |
| Netlify embed hardened (XSS escape, dual postMessage bridge, URL allowlist) | ✅ August 2026 |
| Hardcoded secrets scrubbed from GAS setup/test tooling | ✅ July 2026 |
| Location tracker no longer falls back to hardcoded API key | ✅ |
| Expanded `.gitignore` / `.claspignore` for dumps & secrets | ✅ |
| Ecosystem secrets checklist wrapper | `scripts/check_ecosystem_secrets.py` |
| **Legacy SignNow execution** | ✅ **Live @464** — direct routes, provider modules, callbacks, factory helpers, Node-RED flows, and client embedded-signing surfaces are retired. Historical record fields remain read-only. |
| **DocuSeal packet gate** | ✅ Code-enforced: validated Match, bound BondCase, explicit OSI/Palmetto surety, assigned POA tier, validated recipient email, immutable packet version, and staff-approved delivery path. |
| **Surety realignment (July 2026)** | ✅ Active paperwork requires an explicit `surety_id`; OSI is preferred and Palmetto is selected only under the documented policy. |

---

## Ops still required (not proven by git alone)

| Item | Notes |
|------|--------|
| **Secret rotation** | Keys that ever lived in git history — see `SECRETS_ROTATION_GUIDE.md` |
| **GAS redeploy** | ✅ **@464** on the existing stable portal deployment — 2026-08-16 legacy SignNow execution retired and DocuSeal guards live with no `/exec` URL change. The stable factory health action returned `success:true`. |
| **Wix publish / Bail School pricing** | ✅ **C2 verified live 2026-08-12** — public page JSON-LD lists the 120-hour course at **$649**; no retired “The Agent Path” or `$699` string was found in live page source. |
| **Embed host redeploy** | ✅ `shamrock-embeds` site (`95e4b170…`) serves updated `bail-school.html` |
| **SwipeSimple** | Confirm links charge **$199** / **$649** / **$49** |
| **School sheet ID** | ✅ Script Property `BAIL_SCHOOL_SHEET_ID` + CONFIG fallback set (smoke unlock OK) |
| **SwipeSimple Gmail poller** | Confirm `setupSwipeSimpleTrigger()` still firing every 5 min |
| **Certificate Script Properties** | `CERTIFICATE_TEMPLATE_ID` + `CERTIFICATE_FOLDER_ID` (issue_certificate fails closed without them) |
| **Telegram legacy signing flow** | ✅ Retired; the Telegram mini-app must use the staff-approved DocuSeal workflow rather than generating an embedded signing link. |

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
