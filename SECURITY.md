# SECURITY.md

## Overview
This document defines the security practices for the Shamrock Bail Bonds Portal.  
The platform handles **PII**, **financial data**, and **court documents**, and must comply with bail bond regulations, PCI DSS, and privacy best practices.

---

## Authentication & Authorization
- **Staff**: JWT-based authentication (short expiry, refresh tokens).  
- **Clients (Defendant / Indemnitor)**: Magic link or OTP (expires within 15 mins).  
- **Role-based access**:
  - Defendant → only their forms, payments, and check-ins.
  - Indemnitor → only their indemnity/financial docs and payments.
  - Staff → all assigned cases + admin console.

---

## Data Protection
- **At Rest**: Encrypt all PII in database (AES-256).  
- **In Transit**: TLS 1.2+ required.  
- **Sensitive Fields**:
  - SSN: masked in UI, encrypted in DB.
  - Credit Card: never stored, only tokens via Stripe/Wix Payments.
  - Signatures: stored as image blobs with SHA-256 hash.
  - Selfie Check-Ins: stored in secure blob storage with signed URLs.

---

## Payments
- PCI DSS compliance required.  
- Use Wix Payments / Stripe with tokenization.  
- Store only last4 + brand for reference.  
- No raw PAN, CVV, or exp dates saved in DB.

---

## Logging & Audit
- Log all signature events (timestamp, IP, UA).  
- Log all payments (status, gateway ref).  
- Log all check-ins (GPS, selfie hash, consent flag).  
- Store audit logs in immutable append-only store.

---

## Incident Response
- If PII breach suspected:
  - Notify affected users within 72 hours.
  - Escalate internally via Staff Console alert + Slack.
- Maintain contact list for regulatory reporting.

---

## Development Practices
- Validate all inputs against SCHEMAS.md.  
- Enforce linting for security checks (e.g., eslint-plugin-security).  
- Run dependency vulnerability scans (npm audit, pip-audit).  
- Use OWASP cheat sheet for Velo/Node/FastAPI code.

---

## Checklist
- [ ] TLS enforced on all endpoints.  
- [ ] JWT properly validated (issuer, audience, expiry).  
- [ ] DB encryption verified quarterly.  
- [ ] Staff roles reviewed monthly.  
- [ ] Webhooks signed & validated.  
- [ ] Penetration test scheduled quarterly.  
