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
const GSC_SITEMAP_INDEX = 'https://www.shamrockbailbonds.biz/sitemap.xml';
const INDEXNOW_KEY = 'a7c3e91b4d2f48c0a1e65f0b9c4d8e21';
const INDEXNOW_KEY_LOCATION = 'https://www.shamrockbailbonds.biz/_functions/indexnow';

/**
 * Weekly/daily trigger. Submits the Wix sitemap index and every child sitemap
 * to Google Search Console, then notifies IndexNow/Bing of public URLs.
 */
function runSitemapSubmission() {
  var results = { gsc: [], indexnow: null };
  var feeds = [GSC_SITEMAP_INDEX].concat(fetchChildSitemaps_(GSC_SITEMAP_INDEX));
  var seen = {};
  feeds.forEach(function (feed) {
    if (!feed || seen[feed]) return;
    seen[feed] = true;
    results.gsc.push(submitSitemapToGSC(GSC_SITE_URL, feed));
  });
  results.indexnow = notifyIndexNowFromSitemaps_(feeds);
  Logger.log(JSON.stringify(results));
  return results;
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

function fetchChildSitemaps_(indexUrl) {
  try {
    var xml = UrlFetchApp.fetch(indexUrl, { muteHttpExceptions: true, followRedirects: true }).getContentText() || '';
    var locs = [];
    var re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
    var match;
    while ((match = re.exec(xml))) {
      var loc = String(match[1] || '').trim();
      if (loc && loc.indexOf('sitemap') !== -1) locs.push(loc);
    }
    return locs;
  } catch (e) {
    Logger.log('Child sitemap parse failed: ' + e.message);
    return [];
  }
}

function collectSitemapUrls_(feedUrl) {
  try {
    var xml = UrlFetchApp.fetch(feedUrl, { muteHttpExceptions: true, followRedirects: true }).getContentText() || '';
    var urls = [];
    var re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
    var match;
    while ((match = re.exec(xml))) {
      var loc = String(match[1] || '').trim();
      if (!loc) continue;
      if (loc.indexOf('-sitemap.xml') !== -1 || loc.slice(-12) === 'sitemap.xml') continue;
      urls.push(loc);
    }
    return urls;
  } catch (e) {
    Logger.log('URL collect failed for ' + feedUrl + ': ' + e.message);
    return [];
  }
}

function notifyIndexNowFromSitemaps_(feeds) {
  var urls = [];
  var seen = {};
  (feeds || []).forEach(function (feed) {
    collectSitemapUrls_(feed).forEach(function (u) {
      if (seen[u]) return;
      if (/\/portal-|\/communication-preferences|\/data-deletion/i.test(u)) return;
      seen[u] = true;
      urls.push(u);
    });
  });
  if (!urls.length) return { success: false, error: 'no_urls' };

  var payload = {
    host: 'www.shamrockbailbonds.biz',
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls.slice(0, 10000)
  };
  var endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow'
  ];
  var out = [];
  endpoints.forEach(function (ep) {
    try {
      var res = UrlFetchApp.fetch(ep, {
        method: 'post',
        contentType: 'application/json; charset=utf-8',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
        followRedirects: true
      });
      out.push({ endpoint: ep, status: res.getResponseCode() });
    } catch (e) {
      out.push({ endpoint: ep, error: e.message });
    }
  });
  Logger.log('IndexNow notified ' + urls.length + ' URLs: ' + JSON.stringify(out));
  return { success: true, count: urls.length, results: out };
}
