/**
 * HTTP function auth helpers.
 * Backend-only (.js, not .jsw) so these are not invokable as web methods.
 */

import { timingSafeEqual, createHmac } from 'crypto';
import { getSecret } from 'wix-secrets-backend';

const TWILIO_HOSTS = [
    'https://www.shamrockbailbonds.biz',
    'https://shamrockbailbonds.biz'
];

export const GAS_SECRETS_ALLOWLIST = [
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_WEBHOOK_SECRET',
    'ELEVENLABS_API_KEY',
    'ELEVENLABS_VOICE_ID',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'OPENAI_API_KEY',
    'SLACK_WEBHOOK_URL',
    'GOOGLE_MAPS_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'WIX_API_KEY',
    'GAS_WEBHOOK_URL',
    'GAS_WEB_APP_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DOCUSEAL_API_KEY'
];

/**
 * Constant-time string compare. Different lengths still return false.
 */
export function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const left = Buffer.from(a, 'utf8');
    const right = Buffer.from(b, 'utf8');
    if (left.length !== right.length || left.length === 0) {
        const dummy = Buffer.alloc(32);
        timingSafeEqual(dummy, dummy);
        return false;
    }
    return timingSafeEqual(left, right);
}

export function extractProvidedApiKey(request, extraProvided) {
    if (extraProvided) return String(extraProvided);
    const headers = (request && request.headers) || {};
    const query = (request && request.query) || {};
    const headerKey =
        headers['x-api-key'] ||
        headers['api-key'] ||
        headers['x-gas-api-key'] ||
        '';
    if (headerKey) return String(headerKey);
    const auth = headers['authorization'] || headers['Authorization'] || '';
    if (auth) return String(auth).replace(/^Bearer\s+/i, '').trim();
    return String(query.apiKey || query.auth || query.key || '');
}

/**
 * Fail-closed GAS_API_KEY check.
 * @returns {{ok:true}|{ok:false,status:number,message:string}}
 */
export async function authenticateGasRequest(request, extraProvided) {
    const valid = await getSecret('GAS_API_KEY').catch(() => null);
    if (!valid) {
        return { ok: false, status: 500, message: 'Server misconfiguration' };
    }
    const provided = extractProvidedApiKey(request, extraProvided);
    if (!provided || !safeEqual(provided, valid)) {
        return { ok: false, status: 403, message: 'Unauthorized' };
    }
    return { ok: true };
}

export function escapeXml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export function sanitizeRedirectUrl(url, fallback, allowedHosts) {
    const safeFallback = fallback === undefined
        ? 'https://www.shamrockbailbonds.biz/portal-landing'
        : fallback;
    const hosts = allowedHosts || ['www.shamrockbailbonds.biz', 'shamrockbailbonds.biz'];
    try {
        const parsed = new URL(String(url));
        if (parsed.protocol !== 'https:') return safeFallback;
        if (!hosts.includes(parsed.hostname)) return safeFallback;
        return parsed.toString();
    } catch (e) {
        return safeFallback;
    }
}

export function candidateTwilioUrls(request, path) {
    const urls = TWILIO_HOSTS.map((host) => `${host}/_functions/${path}`);
    const requestUrl = request && (request.url || request.baseUrl);
    if (requestUrl && typeof requestUrl === 'string') {
        urls.unshift(requestUrl.split('?')[0]);
    }
    return [...new Set(urls)];
}

export function verifyTwilioSignature(authToken, signature, paramObj, urls) {
    if (!authToken || !signature) return false;
    return urls.some((url) => {
        const sortedKeys = Object.keys(paramObj).sort();
        let data = url;
        for (const key of sortedKeys) {
            data += `${key}${paramObj[key]}`;
        }
        const generated = createHmac('sha1', authToken)
            .update(Buffer.from(data, 'utf-8'))
            .digest('base64');
        return safeEqual(signature, generated);
    });
}

export function isSecretAllowlisted(name) {
    return GAS_SECRETS_ALLOWLIST.indexOf(name) !== -1;
}
