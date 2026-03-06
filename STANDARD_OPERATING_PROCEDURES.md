# Standard Operating Procedures & Audits

These procedures outline the rigid steps for interacting with the Shamrock ecosystem. 

## 1. Documentation & Clean-up
- **Workflow**: `/documentation_cleanup`
- Audit and archive outdated instructions. Ensure any major structural changes reflect in `docs/ARCHITECTURE.md` or `docs/AGENTS.md`.

## 2. Syncing Google Apps Script (GAS)
- **Workflow**: `/clasp_safe_push` or `/deploy_gas_versioned`
- **Steps**:
  1. Pull remote first `clasp pull`.
  2. Implement local changes in `backend-gas/`.
  3. Validate syntax (Skill: `Systematic Debugging` > `Testing Framework`).
  4. Push safely `clasp push`.
  5. Deploy with an explicit version note `clasp deploy -d "Description"`.

## 3. Wix Syncing & Development
- **Workflow**: `/wix_safe_sync`
- **Steps**:
  1. Wix is a highly visual environment. Verify the layout with Skill: `UI Visual Validator`.
  2. Resolve merge conflicts carefully. Use the `wix.lock` system.
  3. If Velo fails, use Skill: `Wix-GAS Bridge Integrity Check` to restore communication.

## 4. Security & Production Release
- **Workflow**: `/production-code-audit` / Skill: `Audit Security`
- **Steps**:
  1. Scan for PII leaks (phones, emails, SSNs).
  2. Confirm Secrets Management (no hardcoded API keys).
  3. Verify Idempotence on all Webhooks.
  4. Do not commit `.gas-config.json` changes containing tokens.

## 5. Webhook Integrity
- Always verify the origin of Webhook calls matching expected headers or IPs. 
- For Twilio or Telegram, validate signatures.
