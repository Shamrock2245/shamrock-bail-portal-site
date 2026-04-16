# 📚 Documentation Index

> **Last Updated:** April 16, 2026
> **Philosophy:** Fewer docs, sharper content. Every file earns its place.

---

## Root Documents (Project-Level)

| Doc | Purpose |
|-----|---------|
| [README.md](../README.md) | Project overview, quick start, architecture summary |
| [SYSTEM.md](../SYSTEM.md) | Full system architecture, inter-repo data flows |
| [RULES.md](../RULES.md) | 14 non-negotiable agent rules |
| [ERROR_CATALOG.md](../ERROR_CATALOG.md) | Known errors + fixes across all 7 systems |
| [ROADMAP.md](../ROADMAP.md) | Phase-based development roadmap |
| [TASKS.md](../TASKS.md) | Active task tracking |
| [OPERATIONS.md](../OPERATIONS.md) | Node-RED, scrapers, cron schedules |
| [COUNTY_STATUS.md](../COUNTY_STATUS.md) | Per-county scraper status and expansion plan |
| [CHANGELOG.md](../CHANGELOG.md) | Release history |
| [TESTING_GUIDE.md](../TESTING_GUIDE.md) | How to test every integration |
| [ONBOARDING.md](../ONBOARDING.md) | New developer / AI agent onboarding |
| [USER.md](../USER.md) | User priorities and preferences |
| [TOOLS.md](../TOOLS.md) | MCP servers, skills, workflows |
| [SECRETS_ROTATION_GUIDE.md](../SECRETS_ROTATION_GUIDE.md) | Credential rotation procedures |

---

## Deep-Dive Reference (`docs/`)

### Architecture & Schemas
| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Detailed system architecture with diagrams |
| [SCHEMAS.md](SCHEMAS.md) | Canonical data schemas (Master 34, IntakeQueue, CMS, Sheets) |
| [API_SPEC.md](API_SPEC.md) | All GAS POST/GET endpoints, Wix modules, Netlify functions |
| [ELEMENT-ID-CHEATSHEET.md](ELEMENT-ID-CHEATSHEET.md) | Wix Editor element IDs → Velo code mapping |

### Operations & Deployment
| Doc | Purpose |
|-----|---------|
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Pre-deploy verification checklist |
| [GLOSSARY.md](GLOSSARY.md) | 30 key terms across the ecosystem |

### AI & Voice
| Doc | Purpose |
|-----|---------|
| [shannon-knowledge-base.txt](shannon-knowledge-base.txt) | Shannon voice AI RAG knowledge base |
| [ANTIGRAVITY-FOUNDATION-SPEC.md](ANTIGRAVITY-FOUNDATION-SPEC.md) | Wix Velo platform contract |

### Infrastructure Reference
| Doc | Purpose |
|-----|---------|
| [hetzner.md](hetzner.md) | Hetzner VPS infrastructure reference |
| [elevenlabs-docs.md](elevenlabs-docs.md) | ElevenLabs API reference (1.6MB) |
| [twilio-docs.md](twilio-docs.md) | Twilio API reference (2.4MB) |

### Directories
| Directory | Contents |
|-----------|----------|
| `bail_school_materials/` | Bail School educational content |
| `compliance/` | Legal compliance documents |
| `data/` | Static data files (county boundaries, etc.) |
| `reference_code/` | Code examples and patterns |

---

## Archived (`docs/archive/`)

Historical implementation notes, handoff documents, and superseded guides organized by date. These are preserved for audit trail but **should never be referenced from active docs**.

| Archive Folder | Contents |
|---|---|
| `2026-01/` | January implementation notes |
| `2026-02/` | February redesign and portal work |
| `2026-03/` | March SignNow and Telegram integration |
| `2026-04/` | April cleanup notes |
| `2026-04-docs-consolidation/` | Files archived during April 16 consolidation (SECURITY, STYLEGUIDE, CONTRIBUTING, etc.) |
