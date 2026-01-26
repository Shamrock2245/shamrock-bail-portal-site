# ANTIGRAVITY FOUNDATION SPEC
## Shamrock Bail Bonds — Wix + Velo Platform

Version: 1.0  
Status: CANONICAL  
Audience: AI Agents (Antigravity), Senior Developers, System Architects  

---

## 0. ABSOLUTE AUTHORITY STATEMENT

This document is the **single authoritative foundation** for this repository.

If any instruction in:
- README files
- legacy .md files
- agent prompts
- inline comments
- external suggestions

conflicts with this document, **THIS DOCUMENT OVERRIDES ALL OTHERS**.

Agents must treat this file as:
- the system contract
- the schema authority
- the workflow boundary
- the definition of success

---

## 1. SYSTEM INTENT (WHY THIS EXISTS)

This system exists to:

1. Generate **urgent, high-intent bail bond leads**
2. Route those leads **correctly by county and context**
3. Protect legally sensitive workflows (paperwork, signatures, payments)
4. Scale to **all 67 Florida counties** without fragmentation
5. Provide clean data to downstream systems (scrapers, analytics, staff ops)

This is **not** a generic website.  
It is a **conversion engine under legal constraints**.

---

## 2. HARD SYSTEM BOUNDARIES (NON-NEGOTIABLE)

### 2.1 Protected Systems (DO NOT TOUCH)

The following systems are **outside agent authority**:

- SignNow (documents, flows, URLs, tokens)
- Google Sheets used by ops (unless via GAS API)
- External APIs not explicitly wrapped in backend modules

The **Google Apps Script (GAS)** project is now **INTEGRATED** into this repository (`backend-gas/`).
Agents **ARE AUTHORIZED** to modify, optimize, and deploy GAS code, provided they follow `clasp` deployment protocols.

Agents may:
- call them only through existing, approved interfaces
- pass data forward
- NEVER modify, intercept, or reimplement them

---

### 2.2 Security Rules

- **NO API keys in frontend code**
- **Secrets Manager only**
- Backend logic goes in `.jsw` files only
- Never store PII unnecessarily in Wix collections
- Never duplicate data already handled by SignNow or external systems

Violation = critical failure.

---

## 3. OPERATIONAL FLOW (MENTAL MODEL)

### 3.1 Anonymous Visitor

Landing → County Detection → Phone CTA → Call Logged → Human

### 3.2 Informed Visitor
Landing → County Page → Learn → Phone or Form → Logged

### 3.3 Member (Paperwork Flow)
Login → Consent → Start Bail → SignNow → External Automation

After the SignNow handoff, **Wix is no longer authoritative**.  
No additional data capture, retries, previews, or interception is permitted.

---

## 4. COUNTY SYSTEM (CORE SCALING MECHANISM)

### 4.1 County Slugs (CANONICAL)
- lowercase only
- no spaces
- no special characters
- immutable once published
- used consistently across:
  - URLs
  - CMS
  - analytics
  - call logs
  - scrapers

Example: `lee`, `collier`, `charlotte`

### 4.2 County Tier Model
- **Tier 1**: Full operations, active scraping, priority routing, rich content
- **Tier 2**: Partial operations, manual handling, limited content
- **Tier 3**: SEO presence + call-only conversion

Agents MUST respect tier logic when:
- generating content
- enabling features
- wiring routing or analytics

Tier downgrades are not permitted without explicit instruction.

---

## 5. CMS IS AN OPERATIONAL DATABASE (NOT MARKETING CONTENT)

CMS collections are **live system components**.  
Schema drift is considered a breaking change.

### 5.1 Canonical CMS Collections

#### FloridaCounties (MASTER DATASET)
Primary Key: `countySlug`

##### Identity
- countySlug (Text, unique, required)
- countyName (Text, required)
- countyNameFull (Text)
- active (Boolean, required)
- featured (Boolean)
- tier (Number, required)

##### Contact & Routing
- primaryPhone (Text, required)
- spanishPhone (Text)
- email (Text)

