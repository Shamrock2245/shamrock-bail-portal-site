# 🚀 The "Start Here" Guide (Onboarding)

> **Last Updated:** 2026-08-21

Welcome to the Shamrock Bail Bonds digital headquarters. If you are a new AI Sub-Agent or human developer entering this ecosystem for the first time, read the documentation in this specific order.

---

## ⚠️ Mandatory Orientation Directive

> **STOP & READ FIRST:** Before editing any page code, CMS datasets, or backend services, you MUST read **[`USER.md`](USER.md)**, **[`RULES.md`](RULES.md)**, **[`docs/CURRENT_PAPERWORK_ARCHITECTURE.md`](docs/CURRENT_PAPERWORK_ARCHITECTURE.md)**, and **Phase 8.5 (Wix Studio Translation + Autopilot Paperwork Clipboard)** in **[`ROADMAP.md`](ROADMAP.md)**.
> 
> **Core Law:** The website is the clipboard. The backend is the brain. Wix collects and presents data; Super CRM (`shamrock-leads`) and GAS own underwriting, case matching, and staff-gated DocuSeal issuance.

---

## Required Reading Order

1. **[USER.md](USER.md)** — Brendan's vision: "The Uber of Bail Bonds." Growth Ladder IA law (SWFL local dominance → 67 FL counties → 11+ multi-state expansion).
2. **[SYSTEM.md](SYSTEM.md)** — Architecture, tech stack, inter-repo data flows, hosting, and pipeline logic.
3. **[RULES.md](RULES.md)** — 14 non-negotiable agent rules (clipboard vs. brain, DocuSeal boundary, role-scoped ID hydration, stable GAS URL).
4. **[docs/CURRENT_PAPERWORK_ARCHITECTURE.md](docs/CURRENT_PAPERWORK_ARCHITECTURE.md)** — Canonical DocuSeal-only signing boundary & client intake flow.
5. **[AGENTS.md](AGENTS.md)** — 9 AI agent personas, code lenses (`@paperwork-clipboard`, `@studio-translator`), system prompts, handoffs.
6. **`.agent/skills/using-superpowers/SKILL.md`** — Skill-based workflows before modifying complex logic.

---

## Domain-Specific References (Consult as Needed)

| Document | When to Use |
|---|---|
| [ROADMAP.md](ROADMAP.md) | Phase 8.5 Wix Studio milestones & future expansion waves |
| [STATUS.md](STATUS.md) | Authoritative runtime truth, deployed GAS version, pricing |
| [TASKS.md](TASKS.md) | Active sprint tasks and checklists |
| [OPERATIONS.md](OPERATIONS.md) | Voice AI tuning, compliance, health monitoring, integrations, scraping |
| [TOOLS.md](TOOLS.md) | MCP servers, skills, workflows, external services |
| [docs/ANTIGRAVITY-FOUNDATION-SPEC.md](docs/ANTIGRAVITY-FOUNDATION-SPEC.md) | Wix-specific contract, element ID governance, CMS rules |
| [docs/SCHEMAS.md](docs/SCHEMAS.md) | Data schemas, CMS collections, canonical mapping keys |
| [COUNTY_STATUS.md](COUNTY_STATUS.md) | County scraper status, tiers, and expansion backlog |

---

## Submitting Work

Before you finish your task, ALWAYS:
1. Run the `/self-improving-agent` workflow to log session retrospectives and update the knowledge base.
2. Audit your design against `ui-ux-pro-max` skill (No MVP UI allowed; mobile-first touch targets ≥44px, font-size ≥16px).
3. Push code to GitHub via `/git_smart_sync` workflow.
4. Update living documentation in the same commit as code changes.
