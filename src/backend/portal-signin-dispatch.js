/**
 * Portal sign-in delivery chain.
 * File: backend/portal-signin-dispatch.js
 *
 * No Wix imports. Callers pass fetch and getSecret so unit tests can mock both.
 *
 * Two different keys. Do not collapse them:
 * - Dashboard iMessage (X-API-Key) uses Wix secret LEADS_API_KEY, and falls
 *   back to GAS_API_KEY only when LEADS_API_KEY is unset. The live dashboard
 *   key is not the Wix GAS_API_KEY. Never copy the dashboard key over GAS_API_KEY.
 * - Netlify gas-proxy (email MailApp and sendBlueBubblesRelay) always sends
 *   the existing Wix GAS_API_KEY. That proxy path breaks if GAS_API_KEY changes.
 *
 * Phone: /api/imessage/wix/send → /api/imessage/shannon/send → GAS
 * sendBlueBubblesRelay via the Netlify proxy → Twilio SMS only when
 * PORTAL_TWILIO_SMS_ENABLED is true → email on file → Slack alert.
 * Email: GAS MailApp via the proxy, one fast retry, then the phone chain.
 *
 * Per-call timeout stays short so a hung hop cannot burn the whole Wix
 * web-method budget before the next hop runs. Nothing here logs a full
 * phone number, email address, API key, or webhook URL.
 */

export const LEADS_BASE = 'https://leads.shamrockbailbonds.biz';
export const GAS_PROXY_URL = 'https://shamrock-telegram.netlify.app/api/gas-proxy';
export const OFFICE_PHONE_DISPLAY = '(239) 332-2245';
export const DEFAULT_TIMEOUT_MS = 3000;
export const DASHBOARD_SEND_PATHS = [
    '/api/imessage/wix/send',
    '/api/imessage/shannon/send'
];

const FAIL_EMAIL = "We couldn't send the link. Try email instead, or call (239) 332-2245.";
const FAIL_PHONE = "We couldn't send the link. Try a mobile number instead, or call (239) 332-2245.";
const FAIL_CALL = "We couldn't send the link. Please call (239) 332-2245.";
const INVALID_CONTACT = 'Enter a valid 10-digit phone number or email address.';

export function maskPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 4) return 'your phone';
    return '•••-•••-' + digits.slice(-4);
}

export function maskEmail(email) {
    const raw = String(email || '').trim().toLowerCase();
    const at = raw.indexOf('@');
    if (at < 1 || at === raw.length - 1) return 'your email';
    const local = raw.slice(0, at);
    const domain = raw.slice(at + 1);
    return local.slice(0, Math.min(2, local.length)) + '•••@' + domain;
}

export function twilioSmsEnabled(value) {
    return /^(1|true|yes|on)$/i.test(String(value || '').trim());
}

export function describeSignInResult(result) {
    const phone = (result && result.maskedPhone) || 'your phone';
    const email = (result && result.maskedEmail) || 'your email';
    if (!result) return FAIL_CALL;
    if (result.reason === 'invalid') return INVALID_CONTACT;
    if (result && result.success && result.reason === 'text_failed_emailed') {
        return "We couldn't text your sign-in link, so we emailed it to " + email + '.';
    }
    if (result && result.success && result.reason === 'email_failed_texted') {
        return "We couldn't email your sign-in link, so we texted it to " + phone + '.';
    }
    if (result && result.success && result.channel === 'email') {
        return 'We emailed your sign-in link to ' + email + '.';
    }
    if (result && result.success) {
        return 'We texted your sign-in link to ' + phone + '.';
    }
    if (result && result.offerEmail) return FAIL_EMAIL;
    if (result && result.offerPhone) return FAIL_PHONE;
    return FAIL_CALL;
}

export async function readSecret(getSecret, name) {
    if (typeof getSecret !== 'function') return '';
    try {
        const value = await getSecret(name);
        if (value == null) return '';
        return String(value).trim();
    } catch (e) {
        return '';
    }
}

