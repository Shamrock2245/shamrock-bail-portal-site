# CURRENT SYSTEM STATE
## Shamrock Bail Bonds Portal — January 2026

**Last Updated:** 2026-01-22  
**Status:** PRODUCTION  
**Maintainer:** Brendan / Shamrock2245

---

## 1. SYSTEM OVERVIEW

The Shamrock Bail Bonds portal is a **mobile-first paperwork completion and signature capture system** that integrates:

- **Wix/Velo** — Frontend portal pages
- **SignNow** — E-signature capture
- **Google Apps Script (GAS)** — Document generation & backend logic
- **Twilio** — SMS/OTP automations
- **Google Drive** — Completed document storage

---

## 2. PORTAL PAGES (ALL WORKING)

| Page | URL | Purpose |
|------|-----|---------|
| Portal Landing | `/portal-landing` | Entry point, magic link login |
| Indemnitor Portal | `/portal-indemnitor` | Cosigner dashboard, paperwork, payments |
| Defendant Portal | `/portal-defendant` | Defendant dashboard, paperwork, check-ins |
| Staff Portal | `/portal-staff` | Staff dashboard, magic link generator, case management |

**Note:** URLs use **hyphens** (e.g., `/portal-landing`), NOT slashes (e.g., `/portal/landing`).

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Custom Magic Link Authentication (NO Wix Members)

The system uses **custom session-based authentication** via magic links. NO Wix Members Area is used.

**Flow:**
1. User enters email/phone on `/portal-landing`
2. System detects role and sends magic link
3. User clicks link → Session created → Redirected to correct portal
4. Session stored in browser localStorage + `Portal Sessions` collection

### 3.2 Role Assignment Logic

**Priority Order:**

1. **Hardcoded Staff Emails** (HIGHEST PRIORITY)
   - `admin@shamrockbailbonds.biz` → Staff role
   - `shamrockbailoffice@gmail.com` → Staff role

2. **Portal Users Collection**
   - Query by email → Use stored role

3. **Cases Collection - Defendant Match**
   - Query `defendantEmail` or `defendantPhone`
   - Match → Defendant role

4. **Cases Collection - Indemnitor Match**
   - Query `indemnitorEmail` or `indemnitorPhone`
   - Match → Indemnitor role

5. **New User (DEFAULT)**
   - No match found → **Indemnitor role** (cosigner signs first)

### 3.3 Role-to-Portal Mapping

```javascript
const portalMap = {
  'defendant': '/portal-defendant',
  'indemnitor': '/portal-indemnitor',
  'coindemnitor': '/portal-indemnitor',
  'staff': '/portal-staff',
  'admin': '/portal-staff'
};
```

---

## 4. BUSINESS WORKFLOW

### 4.1 Standard Bail Bond Flow

```
1. STAFF receives call/lead
   ↓
2. STAFF enters case in GAS Dashboard
   ↓
3. INDEMNITOR receives magic link (auto or via staff)
   ↓
4. INDEMNITOR completes paperwork on /portal-indemnitor
   ↓
5. INDEMNITOR signs via SignNow
   ↓
6. INDEMNITOR pays (in-person, phone, or portal - coming soon)
   ↓
7. BOND POSTED → Defendant released
   ↓
8. DEFENDANT receives magic link (via staff from /portal-staff)
   ↓
9. DEFENDANT completes paperwork on /portal-defendant
   ↓
10. DEFENDANT signs via SignNow
    ↓
11. COMPLETED PACKET auto-filed to Google Drive
```

### 4.2 Key Principle

> **Indemnitor (cosigner) ALWAYS signs first, then defendant signs after release.**

---

## 5. KEY FILES

### Backend (.jsw)

| File | Purpose |
|------|---------|
| `portal-auth.jsw` | Authentication, magic links, sessions, role detection |
| `signnow-integration.jsw` | SignNow API integration |
| `twilio-client.jsw` | SMS/OTP via Twilio |
| `social-auth.jsw` | Google/Facebook OAuth (optional) |

### Frontend (Pages)

