# Bulk Google Indexing & Rich Results Solution for Shamrock Bail Bonds

**Prepared by Manus AI | February 19, 2026**

This package contains the complete solution to bulk-submit all 119 pages of your Wix website to Google for immediate crawling and to implement the necessary structured data (JSON-LD) for achieving rich results in search.

This automates the manual process you saw in the Wix Site Inspection tool, ensuring all your pages are seen by Google and are eligible for enhanced search result appearances.

---

## 1. The Problem: 154 Pages "Unknown to Google"

Your Wix dashboard correctly identified that the vast majority of your site's pages were not being indexed by Google. Manually clicking "Inspect URL" for each of the 164 pages is not a scalable solution. This automated solution resolves that core problem.

## 2. The Solution: API-Driven Indexing & Schema

This solution is composed of two main parts:

1.  **Bulk Indexing Script (`bulk_indexing_submit.py`)**: A Python script that uses the official Google Indexing API to programmatically request that Google crawl every one of your 119 live URLs. This is the fastest and most efficient way to get your pages into Google's index.

2.  **Rich Results Velo Module (`seo-rich-results.jsw`)**: A Wix Velo backend module that dynamically generates and injects the correct structured data (JSON-LD) into the `<head>` of your pages. This is what makes your pages eligible for rich results like FAQs, breadcrumbs, and enhanced local business listings in Google Search.

---

## 3. How to Use This Solution: Step-by-Step Guide

### Step 1: Set Up Google API Access (One-Time Setup)

To use the bulk indexing script, you need to authorize it with a Google Cloud service account. This is a secure, standard process.

1.  **Go to Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a New Project**: You can name it `Shamrock SEO` or similar.
3.  **Enable the API**: In the project, go to "APIs & Services" > "Library" and search for **"Web Search Indexing API"**. Click **Enable**.
4.  **Create a Service Account**:
    *   Go to "IAM & Admin" > "Service Accounts".
    *   Click **"+ CREATE SERVICE ACCOUNT"**.
    *   Give it a name (e.g., `google-indexing-agent`).
    *   Click **"CREATE AND CONTINUE"**.
    *   For the role, select **"Owner"**. This grants the necessary permissions.
    *   Click **"CONTINUE"**, then **"DONE"**.
5.  **Generate a JSON Key**:
    *   Find the service account you just created in the list.
    *   Click the three-dot menu under "Actions" and select **"Manage keys"**.
    *   Click **"ADD KEY"** > **"Create new key"**.
    *   Choose **JSON** as the key type and click **"CREATE"**. A `.json` file will be downloaded to your computer.
6.  **Rename and Place the Key**: Rename the downloaded file to `service_account.json` and place it in the same directory as the `bulk_indexing_submit.py` script.
7.  **Authorize in Google Search Console**:
    *   Go to your Shamrock Bail Bonds property in [Google Search Console](https://search.google.com/search-console).
    *   Go to **Settings > Users and permissions**.
    *   Click **"ADD USER"**.
    *   In the email address field, paste the email of the service account you created (you can find this in the Google Cloud Console).
    *   Set the permission to **"Owner"** and click **"ADD"**.

**This one-time setup is now complete.**

### Step 2: Run the Bulk Indexing Script

1.  Make sure Python 3 is installed on your computer.
2.  Open a terminal or command prompt.
3.  Navigate to the directory containing the `bulk_indexing_submit.py` and `service_account.json` files.
4.  Run the script:
    ```bash
    python3 bulk_indexing_submit.py
    ```

The script will now authenticate and submit all 119 URLs to Google. It will print its progress and save a full report upon completion. You can re-run this script anytime you make significant updates to your site content.

### Step 3: Implement the Rich Results Module in Wix Velo

1.  **Open the Wix Editor** for your site.
2.  In the left-hand sidebar, go to the **Code** panel ( `</>` icon).
3.  Under the **Backend** section, click the `+` icon and choose **"New .jsw File (Web Module)"**.
4.  Name the file `seo-rich-results.jsw`.
5.  Copy the entire content of the provided `seo-rich-results.jsw` file and paste it into the new file in the Wix Editor.
6.  **Save** the file.
7.  Now, you need to call this backend module from your page code. For example, on your **County Pages (Dynamic Page)**, you would add this to the page's code:

    ```javascript
    import { getRichResultsSchema } from 'backend/seo-rich-results';
    import wixData from 'wix-data';

    $w.onReady(function () {
        const context = $w.location;
        // Example for a dynamic county page
        // You would get the county name from the page's context or data
        const countyName = "Collier"; // Replace with dynamic data from your page item
        const countySlug = "collier"; // Replace with dynamic data

        getRichResultsSchema('COUNTY', { countyName, countySlug })
            .then((jsonLdString) => {
                const schemaElement = $w.html.stringToElements(`<script type="application/ld+json">${jsonLdString}</script>`)[0];
                $w('head').append(schemaElement);
            });
    });
    ```

You will need to adapt this frontend code for each page type (Homepage, Blog Posts, etc.) to pass the correct `pageType` and `data` to the backend module.

---

## Included Files

-   `README.md`: This instruction file.
-   `bulk_indexing_submit.py`: The Python script for bulk submission to the Google Indexing API.
-   `seo-rich-results.jsw`: The Velo backend module for generating dynamic JSON-LD schema.
-   `schema_plan.md`: The detailed strategic plan for structured data implementation.
-   `sitemap_final_urls.txt`: The complete list of 119 URLs that are being submitted.

This comprehensive solution will ensure your website achieves maximum visibility and effectiveness on Google Search.
