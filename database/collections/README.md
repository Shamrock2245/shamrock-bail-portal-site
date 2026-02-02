# CMS Collection Schemas

This directory contains the JSON schema definitions for the custom authentication CMS collections created via Wix Data Collections API.

## Collections

### 1. Portal Users (`create_portal_users.json`)
Stores user profile information for all portal users (staff, indemnitors, defendants).

**Fields:**
- `email` (TEXT) - User email address
- `phone` (TEXT) - Contact phone number
- `name` (TEXT) - Full name
- `firstName` (TEXT) - First name
- `lastName` (TEXT) - Last name
- `role` (TEXT) - User role (staff, indemnitor, defendant)
- `caseId` (TEXT) - Associated case ID
- `address` (TEXT) - Street address
- `city` (TEXT) - City
- `state` (TEXT) - State
- `zip` (TEXT) - ZIP code
- `createdAt` (DATETIME) - Account creation timestamp
- `lastLoginAt` (DATETIME) - Last login timestamp

### 2. Portal Sessions (`create_portal_sessions.json`)
Manages active user sessions for custom authentication (NO Wix native Members).

**Fields:**
- `sessionToken` (TEXT) - Unique session token (passed as `?st=...` in URLs)
- `personId` (TEXT) - Reference to Portal Users record
- `role` (TEXT) - User role for this session
- `caseId` (TEXT) - Associated case ID
- `email` (TEXT) - Session user email
- `phone` (TEXT) - Session user phone
- `name` (TEXT) - Session user name
- `createdAt` (DATETIME) - Session creation time
- `expiresAt` (DATETIME) - Session expiration time
- `isActive` (BOOLEAN) - Whether session is currently active
- `invalidatedAt` (DATETIME) - When session was invalidated (if applicable)

### 3. Magiclinks (`create_magiclinks.json`)
Stores magic link tokens for passwordless authentication.

**Fields:**
- `token` (TEXT) - Unique magic link token
- `contact` (TEXT) - Email or phone number
- `role` (TEXT) - Target role for this magic link
- `caseId` (TEXT) - Associated case ID
- `createdAt` (DATETIME) - Link creation time
- `expiresAt` (DATETIME) - Link expiration time (typically 1 hour)
- `used` (BOOLEAN) - Whether link has been used
- `usedAt` (DATETIME) - When link was used (if applicable)

## Permissions

All collections are configured with **admin-only permissions**:
- Insert: ADMIN
- Update: ADMIN
- Remove: ADMIN
- Read: ADMIN

Backend functions use `{ suppressAuth: true }` to bypass Wix's default authentication and implement custom session validation.

## Creation

These collections were created on **February 2, 2026** via the Wix Data Collections API:

```bash
POST https://www.wixapis.com/wix-data/v2/collections
```

See `../COLLECTIONS_CREATED_SUCCESS.md` for full creation details and sample data.

## Usage in Code

### Backend Authentication (`src/backend/portal-auth.jsw`)
```javascript
// Validate session token
export async function validateCustomSession(sessionToken) {
  const result = await wixData.query('PortalSessions')
    .eq('sessionToken', sessionToken)
    .eq('isActive', true)
    .find({ suppressAuth: true });
  
  if (result.items.length === 0) return null;
  
  const session = result.items[0];
  if (new Date(session.expiresAt) < new Date()) return null;
  
  return session;
}
```

### Frontend Session Check (`src/pages/*.js`)
```javascript
import { validateCustomSession } from 'backend/portal-auth.jsw';

$w.onReady(async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionToken = urlParams.get('st');
  
  if (!sessionToken) {
    wixLocation.to('/portal-landing');
    return;
  }
  
  const session = await validateCustomSession(sessionToken);
  if (!session) {
    wixLocation.to('/portal-landing');
    return;
  }
  
  // Session valid, proceed with page logic
});
```

## Field Type Reference

Based on Wix Data Collections API documentation, field types must use these exact enum values:

| Field Type | Enum Value | Description |
|------------|-----------|-------------|
| Text | `TEXT` | String values |
| Number | `NUMBER` | Numeric values |
| Date | `DATE` | ISO date string (YYYY-MM-DD) |
| Date & Time | `DATETIME` | ISO datetime with timezone |
| Boolean | `BOOLEAN` | true/false values |
| Image | `IMAGE` | Image URL or Media Manager URL |
| Document | `DOCUMENT` | Document URL |
| URL | `URL` | Web URL |
| Rich Text | `RICH_TEXT` | HTML content |
| Reference | `REFERENCE` | Single item reference |
| Multi-Reference | `MULTI_REFERENCE` | Multiple item references |
| Array | `ARRAY` | JSON array |
| Object | `OBJECT` | JSON object |

**Important:** Field types are case-sensitive and must be uppercase (e.g., `DATETIME` not `date_time`).

## Related Documentation

- `../COLLECTIONS_CREATED_SUCCESS.md` - Full creation log with sample data
- `../CMS-COLLECTIONS.md` - Original collection planning document
- `../../src/backend/portal-auth.jsw` - Authentication implementation
- `../../docs/AUTHENTICATION_SYSTEM.md` - Authentication architecture overview
