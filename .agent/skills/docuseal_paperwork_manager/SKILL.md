---
name: DocuSeal Paperwork Manager
description: Authority guide and implementation patterns for DocuSeal signing, canonical schema mapping, and staff-gated paperwork issuance.
version: 2.0.0
---

# Skill: DocuSeal Paperwork Manager

> **Core Doctrine:** "The Website is the Clipboard. The Backend is the Brain."  
> **Sole Active Signer:** DocuSeal is the sole active signing provider. SignNow is permanently retired.

Use this skill when implementing, maintaining, or auditing legal paperwork workflows, canonical schema mappings, client intake forms, and mobile/tablet signing launchpads.

---

## 1. System Responsibilities & Boundaries

| Surface | Allowed Responsibilities | Forbidden Actions |
|---|---|---|
| **Wix Studio Portal / Launchpad** | Authenticate user via phone OTP / Magic Link, host `/portal-start` intake wizard, open `SigningLightbox` launchpad. | Creating DocuSeal submissions, requesting signing URLs directly from the provider, or assuming underwriting authority. |
| **Netlify Paperwork App** | Role selection (Defendant/Indemnitor), PIN verification, camera ID scan, Cloud Vision OCR extraction, delta fields, staff review notice. | Assigning bond amounts, creating unapproved final packets, or treating client input as legal reconciliation. |
| **Super CRM (`shamrock-leads`)** | Store independent deferred intakes, match parties, select surety carrier (OSI/Accredited/Bankers), assign POA tiers, create DocuSeal submissions under staff approval. | Delegating document issuance to a browser, client script, or unverified automated sender. |

---

## 2. Canonical Schema Mapping (`canonical-paperwork-mapper.js`)

To prevent frontend UI from binding to a single surety carrier's 14-page PDF layout, all data is standardized into canonical models:

```javascript
import {
  createCanonicalPerson,
  createCanonicalCase,
  hydratePersonFromOcr,
  exportToLegacyPacketMap
} from 'public/canonical-paperwork-mapper';

// 1. Initialize role-scoped person
const indemnitor = createCanonicalPerson('indemnitor');

// 2. Hydrate from Cloud Vision OCR
hydratePersonFromOcr(indemnitor, ocrExtractedFields);

// 3. Export to downstream automation format if needed
const legacyMap = exportToLegacyPacketMap(canonicalCase);
```

### Role-Scoped Isolation:
- Defendant fields: `DefFirstName`, `DefLastName`, `DefDOB`, `DefDL`, `DefAddress`, etc.
- Indemnitor fields: `IndFirstName`, `IndLastName`, `IndDOB`, `IndDL`, `IndAddress`, etc.
- **Rule:** A cosigner/indemnitor ID scan must NEVER overwrite defendant identity fields.

---

## 3. Client Launchpad Handshake (`SigningLightbox.js`)

The Wix lightbox hosts the Netlify paperwork iframe and listens for postMessage events:

```javascript
// Two-Way Event Bridge
frame.onMessage((event) => {
    const msg = event && event.data;
    if (msg && msg.type === 'shamrock-paperwork-ready') {
        frame.postMessage({
            type: 'shamrock-paperwork-open',
            url,
            phone: member.phone || ctx.phone,
            sessionToken: ctx.sessionToken,
            signUrl: ctx.signUrl || '',
            caseId: ctx.packetId || ctx.caseId,
            role: ctx.role || ''
        });
    }
    if (msg && (msg.type === 'shamrock-paperwork-complete' || msg.type === 'shamrock-paperwork-close')) {
        wixWindow.lightbox.close({ success: msg.type === 'shamrock-paperwork-complete' });
    }
});
```

---

## 4. Super CRM Staff Approval Gate

In `shamrock-leads`, staff validates:
1. `Match`: Confirms arrest record to intake data.
2. `BondCase`: Validates bond amounts and charges.
3. `Surety`: Selects carrier (OSI preferred, Palmetto policy-gated, Accredited/Bankers).
4. `POA Tier`: Assigns active Power of Attorney number and capacity.
5. `DocuSeal Submission`: Triggers the DocuSeal API to issue the official signature session.
