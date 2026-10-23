/**
 * @fileoverview Named, fixed-scope actions for the Shamrock Mongo proxy.
 *
 * The old generic handler accepted caller-supplied database / collection /
 * filter / update / pipeline, so anyone holding PROXY_API_KEY could read or
 * write any collection in any database on the cluster. It is removed.
 *
 * Every action here:
 *   - hardcodes the database (DB_NAME) and its collection;
 *   - ignores any database / dataSource / db / collection / tenant fields in the body;
 *   - copies only whitelisted fields into documents, coerced to scalars and length-capped;
 *   - only accepts plain string values in filters (no operator objects such as {$ne: null}).
 *
 * Pure module: no Mongo driver or functions-framework import, so it can be unit-tested
 * with a fake db (see test/named-actions.test.js).
 */
'use strict';

const DB_NAME = 'ShamrockBailDB';

// Old generic action names. Calls using them get 410 Gone.
const LEGACY_GENERIC_ACTIONS = [
    'findOne', 'find', 'insertOne', 'insertMany', 'updateOne', 'updateMany',
    'deleteOne', 'deleteMany', 'aggregate', 'countDocuments'
];

const MAX_STR = 500;
const MAX_TEXT = 5000;
const MAX_ID = 200;

class ActionError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// ── Field coercion ──────────────────────────────────────────────────
function toStr(v, max) {
    if (v === null || v === undefined) return undefined;
    if (Array.isArray(v)) {
        const parts = v.filter((x) => ['string', 'number', 'boolean'].includes(typeof x)).map(String);
        return parts.length ? parts.join(', ').slice(0, max) : undefined;
    }
    if (['string', 'number', 'boolean'].includes(typeof v)) return String(v).slice(0, max);
    return undefined; // objects are dropped
}

const TYPES = {
    str: (v) => toStr(v, MAX_STR),
    text: (v) => toStr(v, MAX_TEXT),
    // number, numeric string, or empty string (MongoLogger sends '' when unknown)
    amount: (v) => {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string') return v.slice(0, 50);
        return undefined;
    },
    numOrNull: (v) => {
        if (v === null) return null;
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
        return undefined;
    },
    int: (v) => (Number.isInteger(v) ? v : (typeof v === 'string' && /^\d{1,9}$/.test(v) ? Number(v) : undefined)),
};

function pick(body, spec) {
    const doc = {};
    for (const [field, type] of Object.entries(spec)) {
        if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
        const v = TYPES[type](body[field]);
        if (v !== undefined) doc[field] = v;
    }
    return doc;
}

// Filter values must be non-empty plain strings (blocks operator injection).
function requireId(body, field) {
    const v = body[field];
    if (typeof v !== 'string' || v.trim() === '' || v.length > MAX_ID) {
        throw new ActionError(400, `${field} must be a non-empty string (max ${MAX_ID} chars)`);
    }
    return v;
}

function nowIso(clock) {
    return new Date(clock()).toISOString();
}