export async function resolveDashboardKey(getSecret) {
    const leads = await readSecret(getSecret, 'LEADS_API_KEY');
    if (leads) return { key: leads, source: 'LEADS_API_KEY' };
    const gas = await readSecret(getSecret, 'GAS_API_KEY');
    if (gas) return { key: gas, source: 'GAS_API_KEY' };
    return { key: '', source: '' };
}

function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
}

export function toE164(phone) {
    const clean = digitsOnly(phone);
    if (!clean) return '';
    if (clean.length === 10) return '+1' + clean;
    if (clean.length === 11 && clean.charAt(0) === '1') return '+' + clean;
    return '+' + clean;
}

function logEvent(deps, event) {
    const logger = (deps && deps.logger) || console;
    const safe = {
        event: 'portal_signin',
        step: event.step || '',
        reason: event.reason || '',
        status: event.status || 0,
        keySource: event.keySource || ''
    };
    try {
        if (logger && typeof logger.warn === 'function') {
            logger.warn('[portal-signin] ' + JSON.stringify(safe));
        }
    } catch (e) { /* logging must not break delivery */ }
}

function classifyStatus(status) {
    if (status === 401 || status === 403) return 'auth';
    if (status === 404 || !status) return 'unreachable';
    return 'upstream';
}

function withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            const err = new Error('timeout');
            err.code = 'timeout';
            reject(err);
        }, ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function requireFetch(deps) {
    if (!deps || typeof deps.fetchImpl !== 'function') {
        const err = new Error('fetch_unavailable');
        err.code = 'fetch_unavailable';
        throw err;
    }
    return deps.fetchImpl;
}

function authHeaders(key) {
    // Super CRM iMessage expects X-API-Key. X-Internal-Token carries the same
    // value because the dashboard also accepts that header. The value is
    // LEADS_API_KEY (GAS_API_KEY only if LEADS_API_KEY is unset).
    return {
        'Content-Type': 'application/json',
        'X-API-Key': key,
        'X-Internal-Token': key
    };
}

async function readJson(response) {
    let raw = '';
    try {
        raw = await response.text();
    } catch (e) {
        raw = '';
    }
    try {
        return JSON.parse(raw || '{}');
    } catch (e) {
        return {};
    }
}

function sendAccepted(response, data) {
    if (!response || !response.ok) return false;
    return !!(data && (data.success || data.sent || data.queued));
}

async function postJson(deps, url, headers, body) {
    const timeoutMs = deps.timeoutMs || DEFAULT_TIMEOUT_MS;
    const response = await withTimeout(requireFetch(deps)(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    }), timeoutMs);
    const data = await readJson(response);
    return { response, data, status: response.status };
}

/**
 * POST one dashboard send path. Does not log the body.
 */
async function postDashboardPath(deps, keyInfo, path, payload) {
    const base = (deps && deps.leadsBase) || LEADS_BASE;
    const step = path.indexOf('shannon') !== -1 ? 'shannon_send' : 'wix_send';
    try {
        const posted = await postJson(deps, base + path, authHeaders(keyInfo.key), payload);
        if (sendAccepted(posted.response, posted.data)) {
            const channel = posted.data.channel === 'sms' ? 'sms' : 'imessage';
            return {
                success: true,
                reason: 'sent',
                channel: channel,
                step: step,
                status: posted.status,
                messageId: posted.data.messageId || posted.data.queued_id || '',
                data: posted.data
            };
        }
        const reason = classifyStatus(posted.status);
        logEvent(deps, {
            step: step,
            reason: reason === 'auth' ? 'config_auth_mismatch' : reason,
            status: posted.status,
            keySource: keyInfo.source
        });
        return { success: false, reason: reason, step: step, status: posted.status, timedOut: false };
    } catch (error) {
        const timedOut = !!(error && error.code === 'timeout');
        logEvent(deps, {
            step: step,
            reason: 'unreachable',
            status: 0,
            keySource: keyInfo.source
        });
        return { success: false, reason: 'unreachable', step: step, status: 0, timedOut: timedOut };
    }
}

