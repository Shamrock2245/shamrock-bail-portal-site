/**
 * Google Search Console + IndexNow
 *
 * Search Console is NOT an Apps Script Advanced Service. Do not add
 * SearchConsole to appsscript.json enabledAdvancedServices. Submit via
 * Webmaster Tools REST + UrlFetchApp with oauth scope
 * https://www.googleapis.com/auth/webmasters.
 *
 * First run: execute runSitemapSubmission() in the editor and accept OAuth.
 * Daily trigger: installGscSitemapTrigger() (TriggerSetup id 9 only).
 */

var GSC_SITE_URL = 'https://www.shamrockbailbonds.biz/';
var GSC_SITEMAP_INDEX = 'https://www.shamrockbailbonds.biz/sitemap.xml';
var INDEXNOW_KEY = 'a7c3e91b4d2f48c0a1e65f0b9c4d8e21';
var INDEXNOW_KEY_LOCATION = 'https://www.shamrockbailbonds.biz/_functions/indexnow';
var GSC_SITES_API = 'https://www.googleapis.com/webmasters/v3/sites';
var GSC_INSPECT_API = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
var GSC_PROP_RESOLVED = 'GSC_RESOLVED_SITE_URL';
var GSC_PROP_LAST_RUN = 'GSC_LAST_RUN';

var GSC_SITE_CANDIDATES = [
  'sc-domain:shamrockbailbonds.biz',
  'https://www.shamrockbailbonds.biz/',
  'https://www.shamrockbailbonds.biz',
  'https://shamrockbailbonds.biz/',
  'https://shamrockbailbonds.biz'
];

/**
 * Daily trigger. Submit ONLY the Wix sitemap index to GSC (Google reads
 * child sitemaps from the index). Child feeds are still fetched for IndexNow.
 * Never throws — triggers must complete cleanly.
 */
function runSitemapSubmission() {
  var lock = LockService.getScriptLock();
  var results = {
    ok: false,
    siteUrl: null,
    siteUrls: [],
    feeds: [],
    gsc: [],
    gscCleanup: [],
    indexnow: null,
    trigger: null,
    error: null,
    at: new Date().toISOString()
  };

  if (!lock.tryLock(15000)) {
    results.error = 'locked';
    Logger.log(JSON.stringify(results));
    return results;
  }

  try {
    var indexXml = fetchXml_(GSC_SITEMAP_INDEX);
    var childFeeds = parseSitemapLocs_(indexXml, true);
    var seen = {};
    results.feeds.push(GSC_SITEMAP_INDEX);
    childFeeds.forEach(function (feed) {
      if (!feed || seen[feed]) return;
      seen[feed] = true;
      results.feeds.push(feed);
    });

    var sites = listMatchingGscProperties_();
    results.siteUrls = sites.siteUrls;
    results.siteUrl = sites.siteUrl;
    if (!sites.ok) {
      results.error = sites.error;
      results.gsc.push({ success: false, feed: GSC_SITEMAP_INDEX, error: sites.error });
    } else {
      sites.siteUrls.forEach(function (siteUrl) {
        results.gsc.push(submitSitemapToGSC(siteUrl, GSC_SITEMAP_INDEX));
        results.gscCleanup = results.gscCleanup.concat(
          cleanupGscChildSitemaps_(siteUrl, childFeeds)
        );
      });
    }

    results.indexnow = notifyIndexNowFromSitemaps_(results.feeds);
    results.trigger = ensureGscSitemapTrigger_();
    var gscOk = results.gsc.length && results.gsc.every(function (r) { return r && r.success; });
    results.ok = gscOk;
    if (!gscOk && !results.error) results.error = 'gsc_failed';
    else if (gscOk && results.indexnow && !results.indexnow.success) results.error = 'indexnow_failed';
  } catch (e) {
    if (isUrlFetchAuthError_(e)) throw e;
    results.error = e.message;
    console.error('runSitemapSubmission: ' + e.message);
  } finally {
    saveGscLastRun_(results);
    lock.releaseLock();
  }

  Logger.log(JSON.stringify(results));
  return results;
}

/**
 * Submits a sitemap to Google Search Console via REST (not Advanced Service).
 */