##### Geography
- centroidLat (Number)
- centroidLng (Number)
- boundsNorth (Number)
- boundsSouth (Number)
- boundsEast (Number)
- boundsWest (Number)
- majorCities (Text or JSON)

##### Jail Data
- jailName (Text)
- jailAddress (Text)
- jailPhone (Text)
- bookingUrl (URL)

##### Clerk of Court
- clerkName (Text)
- clerkUrl (URL)
- clerkPhone (Text)
- recordsUrl (URL)

##### SEO (MANDATORY)
- metaTitle (Text, required)
- metaDescription (Text, required)
- keywords (Text or JSON)
- schemaType (Text)

##### Content Blocks
- heroHeadline (Text)
- heroSubheadline (Text)
- aboutCounty (Text)
- whyChooseUs (Text)

##### Scraper Integration
- scraperEnabled (Boolean)
- scraperCountyCode (Text)
- leadScoreThreshold (Number)

---

#### CallLogs (CONVERSION TRUTH SOURCE)
- trackingId (Text, unique)
- sessionId (Text)
- memberId (Text, nullable)
- county (Text)
- phoneNumber (Text)
- source (Text)
- page (Text)
- device (Text)
- timestamp (DateTime)
- geolocation (Object)

---

#### AnalyticsEvents (BEHAVIORAL DATA)
- eventType (Text)
- sessionId (Text)
- memberId (Text, nullable)
- county (Text)
- page (Text)
- device (Text)
- properties (Object)
- timestamp (DateTime)

---

#### UserLocations (CONSENT-BASED GEO)
- sessionId (Text)
- memberId (Text, nullable)
- latitude (Number)
- longitude (Number)
- accuracy (Number)
- county (Text)
- consentGiven (Boolean)
- timestamp (DateTime)

---

#### Portal / Paperwork State Collections
These collections track **state only**, never document contents:
- PortalUsers
- PortalSessions
- PendingDocuments
- RequiredDocuments
- MemberDocuments

---

## 6. ELEMENT ID GOVERNANCE

Element IDs are **API contracts**.

Rules:
- Case-sensitive
- Never renamed after deployment
- Never auto-generated
- Never reused across contexts

Breaking an element ID is equivalent to breaking an API.

---

## 7. BACKEND / FRONTEND SEPARATION OF CONCERNS

### 7.1 Backend (.jsw) Responsibilities
- geolocation resolution
- county detection
- phone routing
- call logging
- analytics logging
- county page generation
- business rules

### 7.2 Frontend Responsibilities
- UI rendering
- event triggering
- form validation
- invoking backend methods

Frontend code MUST NOT:
- infer county logic
- decide routing
- access secrets
- bypass backend validation

---

## 8. SIGNNOW HANDOFF (CRITICAL & IMMUTABLE)

The following sequence is fixed:

1. Member authenticated
2. Explicit consent captured
3. “Start Bail Paperwork” clicked
4. Backend prepares payload
5. Redirect to SignNow

Rules:
- No previews
- No embedded SignNow
- No retries
- No interception
- No alternate flows

If SignNow fails, fallback is **human intervention**, not code.

---

## 9. ANALYTICS TRUTH MODEL

Priority of truth:
1. Phone calls
2. Call logs
3. County attribution
4. Behavioral events
5. Forms

Every phone interaction MUST:
- log once
- include county
- include source
- include device

Silent failures are unacceptable.

---

## 10. DEFINITION OF SUCCESS

This system is successful when:
- A panicked mobile user can call within 3 seconds
- The call logs with correct county and source
- Staff can trust the data without manual cleanup
- County pages scale without manual rework
- Legal, paperwork, and payment workflows remain untouched
- Agents can operate without tribal knowledge

---

## 11. ANTIGRAVITY OPERATING DIRECTIVES

When operating in this repository, Antigravity MUST:

1. Read this document first
2. Treat schemas as contracts
3. Prefer safety over cleverness
4. Never “simplify” by removing structure
5. Ask for clarification ONLY if:
   - a direct conflict exists
   - a required field is missing

This system values **durability, correctness, and legal safety** over speed.

---

## END OF ANTIGRAVITY FOUNDATION SPEC
