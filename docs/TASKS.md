# Task Management - Shamrock Bail Suite

This document defines how tasks and technical debt are tracked within the Shamrock project.

## 1. The Task Artifact (`task.md`)
AI Agents must always use the `task.md` artifact in the `.gemini/antigravity/brain/` directory to track their current objective.
- `[ ]` = Pending
- `[/]` = In Progress
- `[x]` = Completed

## 2. Priority Levels
- **P0 (Critical):** Scraper downtime, database corruption, SignNow failure.
- **P1 (High):** Inaccurate lead scoring, broken phone routing, UI bugs on Home page.
- **P2 (Normal):** New county expansion, SEO optimizations, routine documentation.
- **P3 (Backlog):** AI chat enhancements, long-term analytics.

## 3. Implementation Workflow
1. **Discovery:** Identify the task via `grep` or `list_dir`.
2. **Planning:** Create an `implementation_plan.md`.
3. **Execution:** Write code and update `task.md`.
4. **Verification:** Create a `walkthrough.md` with proof of work (screenshots/code).

## 4. Technical Debt Registry
Track items that need later refinement here:
- [ ] Centralize all county scraper runners into a single Node.js service.
- [ ] Move hardcoded phone numbers from `signnow-integration.jsw` to `phone-registry.json`.
- [ ] Implement robust error logging for the Geolocation API.

> [!NOTE]
> All tasks must align with the **Arrest Scraped -> Lead Qualified -> Agent Notified** goal.
