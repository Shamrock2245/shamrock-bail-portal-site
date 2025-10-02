# DEPLOYMENT.md

## Overview
This document explains how to deploy and maintain the Shamrock Bail Bonds Portal.  
The system is split into two parts: **Wix Frontend (Velo)** and **External API Backend**.

---

## 1. Wix Frontend (Velo)

### Setup
1. Enable **Dev Mode** in Wix (Velo).
2. Connect Wix site to **GitHub repo** (`shamrock-bail-portal`).
3. Map `/wix` folder in repo to custom code files in Wix.

### Features
- **Members Area** for login and role-based routing.
- **Velo data collections** for Persons, Cases, Docs, Check-Ins (mirrors API).
- **UI components**: Wizards, forms, camera/GPS integration.
- **wix-fetch** used for API calls.

### Deploy
- Push commits → GitHub → syncs with Wix.
- Test staging branch in Wix preview.
- Merge to main for production push.

---

## 2. External API (Node.js / FastAPI)

### Setup
1. Clone repo and navigate to `/api/`.
2. Install dependencies:
   ```bash
   npm install
   # or
   pip install -r requirements.txt

   3.	Configure .env:DB_URL=postgres://...
STRIPE_KEY=sk_test_...
JWT_SECRET=...

Deploy Options
	•	Vercel: Easy for Node.js, serverless scaling.
	•	Render/Heroku: Quick deployment, free tiers for staging.
	•	AWS ECS/Lambda: For full production hardening.

Database
	•	PostgreSQL with encryption-at-rest.
	•	Managed DB service (e.g., AWS RDS, Supabase).

⸻

3. Deployment Flow
	•	Local Dev → test with Postman using shamrock_openapi.yaml.
	•	Staging → API deployed on staging URL, Wix pointed there.
	•	Production → API deployed to https://api.shamrockbailbonds.biz.

⸻

4. Environment Management
	•	Use .env.staging and .env.production for secrets.
	•	Never commit secrets to GitHub.
	•	Rotate API keys and JWT secrets quarterly.

⸻

5. Monitoring & Alerts
	•	Use server logs for all endpoints.
	•	Set up alerts for:
	•	Failed payments.
	•	Missed check-ins.
	•	Unsigned documents (after 48 hrs).
	•	Integrate alerts via Slack/email.

⸻

Checklist
	•	GitHub repo connected to Wix.
	•	API deployed to staging.
	•	DB migrations applied.
	•	TLS certificate valid.
	•	Staff console tested.
	•	Clients can receive magic links + sign.
  