export async function dashboardSend(deps, params) {
    const formatted = toE164(params && params.phone);
    const text = params && params.text ? String(params.text) : '';
    if (!formatted || digitsOnly(formatted).length < 10 || !text) {
        return { success: false, reason: 'invalid', channel: '', status: 0 };
    }
    const keyInfo = await resolveDashboardKey(deps && deps.getSecret);
    if (!keyInfo.key) {
        logEvent(deps, { step: 'dashboard_auth', reason: 'missing_key', status: 0, keySource: '' });
        return { success: false, reason: 'missing_key', channel: '', status: 0 };
    }
    const payload = {
        phone: formatted,
        to: formatted,
        message: text,
        text: text,
        source: 'wix_clipboard',
        agent_name: 'Wix Clipboard'
    };
    let last = { success: false, reason: 'unreachable', channel: '', status: 0, step: 'wix_send' };
    for (let i = 0; i < DASHBOARD_SEND_PATHS.length; i++) {
        last = await postDashboardPath(deps, keyInfo, DASHBOARD_SEND_PATHS[i], payload);
        if (last.success) return last;
    }
    return last;
}

async function sendGasRelay(deps, phone, text) {
    // Proxy auth stays on GAS_API_KEY. Do not put LEADS_API_KEY in apiKey.
    const gasKey = await readSecret(deps && deps.getSecret, 'GAS_API_KEY');
    if (!gasKey) {
        logEvent(deps, { step: 'gas_relay', reason: 'missing_key', status: 0 });
        return { success: false, reason: 'missing_key', status: 0 };
    }
    const proxy = (deps && deps.gasProxyUrl) || GAS_PROXY_URL;
    try {
        const posted = await postJson(deps, proxy, {
            'Content-Type': 'application/json',
            'X-GAS-API-Key': gasKey
        }, {
            action: 'sendBlueBubblesRelay',
            apiKey: gasKey,
            to: phone,
            phone: phone,
            text: text,
            message: text
        });
        if (sendAccepted(posted.response, posted.data)) {
            const channel = posted.data.channel === 'sms' ? 'sms' : 'imessage';
            return { success: true, reason: 'sent', channel: channel, status: posted.status };
        }
        const reason = classifyStatus(posted.status);
        logEvent(deps, {
            step: 'gas_relay',
            reason: reason === 'auth' ? 'config_auth_mismatch' : reason,
            status: posted.status
        });
        return { success: false, reason: reason, status: posted.status, timedOut: false };
    } catch (error) {
        logEvent(deps, { step: 'gas_relay', reason: 'unreachable', status: 0 });
        return {
            success: false,
            reason: 'unreachable',
            status: 0,
            timedOut: !!(error && error.code === 'timeout')
        };
    }
}

