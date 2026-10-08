/**
 * @fileoverview Manual_Setup_MongoDB.js
 * Helper function to store MongoDB credentials in Script Properties.
 * Run this ONCE from the GAS IDE.
 */

function setupMongoDBProperties() {
    const props = PropertiesService.getScriptProperties();

    // ── Cloud Function Proxy Credentials ──────────────────────────────────────

    // 1. URL of your deployed Google Cloud Function
    //    e.g., https://us-east1-swfl-arrest-scrapers.cloudfunctions.net/mongo-proxy
    props.setProperty('MONGO_PROXY_URL', 'https://us-east1-swfl-arrest-scrapers.cloudfunctions.net/mongo-proxy');

    // 2. GAS's own proxy key (x-api-key). Must match PROXY_API_KEY_GAS in the Cloud Function
    //    environment. Do not reuse the Velo key. The legacy shared PROXY_API_KEY property is
    //    only a transitional fallback; delete it after the rotation.
    props.setProperty('PROXY_API_KEY_GAS', '<SET_YOUR_PROXY_API_KEY_GAS_HERE>'); // ⚠️  Replace with your actual key — NEVER commit real secrets

    // 3. Cluster & DB names (for reference)
    props.setProperty('MONGO_CLUSTER', 'Shamrock');
    props.setProperty('MONGO_DB', 'ShamrockBailDB');

    // ── Verify ──────────────────────────────────────────────────────────
    console.log('✅ MONGO_PROXY_URL set to: ' + props.getProperty('MONGO_PROXY_URL'));
    console.log('✅ PROXY_API_KEY_GAS set.');
    console.log('✅ MONGO_CLUSTER set to: ' + props.getProperty('MONGO_CLUSTER'));
    console.log('✅ MONGO_DB set to: ' + props.getProperty('MONGO_DB'));

    const proxyUrl = props.getProperty('MONGO_PROXY_URL');
}

function testMongoDBProxyConnection() {
    Logger.log("Testing connection through our new Cloud Function Proxy...");
    const result = MongoDbService.ping();
    if (result.success) {
        Logger.log("✅ SUCCESS! Connected to MongoDB Atlas via Cloud Function!");
        Logger.log("Ping Result: " + JSON.stringify(result.result, null, 2));
    } else {
        Logger.log("❌ FAILED: " + result.error);
    }
}