// ── Insert-only log actions (GAS MongoLogger / AI_HistoricalOCR) ────
// collection + whitelisted fields; server stamps createdAt.
const LOG_ACTIONS = {
    logActivity: {
        collection: 'ActivityLog',
        fields: { action: 'str', source: 'str', timestamp: 'str' },
    },
    logIntake: {
        collection: 'Intakes',
        fields: {
            channel: 'str', caseId: 'str', defendantName: 'str', indemnitorName: 'str',
            indemnitorPhone: 'str', indemnitorEmail: 'str', bondAmount: 'amount', county: 'str',
            bookingNumber: 'str', charges: 'text', status: 'str', submittedAt: 'str',
        },
    },
    logSignNowEvent: {
        collection: 'SignNowEvents',
        fields: {
            eventType: 'str', caseId: 'str', documentId: 'str', method: 'str',
            recipientPhone: 'str', recipientEmail: 'str', signingUrl: 'text', eventAt: 'str',
        },
    },
    logPayment: {
        collection: 'Payments',
        fields: {
            caseId: 'str', amount: 'amount', method: 'str', platform: 'str',
            telegramId: 'str', receiptUrl: 'text', loggedAt: 'str',
        },
    },
    logCourtDate: {
        collection: 'CourtDates',
        fields: {
            eventType: 'str', caseId: 'str', defendantName: 'str', courtDate: 'str',
            courtLocation: 'str', caseNumber: 'str', remindersSent: 'int', loggedAt: 'str',
        },
    },
    logCheckIn: {
        collection: 'CheckIns',
        fields: {
            source: 'str', caseId: 'str', defendantName: 'str', telegramId: 'str', phone: 'str',
            latitude: 'numOrNull', longitude: 'numOrNull', selfieUrl: 'text', checkedInAt: 'str',
        },
    },
    logCommunication: {
        collection: 'Communications',
        fields: { platform: 'str', to: 'str', from: 'str', body: 'text', caseId: 'str', sentAt: 'str' },
        fixed: { direction: 'outbound' },
    },
    logLeadScore: {
        collection: 'LeadScoring',
        fields: {
            agentName: 'str', defendantName: 'str', bondAmount: 'amount', county: 'str',
            riskScore: 'numOrNull', recommendation: 'text', scoredAt: 'str',
        },
    },
    insertHistoricalBond: {
        collection: 'HistoricalBonds',
        fields: {
            FirstName: 'str', LastName: 'str', BondDate: 'str', PowerNumber: 'str',
            LiabilityAmount: 'amount', PremiumAmount: 'amount', Email: 'str', Phone: 'str',
            FullName: 'str', DefendantName: 'str', DefendantPhone: 'str', CaseNumber: 'str',
            Status: 'str', References: 'text', EmployerInfo: 'text', ResidenceType: 'str',
            Language: 'str', BookingNumber: 'str', County: 'str', Charges: 'text',
            SourceFile_Link: 'text', SourceFile_Name: 'str',
        },
    },
};

function makeLogAction(spec) {
    return async (body, ctx) => {
        const doc = Object.assign(pick(body, spec.fields), spec.fixed || {}, { createdAt: nowIso(ctx.clock) });
        const db = await ctx.db();
        const result = await db.collection(spec.collection).insertOne(doc);
        return { insertedId: String(result.insertedId) };
    };
}

// ── Bail School actions (Velo backend/bailSchoolMongo.jsw) ──────────
const AUDIT_ACTIONS = /^[A-Z][A-Z0-9_]{1,40}$/;

const NAMED_ACTIONS = {
    ping: async (body, ctx) => {
        const db = await ctx.db();
        await db.command({ ping: 1 });
        return { ok: true };
    },

    getCourse: async (body, ctx) => {
        const courseId = requireId(body, 'courseId');
        const db = await ctx.db();
        return db.collection('Courses').findOne({ _id: courseId });
    },

    listCourseLessons: async (body, ctx) => {
        const courseId = requireId(body, 'courseId');
        const db = await ctx.db();
        const docs = await db.collection('CourseLessons').find({ courseId }).sort({ order: 1 }).limit(100).toArray();
        return { documents: docs };
    },

    getStudentEnrollment: async (body, ctx) => {
        const studentId = requireId(body, 'studentId');
        const courseId = requireId(body, 'courseId');
        const db = await ctx.db();
        return db.collection('StudentEnrollments').findOne({ studentId, courseId });
    },

    listStudentEnrollments: async (body, ctx) => {
        const studentId = requireId(body, 'studentId');
        const db = await ctx.db();
        const docs = await db.collection('StudentEnrollments').find({ studentId }).limit(10).toArray();
        return { documents: docs };
    },

    logStudentAction: async (body, ctx) => {
        const studentId = requireId(body, 'studentId');
        const lessonId = requireId(body, 'lessonId');
        const action = body.studentAction;
        if (typeof action !== 'string' || !AUDIT_ACTIONS.test(action)) {
            throw new ActionError(400, 'studentAction must be an UPPER_SNAKE_CASE string');
        }
        const doc = {
            studentId,
            lessonId,
            action,
            timestamp: nowIso(ctx.clock),
            ipAddress: TYPES.str(body.ipAddress) || 'Unknown',
        };
        const score = TYPES.numOrNull(body.score);
        if (typeof score === 'number') doc.score = score;
        const time = TYPES.numOrNull(body.time);
        if (typeof time === 'number') doc.time = time;
        const db = await ctx.db();
        const result = await db.collection('AuditLogs').insertOne(doc);
        return { insertedId: String(result.insertedId) };
    },

    listStudentAuditLogs: async (body, ctx) => {
        const studentId = requireId(body, 'studentId');
        const db = await ctx.db();
        const docs = await db.collection('AuditLogs').find({ studentId }).sort({ timestamp: -1 }).limit(500).toArray();
        return { documents: docs };
    },


    markLessonComplete: async (body, ctx) => {
        const studentId = requireId(body, 'studentId');
        const courseId = requireId(body, 'courseId');
        const lessonId = requireId(body, 'lessonId');
        const db = await ctx.db();
        const result = await db.collection('StudentEnrollments').updateOne(
            { studentId, courseId },
            { $addToSet: { completedLessons: lessonId }, $set: { lastActive: nowIso(ctx.clock), progress: 100 } },
            { upsert: false }
        );
        return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
    },
};

