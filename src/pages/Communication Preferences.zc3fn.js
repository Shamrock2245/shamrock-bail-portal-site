/**
 * Communication Preferences — Shamrock Bail Bonds Portal
 * Page ID: f870g
 *
 * This page uses an embedded HtmlComponent (#html1) for the form UI.
 * The HTML embed handles all visual rendering and user input.
 * This page code handles:
 *   1. Session authentication or a personal signed link (?cpt=)
 *   2. Loading existing preferences via the backend web method
 *   3. Receiving save requests via postMessage from the HTML embed
 *   4. Calling the backend to authorize, validate, await the GAS consent gate, and persist
 *   5. Sending success/error responses back to the HTML embed
 *
 * Persistence, auth, and GAS sync live in backend/comm-prefs-sync.jsw.
 * The HTML embed element ID should be: #html1
 */

import wixLocation from 'wix-location';
import { local } from 'wix-storage';
import { getSessionToken, getSessionData } from 'public/session-manager';
import { validateCustomSession } from 'backend/portal-auth';
import { saveCommunicationPreferences, getCommunicationPreferences } from 'backend/comm-prefs-sync';

// ── Config ─────────────────────────────────────────────────────────────────────
// Change this if your HTML embed has a different element ID in the Wix Editor
const HTML_ELEMENT_ID = '#html1';
const AUTH_REQUIRED_MESSAGE = 'Please use the personal link from your text message or sign in to view or change your communication preferences.';

// ── State ──────────────────────────────────────────────────────────────────────
let sessionData = null;

// ── Helpers ────────────────────────────────────────────────────────────────────
function postToEmbed(message) {
    try {
        const node = $w(HTML_ELEMENT_ID);
        if (node && typeof node.postMessage === 'function') node.postMessage(message);
    } catch (e) { /* #html1 is not on this layout */ }
}

function formatDate(d) {
    if (!d) return '';
    try {
        return new Date(d).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (_) { return String(d); }
}

function sessionToken() {
    return getSessionToken() || '';
}

function linkTokenFromQuery() {
    try {
        const query = (wixLocation && wixLocation.query) || {};
        return String(query.cpt || query.linkToken || query.prefToken || '').trim();
    } catch (e) {
        return '';
    }
}

function authPayload(formData) {
    const payload = Object.assign({}, formData || {}, {
        sessionToken: sessionToken()
    });
    const linkToken = linkTokenFromQuery() || (formData && (formData.linkToken || formData.cpt)) || '';
    if (linkToken) payload.linkToken = linkToken;
    // Never let the client choose the person being updated.
    delete payload.personId;
    return payload;
}

function isAuthError(result) {
    return Boolean(result && (result.code === 'auth_required' || (result.error && result.error.indexOf('personal link') !== -1)));
}

function showAuthRequired(message) {
    postToEmbed({
        type: 'authRequired',
        message: message || AUTH_REQUIRED_MESSAGE
    });
}

// ── Load preferences from the backend and push to HTML embed ───────────────────
async function loadAndPushPreferences() {
    try {
        const result = await getCommunicationPreferences(authPayload());
        if (!result || result.ok !== true) {
            if (isAuthError(result)) showAuthRequired(result && result.error);
            return;
        }
        if (!result.data) return;

        const data = result.data;
        postToEmbed({
            type: 'loadPreferences',
            data: {
                firstName:     data.firstName || '',
                lastName:      data.lastName || '',
                phone:         data.phone || '',
                email:         data.email || '',
                caseNumber:    data.caseNumber || '',
                smsOptIn:      data.smsOptIn !== false,
                whatsappOptIn: data.whatsappOptIn !== false,
                telegramOptIn: data.telegramOptIn !== false,
                emailOptIn:    data.emailOptIn !== false,
                lastUpdated:   formatDate(data.lastUpdated)
            }
        });
    } catch (err) {
        console.error('[CommPrefs] loadAndPushPreferences error:', err);
    }
}

// ── Save preferences received from the HTML embed ──────────────────────────────
async function savePreferences(formData) {
    try {
        const result = await saveCommunicationPreferences(authPayload(formData));

        if (!result || result.ok !== true) {
            const message = isAuthError(result)
                ? (result.error || AUTH_REQUIRED_MESSAGE)
                : ((result && result.error) || 'Error saving preferences. Please try again.');
            if (isAuthError(result)) showAuthRequired(message);
            postToEmbed({
                type: 'saveError',
                message: message
            });
            return;
        }

        if (sessionData && sessionData.personId && result.prefs) {
            local.setItem(
                'commPrefs_' + sessionData.personId,
                JSON.stringify({
                    smsOptIn:      result.prefs.smsOptIn === true,
                    whatsappOptIn: result.prefs.whatsappOptIn === true,
                    telegramOptIn: result.prefs.telegramOptIn === true,
                    emailOptIn:    result.prefs.emailOptIn === true,
                    savedAt:       result.lastUpdated
                })
            );
        }

        postToEmbed({
            type: 'saveSuccess',
            data: { lastUpdated: formatDate(result.lastUpdated) }
        });
    } catch (err) {
        console.error('[CommPrefs] savePreferences error:', err);
        postToEmbed({
            type: 'saveError',
            message: 'Error saving preferences. Please try again.'
        });
    }
}

// ── Page Ready ─────────────────────────────────────────────────────────────────
$w.onReady(async function () {
    // Studio page SEO owns the title, description, and robots tag.

    // 1. Authenticate session
    const token = getSessionToken();
    if (token) {
        try {
            sessionData = await validateCustomSession(token);
        } catch (e) {
            console.warn('[CommPrefs] Session validation failed:', e.message);
        }
    }

    if (!sessionData) {
        sessionData = getSessionData();
    }

    // 2. Wire up the HTML embed message listener
    try {
        $w(HTML_ELEMENT_ID).onMessage(async (event) => {
            const msg = event.data;
            if (!msg || !msg.type) return;

            if (msg.type === 'savePreferences' && msg.data) {
                // All-channels-off is a valid withdrawal of consent.
                // The backend authorizes, validates, awaits the GAS consent gate, then persists.
                await savePreferences(msg.data);
            }
        });
    } catch (e) {
        console.warn('[CommPrefs] HTML element not found:', e.message);
    }

    // 3. Load existing preferences when a session or personal link is present.
    //    Anonymous visitors without either are asked to use their text link or sign in.
    const hasSession = Boolean(sessionData && (sessionData.valid === true || sessionData.personId));
    const hasLink = Boolean(linkTokenFromQuery());
    if (hasSession || hasLink) {
        await loadAndPushPreferences();
    } else {
        showAuthRequired(AUTH_REQUIRED_MESSAGE);
    }
});
