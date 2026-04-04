# Magiclinks Collection Schema

**Collection Name:** `Magiclinks`  
**Purpose:** Store magic link tokens for passwordless authentication  
**Created:** 2026-02-02

---

## Required Fields

| Field Name | Field Key | Type | Required | Description | Example |
|------------|-----------|------|----------|-------------|---------|
| Token | `token` | Text | ✅ Yes | Unique magic link token (48 chars) | `ml_a1b2c3d4e5f6...` |
| Contact | `contact` | Text | ✅ Yes | User email or phone number | `user@example.com` or `+12395551234` |
| Role | `role` | Text | ✅ Yes | Target role for this login | `indemnitor`, `defendant`, `staff`, `admin` |
| Case ID | `caseId` | Text | ❌ No | Associated case ID (for defendants) | `CASE-2026-001` |
| Created At | `createdAt` | Date & Time | ✅ Yes | When magic link was generated | `2026-02-02T10:30:00Z` |
| Expires At | `expiresAt` | Date & Time | ✅ Yes | When magic link expires (24 hours) | `2026-02-03T10:30:00Z` |
| Used | `used` | Boolean | ✅ Yes | Whether link has been clicked | `true` or `false` |
| Used At | `usedAt` | Date & Time | ❌ No | When link was clicked | `2026-02-02T11:00:00Z` |

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

1. **Text fields:** `token`, `contact`, `role`, `caseId`
2. **Date & Time fields:** `createdAt`, `expiresAt`, `usedAt`
3. **Boolean field:** `used`

---

## CSV Template

See `Magiclinks_CORRECTED.csv` for upload template.

---

## Validation Rules

1. **token** must be unique (48-character random string prefixed with `ml_`)
2. **contact** must be valid email or E.164 phone number
3. **role** must be one of: `indemnitor`, `defendant`, `staff`, `admin`
4. **expiresAt** must be after `createdAt`
5. **used** defaults to `false`
6. **usedAt** is only set when `used` becomes `true`

---

## Usage in Code

```javascript
// Generate magic link
const token = 'ml_' + generateToken(48);
await wixData.insert('Magiclinks', {
    token: token,
    contact: 'user@example.com',
    role: 'indemnitor',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    used: false
}, { suppressAuth: true });

// Validate magic link
const results = await wixData.query('Magiclinks')
    .eq('token', token)
    .eq('used', false)
    .find({ suppressAuth: true });

// Mark as used
if (results.items.length > 0) {
    const link = results.items[0];
    link.used = true;
    link.usedAt = new Date();
    await wixData.update('Magiclinks', link, { suppressAuth: true });
}
```

---

## Magic Link Flow

1. **User requests magic link** (enters email/phone on portal-landing)
2. **Backend generates token** and stores in Magiclinks collection
3. **Email/SMS sent** with link: `https://shamrockbailbonds.biz/portal-landing?token=ml_...`
4. **User clicks link** → Frontend extracts token from URL
5. **Backend validates token** (checks expiry, not used)
6. **Backend marks token as used** (sets `used: true`, `usedAt: now`)
7. **Backend creates session** in Portal Sessions collection
8. **Frontend redirects** to appropriate portal with `st=...` parameter

---

## Notes

- Magic links expire after 24 hours (configurable in `portal-auth.jsw`)
- Each link can only be used once (`used: true` prevents reuse)
- Old magic links should be cleaned up periodically (implement cleanup job)
- Links are sent via email (SendGrid) or SMS (Twilio)