async function sendGasEmail(deps, email) {
    // MailApp via gas-proxy authenticates with the existing GAS_API_KEY only.
    const gasKey = await readSecret(deps && deps.getSecret, 'GAS_API_KEY');
    if (!gasKey) {
        logEvent(deps, { step: 'gas_email', reason: 'missing_key', status: 0 });
        return { success: false, reason: 'missing_key', status: 0 };
    }
    if (!email || !email.to || !email.subject || !email.htmlBody) {
        return { success: false, reason: 'invalid', status: 0 };
    }
    const proxy = (deps && deps.gasProxyUrl) || GAS_PROXY_URL;
    const attempts = deps && deps.emailAttempts ? deps.emailAttempts : 2;
    let last = { success: false, reason: 'unreachable', status: 0, timedOut: false };
    for (let i = 0; i < attempts; i++) {
        try {
            const posted = await postJson(deps, proxy, {
                'Content-Type': 'application/json',
                'X-GAS-API-Key': gasKey
            }, {
                action: 'sendEmail',
                apiKey: gasKey,
                to: email.to,
                subject: email.subject,
                htmlBody: email.htmlBody
            });
            if (posted.response.ok && posted.data && posted.data.success !== false) {
                return { success: true, reason: 'sent', status: posted.status };
            }
            const reason = posted.response.ok ? 'upstream' : classifyStatus(posted.status);
            logEvent(deps, {
                step: 'gas_email',
                reason: reason === 'auth' ? 'config_auth_mismatch' : reason,
                status: posted.status
            });
            last = { success: false, reason: reason, status: posted.status, timedOut: false };
        } catch (error) {
            logEvent(deps, { step: 'gas_email', reason: 'unreachable', status: 0 });
            last = {
                success: false,
                reason: 'unreachable',
                status: 0,
                timedOut: !!(error && error.code === 'timeout')
            };
        }
        const retryable = !last.success && !last.timedOut && last.reason !== 'auth' && last.reason !== 'invalid';
        if (!retryable || i === attempts - 1) break;
        const wait = deps && typeof deps.retryDelayMs === 'number' ? deps.retryDelayMs : 250;
        if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    }
    return last;
}

async function sendTwilioIfEnabled(deps, phone, text) {
    const flag = await readSecret(deps && deps.getSecret, 'PORTAL_TWILIO_SMS_ENABLED');
    if (!twilioSmsEnabled(flag)) {
        logEvent(deps, { step: 'twilio_sms', reason: 'skipped_flag_off', status: 0 });
        return { success: false, reason: 'skipped_flag_off' };
    }
    if (!deps || typeof deps.sendTwilio !== 'function') {
        logEvent(deps, { step: 'twilio_sms', reason: 'upstream', status: 0 });
        return { success: false, reason: 'upstream' };
    }
    try {
        const sms = await withTimeout(Promise.resolve(deps.sendTwilio(phone, text)), deps.timeoutMs || DEFAULT_TIMEOUT_MS);
        if (sms && sms.success) return { success: true, reason: 'sent', channel: 'sms' };
        logEvent(deps, { step: 'twilio_sms', reason: 'upstream', status: 0 });
        return { success: false, reason: 'upstream' };
    } catch (error) {
        logEvent(deps, { step: 'twilio_sms', reason: 'unreachable', status: 0 });
        return { success: false, reason: 'unreachable' };
    }
}

async function alertStaff(deps, info) {
    const url = await readSecret(deps && deps.getSecret, 'SLACK_WEBHOOK_URL');
    if (!url) {
        logEvent(deps, { step: 'slack_alert', reason: 'missing_webhook', status: 0 });
        return;
    }
    const text = 'Portal sign-in link was not delivered. Entry: ' + (info.mode || '')
        + '. Reason: ' + (info.reason || 'unknown')
        + '. Contact: ' + (info.masked || '•••')
        + '. Staff follow-up needed.';
    try {
        await withTimeout(requireFetch(deps)(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        }), (deps && deps.timeoutMs) || DEFAULT_TIMEOUT_MS);
        logEvent(deps, { step: 'slack_alert', reason: 'posted', status: 0 });
    } catch (error) {
        logEvent(deps, { step: 'slack_alert', reason: 'unreachable', status: 0 });
    }
}

async function deliverPhoneChain(deps, input) {
    const formatted = toE164(input.phone);
    if (!formatted || digitsOnly(formatted).length < 10 || !input.text) {
        return { success: false, reason: 'invalid', channel: '' };
    }
    const dash = await dashboardSend(deps, { phone: formatted, text: input.text });
    if (dash.success) return { success: true, channel: dash.channel, reason: 'sent' };

    const relay = await sendGasRelay(deps, formatted, input.text);
    if (relay.success) return { success: true, channel: relay.channel || 'imessage', reason: 'sent' };

    const sms = await sendTwilioIfEnabled(deps, formatted, input.text);
    if (sms.success) return { success: true, channel: 'sms', reason: 'sent' };

    if (input.email && !input.skipEmailFallback && input.htmlBody && input.subject) {
        const emailed = await sendGasEmail(deps, {
            to: input.email,
            subject: input.subject,
            htmlBody: input.htmlBody
        });
        if (emailed.success) return { success: true, channel: 'email', reason: 'text_failed_emailed' };
    }

    return { success: false, reason: dash.reason || relay.reason || 'unreachable', channel: '' };
}

