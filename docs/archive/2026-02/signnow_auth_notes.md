# SignNow Authentication Setup Notes

## Key Findings from Documentation

### Two Authentication Methods

1. **API Key (Easiest)** - Recommended for server-to-server
   - Generated automatically when you create an application
   - Use directly in Authorization header: `Bearer {{API_key}}`
   - No need to generate access tokens
   - Works for most API operations

2. **OAuth 2.0 (Access Token)** - For user-specific operations
   - Requires Basic Authorization Token + Password Grant
   - Generates temporary access tokens
   - More complex but supports user-level permissions

### Current Credentials

**Application Details:**
- Application ID: `60910f0631c84a94b842a0d8a13233039a848b9e`
- Client ID: `3b4dd51e0a07557e5b0e6b42415759db`
- Basic Authorization Token: `<SIGNNOW_BASIC_AUTH_TOKEN — stored in Wix Secrets Manager>`
- Secret Key: `REDACTED_SIGNNOW_WEBHOOK_SECRET`

**API Key (Primary):**
- API Key: `REDACTED_SIGNNOW_API_KEY`

**Account Credentials:**
- Email: `admin@shamrockbailbonds.biz`
- Password: `<SIGNNOW_ACCOUNT_PASSWORD — stored in password manager>`

## Authentication Flow

### Method 1: API Key (Recommended for Shamrock)
```bash
curl --request POST \
  --url https://api.signnow.com/document/{{document_id}}/invite \
  --header 'Authorization: Bearer REDACTED_SIGNNOW_API_KEY' \
  --header 'Content-Type: application/json'
```

### Method 2: OAuth Password Grant (If needed)
```bash
# Step 1: Generate access token
curl --request POST \
  --url https://api.signnow.com/oauth2/token \
  --header 'Authorization: Basic <SIGNNOW_BASIC_AUTH_TOKEN — stored in Wix Secrets Manager>' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'username=admin@shamrockbailbonds.biz' \
  --data-urlencode 'password=<SIGNNOW_ACCOUNT_PASSWORD — stored in password manager>' \
  --data-urlencode 'grant_type=password' \
  --data-urlencode 'scope=*'

# Step 2: Use returned access_token in subsequent requests
curl --request POST \
  --url https://api.signnow.com/document/{{document_id}}/invite \
  --header 'Authorization: Bearer {{access_token}}' \
  --header 'Content-Type: application/json'
```

## Webhook Setup

According to docs, these webhook operations work with **Basic Authorization**:
- Get event subscriptions
- Delete event subscriptions (basic auth)
- Edit event subscriptions (basic auth)

For webhook verification, we need:
- Webhook Secret: Use the Secret Key `REDACTED_SIGNNOW_WEBHOOK_SECRET`

## Next Steps

1. Update Wix Secrets Manager with new credentials
2. Update GAS Script Properties with new credentials
3. Test API connection with API key
4. Configure webhooks for document completion events
5. Verify webhook HMAC signature validation