function submitSitemapToGSC(siteUrl, feedpath) {
  var targetSiteUrl = siteUrl || GSC_SITE_URL;
  var targetSitemapUrl = feedpath || GSC_SITEMAP_INDEX;
  console.log('Starting Sitemap Submission...');
  console.log('   Site: ' + targetSiteUrl);
  console.log('   Feed: ' + targetSitemapUrl);

  try {
    var reachable = fetchXmlMeta_(targetSitemapUrl);
    if (!reachable.ok) {
      return {
        success: false,
        feed: targetSitemapUrl,
        error: 'sitemap_unreachable: ' + reachable.error
      };
    }

    var endpoint = GSC_SITES_API
      + '/' + encodeURIComponent(targetSiteUrl)
      + '/sitemaps/'
      + encodeURIComponent(targetSitemapUrl);
    var put = gscFetch_(endpoint, { method: 'put' });
    if (!put.ok) {
      console.error('Error submitting sitemap: ' + put.error);
      return { success: false, feed: targetSitemapUrl, error: put.error };
    }

    var listed = gscFetch_(endpoint, { method: 'get' });
    console.log('Sitemap submitted successfully to Google Search Console.');
    return {
      success: true,
      feed: targetSitemapUrl,
      status: put.code,
      lastSubmitted: listed.ok && listed.json && listed.json.lastSubmitted
        ? listed.json.lastSubmitted
        : null
    };
  } catch (e) {
    console.error('Error submitting sitemap: ' + e.message);
    return { success: false, feed: targetSitemapUrl, error: e.message };
  }
}

/** Alias kept so the GAS editor Run menu still finds Gemini's function name. */
function submitSitemap(siteUrl, feedpath) {
  return submitSitemapToGSC(siteUrl, feedpath);
}

function inspectUrl(url) {
  try {
    var site = resolveGscSiteUrl_();
    if (!site.ok) {
      console.error('Error inspecting URL: ' + site.error);
      return { error: site.error };
    }
    var response = gscFetch_(GSC_INSPECT_API, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        inspectionUrl: url,
        siteUrl: site.siteUrl
      })
    });
    console.log(JSON.stringify(response.json || response, null, 2));
    return response.json || response;
  } catch (e) {
    console.error('Error inspecting URL:', e);
    return { error: e.message };
  }
}

/** Editor helper: list Search Console properties this account can access. */
function listGscSites() {
  var res = gscFetch_(GSC_SITES_API, { method: 'get' });
  Logger.log(JSON.stringify(res.json || res));
  return res;
}

/** Editor helper: list sitemaps already registered on the resolved property. */
function listGscSitemaps() {
  var site = resolveGscSiteUrl_();
  if (!site.ok) return site;
  var res = gscFetch_(
    GSC_SITES_API + '/' + encodeURIComponent(site.siteUrl) + '/sitemaps',
    { method: 'get' }
  );
  Logger.log(JSON.stringify(res.json || res));
  return res;
}

/** Install only the daily GSC job. Do not run installAllTriggers. */
function installGscSitemapTrigger() {
  return installSingleTrigger('GSC Sitemap Submit');
}

function ensureGscSitemapTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  var exists = triggers.some(function (t) {
    return t.getHandlerFunction() === 'runSitemapSubmission';
  });
  if (exists) return { installed: false, already: true };
  installSingleTrigger('GSC Sitemap Submit');
  return { installed: true, already: false };
}

function listMatchingGscProperties_() {
  var listed = gscFetch_(GSC_SITES_API, { method: 'get' });
  if (!listed.ok) {
    return { ok: false, siteUrl: GSC_SITE_URL, siteUrls: [], error: listed.error };
  }
  var entries = (listed.json && listed.json.siteEntry) || [];
  var available = {};
  entries.forEach(function (entry) {
    if (entry && entry.siteUrl) available[entry.siteUrl] = entry.permissionLevel || true;
  });
  var siteUrls = [];
  GSC_SITE_CANDIDATES.forEach(function (c) {
    if (available[c] && siteUrls.indexOf(c) === -1) siteUrls.push(c);
  });
  Object.keys(available).forEach(function (url) {
    if (!/shamrockbailbonds\.biz/i.test(url)) return;
    if (/^https:\/\/school\./i.test(url)) return;
    if (siteUrls.indexOf(url) === -1) siteUrls.push(url);
  });
  if (!siteUrls.length) {
    return { ok: false, siteUrl: GSC_SITE_URL, siteUrls: [], error: 'no_matching_gsc_property', available: Object.keys(available) };
  }
  PropertiesService.getScriptProperties().setProperty(GSC_PROP_RESOLVED, siteUrls[0]);
  return { ok: true, siteUrl: siteUrls[0], siteUrls: siteUrls };
}

