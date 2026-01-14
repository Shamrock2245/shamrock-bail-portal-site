# Contributing Guidelines - Shamrock Bail Suite

Welcome! This project is a highly specialized internal suite. Please follow these guidelines to ensure consistency and quality.

## 1. Workflow
1. **Sync Local:** Always run `wix pull` before starting work to avoid merge conflicts with the Wix Editor.
2. **Branching:** Create a descriptive branch (e.g., `feature/miami-dade-scraper`).
3. **Draft Plan:** Update the `implementation_plan.md` artifact for any new feature.
4. **Implementation:** Follow the [ROADRULES.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/ROADRULES.md) and [STYLEGUIDE.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/STYLEGUIDE.md).
5. **Verify:** Provide proof of work in a `walkthrough.md`.
6. **PR:** Submit a Pull Request and wait for lead dev approval.

## 2. Communication
- **Updates:** Use the `task_boundary` tool frequently to communicate progress in a structured way.
- **Clarification:** If a task's scope is unclear, ASK via `notify_user` before writing any code.

## 3. AI Agent Protocol
If you are an AI assistant:
- You MUST adhere to the [AGENTS.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/AGENTS.md) instructions.
- You MUST maintain the 34-column schema in all data-related tasks.

## 4. Prohibited Actions
- **No Direct Master Commits:** All changes must go through a branch.
- **No Hardcoded Keys:** Secrets must remain in the platform's manager.
- **No Breaking Changes:** Without a detailed migration plan in the implementation plan.

> [!NOTE]
> We value clean, scalable code that works under pressure. Think mobile-first and panicked-user-first.