function finish(partial) {
    const result = {
        success: !!partial.success,
        channel: partial.channel || '',
        reason: partial.reason || (partial.success ? 'sent' : 'unreachable'),
        maskedPhone: partial.maskedPhone || '',
        maskedEmail: partial.maskedEmail || '',
        offerEmail: !!partial.offerEmail,
        offerPhone: !!partial.offerPhone
    };
    result.message = describeSignInResult(result);
    return result;
}

/**
 * Deliver a portal sign-in link by phone or email, with the ordered fallbacks.
 * @param {Object} input
 * @param {'phone'|'email'} input.mode
 * @param {string} [input.phone]
 * @param {string} [input.email]
 * @param {string} [input.text] SMS / iMessage body
 * @param {string} [input.subject]
 * @param {string} [input.htmlBody]
 * @param {boolean} [input.skipPhoneFallback]
 * @param {boolean} [input.skipEmailFallback]
 * @param {Object} deps fetchImpl, getSecret, optional sendTwilio, logger, timeoutMs
 */
export async function deliverPortalSignInLink(input, deps) {
    const mode = input && input.mode === 'email' ? 'email' : 'phone';
    const phone = input && input.phone ? String(input.phone) : '';
    const email = input && input.email ? String(input.email).trim() : '';
    const maskedPhone = phone ? maskPhone(phone) : '';
    const maskedEmail = email ? maskEmail(email) : '';
    const base = { maskedPhone: maskedPhone, maskedEmail: maskedEmail };

    if (mode === 'email') {
        if (!email || email.indexOf('@') < 1) {
            return finish(Object.assign({}, base, {
                success: false, reason: 'invalid', offerEmail: false, offerPhone: false
            }));
        }
        const emailed = await sendGasEmail(deps, {
            to: email,
            subject: input.subject,
            htmlBody: input.htmlBody
        });
        if (emailed.success) {
            return finish(Object.assign({}, base, {
                success: true, channel: 'email', reason: 'sent', offerEmail: false, offerPhone: false
            }));
        }
        if (phone && !input.skipPhoneFallback && input.text) {
            const texted = await deliverPhoneChain(deps, {
                phone: phone,
                text: input.text,
                email: '',
                skipEmailFallback: true
            });
            if (texted.success) {
                return finish(Object.assign({}, base, {
                    success: true,
                    channel: texted.channel,
                    reason: 'email_failed_texted',
                    offerEmail: false,
                    offerPhone: false
                }));
            }
        }
        if (emailed.reason !== 'invalid') {
            await alertStaff(deps, { mode: 'email', reason: emailed.reason, masked: maskedEmail });
        }
        return finish(Object.assign({}, base, {
            success: false,
            reason: emailed.reason || 'upstream',
            offerEmail: false,
            offerPhone: true
        }));
    }

    const texted = await deliverPhoneChain(deps, {
        phone: phone,
        text: input && input.text,
        email: email,
        subject: input && input.subject,
        htmlBody: input && input.htmlBody,
        skipEmailFallback: !!(input && input.skipEmailFallback)
    });
    if (texted.reason === 'invalid') {
        return finish(Object.assign({}, base, {
            success: false, reason: 'invalid', offerEmail: false, offerPhone: false
        }));
    }
    if (texted.success) {
        return finish(Object.assign({}, base, {
            success: true,
            channel: texted.channel,
            reason: texted.reason,
            offerEmail: false,
            offerPhone: false
        }));
    }
    await alertStaff(deps, { mode: 'phone', reason: texted.reason, masked: maskedPhone });
    return finish(Object.assign({}, base, {
        success: false,
        reason: texted.reason || 'unreachable',
        offerEmail: true,
        offerPhone: false
    }));
}