/**
 * GSC should only have the sitemap index. Child Wix feeds submitted as
 * standalone sitemaps show as Type Unknown / Couldn't fetch.
 */
function cleanupGscChildSitemaps_(siteUrl, childFeeds) {
  var out = [];
  var listed = gscFetch_(
    GSC_SITES_API + '/' + encodeURIComponent(siteUrl) + '/sitemaps',
    { method: 'get' }
  );
  var paths = {};
  (childFeeds || []).forEach(function (feed) { if (feed) paths[feed] = true; });
  if (listed.ok && listed.json && listed.json.sitemap) {
    listed.json.sitemap.forEach(function (entry) {
      if (entry && entry.path) paths[entry.path] = true;
    });
  }
  Object.keys(paths).forEach(function (feed) {
    if (!isStandaloneChildSitemap_(feed)) return;
    var del = gscFetch_(
      GSC_SITES_API + '/' + encodeURIComponent(siteUrl) + '/sitemaps/' + encodeURIComponent(feed),
      { method: 'delete' }
    );
    out.push({ feed: feed, deleted: !!del.ok, error: del.ok ? null : del.error });
  });
  return out;
}

function isStandaloneChildSitemap_(feed) {
  var url = String(feed || '');
  if (!/shamrockbailbonds\.biz/i.test(url)) return false;
  if (/^https:\/\/school\./i.test(url)) return false;
  if (/\/\/www\.shamrockbailbonds\.biz\/sitemap\.xml$/i.test(url)) return false;
  return /\/pages-sitemap\.xml$/i.test(url)
    || /\/blog-posts-sitemap\.xml$/i.test(url)
    || /\/blog-categories-sitemap\.xml$/i.test(url)
    || /dynamic-florida-bail-bonds.*sitemap\.xml$/i.test(url)
    || /\/.+-sitemap\.xml$/i.test(url);
}

/** Editor helper: remove child sitemap submissions, keep the index. */
function cleanupGscChildSitemaps() {
  var sites = listMatchingGscProperties_();
  if (!sites.ok) return sites;
  var childFeeds = [];
  try { childFeeds = parseSitemapLocs_(fetchXml_(GSC_SITEMAP_INDEX), true); } catch (e) { childFeeds = []; }
  var out = [];
  sites.siteUrls.forEach(function (siteUrl) {
    out = out.concat(cleanupGscChildSitemaps_(siteUrl, childFeeds));
  });
  Logger.log(JSON.stringify(out));
  return out;
}

/**
 * First-run OAuth. Run this in the editor so Google can show Review permissions.
 * Do not wrap this in try/catch — Apps Script only prompts if the error is uncaught.
 * The token must include webmasters or GSC REST calls return HTTP 403.
 */
function authorizeGscAccess() {
  var token = ScriptApp.getOAuthToken();
  UrlFetchApp.fetch(GSC_SITEMAP_INDEX, { muteHttpExceptions: true, followRedirects: true });

  var infoRes = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo', {
    method: 'post',
    payload: { access_token: token },
    muteHttpExceptions: true
  });
  var info = {};
  try { info = JSON.parse(infoRes.getContentText() || '{}'); } catch (e) { info = {}; }
  var scopes = String(info.scope || '').split(/\s+/).filter(function (s) { return !!s; });
  Logger.log('Granted OAuth scopes: ' + scopes.join(' | '));
  if (!hasWebmastersScope_(scopes)) {
    throw new Error(WEBMASTERS_REAUTH_MSG_);
  }

  var gsc = UrlFetchApp.fetch(GSC_SITES_API, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  var code = gsc.getResponseCode();
  var body = gsc.getContentText() || '';
  Logger.log('GSC sites HTTP ' + code);
  if (code === 403 && /insufficient authentication scopes/i.test(body)) {
    throw new Error(WEBMASTERS_REAUTH_MSG_);
  }
  if (code < 200 || code >= 300) {
    throw new Error('GSC sites HTTP ' + code + ': ' + body.slice(0, 400));
  }
  Logger.log('GSC UrlFetch + webmasters authorization succeeded.');
  return { ok: true, siteCount: (JSON.parse(body || '{}').siteEntry || []).length };
}

