/**
 * @fileoverview Shamrock MongoDB Proxy — Google Cloud Function (Gen 2)
 * 
 * Replaces the deprecated Atlas Data API. Accepts REST commands from
 * Google Apps Script and executes them against MongoDB Atlas via the
 * Node.js driver.
 * 
 * Environment Variables (set via GCP Secret Manager):
 *   MONGO_URI    — mongodb+srv://... connection string
 *   PROXY_API_KEY — shared secret that GAS sends in the x-api-key header
 * 
 * Deploy:
 *   npm run deploy
 */

const functions = require("@google-cloud/functions-framework");
const { MongoClient, ObjectId } = require("mongodb");

// ── Connection Pool (reused across invocations in Gen 2) ────────────
let cachedClient = null;

async function getClient() {
    // If we have a cached client, try to use it.
    // However, if its topology is fully closed, we should recreate it.
    if (cachedClient) {
        // (Optional check: if the client was explicitly closed or lost topology, clear it)
        // But usually the driver auto-reconnects unless it's fundamentally closed.
        return cachedClient;
    }

    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI environment variable not set");

    const client = new MongoClient(uri, {
        maxIdleTimeMS: 60000,        // close idle connections after 1 min
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
    });

    try {
        await client.connect();
        cachedClient = client;
        console.log("✅ Connected to MongoDB Atlas");
        return cachedClient;
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB Atlas:", err);
        // Ensure we don't cache a broken client
        cachedClient = null;
        throw err;
    }
}

// ── Supported Actions ───────────────────────────────────────────────
const ACTIONS = {
    findOne: async (coll, payload) => {
        return coll.findOne(payload.filter || {}, { projection: payload.projection });
    },
    find: async (coll, payload) => {
        const cursor = coll.find(payload.filter || {}, { projection: payload.projection });
        if (payload.sort) cursor.sort(payload.sort);
        if (payload.skip) cursor.skip(payload.skip);
        const limit = payload.limit || 100;
        cursor.limit(limit);
        return { documents: await cursor.toArray() };
    },
    insertOne: async (coll, payload) => {
        const result = await coll.insertOne(payload.document);
        return { insertedId: result.insertedId.toString() };
    },
    insertMany: async (coll, payload) => {
        const result = await coll.insertMany(payload.documents);
        return { insertedIds: Object.values(result.insertedIds).map(id => id.toString()) };
    },
    updateOne: async (coll, payload) => {
        const opts = {};
        if (payload.upsert) opts.upsert = true;
        const result = await coll.updateOne(payload.filter || {}, payload.update, opts);
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            upsertedId: result.upsertedId ? result.upsertedId.toString() : null
        };
    },
    updateMany: async (coll, payload) => {
        const opts = {};
        if (payload.upsert) opts.upsert = true;
        const result = await coll.updateMany(payload.filter || {}, payload.update, opts);
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
        };
    },
    deleteOne: async (coll, payload) => {
        const result = await coll.deleteOne(payload.filter || {});
        return { deletedCount: result.deletedCount };
    },
    deleteMany: async (coll, payload) => {
        const result = await coll.deleteMany(payload.filter || {});
        return { deletedCount: result.deletedCount };
    },
    aggregate: async (coll, payload) => {
        const docs = await coll.aggregate(payload.pipeline).toArray();
        return { documents: docs };
    },
    countDocuments: async (coll, payload) => {
        const count = await coll.countDocuments(payload.filter || {});
        return { count };
    }
};

// ── Webhook Handlers ────────────────────────────────────────────────
async function handleTwilioWebhook(req, res) {
    try {
        const payload = req.body || {};
        const from = payload.From || "Unknown";
        const body = payload.Body || "";
        const messageSid = payload.SmsMessageSid || payload.MessageSid || "N/A";

        // Log to MongoDB
        const client = await getClient();
        const db = client.db("ShamrockBailDB");
        const commsCol = db.collection("Communications");

        const commDoc = {
            direction: "inbound",
            platform: "twilio",
            from: from,
            to: payload.To || "",
            body: body,
            messageId: messageSid,
            rawPayload: payload,
            timestamp: new Date()
        };
        await commsCol.insertOne(commDoc);
        console.log(`✅ Logged incoming Twilio message from ${from}`);

        // TODO: Wire to replacement orchestrator when ready.
        // Node-RED relay has been removed — inbound Twilio messages are logged to MongoDB above.
        // The GAS webhook handler (SOC2_WebhookHandler.js, path=twilio) is the active processor.

        // Return empty TwiML so Twilio knows we got it
        res.set("Content-Type", "text/xml");
        res.status(200).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
    } catch (err) {
        console.error("❌ Twilio Webhook Error:", err);
        res.status(500).send("Server Error");
    }
}

