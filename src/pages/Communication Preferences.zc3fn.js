/**
 * Communication Preferences — Shamrock Bail Bonds Portal
 * Page ID: f870g
 *
 * This page uses an embedded HtmlComponent (#html1) for the form UI.
 * The HTML embed handles all visual rendering and user input.
 * This page code handles:
 *   1. Session authentication
 *   2. Loading existing preferences via the backend web method
 *   3. Receiving save requests via postMessage from the HTML embed
 *   4. Calling the backend to validate, await the GAS consent gate, and persist
 *   5. Sending success/error responses back to the HTML embed
 *
 * Persistence and GAS sync live in backend/comm-prefs-sync.jsw.
 * The HTML embed element ID should be: #html1
 */

import { local } from 'wix-storage';
import { getSessionToken, getSessionData } from 'public/session-manager';
import { validateCustomSession } from 'backend/portal-auth';
import { saveCommunicationPreferences, getCommunicationPreferences } from 'backend/comm-prefs-sync';

// ── Config ─────────────────────────────────────────────────────────────────────
// Change this if your HTML embed has a different element ID in the Wix Editor
const HTML_ELEMENT_ID = '#html1';

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

// ── Load preferences from the backend and push to HTML embed ───────────────────
async function loadAndPushPreferences() {
    try {
        const result = await getCommunicationPreferences({ sessionToken: sessionToken() });
        if (!result || !result.ok || !result.data) return;

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
        const result = await saveCommunicationPreferences(Object.assign({}, formData, {
            sessionToken: sessionToken()
        }));

        if (!result || result.ok !== true) {
            postToEmbed({
                type: 'saveError',
                message: (result && result.error) || 'Error saving preferences. Please try again.'
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

    // Note: We don't force-redirect if not logged in —
    // the form still works for anonymous users contacting us.

    // 2. Wire up the HTML embed message listener
    try {
        $w(HTML_ELEMENT_ID).onMessage(async (event) => {
            const msg = event.data;
            if (!msg || !msg.type) return;

            if (msg.type === 'savePreferences' && msg.data) {
                // All-channels-off is a valid withdrawal of consent.
                // The backend validates, awaits the GAS consent gate, then persists.
                await savePreferences(msg.data);
            }
        });
    } catch (e) {
        console.warn('[CommPrefs] HTML element not found:', e.message);
    }

    // 3. Load existing preferences if authenticated
    if (sessionData && sessionData.personId) {
        await loadAndPushPreferences();
    }
});
