# Portal Sessions Collection Schema

**Collection Name:** `Portal Sessions`  
**Purpose:** Store active user session tokens for custom authentication  
**Created:** 2026-02-02

---

## Required Fields

| Field Name | Field Key | Type | Required | Description | Example |
|------------|-----------|------|----------|-------------|---------|
| Session Token | `sessionToken` | Text | ✅ Yes | Unique session identifier (48 chars) | `a1b2c3d4e5f6...` |
| Person ID | `personId` | Text | ✅ Yes | User identifier (email, phone, or caseId) | `user@example.com` |
| Role | `role` | Text | ✅ Yes | User role | `indemnitor`, `defendant`, `staff`, `admin` |
| Case ID | `caseId` | Text | ❌ No | Associated case ID (for defendants) | `CASE-2026-001` |
| Email | `email` | Text | ❌ No | User email address | `user@example.com` |
| Phone | `phone` | Text | ❌ No | User phone number (E.164 format) | `+12395551234` |
| Name | `name` | Text | ❌ No | User display name | `John Doe` |
| Created At | `createdAt` | Date & Time | ✅ Yes | When session was created | `2026-02-02T10:30:00Z` |
| Expires At | `expiresAt` | Date & Time | ✅ Yes | When session expires (24 hours) | `2026-02-03T10:30:00Z` |
| Is Active | `isActive` | Boolean | ✅ Yes | Whether session is still valid | `true` or `false` |
| Invalidated At | `invalidatedAt` | Date & Time | ❌ No | When session was manually logged out | `2026-02-02T15:00:00Z` |

---

## Collection Permissions

**CRITICAL:** Set all permissions to **Admin** only:

- **Read:** Admin
- **Create:** Admin
- **Update:** Admin
- **Delete:** Admin

Backend code uses `suppressAuth: true` to bypass these restrictions for authenticated operations.

---

## Field Type Mapping

When creating the collection in Wix CMS:

1. **Text fields:** `sessionToken`, `personId`, `role`, `caseId`, `email`, `phone`, `name`
2. **Date & Time fields:** `createdAt`, `expiresAt`, `invalidatedAt`
3. **Boolean field:** `isActive`

---

## CSV Template

See `Portal_Sessions_CORRECTED.csv` for upload template.

---

## Validation Rules

1. **sessionToken** must be unique (48-character random string)
2. **personId** must not be empty
3. **role** must be one of: `indemnitor`, `defendant`, `staff`, `admin`
4. **expiresAt** must be after `createdAt`
5. **isActive** defaults to `true`

---

## Usage in Code

```javascript
// Create session
await wixData.insert('Portal Sessions', {
    sessionToken: generateToken(48),
    personId: 'user@example.com',
    role: 'indemnitor',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true
}, { suppressAuth: true });

// Validate session
const results = await wixData.query('Portal Sessions')
    .eq('sessionToken', token)
    .eq('isActive', true)
    .find({ suppressAuth: true });
```

---

## Notes

- Sessions expire after 24 hours (configurable in `portal-auth.jsw`)
- Expired sessions are marked `isActive: false` but not deleted
- Manual logout sets `invalidatedAt` and `isActive: false`
- Old sessions should be cleaned up periodically (implement cleanup job)
