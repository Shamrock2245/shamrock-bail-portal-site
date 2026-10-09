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
 *   MONGO_URI               — mongodb+srv://... connection string
 *   PROXY_API_KEY_GAS       — x-api-key for Google Apps Script (GAS actions only)
 *   PROXY_API_KEY_VELO      — x-api-key for the Wix Velo backend (Bail School actions + /wix-intake)
 *   PROXY_API_KEY           — LEGACY shared key (all actions). Transitional; remove after rotation.
 *   TWILIO_AUTH_TOKEN       — Twilio primary auth token (verifies X-Twilio-Signature on /twilio)
 *   TWILIO_WEBHOOK_URL      — the exact public URL configured in Twilio for /twilio
 *   TELEGRAM_WEBHOOK_SECRET — secret_token given to Telegram setWebhook (verifies /telegram)
 * Every check fails closed: a missing variable rejects the request (503).
 * 
 * Deploy:
 *   npm run deploy
 */

const functions = require("@google-cloud/functions-framework");
const { MongoClient } = require("mongodb");
const { handleNamedAction, keysFromEnv } = require("./named-actions");
const { handleTwilioWebhook, handleTelegramWebhook, handleWixIntakeWebhook, webhookRoute } = require("./webhooks");

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

// ── Cloud Function Entry Point ──────────────────────────────────────
functions.http("mongoProxy", async (req, res) => {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key, x-twilio-signature");
    if (req.method === "OPTIONS") return res.status(204).send("");

    const deps = {
        env: process.env,
        keys: keysFromEnv(process.env),
        getDb: async (name) => (await getClient()).db(name),
    };

    // Inbound webhooks (webhooks.js): signature / secret / caller-key checked, fail-closed.
    const route = webhookRoute(req.path || "");
    if (route) {
        const handler = { twilio: handleTwilioWebhook, telegram: handleTelegramWebhook, "wix-intake": handleWixIntakeWebhook }[route];
        const out = await handler(
            { method: req.method, headers: req.headers || {}, body: req.body, rawBody: req.rawBody },
            deps
        );
        if (out.contentType) {
            res.set("Content-Type", out.contentType);
            return res.status(out.status).send(out.body);
        }
        return res.status(out.status).json(out.body);
    }

    // Database operations: fixed named actions only (named-actions.js), scoped per caller key.
    const out = await handleNamedAction({ method: req.method, headers: req.headers || {}, body: req.body }, deps);
    return res.status(out.status).json(out.body);
});