| File | Purpose |
|------|---------|
| `portal-landing.bagfn.js` | Login page, magic link handling |
| `portal-indemnitor.k53on.js` | Indemnitor dashboard |
| `portal-defendant.skg9y.js` | Defendant dashboard |
| `portal-staff.qs9dx.js` | Staff dashboard, magic link generator |

### Public Modules

| File | Purpose |
|------|---------|
| `session-manager.js` | Browser localStorage session handling |
| `LightboxController.js` | Lightbox management for signing, uploads |

---

## 6. CMS COLLECTIONS

### Portal Sessions
Stores active user sessions (custom auth, not Wix Members).

| Field | Type | Purpose |
|-------|------|---------|
| token | Text | Session token (stored in browser) |
| personId | Text | User identifier |
| role | Text | defendant/indemnitor/staff |
| caseId | Text | Associated case (nullable) |
| createdAt | DateTime | Session start |
| expiresAt | DateTime | Session expiry (24h default) |
| lastActivity | DateTime | Last activity timestamp |

### Magiclinks
Stores magic link tokens for authentication.

| Field | Type | Purpose |
|-------|------|---------|
| token | Text | Magic link token |
| personId | Text | User identifier |
| role | Text | Target role |
| caseId | Text | Associated case |
| expiresAt | DateTime | Link expiry |
| used | Boolean | One-time use flag |

### Cases
Main case data (synced from GAS).

| Field | Type | Purpose |
|-------|------|---------|
| defendantName | Text | Defendant full name |
| defendantEmail | Text | Defendant email |
| defendantPhone | Text | Defendant phone |
| indemnitorName | Text | Indemnitor full name |
| indemnitorEmail | Text | Indemnitor email |
| indemnitorPhone | Text | Indemnitor phone |
| bondAmount | Number | Bond amount |
| caseNumber | Text | Court case number |
| status | Text | Case status |
| ... | ... | (34+ columns total) |

### Portal Users
Staff and admin accounts.

| Field | Type | Purpose |
|-------|------|---------|
| email | Text | User email |
| role | Text | staff/admin |
| firstName | Text | First name |
| lastName | Text | Last name |

---

## 7. INTEGRATIONS

### SignNow
- Documents generated in GAS
- Signing links created via `signnow-integration.jsw`
- Embedded signing in `SigningLightbox`
- Webhook handles completion
- Final PDFs saved to Google Drive

### Twilio
- Magic link SMS delivery
- OTP verification (optional)
- Configured in `twilio-client.jsw`

### Google Apps Script (GAS)
- Document generation (20+ page packets)
- Arrest data scraping (`swfl-arrest-scrapers` repo)
- Dashboard.html for staff operations
- Source of truth for case data

---

## 8. WHAT'S WORKING ✅

- [x] All 4 portal pages accessible
- [x] Magic link authentication
- [x] Role detection (staff, defendant, indemnitor)
- [x] Staff portal access for authorized emails
- [x] New users default to indemnitor role
- [x] Session management (browser + database)
- [x] SignNow integration wiring
- [x] Lightbox system for signing/uploads

---

## 9. WHAT NEEDS TESTING/COMPLETION

- [ ] End-to-end signing flow (indemnitor → defendant)
- [ ] Payment integration in portal
- [ ] ID upload capture and storage
- [ ] GAS → Wix data sync verification
- [ ] Mobile responsiveness audit
- [ ] Twilio SMS delivery confirmation

---

## 10. DEPLOYMENT NOTES

### GitHub → Wix Sync
Code changes pushed to GitHub must be synced to Wix:
1. Push to `main` branch on `Shamrock2245/shamrock-bail-portal-site`
2. Sync via Wix CLI or pull in Wix Editor
3. Publish from Wix Editor

### Staff Email Configuration
Hardcoded in `portal-auth.jsw` (line 885-888):
```javascript
const STAFF_EMAILS = [
  'admin@shamrockbailbonds.biz',
  'shamrockbailoffice@gmail.com'
];
```

To add new staff, update this array and push to GitHub.

---

## 11. CONTACT

**Owner:** Brendan  
**GitHub:** Shamrock2245  
**Site:** shamrockbailbonds.biz  
**Phone:** 239-332-2245

---

## END OF CURRENT SYSTEM STATE
