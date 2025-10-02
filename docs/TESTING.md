# TESTING.md

## Overview
This document explains how to test the Shamrock Bail Bonds Portal.  
It covers **unit tests, integration tests, manual QA, and compliance checks**.  
All contributors (human or AI) must follow these steps before merging code.

---

## Local Testing

### Backend (API)
1. Install dependencies.
   ```bash
   npm test
   # or
   pytest

   	2.	Run unit tests for endpoints:
	•	/persons
	•	/cases
	•	/documents
	•	/signatures
	•	/payments
	•	/checkins
	3.	Validate OpenAPI spec (shamrock_openapi.yaml) with Swagger or Postman.

Frontend (Wix Velo)
	•	Use Wix Preview mode for forms and flows.
	•	Mock API responses using a staging server.
	•	Test autosave + resume functionality.

⸻

Schema Validation
	•	All form payloads must match SCHEMAS.md.
	•	Run schema tests:

  npm run validate-schemas
# or
pytest tests/test_schemas.py

	•	Ensure conditional rules pass (collateral uploads, SSA date ranges, etc.).

⸻

PDF Anchor Tests
	•	Verify PDF fields align with anchors in PDF_TEMPLATES.md.
	•	Run automated PDF render test with sample payloads.
	•	Manually inspect one sample per document type.

⸻

Manual QA Checklist
	•	Defendant login works via magic link.
	•	Indemnitor login works via magic link.
	•	Waivers require e-signature before proceeding.
	•	Payment forms tokenize correctly.
	•	Selfie + GPS captured in check-in.
	•	Packet export produces full signed PDF bundle.

⸻

Compliance Testing
	•	No SSN or card data stored in logs.
	•	TLS enforced (check staging + production URLs).
	•	Audit trail included on signed docs.
	•	Payment receipts generated.

⸻

CI/CD
	•	GitHub Actions run all tests on PR.
	•	PR cannot merge unless all tests pass.
	•	Security scans (npm audit, pip-audit) required.

⸻

Reporting Bugs
	•	File GitHub issue with:
	•	Steps to reproduce
	•	Expected result
	•	Actual result
	•	Screenshots/logs
