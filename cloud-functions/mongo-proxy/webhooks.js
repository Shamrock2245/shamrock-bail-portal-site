/**
 * @fileoverview Inbound webhook handlers for the Shamrock Mongo proxy.
 *
 *   POST /twilio     — Twilio Messaging webhook. X-Twilio-Signature is verified
 *                      (HMAC-SHA1 over the PUBLIC webhook URL + sorted POST params,
 *                      keyed with TWILIO_AUTH_TOKEN), per
 *                      https://www.twilio.com/docs/usage/security.
 *   POST /telegram   — Telegram Bot API webhook. X-Telegram-Bot-Api-Secret-Token must
 *                      equal TELEGRAM_WEBHOOK_SECRET (the secret_token given to setWebhook).
 *   POST /wix-intake — Velo intakeQueue.jsw handshake; needs the Velo (or legacy) x-api-key.
 *
 * All three FAIL CLOSED: missing configuration → 503, bad credentials → 401/403, and in
 * both cases nothing is written. /twilio and /telegram write one whitelisted document to
 * Communications (no raw payload).
 *
 * Why TWILIO_WEBHOOK_URL: behind the gen2 Cloud Functions / Cloud Run front end, the
 * Host header and path the function sees are not the URL Twilio signed (e.g. the
 * cloudfunctions.net URL includes /mongo-proxy, which is stripped before the request
 * reaches us). The signature must be checked against the exact URL configured in the
 * Twilio console, so it is configured explicitly and never derived from the request.
 *
 * Pure module (Node built-ins only) so it can be unit-tested with a fake db.
 */
'use strict';

const crypto = require('crypto');
const { TYPES, timingSafeEqualStr, authenticateCaller, callerMayUse } = require('./named-actions');

const DB_NAME = 'ShamrockBailDB';
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function header(headers, name) {
    if (!headers) return '';
    const v = headers[name] !== undefined ? headers[name] : headers[name.toLowerCase()];
    if (Array.isArray(v)) return String(v[0] || '');
    return v === undefined || v === null ? '' : String(v);
}

function envValue(env, name) {
    const v = env && env[name];
    return typeof v === 'string' && v.trim() ? v.trim() : '';
}

// ── Twilio signature ────────────────────────────────────────────────
/**
 * POST params exactly as Twilio sent them. Prefer the raw urlencoded body (the
 * functions-framework exposes req.rawBody) so body-parser's "extended" nesting or
 * trimming can never change what is signed. Repeated keys become arrays.
 */
function twilioParams(req) {
    const raw = req.rawBody;
    const ctype = header(req.headers, 'content-type').toLowerCase();
    if (raw !== undefined && raw !== null && (ctype === '' || ctype.includes('application/x-www-form-urlencoded'))) {
        const out = {};
        for (const [k, v] of new URLSearchParams(Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw))) {
            if (Object.prototype.hasOwnProperty.call(out, k)) out[k] = [].concat(out[k], v);
            else out[k] = v;
        }
        return out;
    }
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const out = {};
    for (const [k, v] of Object.entries(body)) {
        if (Array.isArray(v)) out[k] = v.map(String);
        else if (v !== null && typeof v === 'object') continue; // never signed by Twilio
        else out[k] = v === undefined || v === null ? '' : String(v);
    }
    return out;
}

/** HMAC-SHA1(authToken, url + concat(sorted key+value)) → base64 (same as twilio-node). */
function twilioSignature(authToken, url, params) {
    let data = url;
    for (const key of Object.keys(params || {}).sort()) {
        const v = params[key];
        if (Array.isArray(v)) data += Array.from(new Set(v.map(String))).sort().map((x) => key + x).join('');
        else data += key + (v === undefined || v === null ? '' : String(v));
    }
    return crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
}

/**
 * The URL as signed, with and without the port, like twilio-node's validateRequest
 * (Twilio keeps the port for SMS callbacks and drops it for voice over HTTPS).
 * Parsed by hand because WHATWG URL silently drops a default :443.
 */
