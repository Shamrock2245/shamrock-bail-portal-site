# Security Policy - Shamrock Bail Suite

Security protocols for protecting sensitive data within the Shamrock ecosystem.

## 1. Data Protection
- **Arrestee Data:** All arrest data (PII) must be stored in the Master Sheet and Google Drive with restricted access.
- **Mugshots:** Use temporary signed URLs where possible. Do not store raw image files in public repositories.
- **Wix Data:** Use Wix's built-in data encryption and permission levels (Admin only for sensitive logs).

## 2. Secrets Management
- **No Hardcoding:** Never hardcode API keys, Sheet IDs, or webhook URLs in `.js` or `.jsw` files.
- **Environment Variables:** Use Wix Secrets, GitHub Actions Secrets, and GAS Script Properties.
- **Rotation:** Credentials should be rotated every 180 days.

## 3. Access Control
- **GitHub:** MFA required for all contributors. No public forks of internal repos.
- **Google Sheets:** Only dedicated "Shamrock Lead Admins" should have deletion privileges.
- **Wix Portal:** Use role-based access control (RBAC) to ensure defendants cannot see other defendants' data.

## 4. Reporting Vulnerabilities
If you discover a security flaw (e.g., exposed API key, data leak), please:
1. Revoke the compromised secret immediately.
2. Report the incident to the project owner.
3. Patch the code and audit the logs for unauthorized access.

## 5. Third-Party Services
- **SignNow:** All document transactions must follow the "Private" visibility setting.
- **Google Drive:** Folders containing signed contracts must be private with no "Anyone with link" access.

> [!CAUTION]
> Hardcoding an API key is a project-stopping offense. Always use the Platform Secret Manager.