var WEBMASTERS_REAUTH_MSG_ = 'webmasters_scope_missing: Google Account → Third-party access → remove shamrock-automations → Run authorizeGscAccess again and allow "View Search Console data for your verified sites".';

function hasWebmastersScope_(scopes) {
  return (scopes || []).some(function (s) {
    return s === 'https://www.googleapis.com/auth/webmasters'
      || s === 'https://www.googleapis.com/auth/webmasters.readonly';
  });
}

function isUrlFetchAuthError_(e) {
  return !!(e && /permission to call UrlFetchApp|Authorization is required|required permissions/i.test(String(e.message || e)));
}

function resolveGscSiteUrl_() {
  return listMatchingGscProperties_();
}

function gscFetch_(url, options) {
  options = options || {};
  var attempt = 0;
  var max = 3;
  var last = { ok: false, error: 'no_attempt' };

  while (attempt < max) {
    attempt++;
    try {
      var headers = options.headers || {};
      headers.Authorization = 'Bearer ' + ScriptApp.getOAuthToken();
      var fetchOpts = {
        method: String(options.method || 'get').toLowerCase(),
        headers: headers,
        muteHttpExceptions: true,
        followRedirects: true
      };
      if (options.contentType) fetchOpts.contentType = options.contentType;
      if (options.payload) fetchOpts.payload = options.payload;

      var response = UrlFetchApp.fetch(url, fetchOpts);
      var code = response.getResponseCode();
      var body = response.getContentText() || '';
      var json = null;
      try { json = body ? JSON.parse(body) : null; } catch (parseErr) { json = null; }

      if (code === 429 || code >= 500) {
        last = { ok: false, code: code, error: gscErrorMessage_(code, body, json) };
        Utilities.sleep(Math.pow(2, attempt) * 400);
        continue;
      }
      if (code === 401 && attempt < max) {
        last = { ok: false, code: 401, error: 'unauthorized_reauth_required' };
        Utilities.sleep(400);
        continue;
      }
      if (code >= 200 && code < 300) {
        return { ok: true, code: code, json: json, body: body };
      }
      return { ok: false, code: code, json: json, body: body, error: gscErrorMessage_(code, body, json) };
    } catch (e) {
      last = { ok: false, error: e.message };
      if (isUrlFetchAuthError_(e)) throw e;
      Utilities.sleep(Math.pow(2, attempt) * 400);
    }
  }
  return last;
}

function gscErrorMessage_(code, body, json) {
  var apiMsg = json && json.error && (json.error.message || json.error.status);
  if (code === 401) return 'unauthorized_reauth_required';
  if (code === 403 && /insufficient authentication scopes/i.test(String(apiMsg || body || ''))) {
    return WEBMASTERS_REAUTH_MSG_;
  }
  if (code === 403 && /has not been used in project|is disabled/i.test(String(apiMsg || body || ''))) {
    return 'search_console_api_disabled: enable Search Console API on the Apps Script GCP project, then re-run';
  }
  return 'HTTP ' + code + ': ' + (apiMsg || String(body || '').slice(0, 300));
}

function fetchXml_(url) {
  var meta = fetchXmlMeta_(url);
  if (!meta.ok) throw new Error(meta.error);
  return meta.text;
}

function fetchXmlMeta_(url) {
  var attempt = 0;
  var lastErr = 'no_attempt';
  while (attempt < 3) {
    attempt++;
    try {
      var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
      var code = response.getResponseCode();
      var text = response.getContentText() || '';
      if (code === 429 || code >= 500) {
        lastErr = 'HTTP ' + code;
        Utilities.sleep(Math.pow(2, attempt) * 400);
        continue;
      }
      if (code < 200 || code >= 300) return { ok: false, error: 'HTTP ' + code + ' for ' + url };
      if (text.indexOf('<') === -1) return { ok: false, error: 'not_xml for ' + url };
      return { ok: true, text: text, code: code };
    } catch (e) {
      lastErr = e.message;
      if (isUrlFetchAuthError_(e)) throw e;
      Utilities.sleep(Math.pow(2, attempt) * 400);
    }
  }
  return { ok: false, error: lastErr };
}

