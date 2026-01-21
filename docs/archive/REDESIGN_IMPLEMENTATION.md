# Shamrock Bail Bonds - Front-End Redesign Implementation

This document details the Velo (Wix) code and design assets for the Shamrock Bail Bonds website redesign (December 2024).

## 📁 Project Structure

The redesign code is located in the `src/` directory:

```
src/
├── pages/                        # Page-specific Velo code
│   ├── Home.js                   # Homepage logic
│   ├── CountyPage.js             # Dynamic county page logic
│   ├── masterPage.js             # Global code (Header/Footer)
│   └── members/
│       ├── StartBail.js          # Consent & SignNow handoff
│       └── Account.js            # Member profile & uploads
├── public/                       # Shared code
│   └── countyUtils.js            # County data fetcher
├── backend/                      # Server-side modules
│   └── signNowIntegration.jsw    # SignNow API handler
└── styles/
    └── global.css                # CSS Design System Reference
```

## 🚀 Setup Instructions

### 1. Wix Editor Code
*   **Enable Dev Mode** in the Wix Editor.
*   **Pages**: Copy the contents of `src/pages/*.js` to the corresponding page code panels in Wix.
*   **Public**: Create a file named `countyUtils.js` in the **Public** folder and paste the content from `src/public/countyUtils.js`.
*   **Backend**: Create a file named `signNowIntegration.jsw` in the **Backend** folder and paste the content from `src/backend/signNowIntegration.jsw`.

### 2. Database Collections
Ensure the following collections exist in Wix Data:

| Collection Name | Permissions | Fields |
| :--- | :--- | :--- |
| **FloridaCounties** | Read-only (Visitors) | `name` (Text), `slug` (Text), `region` (Text), `sheriffPhone` (Text), `clerkPhone` (Text), `sheriffUrl` (URL), `clerkUrl` (URL), `image` (Image) |
| **MemberProfiles** | Member-author | `firstName`, `lastName`, `email`, `phone` |
| **MemberDocuments** | Member-author | `memberId` (Ref), `fileName` (Text), `fileUrl` (URL), `type` (Text), `uploadDate` (Date) |

### 3. Secrets Manager
Add the following keys in the Wix Secrets Manager for the backend integration:
*   `SIGNNOW_API_TOKEN`: Your SignNow API key.
*   `SIGNNOW_TEMPLATE_ID`: The ID of the document template to be signed.

### 4. Design System (CSS)
Wix does not support a global CSS file. Use `src/styles/global.css` as a reference guide to set your **Site Theme** in the Wix Editor:
*   **Colors**: Navy (`#1B3A5F`), Action Blue (`#0066CC`), Gold (`#FDB913`).
*   **Fonts**: Headings (`Poppins`), Body (`Inter`).

## 📱 Mobile Features
*   **Sticky CTA**: The `masterPage.js` script handles the sticky bottom bar. Ensure a container `#stickyMobileCTA` exists in your footer/header and is set to "Collapsed on load".
