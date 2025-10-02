# Shamrock Bail Bonds Portal (Wix + External API)

This project is the official Shamrock Bail Bonds Portal. It runs on Wix (Velo + Members Area) for the client-facing front end, and connects to an external API backend (Node/FastAPI) for secure workflows (PDF rendering, signatures, payments, check-ins).

⸻

## 📌 Goals
	•	Automate all bail bond paperwork (Financial Indemnity, Appearance Application, Collateral/Promissory Note, Bond Info Sheet, Waivers, SSA-3288, Credit Card Authorization).
	•	Minimize repetitive data entry with shared schemas.
	•	Enable role-based portals:
	•	Defendant: application, waivers, check-in, optional payment.
	•	Indemnitor/Cosignor: financials, indemnity, collateral, payment.
	•	Staff: dashboard for prefill, tracking, case management.
	•	Collect legally valid e-signatures with audit trails.
	•	Support payments via Wix Payments (Stripe/PayPal).
	•	Allow GPS + selfie check-ins for defendants with certified audit.
	•	Export court-ready PDFs that mirror official packet forms.

⸻

## 🛠 Tech Stack
	•	Front End: Wix + Velo (JS), Members Area, Forms, Camera/GPS APIs.
	•	Backend API: Node.js or Python (FastAPI) with OpenAPI 3.1 spec.
	•	Database: Encrypted PII store (e.g., Postgres + KMS).
	•	Storage: Secure blob for PDFs, selfies, signatures.
	•	Payments: Wix Payments / Stripe.
	•	Deployment: GitHub integration with Wix; external API hosted (Vercel/Render/AWS).

⸻

## 🔐 Security & Compliance
	•	PII encrypted at rest, TLS in transit.
	•	PCI DSS compliance (never store raw PAN/CVV).
	•	JWT auth for staff; magic links/OTP for clients.
	•	Audit logs for all signatures, payments, check-ins.

⸻

## 🚀 Workflows

**Defendant**
	1.	Log in via magic link.
	2.	Complete Appearance Application, Waivers, optional Payment.
	3.	Perform GPS/selfie check-in (if required).
	4.	Receive PDF + email copy.

**Indemnitor**
	1.	Log in.
	2.	Complete Financial Indemnity, Collateral, Credit Card Auth.
	3.	E-sign documents.
	4.	Receive receipt + signed packet.

**Staff**
	1.	Log in.
	2.	Create Case + pre-fill details.
	3.	Send links to Defendant/Indemnitor.
	4.	Monitor progress, payments, check-ins.
	5.	Export signed packet PDFs.

⸻

## 🔗 API Endpoints

See API_SPEC.md for full OpenAPI 3.1 definitions.
Key endpoints:
	•	POST /persons
	•	POST /cases
	•	POST /documents
	•	POST /signatures/requests
	•	POST /payments/authorize
	•	POST /checkins

⸻

## 📄 Documents & Schemas

All forms are digitized via JSON Schema (Draft 2020-12).
See SCHEMAS.md for definitions and conditionals.
Examples:
	•	financial_indemnity_v1
	•	appearance_application_v1
	•	collateral_promissory_v1
	•	bond_info_sheet_v1
	•	waiver_authorization_v1
	•	ssa_3288_v1
	•	cc_authorization_v1

⸻

## 📦 Setup
	1.	Wix Side
	•	Connect Wix to this repo via GitHub integration.
	•	Enable Velo developer mode.
	•	Add Members Area for login.
	•	Configure Wix Payments.
	•	Create Velo data collections for Persons, Cases, Docs, Check-Ins.
	2.	API Side
	•	Deploy backend (api/) separately.
	•	Import shamrock_openapi.yaml into Postman/Swagger.
	•	Configure environment variables (DB_URL, STRIPE_KEY, JWT_SECRET).
	3.	Integration
	•	Velo fetch calls to /api/v1/... endpoints.
	•	Validate form inputs against schemas before submission.
	•	Store PDF/selfie/signature blobs via backend.

⸻

## 🤖 For AI Builders (Manus, Copilot, etc.)
	•	Stay Wix-aware: all UI code = Velo JS. Use wix-users, wix-data, wix-fetch, wix-pay.
	•	Backend = external API: never embed heavy logic in Wix, call /api/v1.
	•	Render PDFs externally: match uploaded packet layout.
	•	Respect schemas: see SCHEMAS.md.
	•	Follow security rules above.

⸻

## Additional Markdown Files

**API_SPEC.md**
	•	Embed the OpenAPI 3.1 YAML (shamrock_openapi.yaml).
	•	Summarize endpoints with example requests/responses.
	•	Helps Manus wire frontend → backend cleanly.

**SCHEMAS.md**
	•	Contain all JSON Schemas (Person, Case, Documents).
	•	List conditionals (e.g., real estate requires deed upload).
	•	Helps Manus auto-generate validation logic.

**PDF_TEMPLATES.md**
	•	Describe page-by-page packet anchors for signature fields and inputs.
	•	E.g., Page 1: “NAME OF INDEMNITOR” at x=120, y=640.
	•	Guides Manus when wiring form → PDF render.

**MANUS.md**
	•	A stripped-down copy of your “master prompt” (the one we built earlier).
	•	Makes it explicit what Manus should always optimize for.