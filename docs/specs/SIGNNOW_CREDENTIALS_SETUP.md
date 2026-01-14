# SignNow Credentials Setup for Wix Velo

**Date:** December 26, 2025  
**Purpose:** Securely store and access SignNow OAuth 2.0 credentials in Wix Velo

---

## Overview

SignNow OAuth 2.0 credentials must be stored in the **Wix Secrets Manager** to ensure secure access from backend code without hardcoding sensitive values.

---

## Credentials to Store

The following credentials must be added to the Wix Secrets Manager:

| Secret Name | Value | Description |
|:---|:---|:---|
| `signnow-client-id` | `f4faf24c7b2b6b47b3db357f7c1a8` | SignNow OAuth 2.0 Client ID |
| `signnow-client-secret` | `5a3d6b5cce7e27b2a95f3d5a8f82` | SignNow OAuth 2.0 Client Secret |
| `signnow-access-token` | `0c35edbbf6823555a8434624aaec4830fd4477bb5befee3da2fa29e2b258913d` | SignNow API Access Token (legacy) |

---

## How to Add Secrets in Wix Dashboard

### Step 1: Access Secrets Manager

1. Open your Wix site dashboard
2. Navigate to **Developer Tools** → **Secrets Manager**
3. Click **+ Add Secret** button

### Step 2: Add Each Secret

For each credential above:

1. **Name:** Enter the secret name (e.g., `signnow-client-id`)
   - Only letters, numbers, hyphens, and underscores
   - Cannot start with "wix"
   - 40 character maximum
2. **Value:** Paste the credential value
   - 3,500 character maximum
3. **Description:** Add context (e.g., "SignNow OAuth 2.0 Client ID for bail paperwork integration")
   - 200 character maximum
4. Click **Save**

---

## How to Access Secrets in Backend Code

### Import the Secrets API

```javascript
import { getSecret } from 'wix-secrets-backend';
```

### Retrieve Secrets

```javascript
// Get SignNow Client ID
const clientId = await getSecret('signnow-client-id');

// Get SignNow Client Secret
const clientSecret = await getSecret('signnow-client-secret');

// Get SignNow Access Token (legacy)
const accessToken = await getSecret('signnow-access-token');
```

### Example: OAuth Token Exchange

```javascript
import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';

export async function getSignNowAccessToken(authorizationCode) {
  try {
    const clientId = await getSecret('signnow-client-id');
    const clientSecret = await getSecret('signnow-client-secret');
    
    const response = await fetch('https://api.signnow.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=authorization_code&code=${authorizationCode}&client_id=${clientId}&client_secret=${clientSecret}`
    });
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('SignNow OAuth error:', error);
    throw error;
  }
}
```

---

## Security Best Practices

### ✅ DO

- Store all API keys and OAuth credentials in Secrets Manager
- Use descriptive names for secrets (e.g., `signnow-client-id`)
- Add descriptions to document what each secret is for
- Access secrets only in backend (.jsw) files
- Handle errors gracefully when secrets are missing

### ❌ DON'T

- Never hardcode credentials in code
- Never commit secrets to version control
- Never expose secrets in frontend code
- Never log secret values in console or logs
- Never share secrets via email or chat

---

## Roles and Permissions

Only site collaborators with these roles can access Secrets Manager:

- **Admin (Co-Owner)**
- **Website Manager**

---

## Integration Points

The following files will use these secrets:

1. **`src/backend/signnow-integration.jsw`**
   - OAuth token exchange
   - Document template retrieval
   - Signing invitation creation

2. **`src/pages/members/StartBail.js`**
   - Initiates SignNow paperwork flow
   - Redirects to OAuth authorization

3. **`src/backend/webhooks/signnow-webhook.jsw`**
   - Validates webhook signatures
   - Processes document completion events

---

## Testing Checklist

After adding secrets to Wix Secrets Manager:

- [ ] Verify secrets are accessible in backend code
- [ ] Test OAuth authorization flow
- [ ] Confirm document template retrieval works
- [ ] Validate webhook signature verification
- [ ] Check error handling for missing secrets

---

## References

- [Wix Secrets Manager Documentation](https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/secrets-manager/about-the-secrets-manager)
- [Wix Secrets API Reference](https://dev.wix.com/docs/velo/apis/wix-secrets-backend/introduction)
- [SignNow OAuth 2.0 Documentation](https://docs.signnow.com/docs/signnow/authentication)

---

## Next Steps

1. Add all three secrets to Wix Secrets Manager via dashboard
2. Update `signnow-integration.jsw` to use `getSecret()` API
3. Test OAuth flow end-to-end
4. Implement webhook signature validation
5. Add comprehensive error logging
