# Social Media Publisher: API Credential Setup Guide

This guide provides step-by-step instructions for obtaining the necessary API credentials for each social media platform. These credentials must be stored in your Google Apps Script **Script Properties** to enable the one-click publishing feature.

**Where to Store Credentials:**
1. Open your Google Apps Script project.
2. Go to **Project Settings** (the gear icon ⚙️).
3. Scroll down to the **Script Properties** section and click **Add script property**.

---

## 1. Google Business Profile API

**Required Properties:**
- `GOOGLE_OAUTH_CLIENT_ID` (Required to initialize OAuth)
- `GOOGLE_OAUTH_CLIENT_SECRET` (Required to initialize OAuth)
- `GBP_ACCESS_TOKEN` (Generated automatically)
- `GBP_REFRESH_TOKEN` (Generated automatically)
- `GBP_LOCATION_ID`

### Steps:

1.  **Enable the APIs & Request Quota:**
    - Go to the [Google API Console](https://console.cloud.google.com/apis/library/).
    - Select a project or create a new one.
    - Search for and **Enable** the following two APIs:
      1.  **My Business Account Management API** (Needed to list accounts/locations)
      2.  **My Business Business Information API** (Needed to create posts)
    - **CRITICAL:** Google sets your initial quota for these APIs to **0**. After enabling them, you *must* fill out the [Google Business Profile API Application](https://support.google.com/business/contact/api_default) to get your quota increased so you can actually use the API. Approval usually takes a few days.

2.  **Create OAuth 2.0 Credentials:**
    - Go to the [Credentials page](https://console.cloud.google.com/apis/credentials).
    - Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
    - Choose **Web application** as the application type.
    - Under **Authorized redirect URIs**, add the special Apps Script URI: `https://script.google.com/macros/d/{SCRIPT_ID}/usercallback` (replace `{SCRIPT_ID}` with your actual GAS project's Script ID).
    - Click **Create**.
    - Store the **Client ID** as `GOOGLE_OAUTH_CLIENT_ID` in your GAS Script Properties.
    - Store the **Client Secret** as `GOOGLE_OAUTH_CLIENT_SECRET` in your GAS Script Properties.

3.  **Get an Access Token (via OAuth2 for GAS):**
    - The `SocialPublisher.js` file will include a function `getGbpAuthUrl()` that you can run once to get an authorization URL. You will visit this URL, approve access, and the script will automatically handle storing the access and refresh tokens.

4.  **Find your Location ID:**
    - Use the [Google Business Profile locations.list API explorer](https://developers.google.com/my-business/reference/businessinformation/rest/v1/locations/list) to find the ID for your business location. It will look like `locations/12345678901234567890`.
    - Store just the numeric part (e.g., `12345678901234567890`) in the `GBP_LOCATION_ID` script property.

---

## 2. X (Twitter) API v2

> **Strategic Note:** X (Twitter) is used exclusively as an outbound "megaphone" for automated marketing posts, bail bond facts, and geographic updates. Due to API limitations and WhatsApp Terms of Service, **all customer service must be directed to Telegram**. 
> 
> **Action Required:** Ensure your X (Twitter) profile bio includes a direct link to your Telegram bot (e.g., `t.me/ShamrockBailBot`) for customer service inquiries.

**Required Properties:**
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`

### Steps:

1.  **Apply for a Developer Account:**
    - Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) and sign in with your Shamrock Bail Bonds Twitter account.
    - Apply for a new developer account. You will need to describe your use case (e.g., "Programmatically posting company updates to our own business profile via an internal dashboard").

2.  **Create a New Project and App:**
    - Once approved, create a new Project.
    - Inside the project, create a new App.
    - Give the app **Read and Write** permissions.

3.  **Generate Keys and Tokens:**
    - In your App's settings, go to the **Keys and tokens** tab.
    - Under **Consumer Keys**, regenerate the **API Key** and **API Key Secret**. Copy these and store them as `TWITTER_API_KEY` and `TWITTER_API_SECRET`.
    - Under **Authentication Tokens**, generate the **Access Token** and **Access Token Secret**. Copy these and store them as `TWITTER_ACCESS_TOKEN` and `TWITTER_ACCESS_TOKEN_SECRET`.

---

## 3. LinkedIn Company Page API

**Required Properties:**
- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_COMPANY_URN`

### Steps:

1.  **Create a Developer App:**
    - Go to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps/new).
    - Create a new app, linking it to your Shamrock Bail Bonds company page.
    - In the **Products** tab, add the **"Share on LinkedIn"** and **"Sign In with LinkedIn using OpenID Connect"** products.

2.  **Get an Access Token:**
    - This requires an OAuth 2.0 flow. The `SocialPublisher.js` file will contain a `getLinkedinAuthUrl()` function. Run this function, visit the URL it provides, authorize access, and the script will handle storing the token.

3.  **Find your Company URN:**
    - Your company page URL is something like `linkedin.com/company/your-company-name`.
    - Your URN is `urn:li:organization:{id}` where `{id}` is the numeric ID of your company page. You can find this ID by using the LinkedIn API after you've authenticated.
    - The script will attempt to find this automatically after you authorize it.

---

## 4. TikTok Content Posting API

**Required Properties:**
- `TIKTOK_ACCESS_TOKEN`

### Steps:

1.  **Enable Developer Tools on your TikTok Account:**
    - In the TikTok mobile app, go to your profile -> Settings and privacy -> **Developer options** and enable it.

2.  **Create a Developer App:**
    - Go to the [TikTok for Developers](https://developers.tiktok.com/) portal.
    - Create a new app with the **Content Posting API** scope.

3.  **Get an Access Token:**
    - This is another OAuth 2.0 flow. The `SocialPublisher.js` file will have a `getTiktokAuthUrl()` function. Run it, visit the URL, authorize, and the script will store the token.

---

## 5. YouTube Data API v3

**Required Properties:**
- `YOUTUBE_ACCESS_TOKEN`
- `YOUTUBE_CHANNEL_ID`

### Steps:

1.  **Enable the API:**
    - Go to the [Google API Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com).
    - Select the same project used for the Google Business Profile API.
    - Click **Enable** to activate the "YouTube Data API v3".

2.  **Use Existing OAuth Credentials:**
    - You can use the same OAuth 2.0 Client ID created for the Google Business Profile API. Ensure the YouTube API is enabled for that project.

3.  **Get an Access Token:**
    - The `SocialPublisher.js` file will have a `getYoutubeAuthUrl()` function. Run it, visit the URL (making sure to select your Shamrock Bail Bonds YouTube channel during the consent screen), and the script will store the token.

4.  **Find your Channel ID:**
    - Your channel ID is found in your YouTube account's [advanced settings](https://www.youtube.com/account_advanced). It will start with `UC...`.
    - Store this in the `YOUTUBE_CHANNEL_ID` script property.

---

## 6. Telegram API

**Required Properties:**
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

### Steps:

1.  **Create a Bot:**
    - Talk to [@BotFather](https://t.me/botfather) on Telegram and select `/newbot`.
    - Follow the prompts to create a bot. Copy the provided HTTP API Token.
    - Store this token as `TELEGRAM_BOT_TOKEN`.

2.  **Get Chat ID:**
    - Add your bot to the target channel or group as an admin.
    - Send a test message to the channel/group.
    - Visit `https://api.telegram.org/bot<YourBOTToken>/getUpdates` to find the `chat_id` in the JSON response.
    - Store this as `TELEGRAM_CHAT_ID` (usually starts with a `-` for channels/groups).

---

## 7. Meta Platform (Facebook, Instagram, Threads)

### Architecture

All three Meta platforms use **Meta Graph API v21.0**. Facebook and Instagram share a single Meta App and Page Access Token. Threads uses a **separate** Threads App with its own token.

```
Dashboard.html (Browser)
       │  google.script.run
       ▼
SocialPublisher.js (GAS)
       ├── postToFacebook_()   → graph.facebook.com/v21.0/{pageId}/feed
       ├── postToInstagram_()  → graph.facebook.com/v21.0/{igId}/media + /media_publish
       └── postToThreads_()    → graph.threads.net/v1.0/{userId}/threads + /threads_publish
```

---

### 7a. Facebook Page Posting

**Required Script Properties:**
- `FACEBOOK_CLIENT_ID` (for OAuth setup only)
- `FACEBOOK_CLIENT_SECRET` (for OAuth setup only)
- `FB_PAGE_ACCESS_TOKEN` (**required for posting**)
- `FB_PAGE_ID` (**required for posting**)

#### Steps:

1.  **Create or Use an Existing Meta App:**
    - Go to [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)
    - Select an existing app or click **Create App** → **Business** type
    - Add the **Facebook Login for Business** product
    - Under **Settings → Basic**, note your **App ID** and **App Secret**
    - Store them as `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`

2.  **Set the Redirect URI:**
    - Go to **Facebook Login for Business → Settings**
    - Under **Valid OAuth Redirect URIs**, add your GAS Web App URL:
      `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`
    - Save changes

3.  **Set Script Properties** (in GAS IDE → Project Settings → Script Properties):

    | Property | Value |
    |---|---|
    | `FACEBOOK_CLIENT_ID` | Your Meta App ID |
    | `FACEBOOK_CLIENT_SECRET` | Your Meta App Secret |
    | `FB_PAGE_ID` | Your Facebook Page numeric ID |

    > **How to find your Page ID:** Go to your Facebook Page → About → scroll to the bottom → Page ID.

4.  **Authorize and Get Page Access Token:**
    - In the GAS IDE, run the function **`logAuthUrl_Facebook`**
    - Copy the URL from the Execution Log and open it in your browser
    - Authorize the app with your Facebook account
    - After redirect, copy the `code=` parameter from the URL (strip the trailing `#_`)
    - In Script Properties, temporarily set `FB_USER_ACCESS_TOKEN` to that code
    - Run **`exchangeFacebookTokenForPageToken`** — this automatically:
      - Exchanges the code for a long-lived user token
      - Fetches and stores your `FB_PAGE_ACCESS_TOKEN`

    > If `FB_PAGE_ID` is not set, the function lists all your pages in the Execution Log.

5.  **Verify:** In the Dashboard Social Hub, the Facebook credential indicator turns green.

---

### 7b. Instagram Business Account

Instagram uses the **same Facebook App and Page Access Token**. The only additional requirement is linking your Instagram Professional account to your Facebook Page.

**Required Script Properties:**
- `FB_PAGE_ACCESS_TOKEN` (same as Facebook — already set)
- `FB_PAGE_ID` (same as Facebook — already set)
- `INSTAGRAM_ACCOUNT_ID` (auto-discovered on first post)

#### Steps:

1.  **Link Instagram to Facebook Page:**
    - Go to your Facebook Page → **Settings → Linked Accounts → Instagram**
    - Click **Connect Account** and log in to your Instagram Business/Creator account

2.  **No additional credentials needed.** The `INSTAGRAM_ACCOUNT_ID` is auto-discovered on the first Instagram post.

> **Important:** The Instagram Graph API **does not support text-only posts**. If no media is attached, the system returns a graceful message with a link to post manually. For media posts, attach a Google Drive File ID in the Social Hub — the file must be publicly accessible.

---

### 7c. Threads

Threads uses a **separate Meta App** with the Threads use case and its own OAuth flow.

**Required Script Properties:**
- `THREADS_CLIENT_ID` (for OAuth setup only)
- `THREADS_CLIENT_SECRET` (for OAuth setup only)
- `THREADS_ACCESS_TOKEN` (**required for posting**, valid 60 days)
- `THREADS_USER_ID` (**required for posting**, auto-set during token exchange)

#### Steps:

1.  **Create a Threads App:**
    - Go to [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)
    - Click **Create App** → **Other** → **Next**
    - Under **Add a use case**, select **Threads API** → **Next**
    - Under **Settings → Basic**, note your **Threads App ID** and **Threads App Secret**

    > **Important:** There will be two App IDs — use the **Threads App ID** (not the Meta App ID).

2.  **Configure Redirect URI:**
    - Go to **Threads API → Settings**
    - Under **Redirect Callback URLs**, add your GAS Web App URL:
      `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

3.  **Add Yourself as a Tester** (required until app is approved by Meta):
    - Go to **App Roles → Roles → Add People** → **Threads Tester**
    - Accept the invitation in Threads: **Account Settings → Website Permissions**

4.  **Set Script Properties:**

    | Property | Value |
    |---|---|
    | `THREADS_CLIENT_ID` | Your Threads App ID |
    | `THREADS_CLIENT_SECRET` | Your Threads App Secret |

5.  **Authorize and Get Long-Lived Token:**
    - In the GAS IDE, run **`logAuthUrl_Threads`**
    - Copy the URL from the Execution Log and open it in your browser
    - Authorize the app
    - After redirect, copy the `code=` parameter (strip the trailing `#_`)
    - In Script Properties, set `THREADS_SHORT_LIVED_TOKEN` to that code
    - Run **`exchangeThreadsTokenForLongLived`** — this automatically stores:
      - `THREADS_ACCESS_TOKEN` (valid 60 days)
      - `THREADS_USER_ID`

6.  **Token Refresh:** Threads tokens expire after 60 days. Re-run `exchangeThreadsTokenForLongLived` before expiry. Set a calendar reminder 50 days after setup.

7.  **Verify:** In the Dashboard Social Hub, the Threads credential indicator turns green.

---

### 7d. Script Properties Quick Reference

| Property | Platform | Required | Description |
|---|---|---|---|
| `FACEBOOK_CLIENT_ID` | Facebook/Instagram | OAuth only | Meta App ID |
| `FACEBOOK_CLIENT_SECRET` | Facebook/Instagram | OAuth only | Meta App Secret |
| `FB_USER_ACCESS_TOKEN` | Facebook | Temp (OAuth) | Short-lived user token — replaced after `exchangeFacebookTokenForPageToken` |
| `FB_PAGE_ACCESS_TOKEN` | Facebook/Instagram | **Yes** | Long-lived Page Access Token |
| `FB_PAGE_ID` | Facebook/Instagram | **Yes** | Facebook Page numeric ID |
| `INSTAGRAM_ACCOUNT_ID` | Instagram | Auto-set | Instagram Business Account ID |
| `THREADS_CLIENT_ID` | Threads | OAuth only | Threads App ID |
| `THREADS_CLIENT_SECRET` | Threads | OAuth only | Threads App Secret |
| `THREADS_SHORT_LIVED_TOKEN` | Threads | Temp (OAuth) | Short-lived Threads token — replaced after exchange |
| `THREADS_ACCESS_TOKEN` | Threads | **Yes** | Long-lived token (60 days) |
| `THREADS_USER_ID` | Threads | **Yes** | Threads user numeric ID (auto-set) |

### 7e. Troubleshooting

- **"Facebook/Instagram credentials missing"** → Set `FB_PAGE_ACCESS_TOKEN` and `FB_PAGE_ID` in Script Properties.
- **"Could not find connected Instagram Business Account"** → Confirm your Instagram is a Professional account linked to the Facebook Page.
- **"Instagram requires an image or video"** → Attach a Google Drive File ID in the Social Hub, or post manually.
- **"Threads credentials missing"** → Re-run the token exchange if the 60-day token expired.
- **"Threads Create Container Error 400"** → Text exceeds 500 characters (Threads limit). Shorten the post.
- **OAuth popup does not redirect** → Verify the Redirect URI in the Meta App Dashboard exactly matches your GAS deployment URL.

---

## 8. Global & AI Settings

**Required Properties:**
- `OPENAI_API_KEY`
- `GROK_API_KEY`
- `SOCIAL_CALENDAR_ID`

### Steps:

1.  **OpenAI (Standard Content Generation):**
    - Go to the [OpenAI Platform](https://platform.openai.com/api-keys).
    - Generate a new API key and store it as `OPENAI_API_KEY`.
    - This is used for standard social media draft generation and general AI functionalities.

2.  **xAI/Grok (News Reactor & Real-Time Content):**
    - Go to the [xAI API Console](https://console.x.ai).
    - Create an API key to access Grok.
    - Store this as `GROK_API_KEY`.
    - This powers the "News Reactor" feature, analyzing current events and generating edgy/relevant posts.

3.  **Social Calendar ID (Auto-Generated):**
    - The system automatically creates a dedicated "Shamrock Social Hub Planner" calendar on the first scheduling attempt.
    - Its ID is saved automatically to the `SOCIAL_CALENDAR_ID` script property to maintain perfectly separated schedules from court dates and notifications. No manual setup is required unless redefining the calendar.
