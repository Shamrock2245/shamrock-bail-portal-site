# Bail School & Curriculum Guidelines

> **Last updated:** 2026-08-06  
> **Canonical catalog:** `shamrock-bail-school/lib/courses.ts`  
> **Public marketing surfaces:** `netlify-embeds/bail-school.html`, Wix `/bail-school`, `school.shamrockbailbonds.biz`

This document outlines the operational structure, live curriculum programs, and integrations for the Shamrock Bail Bonds "Bail School" division.

## 1. Core Mission of the Bail School

1. **Pre-licensing education** — Florida DFS-aligned 20-Hour correspondence and 120-Hour basic certification training (pending FLDFS course approval; Provider #648-FL).
2. **Exam readiness** — Pearson VUE–style State Exam Simulator, Bail Mentor AI, and master flashcards.
3. **Recruitment pipeline** — Graduate pathway into agency internship / appointment consideration.

## 2. Platform Integrations

| System | Role |
|--------|------|
| **`shamrock-bail-school`** | Student LMS at `school.shamrockbailbonds.biz` (dashboards, curriculum, simulator) |
| **Wix `/bail-school`** | Public marketing page; HtmlComponent iframe → Netlify embed |
| **Netlify `shamrock-embeds`** | Hosts `bail-school.html` (primary public cards + FAQ) |
| **SwipeSimple** | Course payment links (`COURSES[*].paymentUrl`) |
| **GAS `BailSchoolPayments.js`** | Gmail poll → unlock `$199`→`20hr`, `$649`→`120hr` |
| **SignNow / certificates** | Completion certificate issuance (when Script Properties configured) |

## 3. Live Programs (canonical)

Do **not** advertise retired names as primary offerings: *Indemnitor Basics*, *The Agent Path*, *30-Hour Correspondence*, *Bail Bond Masterclass*, *Agency Operations*, *Risk Management & Skip Tracing* (as paid primary tracks). Those were educational/future-CE concepts or outdated naming.

### Program A — 20-Hour Correspondence Pre-Licensing

| Field | Value |
|-------|--------|
| **IDs** | `20hr` · dashboard `/dashboard/correspondence` |
| **Price** | **$199** (list $299) |
| **Format** | Online / self-paced / correspondence |
| **Audience** | Aspiring agents completing the correspondence prerequisite |
| **Includes** | ~10 modules, statutory time tracking, quizzes (80% gate), final exam, digital certificate |
| **Payment** | SwipeSimple 20hr link from `COURSES['20hr'].paymentUrl` |

### Program B — 120-Hour Basic Certification Training

| Field | Value |
|-------|--------|
| **IDs** | `120hr` · dashboard `/dashboard/120hr` |
| **Price** | **$649** (list $1,200) |
| **Format** | Live interactive webinars + hybrid cohorts |
| **Audience** | Aspiring Florida bail bond agents seeking full pre-licensing |
| **Bundled** | 1-year State Exam Simulator + Bail Mentor AI + flashcards |
| **Schedule** | `school.shamrockbailbonds.biz/schedule` |
| **Payment** | SwipeSimple 120hr link from `COURSES['120hr'].paymentUrl` |

### Program C — Simulator & Flashcard Pass (standalone)

| Field | Value |
|-------|--------|
| **IDs** | `simulator` · dashboard `/dashboard/simulator` |
| **Price** | **$49** (list $99) |
| **Note** | Included free with 120-Hour enrollment |

## 4. Unlock Rules (GAS + LMS)

- **20-Hour payment** unlocks correspondence only.
- **120-Hour payment** unlocks 120hr **and** 1-year simulator/mentor pass.
- **Simulator payment** unlocks simulator only.
- Super-admin / auditor emails may unlock all for curriculum audit.

## 5. Automation & Handoff

- **Interest capture:** Embed newsletter → `postMessage` → Velo `submitBailSchoolInterest`.
- **Payment unlock:** SwipeSimple receipt email → GAS poller → Student_Auth sheet unlock.
- **Graduation:** Certificate flow requires `CERTIFICATE_TEMPLATE_ID` + `CERTIFICATE_FOLDER_ID` Script Properties.

## 6. UI/UX Rules for Public Surfaces

- **Primary cards:** 20-Hour + 120-Hour only (simulator may appear as third card, not CE clutter).
- **Never** lead with free “Indemnitor Basics” or “Agent Path” as product names.
- **Prices / links** must match `lib/courses.ts`.
- **Aesthetics:** Premium, academic; trust signals (pass rate, provider #, pending approval) OK when accurate.
- **Dark-theme embed** design system + height postMessage bridge (`setHeight` + `RESIZE`) must stay intact.

## 7. File map (portal repo)

| Path | Role |
|------|------|
| `netlify-embeds/bail-school.html` | Live Netlify embed (deploy to site `shamrock-embeds`) |
| `src/custom-embeds/bail-school-embed.html` | Mirror of Netlify embed (keep identical) |
| `src/pages/Bail School.sftg6.js` | Wix page: iframe URL, resize, SEO schema, interest signup |
| `src/backend/data/bailSchoolCourses.json` | Structured catalog + FAQs for backend/consumers |
| `content/pages/become-bondsman.md` | CMS content for become-a-bondsman journey |