function urlVariants(url) {
    const out = [url];
    const m = /^(https?:\/\/)([^/?#]*)(.*)$/i.exec(url);
    if (m) {
        const [, scheme, authority, rest] = m;
        const pm = /^(.*?)(?::(\d+))?$/.exec(authority);
        const hostOnly = pm[1];
        if (pm[2] !== undefined) out.push(scheme + hostOnly + rest); // drop explicit port
        else out.push(scheme + hostOnly + ':' + (scheme.toLowerCase() === 'https://' ? '443' : '80') + rest); // add default
    }
    return Array.from(new Set(out));
}

function validTwilioSignature(authToken, publicUrl, params, signature) {
    if (!signature) return false;
    let ok = false;
    for (const url of urlVariants(publicUrl)) {
        if (timingSafeEqualStr(twilioSignature(authToken, url, params), signature)) ok = true;
    }
    return ok;
}

// ── Handlers ────────────────────────────────────────────────────────
/**
 * @param {{method: string, headers: object, body: any, rawBody?: Buffer|string}} req
 * @param {{env: object, getDb: (name: string) => Promise<object>, clock?: () => number}} deps
 * @returns {Promise<{status: number, body: string|object, contentType?: string}>}
 */
async function handleTwilioWebhook(req, deps) {
    if (req.method !== 'POST') return { status: 405, body: 'Method Not Allowed', contentType: 'text/plain' };
    const authToken = envValue(deps.env, 'TWILIO_AUTH_TOKEN');
    const publicUrl = envValue(deps.env, 'TWILIO_WEBHOOK_URL');
    if (!authToken || !publicUrl) {
        console.error('❌ /twilio rejected: TWILIO_AUTH_TOKEN and TWILIO_WEBHOOK_URL must both be set');
        return { status: 503, body: 'Twilio webhook not configured', contentType: 'text/plain' };
    }
    const params = twilioParams(req);
    if (!validTwilioSignature(authToken, publicUrl, params, header(req.headers, 'x-twilio-signature'))) {
        console.warn('⚠️ /twilio rejected: invalid or missing X-Twilio-Signature');
        return { status: 403, body: 'Invalid Twilio signature', contentType: 'text/plain' };
    }
    const one = (v) => (Array.isArray(v) ? v[0] : v);
    const doc = {
        direction: 'inbound',
        platform: 'twilio',
        from: TYPES.str(one(params.From)) || 'Unknown',
        to: TYPES.str(one(params.To)) || '',
        body: TYPES.text(one(params.Body)) || '',
        messageId: TYPES.str(one(params.MessageSid) || one(params.SmsMessageSid)) || 'N/A',
        timestamp: new Date((deps.clock || Date.now)()),
    };
    const numMedia = TYPES.int(one(params.NumMedia));
    if (typeof numMedia === 'number') doc.numMedia = numMedia;
    try {
        const db = await deps.getDb(DB_NAME);
        await db.collection('Communications').insertOne(doc);
    } catch (err) {
        console.error('❌ Twilio Webhook Error:', err);
        return { status: 500, body: 'Server Error', contentType: 'text/plain' };
    }
    return { status: 200, body: EMPTY_TWIML, contentType: 'text/xml' };
}

async function handleTelegramWebhook(req, deps) {
    if (req.method !== 'POST') return { status: 405, body: 'Method Not Allowed', contentType: 'text/plain' };
    const secret = envValue(deps.env, 'TELEGRAM_WEBHOOK_SECRET');
    if (!secret) {
        console.error('❌ /telegram rejected: TELEGRAM_WEBHOOK_SECRET is not set');
        return { status: 503, body: 'Telegram webhook not configured', contentType: 'text/plain' };
    }
    if (!timingSafeEqualStr(header(req.headers, 'x-telegram-bot-api-secret-token'), secret)) {
        console.warn('⚠️ /telegram rejected: invalid or missing X-Telegram-Bot-Api-Secret-Token');
        return { status: 401, body: 'Unauthorized', contentType: 'text/plain' };
    }
    const update = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const message = update.message || update.edited_message || (update.callback_query && update.callback_query.message) || null;
    const chatId = message && message.chat && message.chat.id;
    const doc = {
        direction: 'inbound',
        platform: 'telegram',
        from: TYPES.str(chatId) || 'Unknown',
        body: (message && TYPES.text(message.text)) || '',
        messageId: (message && TYPES.str(message.message_id)) || 'N/A',
        timestamp: new Date((deps.clock || Date.now)()),
    };
    const updateId = TYPES.int(update.update_id);
    if (typeof updateId === 'number') doc.updateId = updateId;
    try {
        const db = await deps.getDb(DB_NAME);
        await db.collection('Communications').insertOne(doc);
    } catch (err) {
        console.error('❌ Telegram Webhook Error:', err);
        return { status: 500, body: 'Server Error', contentType: 'text/plain' };
    }
    return { status: 200, body: 'OK', contentType: 'text/plain' };
}

/** Velo intakeQueue.jsw handshake. Unchanged storage; auth is now per-caller and fail-closed. */
async function handleWixIntakeWebhook(req, deps) {
    const auth = authenticateCaller(req.headers, deps.keys);
    if (auth.status !== 200) return { status: auth.status, body: { error: auth.error } };
    if (!callerMayUse(auth.caller, 'route', 'wix-intake')) {
        return { status: 403, body: { error: 'This caller key may not post /wix-intake' } };
    }
    try {
        const payload = req.body || {};
        const db = await deps.getDb(DB_NAME);
        await db.collection('WixIntakeEvents').insertOne({
            source: 'wix_velo',
            type: 'intake_submission',
            caseId: payload.caseId || 'Unknown',
            rawPayload: payload,
            timestamp: new Date((deps.clock || Date.now)()),
        });
    } catch (err) {
        console.error('❌ Wix Webhook Error:', err);
        return { status: 500, body: { error: 'Server Error' } };
    }
    return { status: 200, body: { success: true, message: 'Handshake completed successfully' } };
}

/** Which webhook a request path targets ('twilio' | 'telegram' | 'wix-intake' | null). */
function webhookRoute(path) {
    const p = String(path || '').toLowerCase().replace(/\/+$/, '');
    for (const name of ['twilio', 'telegram', 'wix-intake']) {
        if (p === '/' + name || p.endsWith('/' + name)) return name;
    }
    return null;
}

module.exports = {
    EMPTY_TWIML, twilioParams, twilioSignature, urlVariants, validTwilioSignature,
    handleTwilioWebhook, handleTelegramWebhook, handleWixIntakeWebhook, webhookRoute,
};
