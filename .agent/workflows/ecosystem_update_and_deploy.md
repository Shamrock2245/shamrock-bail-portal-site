---
description: Automated update and deploy workflow across all Shamrock repositories
---

# 🍀 Shamrock Ecosystem — Automated Update & Deploy Workflow

Whenever making code updates to **any** repository in `shamrock-active-software`, execute this standard automated pipeline.

## 1. Quick Ecosystem Status Check
Run from `/Users/brendan/Desktop/shamrock-active-software/`:
```bash
./update_workflow.sh --status
```
Verifies branch names, remote sync (ahead/behind), and working tree cleanliness across all 6 repositories.

---

## 2. Automated Pre-Push Test Verification
Run test suites before pushing any code:

- **For all active repos:**
  ```bash
  ./update_workflow.sh --test-all
  ```
- **For a specific repo:**
  ```bash
  ./update_workflow.sh --test <repo-name>
  ```

### Repo-Specific Test Engines:
- **`shamrock-bail-portal-site`**: `npm test` (Runs Velo syntax, JSON schemas, GAS auth gates, Shannon ring, and router suites)
- **`shamrock-telegram-app`**: `npm test` (Runs 145 unit, rate limiter, and auth tests)
- **`shamrock-node-red`**: `python3 scripts/validate_flows.py` & 102 unit tests
- **`shamrock-leads`**: `.venv/bin/pytest tests/test_workflow_endpoints.py tests/test_fl_hernando_detail_status.py`
- **`shamrock-bail-school`**: `npm run build` / Next.js production checks

---

## 3. Automated Safe Push Pipeline
To automatically test, hygiene-check (no `.venv` or credential leaks), stage, commit, and push:
```bash
./update_workflow.sh --push <repo-name> "<conventional-commit-message>"
```

### Examples:
```bash
./update_workflow.sh --push shamrock-telegram-app "feat(auth): add signature timestamp validation"
./update_workflow.sh --push shamrock-node-red "fix(radar): adjust high-bond alert threshold"
./update_workflow.sh --push shamrock-bail-portal-site "fix(router): update first-appearance query mapping"
```

---

## 4. Downstream Automated Deployments (Triggered on Push to Main)

| Repository | Automated Pipeline | Destination / Action |
| :--- | :--- | :--- |
| **shamrock-bail-portal-site** | `.github/workflows/wix-deploy.yml` | Wix Studio Live Site Publish |
| **shamrock-telegram-app** | Netlify Git CD | Edge Functions & Mini App PWAs deployed to `shamrock-telegram.netlify.app` |
| **shamrock-leads** | `.github/workflows/deploy-hetzner.yml` | SSH deployment to Hetzner VPS (`178.156.179.237`), Docker rebuild & restart |
| **shamrock-node-red** | `.github/workflows/deploy-flows.yml` | Flow validation & Admin API deploy |
| **shamrock-bail-school** | `.github/workflows/ci.yml` | Netlify production deployment (`shamrock-bail-school.netlify.app`) |
| **backend-gas** (in portal) | Clasp CLI (manual gate) | Push to stable deployment ID `@510` (`clasp deploy -i <ID> -d "..."`) |
