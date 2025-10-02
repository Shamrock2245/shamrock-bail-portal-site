# METRICS.md

## Overview
This document defines the key performance indicators (KPIs) for the Shamrock Bail Bonds Portal.  
Metrics will help track adoption, efficiency, and compliance.

---

## Core Metrics
- **Case Completion Rate**  
  % of cases fully completed (all signatures + payments) via portal.  
  Target: 90%+

- **Average Packet Completion Time**  
  Time from case creation → final signed packet export.  
  Baseline: manual = days. Target: < 12 hours.

- **Check-In Compliance Rate**  
  % of scheduled check-ins completed on time.  
  Target: 95%+.

- **Payment Success Rate**  
  % of payments authorized and captured without retry.  
  Target: 98%+.

- **Staff Time Saved per Case**  
  Manual hours saved (data entry, chasing signatures).  
  Target: 2–3 hours per case.

---

## Operational Metrics
- **Magic Link Delivery Rate**: % of links successfully delivered (email/SMS).  
- **Drop-Off Rate**: % of users who start but don’t finish forms.  
- **Multi-Indemnitor Completion**: % of cases where all indemnitors complete their flows.  
- **Error Rate**: % of API calls failing validation.  
- **System Uptime**: API + Wix uptime > 99.9%.

---

## Compliance Metrics
- **Audit Trail Completeness**: % of signed docs with IP, timestamp, and UA logged.  
- **GPS Consent Rate**: % of defendants granting GPS check-in consent.  
- **Data Breach Incidents**: zero tolerated.

---

## Reporting
- Metrics captured in DB → staff dashboard.  
- Weekly report auto-sent to Brendan + staff.  
- Quarterly review against targets.
