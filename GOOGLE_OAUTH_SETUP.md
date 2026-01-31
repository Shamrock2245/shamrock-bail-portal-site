# Google OAuth Setup Documentation

**Date:** January 30, 2026  
**Status:** OAuth Credentials Created, Awaiting Wix Secrets Configuration  
**Project:** Shamrock Bail Bonds Portal - Google Login Integration

---

## Overview

Google Login (OAuth 2.0) has been configured for the Shamrock Bail Bonds website to allow users to sign in with their Google accounts. This document details the complete setup, credentials, and next steps.

---

## Google Cloud Platform Configuration

### Project Details
- **Project Name:** shamrock-bail-suite
- **Project ID:** shamrock-bail-suite
- **Google Account:** admin@shamrockbailbonds.biz

### OAuth Consent Screen
- **App Name:** Shamrock Bail Bonds Portal
- **User Type:** External (public)
- **Publishing Status:** In Production
- **User Support Email:** admin@shamrockbailbonds.biz
- **Developer Contact Email:** admin@shamrockbailbonds.biz

**Console URL:** https://console.cloud.google.com/auth/branding?project=shamrock-bail-suite

---

## OAuth Client Credentials

### Client Details
- **Client Name:** Shamrock Bail Portal Web Client
- **Application Type:** Web application
- **Created:** January 30, 2026

### Credentials (CONFIDENTIAL)

**Client ID:** `[See GOOGLE_OAUTH_CREDENTIALS.txt - NOT committed to repo]`

**Client Secret:** `[See GOOGLE_OAUTH_CREDENTIALS.txt - NOT committed to repo]`

**⚠️ SECURITY NOTE:** Credentials are stored separately and NOT committed to this repository. They MUST be added to Wix Secrets Manager. Contact project owner for credentials.

### Authorized URLs

**Authorized JavaScript Origins:**
- https://www.shamrockbailbonds.biz

**Authorized Redirect URIs:**
- https://www.shamrockbailbonds.biz/_functions/authCallback

**Console URL:** https://console.cloud.google.com/auth/clients?project=shamrock-bail-suite

---

## Wix Configuration

### Required Secrets

The following secrets MUST be added to Wix Secrets Manager for Google Login to work:

| Secret Name | Secret Value |
|-------------|--------------|  
| `GOOGLE_CLIENT_ID` | `[Contact project owner for value]` |
| `GOOGLE_CLIENT_SECRET` | `[Contact project owner for value]` |

### How to Add Secrets to Wix

**Method 1: Via Wix Editor**
1. Open your Wix site in the Editor
2. Enable Dev Mode (if not already enabled)
3. Click on the **Code** icon in the left sidebar
4. Go to **Secrets Manager** (under Backend section)
5. Click **+ New Secret**
6. Add each secret with the exact name and value from the table above

**Method 2: Via Wix CLI** (if authenticated)
```bash
wix secrets create GOOGLE_CLIENT_ID "[YOUR_CLIENT_ID]"
wix secrets create GOOGLE_CLIENT_SECRET "[YOUR_CLIENT_SECRET]"
```

**Note:** Actual credential values are stored securely outside this repository.

---

## Code Implementation

### Backend Files

**1. Social Authentication Handler**  
**File:** `src/backend/social-auth.jsw`  
**Purpose:** Handles Google OAuth flow, token exchange, and user data retrieval  
**Status:** ✅ Already implemented

Key functions:
- `getGoogleAuthUrl()` - Generates Google OAuth authorization URL
- `handleGoogleCallback(code)` - Exchanges authorization code for access token
- `getGoogleUserInfo(accessToken)` - Retrieves user profile from Google

**2. HTTP Functions (OAuth Callback)**  
**File:** `src/backend/http-functions.js`  
**Purpose:** Handles the OAuth callback from Google  
**Endpoint:** `/_functions/authCallback`  
**Status:** ✅ Already implemented

The callback endpoint:
- Receives the authorization code from Google
- Exchanges it for user info
- Creates or updates the Wix member
- Redirects to the portal

### Frontend Files

**3. Portal Landing Page**  
**File:** `src/pages/portal-landing.bagfn.js`  
**Purpose:** Displays the Google Login button  
**Status:** ✅ Already implemented

The page includes:
- "Sign in with Google" button
- Calls `getGoogleAuthUrl()` from backend
- Redirects user to Google consent screen

---

## OAuth Flow Diagram

```
1. User clicks "Sign in with Google" on portal landing page
   ↓
2. Frontend calls getGoogleAuthUrl() from social-auth.jsw
   ↓
3. User is redirected to Google consent screen
   ↓
4. User approves access and is redirected to:
   https://www.shamrockbailbonds.biz/_functions/authCallback?code=...
   ↓
5. authCallback function in http-functions.js:
   - Receives authorization code
   - Calls handleGoogleCallback(code)
   - Exchanges code for access token
   - Retrieves user info from Google
   ↓
6. User is created/updated in Wix Members
   ↓
7. User is redirected to portal dashboard
```

