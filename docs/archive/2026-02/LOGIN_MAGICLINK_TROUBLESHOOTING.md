# Magic Link Login Troubleshooting (Scanner Defense)

## Problem
Some email providers (Gmail, Outlook 365, Microsoft Safe Links) **pre-fetch** links in inbound emails. That background request can consume a **single-use** magic link before the human clicks it, resulting in false “link already used” errors.

## Fix Implemented
The login flow in `src/backend/portal-auth.jsw` now applies an **idempotency grace period**:

- If a magic link is marked `used` **within 5 minutes**, the login is still allowed.
- If `usedAt` is missing or invalid, the link is treated as truly used and rejected.
- Expired links are still rejected normally.

This protects against automated scanners while keeping tokens single-use after the short grace window.

## Operational Notes
- **Collection:** `Magiclinks`
- **Grace Period:** `5 minutes` (`MAGIC_LINK_GRACE_PERIOD_MS`)
- **Behavior:**
  - Used within grace period → allow login
  - Used beyond grace period → reject
  - Used with missing/invalid `usedAt` → reject

## Verification Checklist
1. Send a magic link to an enterprise email address (Outlook/Gmail).
2. Click the email link within 5 minutes.
3. Confirm login succeeds even if the link shows as “used” in the collection.
4. After 5 minutes, confirm the same link is rejected.

