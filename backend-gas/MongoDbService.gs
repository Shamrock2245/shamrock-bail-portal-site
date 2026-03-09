/**
 * @fileoverview MongoDbService.gs
 * Handles communication with MongoDB Atlas Data API (REST).
 * Used for storing and retrieving historical bonds, and scaling the arrest scrapers.
 */

const MONGO_CLUSTER = "Shamrock";
const MONGO_DB = "ShamrockBailDB";

/**
 * Retrieves the MongoDB configuration from Script Properties.
 */
function getMongoConfig_() {
  const props = PropertiesService.getScriptProperties();
  const proxyUrl = props.getProperty('MONGO_PROXY_URL');
  const proxyKey = props.getProperty('PROXY_API_KEY');
  
  if (!proxyUrl || !proxyKey) {
    throw new Error('Missing MONGO_PROXY_URL or PROXY_API_KEY in script properties. Please run setupMongoDBProperties().');
  }
  
  return {
    proxyUrl: proxyUrl,
    proxyKey: proxyKey
  };
}

/**
 * Base execution function for all Atlas proxy requests.
 */
function callMongoDataApi_(action, collection, payload = {}) {
  const config = getMongoConfig_();
  
  const requestBody = {
    action: action,
    dataSource: MONGO_CLUSTER,
    database: MONGO_DB,
    collection: collection,
    ...payload
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': config.proxyKey
    },
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(config.proxyUrl, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode >= 400) {
    console.error(`MongoDB Proxy Error (${responseCode}) during ${action} on ${collection}: ${responseText}`);
    throw new Error(`MongoDB Proxy Error: ${responseText}`);
  }
  
  return JSON.parse(responseText);
}

/**
 * MongoDbService Public Methods
 */
const MongoDbService = {
  
  /**
   * Find a single document that matches the filter.
   * @param {string} collection - The MongoDB collection name (e.g., 'HistoricalBonds')
   * @param {Object} filter - The query filter (e.g., { "PowerNumber": "12345" })
   */
  findOne: function(collection, filter = {}) {
    Logger.log(`MongoDB: Finding one in ${collection}`);
    return callMongoDataApi_('findOne', collection, { filter: filter });
  },
  
  /**
   * Find multiple documents.
   * @param {string} collection - The MongoDB collection name
   * @param {Object} filter - The query filter
   * @param {number} limit - Max results to return
   * @param {number} skip - Results to skip (for pagination)
   */
  find: function(collection, filter = {}, limit = 100, skip = 0) {
    Logger.log(`MongoDB: Finding many in ${collection} (limit: ${limit})`);
    return callMongoDataApi_('find', collection, { filter: filter, limit: limit, skip: skip });
  },
  
  /**
   * Insert a single document into the collection.
   * @param {string} collection - The MongoDB collection name
   * @param {Object} document - The JSON document to insert
   */
  insertOne: function(collection, document) {
    Logger.log(`MongoDB: Inserting one into ${collection}`);
    // Add timestamps
    document.createdAt = new Date().toISOString();
    return callMongoDataApi_('insertOne', collection, { document: document });
  },
  
  /**
   * Update a single document.
   * @param {string} collection - The MongoDB collection name
   * @param {Object} filter - The filter to find the document
   * @param {Object} updateMsg - The update modifier (e.g., { "$set": { "Status": "Open" } })
   * @param {boolean} upsert - If true, insert if not found
   */
  updateOne: function(collection, filter, updateMsg, upsert = false) {
    Logger.log(`MongoDB: Updating one in ${collection}`);
    // Ensure we handle timestamping on upserts or modifications
    if (!updateMsg.$set) updateMsg.$set = {};
    updateMsg.$set.updatedAt = new Date().toISOString();
    
    return callMongoDataApi_('updateOne', collection, { filter: filter, update: updateMsg, upsert: upsert });
  },
  
  /**
   * Update multiple documents.
   */
  updateMany: function(collection, filter, updateMsg, upsert = false) {
    Logger.log(`MongoDB: Updating many in ${collection}`);
    if (!updateMsg.$set) updateMsg.$set = {};
    updateMsg.$set.updatedAt = new Date().toISOString();
    
    return callMongoDataApi_('updateMany', collection, { filter: filter, update: updateMsg, upsert: upsert });
  },
  
  /**
   * Test the connection.
   */
  ping: function() {
    try {
      // A simple findOne on a generic collection to test auth and connectivity
      const result = this.findOne('HistoricalBonds', { _id: "ping" });
      return { success: true, result: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
