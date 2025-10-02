# GLOSSARY.md

## Overview
This glossary defines key terms, acronyms, and roles used in the Shamrock Bail Bonds Portal.  
It is meant to align staff, developers, and AI agents on shared language.

---

## Roles & People
- **Defendant**: Person accused of a crime, released on bail with conditions.  
- **Indemnitor (Cosignor)**: Person who guarantees the defendant’s appearance in court by pledging collateral or signing financial agreements.  
- **Co-Indemnitor**: Additional cosignor sharing responsibility for bond obligations.  
- **Staff (Agent)**: Shamrock Bail Bonds employees managing cases, paperwork, and compliance.  

---

## Documents
- **Application for Appearance Bond**: Defendant’s personal info, employment, prior arrests.  
- **Financial Statement & Indemnity Agreement**: Indemnitor’s financial disclosures and indemnity promise.  
- **Collateral Promissory Note**: Document recording pledged collateral (cash, property, vehicle).  
- **Bond Information Sheet**: Summary sheet with key bond details, powers of attorney, conditions.  
- **Waiver / Authorization**: Consent forms for background checks and release of personal info.  
- **SSA-3288**: Social Security release form.  
- **Credit Card Authorization**: Form to charge indemnitor/defendant for bond fees.  

---

## Processes
- **Check-In**: Defendant’s compliance step; submitting GPS location + selfie photo.  
- **Certified Check-In**: Check-in confirmed with photo, GPS, device hash, and audit trail.  
- **Packet Export**: Final bundle of signed, completed PDFs for a case.  

---

## Legal & Financial
- **Bond Amount**: The monetary value of bail set by the court.  
- **Power of Attorney (POA)**: Authority number allowing agent to execute bail bond on behalf of insurer.  
- **Collateral**: Assets pledged to secure bail (cash, property, vehicle).  
- **Indemnity**: Legal responsibility indemnitors assume if the defendant fails to appear.  

---

## Technology & Security
- **Magic Link**: Time-limited, single-use URL for login (no password).  
- **OTP (One-Time Password)**: Temporary code sent via SMS/email for login verification.  
- **JWT (JSON Web Token)**: Authentication token used by staff to access API.  
- **Schema Validation**: Ensuring user inputs match JSON Schema definitions in `SCHEMAS.md`.  
- **Anchor-Based PDF Rendering**: Technique for mapping data fields to specific spots in PDF templates.  
- **Audit Trail**: Metadata (IP, timestamp, device, signature hash) attached to signatures, payments, and check-ins.  

---

## Counties (Service Area)
- **Lee County**: Primary jurisdiction for Shamrock Bail Bonds.  
- **Charlotte County**: Adjacent service area.  
- **Collier County**: Additional service area.
- **Hendry County**: Adjacent service area.
- **Sarasota County**: Additional service area.
- **Manatee County**: Additional service area.

---

## Metrics & Compliance
- **Completion Rate**: % of cases where all parties signed and paid online.  
- **Compliance Rate**: % of defendants completing required check-ins.  
- **PCI DSS**: Payment Card Industry Data Security Standard — rules for handling credit card data.  
- **PII**: Personally Identifiable Information (SSN, DOB, addresses, etc.).  
- **TLS**: Transport Layer Security — encryption for all web/API traffic.  
