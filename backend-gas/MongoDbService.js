/**
 * @fileoverview MongoDbService.js
 * Handles all MongoDB Atlas communication via the Cloud Function Proxy.
 *
 * Architecture:
 *   GAS  →  UrlFetchApp  →  Cloud Function Proxy  →  MongoDB Atlas Data API
 *
 * All credentials are stored in GAS Script Properties — NEVER hardcoded.
 * Required Script Properties:
 *   MONGO_PROXY_V2_URL — URL of the mongo-proxy-v2 Cloud Function (named actions). There is
 *                        deliberately NO fallback to the old MONGO_PROXY_URL property, which
 *                        keeps pointing at the old generic function until the soak is done.
 *   PROXY_API_KEY    — Shared secret (must match Cloud Function env var)
 *
 * Public API (MongoDbService object):
 *   callAction(action, params)   — POST a NAMED proxy action (see cloud-functions/mongo-proxy/named-actions.js)
 *   insertHistoricalBond(doc)    — action insertHistoricalBond (HistoricalBonds)
 *   ping()                       — action ping
 *
 * The proxy no longer accepts generic database/collection/filter calls
 * (findOne/find/insertOne/updateOne/... return 410). Each named action hardcodes
 * its database and collection server-side and whitelists fields, so this client
 * never sends database or collection.
 *
 * Version: 3.0.0 — Named actions only (generic proxy removed).
 */

// ── Constants ──────────────────────────────────────────────────────────────────
var MONGO_MAX_RETRIES    = 3;
var MONGO_RETRY_DELAY_MS = 1500; // ms; multiplied by attempt# for back-off

// ── Config Loader ──────────────────────────────────────────────────────────────
function getMongoConfig_() {
  var props    = PropertiesService.getScriptProperties();
  var proxyUrl = props.getProperty('MONGO_PROXY_V2_URL');
  var proxyKey = props.getProperty('PROXY_API_KEY');
  if (!proxyUrl || !proxyKey) {
    throw new Error(
      '[MongoDbService] MONGO_PROXY_V2_URL or PROXY_API_KEY missing from Script Properties. ' +
      'Run setupMongoDBProperties() once from the GAS IDE.'
    );
  }
  return { proxyUrl: proxyUrl, proxyKey: proxyKey };
}

// ── Core Fetch with Exponential Back-off Retry ─────────────────────────────────
function callMongoNamedAction_(action, params) {
  params = params || {};
  var config = getMongoConfig_();

  // Build request body: action + the action's own params. Never database/collection.
  var requestBody = {};
  var pKeys = Object.keys(params);
  for (var i = 0; i < pKeys.length; i++) {
    if (pKeys[i] === 'database' || pKeys[i] === 'collection' || pKeys[i] === 'dataSource') continue;
    requestBody[pKeys[i]] = params[pKeys[i]];
  }
  requestBody.action = action;

  var options = {
    method:             'post',
    contentType:        'application/json',
    headers:            { 'x-api-key': config.proxyKey },
    payload:            JSON.stringify(requestBody),
    muteHttpExceptions: true
  };

  var lastError;
  for (var attempt = 1; attempt <= MONGO_MAX_RETRIES; attempt++) {
    try {
      var response     = UrlFetchApp.fetch(config.proxyUrl, options);
      var responseCode = response.getResponseCode();
      var responseText = response.getContentText();

      if (responseCode >= 200 && responseCode < 300) {
        return JSON.parse(responseText);
      }

      // 4xx = client error; do NOT retry
      if (responseCode >= 400 && responseCode < 500) {
        Logger.log('[MongoDbService] Client error ' + responseCode + ' on ' + action + ': ' + responseText);
        throw new Error('MongoDB Proxy Client Error (' + responseCode + '): ' + responseText);
      }

      // 5xx = server error; retry with back-off
      lastError = new Error('MongoDB Proxy Server Error (' + responseCode + '): ' + responseText);
      Logger.log('[MongoDbService] Attempt ' + attempt + '/' + MONGO_MAX_RETRIES +
                 ' server error ' + responseCode + '. Retrying in ' + (MONGO_RETRY_DELAY_MS * attempt) + 'ms...');

    } catch (e) {
      // Re-throw client errors immediately (they were thrown above, not caught here)
      if (e.message && e.message.indexOf('Client Error') !== -1) throw e;
      lastError = e;
      Logger.log('[MongoDbService] Attempt ' + attempt + '/' + MONGO_MAX_RETRIES +
                 ' network exception: ' + e.message);
    }

    if (attempt < MONGO_MAX_RETRIES) {
      Utilities.sleep(MONGO_RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error('[MongoDbService] All ' + MONGO_MAX_RETRIES + ' retries failed for ' +
                  action + '. Last: ' + (lastError ? lastError.message : 'unknown'));
}

// ── Public Service Object ──────────────────────────────────────────────────────
var MongoDbService = {

  /**
   * Call a named proxy action (e.g. 'logCheckIn', 'logIntake', 'insertHistoricalBond').
   * @param {string} action
   * @param {Object} params — whitelisted fields for that action
   */
  callAction: function(action, params) {
    Logger.log('[MongoDbService] action → ' + action);
    return callMongoNamedAction_(action, params);
  },

  /**
   * Insert an OCR-parsed historical bond (HistoricalBonds). Only whitelisted fields are stored.
   * @param {Object} doc
   * @returns {{ insertedId: string }}
   */
  insertHistoricalBond: function(doc) {
    return this.callAction('insertHistoricalBond', doc || {});
  },

  ping: function() {
    try {
      var result = this.callAction('ping', {});
      Logger.log('[MongoDbService] ping OK');
      return { success: true, result: result };
    } catch (e) {
      Logger.log('[MongoDbService] ping FAILED: ' + e.message);
      return { success: false, error: e.message };
    }
  }

};
