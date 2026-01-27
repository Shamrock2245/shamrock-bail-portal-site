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
	•	Backend API: Google Apps Script (GAS) Web App (Serverless).
	•	Database: Wix Collections (MagicLinks, Sessions, Cases) + Google Sheets (Backups).
	•	Storage: Google Drive (PDFs, Signatures) + Wix Media Manager.
	•	Payments: Wix Payments / Stripe.
	•	Deployment: GitHub integration (Wix) + Clasp (GAS).

⸻

## 🔐 Security & Compliance
	•	PII encrypted at rest, TLS in transit.
	•	PCI DSS compliance (never store raw PAN/CVV).
	•	Custom Session Auth (Magic Links) + Wix Portal Integration.
	•	Audit logs for all signatures, payments, check-ins.

⸻

## 🚀 Workflows

**Defendant**
	1.	Log in via magic link (SMS/Email).
	2.	Complete Appearance Application, Waivers.
	3.	Perform GPS/selfie check-in.
	4.	Receive PDF + email copy.

**Indemnitor**
	1.	Log in via magic link.
	2.	Complete Financial Indemnity, Collateral fields.
	3.	E-sign documents via SignNow Lightbox.
	4.	Receive receipt + signed packet.

**Staff**
	1.	Log in (Admin/Staff role).
	2.	Create Case + pre-fill details.
	3.	Generate Magic Links for Defendant/Indemnitor.
	4.	Monitor progress in Google Sheets / Dashboard.
	5.	Export signed packet PDFs.

⸻

## 🔗 API Endpoints

The backend is hosted on Google Apps Script.
Key Actions (via `doPost` router):
	•	`submitIntake`: Handle form submissions.
	•	`createEmbeddedLink`: Generate SignNow signing sessions.
	•	`sendEmail`: Send magic links or notifications.
	•	`logCheckIn`: Handle GPS check-ins.

⸻

## 📄 Documents & Schemas

All forms are digitized via JSON Schema.
See `docs/` for detailed breakdown.

⸻

## 📦 Setup
	1.	Wix Side
	•	Connect Wix to this repo via GitHub integration.
	•	Enable Velo developer mode.
	•	Set up distinct Pages for Defendant/Indemnitor portals.
	•	Configure Wix Secrets (`GAS_WEB_APP_URL`, `GOOGLE_MAPS_API_KEY`).
	2.	API Side (GAS)
	•	Code stored in `backend-gas/`.
	•	Deploy using `clasp push`.
	•	Update `gasWebAppUrl` in `utils.jsw`.

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