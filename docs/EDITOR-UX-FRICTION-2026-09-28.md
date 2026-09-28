# Editor UX friction cuts (defendants / indemnitors) — 2026-09-28

Companion to draft PR `fix/ux-friction-defendant-indemnitor`.  
**Do not bump `wix.config.json` uiVersion from this pass.**  
**Do not publish until live ≠ main is resolved separately.**  
Velo half ships via PR; canvas steps below need Brendan in Wix Editor.

## What Velo already does (this PR)

| Surface | Change |
|---|---|
| `/portal-landing` | Role-first ("Who are you?") before magic-link login; plain-language role labels; SEO title not "Login"; Send my link secondary |
| Marketing header | `#loginButton` / `#loginBtn` label → **Client login** (still present) |
| HOME | County CTA **Get Them Out**; placeholder aligned; `#startBondButton` → portal with county; `#startOnlineBtn` carries last county |
| Defendant / indemnitor dashboards | Softer incomplete-paperwork banners; Continue paperwork label |
| masterPage SEO helpers | **Unchanged:** logo `#comp-mjimunqt` H1→p demote; empty Image alts filled |

## Exact Editor steps (Brendan)

### 1) Marketing nav declutter (highest visual impact)

Site menu is Editor-owned (`StylableHorizontalMenu`). Shrink to **mobile-first**:

**Keep visible:** Home · How Bail Works · Contact · (optional) Bail School  
**Move under More / footer only:** How to Become a Bondsman · About · Blog · Testimonials  

Keep a single **Call (239) 332-2245** header control. Keep **Client login** (code will rename Login) as a quiet text/button — not a primary pill.

### 2) HOME hero hierarchy

1. One H1: keep content hero ("Fast, Professional Bail Bonds…") — do **not** re-H1 the logo (`#comp-mjimunqt`).
2. Primary block: county dropdown + **Get Them Out** only (one primary CTA).
3. Secondary: Call Now / Telegram — outline style, not competing solid green.
4. If a second "Get Started" duplicates the county CTA, delete or relabel to Call.

### 3) Portal landing canvas (if role cards exist)

IDs code already wires (create if missing):

- `#boxRoleSelection` or `#rolePickerContainer` — expanded by default  
- `#btnRoleIndemnitor` / `#cardRoleIndemnitor`  
- `#btnRoleDefendant` / `#cardRoleDefendant`  
- `#btnRoleCoIndemnitor` / `#cardRoleCoIndemnitor` (can sit under "More options")  
- `#boxLoginForm` / `#loginContainer` — visually secondary ("Already started?")  
- `#emailPhoneInput`, `#getStartedBtn`  

Optional text IDs for code soft-copy: `#textRoleHeading`, `#textRoleSubhead`, `#textLoginHeading`.

### 4) County pages

Confirm one solid **Get Someone Out** (`#heroStartButton` / `#getSomeoneOutBtn` / `#startBailBtn`) and one **Call (239) 332-2245**. Hide or demote Staff Portal / Defendant Portal footers on public county templates (Staff → CRM is retirement path; public shouldn't advertise `/portal-staff`).

### 5) Contacts (must stay exact if shown)

- Main: **239-332-2245**  
- Automated: **727-295-2245**  
- Text: **239-955-0178**  
- Email: **admin@shamrockbailbonds.biz**  
- Address: **1528 Broadway Fort Myers**

## Out of scope (needs Brendan / separate work)

- New marketing pages, surety naming, hero brand rewrite  
- PR #24 intake / GAS / wizard embeds  
- uiVersion pin / Editor Save sync / live ≠ main publish mismatch  
