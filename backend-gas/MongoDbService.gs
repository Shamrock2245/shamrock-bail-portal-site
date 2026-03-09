/**
 * @fileoverview MongoDbService.gs
 * Handles all MongoDB Atlas communication via the Cloud Function Proxy.
 *
 * Architecture:
 *   GAS  →  UrlFetchApp  →  Cloud Function Proxy  →  MongoDB Atlas Data API
 *
 * All credentials are stored in GAS Script Properties — NEVER hardcoded.
 * Required Script Properties:
 *   MONGO_PROXY_URL  — Cloud Function URL
 *   PROXY_API_KEY    — Shared secret (must match Cloud Function env var)
 *
 * Public API (MongoDbService object):
 *   findOne(collection, filter)
 *   find(collection, filter, limit, skip)
 *   insertOne(collection, document)
 *   updateOne(collection, filter, updateMsg, upsert)
 *   updateMany(collection, filter, updateMsg, upsert)
 *   deleteOne(collection, filter)              ← NEW in v2.1
 *   ping()
 *
 * Version: 2.1.0 — Added retry logic, deleteOne, hardened error handling.
 */

// ── Constants ──────────────────────────────────────────────────────────────────
var MONGO_CLUSTER        = 'Shamrock';
var MONGO_DB             = 'ShamrockBailDB';
var MONGO_MAX_RETRIES    = 3;
var MONGO_RETRY_DELAY_MS = 1500; // ms; multiplied by attempt# for back-off

// ── Config Loader ──────────────────────────────────────────────────────────────
function getMongoConfig_() {
  var props    = PropertiesService.getScriptProperties();
  var proxyUrl = props.getProperty('MONGO_PROXY_URL');
  var proxyKey = props.getProperty('PROXY_API_KEY');
  if (!proxyUrl || !proxyKey) {
    throw new Error(
      '[MongoDbService] MONGO_PROXY_URL or PROXY_API_KEY missing from Script Properties. ' +
      'Run setupMongoDBProperties() once from the GAS IDE.'
    );
  }
  return { proxyUrl: proxyUrl, proxyKey: proxyKey };
}

// ── Core Fetch with Exponential Back-off Retry ─────────────────────────────────
function callMongoDataApi_(action, collection, payload) {
  payload = payload || {};
  var config = getMongoConfig_();

  // Build request body
  var requestBody = {
    action:     action,
    dataSource: MONGO_CLUSTER,
    database:   MONGO_DB,
    collection: collection
  };
  var pKeys = Object.keys(payload);
  for (var i = 0; i < pKeys.length; i++) {
    requestBody[pKeys[i]] = payload[pKeys[i]];
  }

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
        Logger.log('[MongoDbService] Client error ' + responseCode + ' on ' + action + '/' + collection + ': ' + responseText);
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
                  action + '/' + collection + '. Last: ' + (lastError ? lastError.message : 'unknown'));
}

// ── Public Service Object ──────────────────────────────────────────────────────
var MongoDbService = {

  findOne: function(collection, filter) {
    filter = filter || {};
    Logger.log('[MongoDbService] findOne → ' + collection);
    return callMongoDataApi_('findOne', collection, { filter: filter });
  },

  find: function(collection, filter, limit, skip) {
    filter = filter || {};
    limit  = (typeof limit === 'number') ? limit : 100;
    skip   = (typeof skip  === 'number') ? skip  : 0;
    Logger.log('[MongoDbService] find → ' + collection + ' (limit=' + limit + ')');
    return callMongoDataApi_('find', collection, { filter: filter, limit: limit, skip: skip });
  },

  insertOne: function(collection, document) {
    document = document || {};
    document.createdAt = new Date().toISOString();
    Logger.log('[MongoDbService] insertOne → ' + collection);
    return callMongoDataApi_('insertOne', collection, { document: document });
  },

  updateOne: function(collection, filter, updateMsg, upsert) {
    upsert = (upsert === true);
    if (!updateMsg.$set) updateMsg.$set = {};
    updateMsg.$set.updatedAt = new Date().toISOString();
    Logger.log('[MongoDbService] updateOne → ' + collection);
    return callMongoDataApi_('updateOne', collection, { filter: filter, update: updateMsg, upsert: upsert });
  },

  updateMany: function(collection, filter, updateMsg, upsert) {
    upsert = (upsert === true);
    if (!updateMsg.$set) updateMsg.$set = {};
    updateMsg.$set.updatedAt = new Date().toISOString();
    Logger.log('[MongoDbService] updateMany → ' + collection);
    return callMongoDataApi_('updateMany', collection, { filter: filter, update: updateMsg, upsert: upsert });
  },

  /**
   * Delete a single document matching the filter.
   * @param {string} collection
   * @param {Object} filter
   * @returns {{ deletedCount: number }}
   */
  deleteOne: function(collection, filter) {
    filter = filter || {};
    Logger.log('[MongoDbService] deleteOne → ' + collection);
    return callMongoDataApi_('deleteOne', collection, { filter: filter });
  },

  ping: function() {
    try {
      var result = this.findOne('HistoricalBonds', { _id: 'ping' });
      Logger.log('[MongoDbService] ping OK');
      return { success: true, result: result };
    } catch (e) {
      Logger.log('[MongoDbService] ping FAILED: ' + e.message);
      return { success: false, error: e.message };
    }
  }

};
