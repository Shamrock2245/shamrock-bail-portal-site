/**
 * Google Search Console Integration
 * 
 * INSTRUCTIONS:
 * 1. Ensure "Google Search Console API" is enabled in `appsscript.json` (dependencies.enabledAdvancedServices).
 *    (This is already handled by the repo's appsscript.json).
 * 2. This script submits the sitemap to Google Search Console to encourage re-indexing.
 * 3. Run `runSitemapSubmission()` manually or set up a Time-driven trigger (e.g. Weekly).
 */

const GSC_SITE_URL = 'https://www.shamrockbailbonds.biz/'; // Must match GSC property exactly (check trailing slash)
const GSC_SITEMAP_URL = 'https://www.shamrockbailbonds.biz/sitemap.xml'; // Or _functions/sitemap if dynamic

/**
 * Main function to run the submission.
 * Can be triggered manually or via clock trigger.
 */
function runSitemapSubmission() {
  submitSitemapToGSC(GSC_SITE_URL, GSC_SITEMAP_URL);
}

/**
 * Submits a sitemap to Google Search Console.
 * @param {string} siteUrl - The property URL (e.g. 'https://www.example.com/')
 * @param {string} feedpath - The URL of the sitemap
 */
function submitSitemapToGSC(siteUrl, feedpath) {
  console.log(`📡 Starting Sitemap Submission...`);
  console.log(`   Site: ${siteUrl}`);
  console.log(`   Feed: ${feedpath}`);

  try {
    // 1. Check if Service is enabled in Manifest
    if (typeof SearchConsole === 'undefined') {
      throw new Error('Search Console Service is not enabled in appsscript.json or the Editor Services tab.');
    }

    // 2. Submit
    // Note: The API returns undefined on success, throws on failure.
    SearchConsole.Sitemaps.submit(siteUrl, feedpath);
    
    console.log('✅ Sitemap submitted successfully to Google Search Console.');
    return { success: true };

  } catch (e) {
    console.error(`❌ Error submitting sitemap: ${e.message}`);
    // Log extended error info if available
    if (e.details) {
      console.error(JSON.stringify(e.details));
    }
    return { success: false, error: e.message };
  }
}

/**
 * Inspection Utility (Optional)
 * Checks the status of a specific URL in the index.
 */
function inspectUrl(url) {
  try {
    const request = {
        inspectionUrl: url,
        siteUrl: GSC_SITE_URL
    };
    const response = SearchConsole.UrlInspection.index.inspect(request);
    console.log(JSON.stringify(response, null, 2));
    return response;
  } catch(e) {
    console.error("Error inspecting URL:", e);
    return null;
  }
}