async function handleTelegramWebhook(req, res) {
    try {
        const payload = req.body || {};
        let message = payload.message || (payload.callback_query && payload.callback_query.message);
        let from = message ? (message.chat ? message.chat.id.toString() : "Unknown") : "Unknown";
        let body = message ? message.text : "";
        let messageId = message ? (message.message_id ? message.message_id.toString() : "N/A") : "N/A";

        // Log to MongoDB
        const client = await getClient();
        const db = client.db("ShamrockBailDB");
        const commsCol = db.collection("Communications");

        const commDoc = {
            direction: "inbound",
            platform: "telegram",
            from: from,
            body: body,
            messageId: messageId,
            rawPayload: payload,
            timestamp: new Date()
        };
        await commsCol.insertOne(commDoc);
        console.log(`✅ Logged incoming Telegram message from ${from}`);

        // TODO: Wire to replacement orchestrator when ready.
        // Node-RED relay has been removed — inbound Telegram messages are logged to MongoDB above.
        // The GAS webhook handler (SOC2_WebhookHandler.js, path=telegram) is the active processor.

        res.status(200).send("OK");
    } catch (err) {
        console.error("❌ Telegram Webhook Error:", err);
        res.status(500).send("Server Error");
    }
}

async function handleWixWebhook(req, res) {
    try {
        const payload = req.body || {};
        const caseId = payload.caseId || "Unknown";

        // Log to MongoDB
        const client = await getClient();
        const db = client.db("ShamrockBailDB");
        const eventsCol = db.collection("WixIntakeEvents");

        const eventDoc = {
            source: "wix_velo",
            type: "intake_submission",
            caseId: caseId,
            rawPayload: payload,
            timestamp: new Date()
        };
        await eventsCol.insertOne(eventDoc);
        console.log(`✅ Logged incoming Wix intake event for Case: ${caseId}`);

        // TODO: Wire to replacement orchestrator when ready.
        // Node-RED relay has been removed — inbound Wix intake events are logged to MongoDB above.
        // The GAS webhook handler (SOC2_WebhookHandler.js) is the active processor.

        res.status(200).json({ success: true, message: "Handshake completed successfully" });
    } catch (err) {
        console.error("❌ Wix Webhook Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
}

// ── Cloud Function Entry Point ──────────────────────────────────────
functions.http("mongoProxy", async (req, res) => {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key, x-twilio-signature");
    if (req.method === "OPTIONS") return res.status(204).send("");

    // Route Incoming Webhooks
    const path = req.path || "";
    if (path.includes("/twilio")) {
        return handleTwilioWebhook(req, res);
    }
    if (path.includes("/telegram")) {
        return handleTelegramWebhook(req, res);
    }
    if (path.includes("/wix-intake")) {
        // Authenticate Wix webhook requests with PROXY_API_KEY
        const expectedKey = process.env.PROXY_API_KEY;
        const providedKey = req.headers["x-api-key"];
        if (expectedKey && providedKey !== expectedKey) {
            return res.status(401).json({ error: "Unauthorized — invalid x-api-key" });
        }
        return handleWixWebhook(req, res);
    }

    // Auth: check API key for database operations
    const expectedKey = process.env.PROXY_API_KEY;
    const providedKey = req.headers["x-api-key"];
    if (expectedKey && providedKey !== expectedKey) {
        return res.status(401).json({ error: "Unauthorized — invalid x-api-key" });
    }

    // Validate method
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST requests allowed" });
    }

    try {
        const { action, dataSource, database, collection, ...payload } = req.body;

        if (!action || !database || !collection) {
            return res.status(400).json({
                error: "Missing required fields: action, database, collection"
            });
        }

        const handler = ACTIONS[action];
        if (!handler) {
            return res.status(400).json({
                error: `Unknown action: ${action}. Supported: ${Object.keys(ACTIONS).join(", ")}`
            });
        }

        const client = await getClient();
        const db = client.db(database);
        const coll = db.collection(collection);

        const result = await handler(coll, payload);
        return res.status(200).json(result);

    } catch (err) {
        console.error("❌ Proxy error:", err);
        return res.status(500).json({ error: err.message });
    }
});
