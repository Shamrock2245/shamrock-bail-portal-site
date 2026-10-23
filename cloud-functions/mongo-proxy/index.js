/**
 * @fileoverview Shamrock MongoDB Proxy — Google Cloud Function (Gen 2)
 * 
 * Replaces the deprecated Atlas Data API. Exposes FIXED, NAMED actions only
 * (see named-actions.js) for Google Apps Script and the Wix Velo backend.
 * The generic database/collection/filter handler was removed: calls with the
 * old generic actions (find, insertOne, updateOne, ...) get 410 Gone, and any
 * database / collection fields in the body are ignored.
 * 
 * Environment Variables (set via GCP Secret Manager):
 *   MONGO_URI    — mongodb+srv://... connection string
 *   PROXY_API_KEY — shared secret that GAS sends in the x-api-key header
 * 
 * Deploy:
 *   npm run deploy
 */

const functions = require("@google-cloud/functions-framework");
const { MongoClient } = require("mongodb");
const { handleNamedAction } = require("./named-actions");

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

    // Database operations: fixed named actions only (named-actions.js).
    const out = await handleNamedAction(
        { method: req.method, headers: req.headers || {}, body: req.body },
        {
            apiKey: process.env.PROXY_API_KEY,
            getDb: async (name) => (await getClient()).db(name),
        }
    );
    return res.status(out.status).json(out.body);
});
