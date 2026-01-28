
**Frontend:** Wix + Velo  
**Backend:** External REST API (prefix `/api/v1`)  
**Auth:** JWT (staff console) + magic links / OTP (clients)  
**PII:** Encrypted at rest; TLS in transit. **PCI:** never store PAN/CVV—tokenize.

---

## Base URL

https://api.shamrockbailbonds.biz/api/v1

## Security
- `Authorization: Bearer <JWT>` (staff)  
- Magic link tokens for Defendant / Indemnitor flows (signed, short-lived)  
- Idempotency: `Idempotency-Key` on money/critical state  

---

## Endpoints (Contract)

### Persons

**Create**  
`POST /persons`
```json
{
  "role": "defendant|indemnitor|coindemnitor|spouse|parent|reference|attorney",
  "first_name": "string",
  "last_name": "string",
  "dob": "YYYY-MM-DD",
  "email": "string",
  "phone_primary": "string",
  "address": { "line1": "", "city": "", "state": "FL", "zip": "33901" }
}

201 →

{ "person_id": "P-XXXX", "created_at": "ISO-8601" }

Update
PATCH /persons/{person_id} → partial updates; 200 updated record.

⸻

Cases

Create
POST /cases

{
  "case_number": "24-CF-001234",
  "court_name": "Lee County Circuit Court",
  "county": "Lee|Charlotte|Collier",
  "charge_description": "string",
  "bond_amount": 15000,
  "power_of_attorney_numbers": ["PSC-A123456"],
  "execution_datetime": "ISO-8601",
  "agent_name": "Brendan O’Neill",
  "defendant_person_id": "P-DEF-001",
  "indemnitors": ["P-IND-001"]
}

201 →

{ "case_id": "CASE-001" }

Update
PATCH /cases/{case_id} → 200 updated.

⸻

Documents

Create instance
POST /documents

{
  "case_id": "CASE-001",
  "document_key": "appearance_application_v1",
  "payload": { /* must validate against doc schema */ }
}

201 →

{ "document_id": "DOC-...", "status": "draft" }

Get / Update
GET /documents/{document_id}
PATCH /documents/{document_id} (payload changes)

Render PDF
POST /documents/{document_id}:render

{ "format": "pdf", "with_audit_trail": true }

200 → PDF bytes or URL.

