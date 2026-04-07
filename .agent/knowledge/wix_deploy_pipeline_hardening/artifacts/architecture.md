# Wix Deploy Pipeline Hardening

---

## Problem 1: ESM Crypto Import Incompatibility

### Symptom

Wix build fails with `ReferenceError: crypto is not defined` or similar at build time,
even though the code works locally/in IDE with no visible error.

### Root Cause

Wix Velo enforces strict ESM. `import crypto from 'crypto'` is a **CommonJS default import**
and is illegal in Wix's ESM environment. The IDE does NOT flag this — it only fails at build.

### Fix

Replace ALL occurrences across every `.js` / `.jsw` backend file:

```javascript
// ❌ WRONG — CommonJS default import (breaks Wix ESM build)
import crypto from 'crypto';
crypto.createHmac('sha256', secret).update(data).digest('hex');

// ✅ CORRECT — Named ESM imports
import { createHmac, createHash, randomBytes } from 'crypto';
createHmac('sha256', secret).update(data).digest('hex');
```

### Edge Cases Discovered

1. **Multiline chained calls** — `crypto\n  .createHmac(...)` spans two lines and is missed
   by simple string search. Must grep with regex: `crypto\s*\n\s*\.`

2. **Naming conflicts** — If a file exports a function named `createHash`, importing
   `{ createHash }` from crypto will shadow it. Use an alias:

   ```javascript
   import { createHash as _cryptoCreateHash } from 'crypto';
   ```

### Affected Files (this project)

- `src/backend/http-functions.js`
- `src/backend/auth-utils.jsw` (+ naming alias needed)
- `src/backend/auth-utils.js`
- `src/backend/portal-auth.jsw`
- `src/backend/signnow-webhooks.jsw`

### Prevention

Rule 7 added to `RULES.md`: "ESM Named Imports Only (Wix Backend)"

---

## Problem 2: Expired WIX_CLI_API_KEY

### Symptom

GitHub Actions fails at the authentication step with:

```text
✖ Failed to get account information.
FailedToGetMyAccount: 404 - Entity not found
```

The build step never even starts. No code error — pure auth failure.

### Root Cause

The Wix CLI API key stored in GitHub Secrets under `WIX_CLI_API_KEY` had expired silently.
Wix does not notify on expiry. No IDE, Slack, or GitHub warning is issued.

### Fix Steps

1. Go to `manage.wix.com/account/api-keys` (logged in as `admin@shamrockbailbonds.biz`)
2. Wix sends a 6-digit verification code to that email — enter it
3. Generate new key → **All Permissions** → copy immediately (shown once only)
4. Go to GitHub → repo → Settings → Secrets → Actions → update `WIX_CLI_API_KEY`
5. Trigger manual run: Actions → Deploy to Wix → Run workflow → verify ✅

### Prevention

Rule 8 added to `RULES.md`. Full rotation procedure in `SECRETS_ROTATION_GUIDE.md` Section 5.

---

## Session Timeline

- Identified deploy failure from Slack notification
- Traced to ESM issue via GitHub Actions build log
- Fixed 5 backend files (named imports + multiline pattern + alias)
- Still failing → traced to expired API key (404 at auth step)
- Regenerated key → GitHub Actions Run #25 ✅ (32 seconds)
- Documented in RULES, CHANGELOG, TASKS, SECRETS_ROTATION_GUIDE

---

## Quick Reference Checklist (for future deploy failures)

1. **Check GitHub Actions log** — is it failing at build or auth?
   - Auth failure → 404 entity not found → rotate `WIX_CLI_API_KEY`
   - Build failure → ReferenceError/SyntaxError → check ESM imports

2. **Grep for bare `crypto` identifiers** in backend files:

   ```bash
   grep -rn "import crypto from\|crypto\." src/backend/
   ```

3. **Check for multiline crypto calls**:

   ```bash
   grep -Pn "crypto\s*$" src/backend/
   ```
