# Social Media Publisher: API Credential Setup Guide

This guide provides step-by-step instructions for obtaining the necessary API credentials for each social media platform. These credentials must be stored in your Google Apps Script **Script Properties** to enable the one-click publishing feature.

**Where to Store Credentials:**
1. Open your Google Apps Script project.
2. Go to **Project Settings** (the gear icon ⚙️).
3. Scroll down to the **Script Properties** section and click **Add script property**.

---

## 1. Google Business Profile API

**Required Properties:**
- `GBP_ACCESS_TOKEN`
- `GBP_LOCATION_ID`

### Steps:

1.  **Enable the API:**
    - Go to the [Google API Console](https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com).
    - Select a project or create a new one.
    - Click **Enable** to activate the "Google My Business API".

2.  **Create OAuth 2.0 Credentials:**
    - Go to the [Credentials page](https://console.cloud.google.com/apis/credentials).
    - Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
    - Choose **Web application** as the application type.
    - Under **Authorized redirect URIs**, add the special Apps Script URI: `https://script.google.com/macros/d/{SCRIPT_ID}/usercallback` (replace `{SCRIPT_ID}` with your actual GAS project's Script ID).
    - Click **Create**. Copy the **Client ID** and **Client Secret** and save them temporarily.

3.  **Get an Access Token (via OAuth2 for GAS):**
    - The `SocialPublisher.js` file will include a function `getGbpAuthUrl()` that you can run once to get an authorization URL. You will visit this URL, approve access, and the script will automatically handle storing the access and refresh tokens.

4.  **Find your Location ID:**
    - Use the [Google Business Profile locations.list API explorer](https://developers.google.com/my-business/reference/businessinformation/rest/v1/locations/list) to find the ID for your business location. It will look like `locations/12345678901234567890`.
    - Store just the numeric part (e.g., `12345678901234567890`) in the `GBP_LOCATION_ID` script property.

---

## 2. X (Twitter) API v2

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
