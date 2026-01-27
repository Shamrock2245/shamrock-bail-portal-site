# Production Code Audit

<SKILL_METADATA>
description: Comprehensive checklist and workflow for auditing code before production release
version: 1.0.0
author: sickn33
</SKILL_METADATA>

## Overview
A standardized approach to verifying code quality, security, and performance before deployment.

## Production Audit Checklist

### Security
- [ ] No SQL injection vulnerabilities (use ORM/prepared statements)
- [ ] No hardcoded secrets (use Secrets Manager/Env Vars)
- [ ] Authentication on protected routes (verify session/role)
- [ ] Authorization checks implemented (verify ownership)
- [ ] Input validation on all endpoints (zod/joi/custom)
- [ ] HTTPS enforced
- [ ] Dependencies have no known vulnerabilities

### Performance
- [ ] No N+1 query problems
- [ ] Database indexes on foreign keys
- [ ] Caching implemented for expensive operations
- [ ] API response time < 200ms
- [ ] Code splitting / lazy loading for large bundles

### Testing
- [ ] Critical paths covered by manual or automated tests
- [ ] Edge cases considered (null/undefined/empty states)
- [ ] Error handling is graceful (no white screens/raw stack traces)

### Production Readiness
- [ ] Environment variables configured in Production
- [ ] Error tracking setup (Sentry/Logs)
- [ ] Structured logging implemented (Context + Error)
- [ ] User feedback mechanisms working (Fallbacks)

## How It Works
1.  **Discover**: Map the surface area of the change.
2.  **Detect**: Run through the checklist against the specific changes.
3.  **Fix**: Address critical issues immediately.
4.  **Verify**: Confirm fixes with tests or manual verification.
