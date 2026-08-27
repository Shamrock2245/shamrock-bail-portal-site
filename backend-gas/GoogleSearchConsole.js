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
  'https://www.shamrockbailbonds.biz/',
  'https://www.shamrockbailbonds.biz',
  'sc-domain:shamrockbailbonds.biz',
  'https://shamrockbailbonds.biz/',
  'https://shamrockbailbonds.biz'
];

/**
 * Daily trigger. Submits the Wix sitemap index and every child sitemap
 * to Google Search Console, then notifies IndexNow/Bing of public URLs.
 * Never throws — triggers must complete cleanly.
 */
function runSitemapSubmission() {
  var lock = LockService.getScriptLock();
  var results = {
    ok: false,
    siteUrl: null,
    feeds: [],
    gsc: [],
    indexnow: null,
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
    var feeds = [GSC_SITEMAP_INDEX].concat(parseSitemapLocs_(indexXml, true));
    var seen = {};
    feeds.forEach(function (feed) {
      if (!feed || seen[feed]) return;
      seen[feed] = true;
      results.feeds.push(feed);
    });

    var site = resolveGscSiteUrl_();
    results.siteUrl = site.siteUrl;
    if (!site.ok) {
      results.error = site.error;
      results.gsc = results.feeds.map(function (feed) {
        return { success: false, feed: feed, error: site.error };
      });
    } else {
      results.feeds.forEach(function (feed) {
        results.gsc.push(submitSitemapToGSC(site.siteUrl, feed));
      });
    }

    results.indexnow = notifyIndexNowFromSitemaps_(results.feeds);
    var gscOk = results.gsc.length && results.gsc.every(function (r) { return r && r.success; });
    var indexOk = !!(results.indexnow && results.indexnow.success);
    results.ok = gscOk && indexOk;
    if (!results.ok && !results.error) {
      results.error = gscOk ? 'indexnow_failed' : 'gsc_failed';
    }
  } catch (e) {
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

function resolveGscSiteUrl_() {
  var props = PropertiesService.getScriptProperties();
  var cached = String(props.getProperty(GSC_PROP_RESOLVED) || '').trim();
  var listed = gscFetch_(GSC_SITES_API, { method: 'get' });
  if (!listed.ok) {
    return { ok: false, siteUrl: cached || GSC_SITE_URL, error: listed.error };
  }

  var entries = (listed.json && listed.json.siteEntry) || [];
  var available = {};
  entries.forEach(function (entry) {
    if (entry && entry.siteUrl) available[entry.siteUrl] = entry.permissionLevel || true;
  });

  var candidates = [];
  if (cached) candidates.push(cached);
  GSC_SITE_CANDIDATES.forEach(function (c) {
    if (candidates.indexOf(c) === -1) candidates.push(c);
  });
  Object.keys(available).forEach(function (url) {
    if (/shamrockbailbonds\.biz/i.test(url) && candidates.indexOf(url) === -1) {
      candidates.push(url);
    }
  });

  var i;
  for (i = 0; i < candidates.length; i++) {
    if (available[candidates[i]]) {
      if (cached !== candidates[i]) props.setProperty(GSC_PROP_RESOLVED, candidates[i]);
      return { ok: true, siteUrl: candidates[i], permissionLevel: available[candidates[i]] };
    }
  }

  return {
    ok: false,
    siteUrl: cached || GSC_SITE_URL,
    error: 'no_matching_gsc_property',
    available: Object.keys(available)
  };
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
      if (/permission to call UrlFetchApp/i.test(e.message)) {
        return {
          ok: false,
          error: 'urlfetch_not_authorized: run runSitemapSubmission in the editor and accept permissions (script.external_request + webmasters)'
        };
      }
      Utilities.sleep(Math.pow(2, attempt) * 400);
    }
  }
  return last;
}

function gscErrorMessage_(code, body, json) {
  var apiMsg = json && json.error && (json.error.message || json.error.status);
  if (code === 401) return 'unauthorized_reauth_required';
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
      if (/permission to call UrlFetchApp/i.test(e.message)) {
        return {
          ok: false,
          error: 'urlfetch_not_authorized: run runSitemapSubmission in the editor and accept permissions'
        };
      }
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
      if (seen[u]) return;
      if (/\/portal-|\/communication-preferences|\/data-deletion/i.test(u)) return;
      seen[u] = true;
      urls.push(u);
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
