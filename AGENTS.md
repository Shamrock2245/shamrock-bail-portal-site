# AGENTS.md

## Overview
Defines the "agents" (human + AI roles) involved in building and maintaining the Shamrock Bail Bonds Portal.  
This file helps Manus or other assistants know who is responsible for what.

---

## Human Agents
- **Brendan (Owner)**  
  Role: Product owner, bail bond subject matter expert.  
  Responsibilities: Business rules, form compliance, county-specific workflows, vision.

- **Staff Console Users (Shamrock Staff)**  
  Role: Intake, pre-fill, case monitoring, packet export.  
  Responsibilities: Day-to-day use of the platform.

- **Developers**  
  Role: Implement Velo code, backend API, PDF renderers.  
  Responsibilities: Execution of the roadmap in TASKS.md.

---

## AI Agents
- **Manus**  
  Role: Code generation, scaffolding, schema enforcement.  
  Responsibilities: Generate Velo JS snippets, backend endpoints, PDF rendering logic.  
  Must always follow: `README.md`, `API_SPEC.md`, `SCHEMAS.md`, `PDF_TEMPLATES.md`.

- **Validator** (optional AI role)  
  Role: JSON Schema validator & PDF anchor checker.  
  Responsibilities: Ensure inputs match SCHEMAS.md before API calls.

- **Compliance Checker** (optional AI role)  
  Role: Flag missing signatures, incomplete check-ins, or invalid SSNs.  
  Responsibilities: Assist staff in staying audit-ready.

---

## How to Use
- **Developers**: Follow TASKS.md and use Manus for boilerplate and wiring.  
- **Manus**: Stay Wix-aware, use `wix-fetch` for API calls, rely on SCHEMAS.md for validation.  
- **Staff**: Report any broken workflows for dev fixes.  
