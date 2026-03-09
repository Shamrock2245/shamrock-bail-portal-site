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

// ── Cloud Function Entry Point ──────────────────────────────────────
functions.http("mongoProxy", async (req, res) => {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    if (req.method === "OPTIONS") return res.status(204).send("");

    // Auth: check API key
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
