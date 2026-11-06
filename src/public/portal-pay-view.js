/**
 * Display model for the portal pay panel.
 * The payment lookup itself is getPaymentLinkForSession in backend/portal-payment
 * (PR 106). This module does not call leads. It reads only
 * { state, payment_url?, amount_cents? }. state is one of:
 * ok, preparing, hidden, paid, expired, call.
 * An older { url, source } body has no state and is shown as call.
 * The object sent to the dashboard embed never includes payment_url or a token.
 */

export const PAY_PREPARING = 'Your link is being prepared, please try again in a moment';
export const PAY_EXPIRED = 'Your payment link expired. Please call (239) 332-2245.';
export const PAY_CALL = 'Please call (239) 332-2245.';
export const PAY_STATES = ['ok', 'preparing', 'hidden', 'paid', 'expired', 'call'];

function validCents(value) {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

export function formatPremiumDue(cents) {
    if (!validCents(cents)) return '';
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function safePaymentUrl(value, sessionToken) {
    if (typeof value !== 'string') return '';
    const raw = value.trim();
    if (!raw || raw.length > 2000) return '';
    if (/[\u0000-\u001F\u007F]/.test(raw)) return '';
    if (/\/links\/|lnk_/i.test(raw)) return '';
    if (sessionToken && raw.indexOf(sessionToken) !== -1) return '';
    let parsed;
    try {
        parsed = new URL(raw);
    } catch (e) {
        return '';
    }
    if (parsed.protocol !== 'https:') return '';
    if (parsed.username || parsed.password) return '';
    if (parsed.port && parsed.port !== '443') return '';
    if (sessionToken && parsed.href.indexOf(sessionToken) !== -1) return '';
    return parsed.href;
}

function callView() {
    return {
        state: 'call',
        openUrl: '',
        premiumDueLabel: '',
        premiumDueText: 'Premium due: Not on file',
        message: PAY_CALL,
        showPayNow: false,
        showPayCall: true,
        showPaidBadge: false
    };
}

/**
 * @param {object|null} result Backend result. Only state, payment_url, and amount_cents are read.
 * @param {string} [sessionToken] Reject a payment_url that contains this. It is not copied onto the view.
 */
export function payViewFromResult(result, sessionToken) {
    const state = result && PAY_STATES.indexOf(result.state) !== -1 ? result.state : 'call';
    if (state === 'hidden') {
        return {
            state: 'hidden',
            openUrl: '',
            premiumDueLabel: '',
            premiumDueText: '',
            message: '',
            showPayNow: false,
            showPayCall: false,
            showPaidBadge: false
        };
    }
    if (state === 'paid') {
        return {
            state: 'paid',
            openUrl: '',
            premiumDueLabel: '',
            premiumDueText: '',
            message: 'Paid',
            showPayNow: false,
            showPayCall: false,
            showPaidBadge: true
        };
    }
    if (state === 'preparing') {
        return {
            state: 'preparing',
            openUrl: '',
            premiumDueLabel: '',
            premiumDueText: '',
            message: PAY_PREPARING,
            showPayNow: false,
            showPayCall: true,
            showPaidBadge: false
        };
    }
    if (state === 'expired') {
        return {
            state: 'expired',
            openUrl: '',
            premiumDueLabel: '',
            premiumDueText: '',
            message: PAY_EXPIRED,
            showPayNow: false,
            showPayCall: true,
            showPaidBadge: false
        };
    }
    if (state === 'ok') {
        const cents = validCents(result.amount_cents) ? result.amount_cents : null;
        const url = safePaymentUrl(result.payment_url, sessionToken);
        if (!url || cents === null) return callView();
        const label = formatPremiumDue(cents);
        return {
            state: 'ok',
            openUrl: url,
            premiumDueLabel: label,
            premiumDueText: 'Premium due: ' + label,
            message: '',
            showPayNow: true,
            showPayCall: false,
            showPaidBadge: false
        };
    }
    return callView();
}

/**
 * Main's payment module uses role_not_indemnitor, already_paid, and call_only.
 * The panel model uses hidden, paid, and call. Either set is accepted.
 * The returned object never includes payment_url.
 */
export function paymentPanelView(result, sessionToken) {
    const state = result && result.state;
    if (state === 'role_not_indemnitor' || state === 'hidden') {
        return {
            state: 'hidden', openUrl: '', premiumDueLabel: '', message: '',
            showPayNow: false, showPayCall: false, showPaidBadge: false
        };
    }
    if (state === 'already_paid' || state === 'paid') return payViewFromResult({ state: 'paid' }, sessionToken);
    if (state === 'call_only' || state === 'rate_limited' || state === 'error') {
        return payViewFromResult({ state: 'call' }, sessionToken);
    }
    return payViewFromResult(result, sessionToken);
}

/** Fields that may be posted to the embed. No URL and no token. */
export function dashPayFields(view) {
    const v = view || callView();
    return {
        payState: v.state,
        premiumDueLabel: v.showPayNow ? v.premiumDueLabel : '',
        payMessage: v.message || '',
        showPayNow: v.showPayNow === true,
        showPayCall: v.showPayCall === true,
        showPaidBadge: v.showPaidBadge === true
    };
}