/**
 * Auth probe. GET status and POST an empty body. No recipient, so no text is sent.
 * A 400 on the empty send means the key was accepted and the body was rejected.
 */
export async function probeDashboardSend(deps) {
    const keyInfo = await resolveDashboardKey(deps && deps.getSecret);
    const base = (deps && deps.leadsBase) || LEADS_BASE;
    if (!keyInfo.key) {
        logEvent(deps, { step: 'probe', reason: 'missing_key', status: 0 });
        return {
            success: false,
            reason: 'missing_key',
            connected: false,
            keySource: '',
            error: 'Missing LEADS_API_KEY and GAS_API_KEY'
        };
    }
    let statusData = {};
    try {
        const timeoutMs = (deps && deps.timeoutMs) || DEFAULT_TIMEOUT_MS;
        const statusRes = await withTimeout(requireFetch(deps)(base + '/api/imessage/status', {
            method: 'GET',
            headers: authHeaders(keyInfo.key)
        }), timeoutMs);
        statusData = await readJson(statusRes);
        if (statusRes.status === 401 || statusRes.status === 403) {
            logEvent(deps, {
                step: 'probe_status',
                reason: 'config_auth_mismatch',
                status: statusRes.status,
                keySource: keyInfo.source
            });
            return {
                success: false,
                reason: 'auth',
                connected: false,
                keySource: keyInfo.source,
                sendProbeStatus: statusRes.status,
                error: 'config_auth_mismatch'
            };
        }
    } catch (error) {
        logEvent(deps, { step: 'probe_status', reason: 'unreachable', status: 0, keySource: keyInfo.source });
        return {
            success: false,
            reason: 'unreachable',
            connected: false,
            keySource: keyInfo.source,
            error: 'status_unreachable'
        };
    }

    let sendStatus = 0;
    let pathUsed = DASHBOARD_SEND_PATHS[0];
    try {
        const first = await postJson(deps, base + pathUsed, authHeaders(keyInfo.key), {});
        sendStatus = first.status;
        if (sendStatus === 404 || sendStatus === 401 || sendStatus === 403) {
            pathUsed = DASHBOARD_SEND_PATHS[1];
            const second = await postJson(deps, base + pathUsed, authHeaders(keyInfo.key), {});
            sendStatus = second.status;
        }
    } catch (error) {
        logEvent(deps, { step: 'probe_send', reason: 'unreachable', status: 0, keySource: keyInfo.source });
        return {
            success: false,
            reason: 'unreachable',
            connected: !!statusData.connected,
            keySource: keyInfo.source,
            pathInUse: pathUsed,
            error: 'send_probe_unreachable'
        };
    }

    if (sendStatus === 401 || sendStatus === 403) {
        logEvent(deps, {
            step: 'probe_send',
            reason: 'config_auth_mismatch',
            status: sendStatus,
            keySource: keyInfo.source
        });
    }
    const ok = !!statusData.connected && sendStatus === 400;
    return {
        success: ok,
        reason: (sendStatus === 401 || sendStatus === 403) ? 'auth' : (ok ? 'ok' : 'upstream'),
        connected: !!statusData.connected,
        keySource: keyInfo.source,
        pathInUse: (statusData.servers && statusData.servers[0] && statusData.servers[0].path_in_use) || pathUsed,
        sendProbeStatus: sendStatus,
        error: ok ? '' : (sendStatus === 401 || sendStatus === 403
            ? 'config_auth_mismatch'
            : 'expected send 400 after auth, got ' + sendStatus)
    };
}
