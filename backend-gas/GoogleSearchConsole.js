/**
 * Google Search Console Integration
 * 
 * INSTRUCTIONS:
 * 1. In the Apps Script Editor, go to "Services" (+)
 * 2. Add "Google Search Console API" (v1)
 * 3. Identifier: "SearchConsole"
 * 4. Run the 'runSitemapSubmission' function once.
 */

const SITE_URL = 'https://www.shamrockbailbonds.biz'; // Must match GSC property exactly (sc-domain: or https://)
const SITEMAP_URL = 'https://www.shamrockbailbonds.biz/_functions/sitemap';

/**
 * Submits the sitemap to Google Search Console
 * Run this function manually or set up a trigger to run weekly.
 */
function runSitemapSubmission() {
    submitSitemapToGSC(SITE_URL, SITEMAP_URL);
}

/**
 * Core submission logic
 * @param {string} siteUrl - The property URL (e.g., 'https://www.example.com/' or 'sc-domain:example.com')
 * @param {string} feedpath - The URL of the sitemap
 */
function submitSitemapToGSC(siteUrl, feedpath) {
    try {
        console.log(`📡 Submitting sitemap for ${siteUrl}...`);

        // Check if the service is enabled
        if (typeof SearchConsole === 'undefined') {
            throw new Error('Search Console Service is not enabled. Please add "Google Search Console API" in Services.');
        }

        // Submit
        // Note: If siteUrl is domain property, it requires 'sc-domain:' prefix usually, 
        // but the API often accepts the URL if verified via URL prefix. 
        // Try standard URL first.

        SearchConsole.Sitemaps.submit(siteUrl, feedpath);

        console.log('✅ Sitemap submitted successfully!');
        console.log(`URL: ${feedpath}`);

        // Log intent to admin email (optional)
        // MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Sitemap Submitted', 'Shamrock sitemap has been pinged to Google.');

    } catch (e) {
        console.error('❌ Error submitting sitemap:', e.message);

        // specialized error handling
        if (e.message.includes('User not authorized')) {
            console.error('👉 Ensure admin@shamrockbailbonds.biz is a verified owner of this property in Search Console.');
        }
    }
}

/**
 * Inspect a specific URL index status (Debug Helper)
 */
function inspectUrl(pageUrl) {
    try {
        const request = {
            inspectionUrl: pageUrl,
            siteUrl: SITE_URL,
            languageCode: "en-US"
        };

        const response = SearchConsole.UrlInspection.index.inspect(request);
        console.log(JSON.stringify(response, null, 2));

    } catch (e) {
        console.error('Error inspecting URL:', e.message);
    }
}

/**
 * Setup a weekly trigger for sitemap submission
 * Run this ONCE to automate the process.
 */
function setupSitemapTrigger() {
    try {
        // 1. Delete existing triggers to avoid duplicates
        const triggers = ScriptApp.getProjectTriggers();
        for (const trigger of triggers) {
            if (trigger.getHandlerFunction() === 'runSitemapSubmission') {
                ScriptApp.deleteTrigger(trigger);
            }
        }

        // 2. Create new weekly trigger (Every Monday at 9am)
        ScriptApp.newTrigger('runSitemapSubmission')
            .timeBased()
            .onWeekDay(ScriptApp.WeekDay.MONDAY)
            .atHour(9)
            .create();

        console.log('✅ Weekly sitemap trigger set for Mondays at 9am.');

    } catch (e) {
        console.error('Error setting up trigger:', e.message);
    }
}
