# PDF_TEMPLATES.md

## Strategy
All bail bond packet forms are rendered as **US Letter PDFs**.  
We use **anchor-based placement**: find a known text string (anchor) and position fields relative to it with `dx`,`dy` offsets.  
This avoids breakage if fonts shift or page layouts adjust.  
Each signature includes: signer name, timestamp (ISO), IP, and user agent. If notarized, capture notary details (county, commission expiry, ID type).

---

## Global Signature Stamps
- Anchor: signature labels (e.g., "SIGNATURE OF INDEMNITOR").  
- Overlay: hand-drawn signature or stored image.  
- Append metadata: `signed_by`, `timestamp`, `ip_address`, `user_agent`.  
- Notary blocks placed at bottom-right, where present.  

---

## Document Anchors

### 1. Financial Statement & Indemnity (`financial_indemnity_v1`)
- Anchor: **“FINANCIAL STATEMENT AND INDEMNITY AGREEMENT”** → header fields (Agent, Power, Case, Execution Date).  
- Anchor: **“NAME OF INDEMNITOR”** → place first/middle/last name.  
- Anchors: **“ASSETS”**, **“LIABILITIES”** → two-column grid.  
- Anchor: **“SIGNATURE OF DEFENDANT / INDEMNITOR / CO-INDEMNITOR”** → signature + audit trail.  
- Notary area: bottom-right, anchored at “PERSONALLY KNOWN / PRODUCE IDENTIFICATION”.

---

### 2. Application for Appearance Bond (`appearance_application_v1`)
- Anchor: **“APPLICATION FOR APPEARANCE BOND”** → header case info.  
- Anchors: **“Date of Birth”**, **“Automobile – Year Make Model”**, **“Driver’s License No. State”**, **“Are you under any bail bond now?”** → map fields.  
- Anchors: **“AGENT WITNESS HERE”**, **“DEFENDANT SIGN HERE”** → signature placement.

---

### 3. Collateral Receipt & Promissory Note (`collateral_promissory_v1`)
- Anchor: **“PROMISSORY NOTE”** → amount, payee, call date, conditions, 3 signatures.  
- Anchor: **“COLLATERAL RECEIPT No.”** → collateral items, receipt date, received by, fee %, indemnitor + agent signatures.

---

### 4. Bail Bond Information Sheet (`bond_info_sheet_v1`)
- Anchor: agency header block → Shamrock Bail Bonds address/phone.  
- Anchors: **“BOND DEFENDANT:”**, **“POWER OF ATTORNEY NUMBER(S):”** → case and bond info.  
- Anchor: **“ANY OF THE FOLLOWING HAPPENINGS IS A BREACH OF AGREEMENT”** → acknowledgment section with signature.

---

### 5. Waiver / Authorization (`waiver_authorization_v1`)
- Anchor: **“WAIVER OF RIGHTS / AUTHORIZATION FOR RELEASE OF PERSONAL INFORMATION”** → header.  
- Anchors: Name, DOB, SSN, Address lines → mapped fields.  
- Anchor: **“PERSONALLY KNOWN / PRODUCE IDENTIFICATION”** → notary signature area.

---

### 6. SSA-3288 (`ssa_3288_v1`)
- Anchor: **“Consent for Release of Information”** and OMB box → top.  
- Anchors: Recipient name/address, checkbox list, date range fields.  
- Signature/date/relationship anchors at bottom.

---

### 7. Credit Card Authorization (`cc_authorization_v1`)
- Anchor: **“Credit Card Authorization Form”** → title.  
- Anchors: Card type checkboxes, Name on Card, Expiration, Billing Address, Phone, Email.  
- Anchor: “I, ___ authorize Shamrock Bail Bonds…” → amount, defendant name, payer.  
- Signature + date anchors below authorization statement.

---

## Example Anchor Mapping
```json
[
  {
    "page": 1,
    "anchor": "NAME OF INDEMNITOR",
    "fields": [
      { "path": "indemnitor.first_name", "dx": 120, "dy": 12, "w": 160 },
      { "path": "indemnitor.middle_name", "dx": 300, "dy": 12, "w": 80 },
      { "path": "indemnitor.last_name", "dx": 400, "dy": 12, "w": 180 }
    ]
  },
  {
    "page": 1,
    "anchor": "SIGNATURE OF INDEMNITOR",
    "fields": [
      { "path": "signatures[?signed_by_person_id==indemnitor.person_id]", "dx": 140, "dy": 6, "type": "signature" }
    ]
  }
]

Usage Notes
	•	Anchor configs stored in backend JSON.
	•	At runtime, PDF renderer finds anchor text, applies offsets, injects field values.
	•	Manus or devs can adjust offsets (dx,dy) in staging to align fields perfectly.
	•	Ensure all rendered PDFs embed audit metadata for legal compliance.