function parseSitemapLocs_(xml, sitemapsOnly) {
  var locs = [];
  var re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  var match;
  while ((match = re.exec(xml || ''))) {
    var loc = String(match[1] || '').trim();
    if (!loc) continue;
    var isSitemap = /sitemap/i.test(loc) && /\.xml(\?|$)/i.test(loc);
    if (sitemapsOnly && !isSitemap) continue;
    if (!sitemapsOnly && isSitemap) continue;
    locs.push(loc);
  }
  return locs;
}

function fetchChildSitemaps_(indexUrl) {
  try {
    return parseSitemapLocs_(fetchXml_(indexUrl), true);
  } catch (e) {
    Logger.log('Child sitemap parse failed: ' + e.message);
    return [];
  }
}

function canonicalizePublicUrl_(raw) {
  var loc = String(raw || '').trim();
  if (loc === 'https://www.shamrockbailbonds.biz') loc = 'https://www.shamrockbailbonds.biz/';
  if (loc.indexOf('https://www.shamrockbailbonds.biz/') !== 0) return '';
  if (/\/portal-|\/communication-preferences|\/data-deletion/i.test(loc)) return '';
  return loc;
}

function collectSitemapUrls_(feedUrl) {
  try {
    return parseSitemapLocs_(fetchXml_(feedUrl), false);
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
      var loc = canonicalizePublicUrl_(u);
      if (!loc || seen[loc]) return;
      seen[loc] = true;
      urls.push(loc);
    });
  });
  if (!urls.length) return { success: false, error: 'no_urls' };

  var payload = JSON.stringify({
    host: 'www.shamrockbailbonds.biz',
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls.slice(0, 10000)
  });
  var endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow'
  ];
  var out = [];
  endpoints.forEach(function (ep) {
    out.push(indexNowPost_(ep, payload));
  });
  var ok = out.some(function (r) { return r && r.status >= 200 && r.status < 300; });
  Logger.log('IndexNow notified ' + urls.length + ' URLs: ' + JSON.stringify(out));
  return { success: ok, count: urls.length, results: out };
}

function indexNowPost_(endpoint, payload) {
  var attempt = 0;
  while (attempt < 3) {
    attempt++;
    try {
      var res = UrlFetchApp.fetch(endpoint, {
        method: 'post',
        contentType: 'application/json; charset=utf-8',
        payload: payload,
        muteHttpExceptions: true,
        followRedirects: true
      });
      var code = res.getResponseCode();
      if (code === 429 || code >= 500) {
        Utilities.sleep(Math.pow(2, attempt) * 400);
        continue;
      }
      return { endpoint: endpoint, status: code, body: String(res.getContentText() || '').slice(0, 200) };
    } catch (e) {
      if (attempt >= 3) return { endpoint: endpoint, error: e.message };
      Utilities.sleep(Math.pow(2, attempt) * 400);
    }
  }
  return { endpoint: endpoint, error: 'retries_exhausted' };
}

function saveGscLastRun_(results) {
  try {
    var slim = {
      ok: !!(results && results.ok),
      at: results && results.at,
      siteUrl: results && results.siteUrl,
      error: results && results.error,
      feeds: (results && results.feeds) || [],
      gsc: ((results && results.gsc) || []).map(function (r) {
        return { success: !!(r && r.success), feed: r && r.feed, error: r && r.error, lastSubmitted: r && r.lastSubmitted };
      }),
      gscCleanup: (results && results.gscCleanup) || [],
      trigger: results && results.trigger,
      indexnow: results && results.indexnow
        ? { success: !!results.indexnow.success, count: results.indexnow.count, results: results.indexnow.results }
        : null
    };
    PropertiesService.getScriptProperties().setProperty(GSC_PROP_LAST_RUN, JSON.stringify(slim));
  } catch (e) {
    Logger.log('GSC last-run save failed: ' + e.message);
  }
}

function getGscLastRun() {
  var raw = PropertiesService.getScriptProperties().getProperty(GSC_PROP_LAST_RUN);
  var parsed = raw ? JSON.parse(raw) : null;
  Logger.log(JSON.stringify(parsed));
  return parsed;
}