---

## Testing Checklist

### Prerequisites
- [ ] Google OAuth credentials created (✅ DONE)
- [ ] Wix Secrets added (⏳ PENDING)
- [ ] Site published with latest code

### Test Steps
1. Navigate to portal landing page: https://www.shamrockbailbonds.biz/portal-landing
2. Click "Sign in with Google" button
3. Verify redirect to Google consent screen
4. Approve access with a test Google account
5. Verify redirect back to Wix portal
6. Verify user is logged in and member record is created
7. Test logout and re-login

### Expected Behavior
- ✅ Smooth redirect to Google
- ✅ Google consent screen shows "Shamrock Bail Bonds Portal"
- ✅ After approval, user is logged into Wix
- ✅ User profile populated with Google data (name, email)
- ✅ Subsequent logins skip consent screen (already approved)

---

## Troubleshooting

### Common Issues

**Issue:** "Error 400: redirect_uri_mismatch"  
**Solution:** Verify the redirect URI in Google Cloud Console matches exactly:  
`https://www.shamrockbailbonds.biz/_functions/authCallback`

**Issue:** "Secrets not found" error in Wix  
**Solution:** Verify secrets are added to Wix Secrets Manager with exact names:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Issue:** "Access blocked: This app's request is invalid"  
**Solution:** Check that OAuth consent screen is published (not in Testing mode)

**Issue:** User data not saving to Wix Members  
**Solution:** Check Wix Members API permissions and ensure member creation code is working

---

## Security Considerations

### Credential Storage
- ✅ Client ID and Secret stored in Wix Secrets Manager (encrypted)
- ✅ Never exposed to frontend code
- ✅ Never logged or displayed in error messages

### OAuth Scopes
The application requests minimal Google scopes:
- `openid` - Basic authentication
- `email` - User's email address
- `profile` - User's basic profile info (name, picture)

### HTTPS Requirement
- ✅ All OAuth URLs use HTTPS
- ✅ Redirect URI is HTTPS only

---

## Service Account Information

**Note:** The Google Cloud project also has a service account configured:

**Service Account Email:** `bail-suite-sa@shamrock-bail-suite.iam.gserviceaccount.com`  
**Service Account ID:** `117584627585632502744`

**Important:** This service account is NOT used for OAuth login. It's for server-to-server API calls (if needed for other integrations). OAuth uses the Client ID/Secret configured above.

---

## Next Steps

### Immediate (Required for Google Login to Work)
1. ✅ Google OAuth credentials created
2. ⏳ **Add secrets to Wix Secrets Manager** (PENDING - see instructions above)
3. ⏳ Publish Wix site with latest code
4. ⏳ Test Google Login flow

### Future Enhancements
- [ ] Add OAuth branding (logo, privacy policy, terms of service)
- [ ] Submit app for Google verification (removes "unverified app" warning)
- [ ] Add additional OAuth providers (Facebook, Apple)
- [ ] Implement OAuth token refresh for long-lived sessions

---

## References

### Google Cloud Console URLs
- **Project Dashboard:** https://console.cloud.google.com/home/dashboard?project=shamrock-bail-suite
- **OAuth Consent Screen:** https://console.cloud.google.com/auth/branding?project=shamrock-bail-suite
- **OAuth Clients:** https://console.cloud.google.com/auth/clients?project=shamrock-bail-suite
- **Credentials:** https://console.cloud.google.com/apis/credentials?project=shamrock-bail-suite

### Wix Documentation
- **Wix OAuth Guide:** https://dev.wix.com/docs/develop-websites/articles/code-tutorials/wix-users/authentication/implementing-social-login
- **Wix Secrets Manager:** https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/backend-code/secrets-manager
- **Wix Members API:** https://dev.wix.com/docs/velo/api-reference/wix-members-backend

### Google OAuth Documentation
- **OAuth 2.0 Overview:** https://developers.google.com/identity/protocols/oauth2
- **Web Server Applications:** https://developers.google.com/identity/protocols/oauth2/web-server

---

## Contact & Support

**Project Owner:** Brendan O'Neal (admin@shamrockbailbonds.biz)  
**Repository:** https://github.com/Shamrock2245/shamrock-bail-portal-site  
**Documentation Updated:** January 30, 2026

---

## Changelog

### January 30, 2026
- Created Google Cloud project OAuth client
- Configured OAuth consent screen (External, In Production)
- Generated Client ID and Client Secret
- Documented complete setup process
- Code already implemented in repository (no changes needed)
- **Status:** Awaiting Wix Secrets configuration to activate Google Login
