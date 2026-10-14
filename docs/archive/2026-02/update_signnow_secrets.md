# Update SignNow Credentials in Wix Secrets Manager

## Credentials to Update

### 1. SIGNNOW_API_KEY
**Value:** `REDACTED_SIGNNOW_API_KEY`  
**Usage:** Primary authentication for all SignNow API calls  
**Format:** Bearer token in Authorization header

### 2. SIGNNOW_WEBHOOK_SECRET
**Value:** `REDACTED_SIGNNOW_WEBHOOK_SECRET`  
**Usage:** HMAC signature verification for incoming webhooks  
**Format:** Secret key for cryptographic validation

### 3. SIGNNOW_CLIENT_ID (Optional - for OAuth if needed)
**Value:** `<redacted — name only>`  
**Usage:** OAuth 2.0 client identification

### 4. SIGNNOW_BASIC_TOKEN (Optional - for OAuth if needed)
**Value:** `<SIGNNOW_BASIC_TOKEN — stored in Wix Secrets Manager>`  
**Usage:** Basic authorization for generating access tokens

## How to Update in Wix

1. Open Wix Editor
2. Go to **Settings** → **Secrets Manager**
3. Update or create each secret above
4. Save changes

## Verification

After updating, test with this API call:
```bash
curl --request GET \
  --url https://api.signnow.com/user \
  --header 'Authorization: Bearer REDACTED_SIGNNOW_API_KEY'
```

Expected response: User account information