for (const [name, spec] of Object.entries(LOG_ACTIONS)) {
    NAMED_ACTIONS[name] = makeLogAction(spec);
}

function timingSafeEqualStr(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    let diff = a.length ^ b.length;
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return diff === 0;
}

/**
 * Handle a database request (webhook paths are routed before this in index.js).
 * @param {{method: string, headers: object, body: any}} req
 * @param {{getDb: (name: string) => Promise<object>, apiKey: string|undefined, clock?: () => number}} deps
 * @returns {Promise<{status: number, body: any}>}
 */
async function handleNamedAction(req, deps) {
    const expectedKey = deps.apiKey;
    if (!expectedKey) {
        return { status: 503, body: { error: 'Proxy not configured (PROXY_API_KEY missing)' } };
    }
    const providedKey = (req.headers && (req.headers['x-api-key'] || req.headers['X-Api-Key'])) || '';
    if (!timingSafeEqualStr(String(providedKey), expectedKey)) {
        return { status: 401, body: { error: 'Unauthorized — invalid x-api-key' } };
    }
    if (req.method !== 'POST') {
        return { status: 405, body: { error: 'Only POST requests allowed' } };
    }
    const body = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? req.body : {};
    const action = body.action;
    if (typeof action !== 'string' || !action) {
        return { status: 400, body: { error: 'Missing action' } };
    }
    if (LEGACY_GENERIC_ACTIONS.includes(action)) {
        return {
            status: 410,
            body: { error: `Generic action "${action}" was removed. Use a named action: ${Object.keys(NAMED_ACTIONS).sort().join(', ')}` },
        };
    }
    if (!Object.prototype.hasOwnProperty.call(NAMED_ACTIONS, action)) {
        return { status: 404, body: { error: `Unknown action: ${action}` } };
    }
    try {
        // Database is fixed. body.database / dataSource / db / collection / tenant are ignored.
        // Input is validated before the connection is opened (ctx.db() is lazy).
        const ctx = { clock: deps.clock || Date.now, db: () => deps.getDb(DB_NAME) };
        const result = await NAMED_ACTIONS[action](body, ctx);
        return { status: 200, body: result === undefined ? null : result };
    } catch (err) {
        if (err instanceof ActionError) return { status: err.status, body: { error: err.message } };
        console.error('❌ Proxy error:', err);
        return { status: 500, body: { error: 'Internal error' } };
    }
}

module.exports = { DB_NAME, NAMED_ACTIONS, LOG_ACTIONS, LEGACY_GENERIC_ACTIONS, handleNamedAction };
