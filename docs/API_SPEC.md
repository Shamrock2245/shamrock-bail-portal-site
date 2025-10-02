# Shamrock Bail Bonds API — Overview

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

⸻

Signatures

Create signature request (magic link)
POST /signatures/requests

{
  "document_id": "DOC-...",
  "signed_by_person_id": "P-...",
  "signature_image_uri": "https://.../sig.png",
  "ip_address": "string",
  "user_agent": "string",
  "timestamp": "ISO-8601",
  "notary": null
}

201 →

{ "signature_id": "SIG-...", "document_status": "partially_signed|signed" }

Webhook: POST /webhooks/signature.completed

⸻

Payments

Authorize
POST /payments/authorize

{
  "case_id": "CASE-001",
  "payer_person_id": "P-IND-001",
  "authorized_amount": 1500,
  "method": "visa|mastercard|amex|discover|other",
  "gateway_token": "tok_xxx",
  "metadata": { "document_id": "DOC-CC-..." }
}

200 →

{
  "payment_id": "PAY-001",
  "status": "authorized",
  "brand": "visa",
  "last4": "4242",
  "authorization_datetime": "ISO-8601"
}

Capture
POST /payments/{payment_id}:capture → 200 captured.

Receipt
GET /payments/{payment_id}/receipt → PDF.

Webhook: POST /webhooks/payment.succeeded

⸻

Check-Ins

Create check-in
POST /checkins

{
  "case_id": "CASE-001",
  "person_id": "P-DEF-001",
  "gps": { "lat": 26.6406, "lng": -81.8723, "accuracy_m": 12 },
  "selfie_uri": "https://.../IMG.jpg",
  "device_fingerprint": "hash"
}

201 →

{
  "checkin_id": "CHK-001",
  "status": "certified",
  "certified_at": "ISO-8601",
  "certificate_hash": "sha256:..."
}

List
GET /cases/{case_id}/checkins?limit=50

Server MUST verify a signed waiver with GPS consent before accepting check-ins.

⸻

Errors (shape)

{
  "error": "VALIDATION_ERROR",
  "message": "Field X is required",
  "details": [{ "path": "payload.defendant.dob", "rule": "format:date" }]
}

