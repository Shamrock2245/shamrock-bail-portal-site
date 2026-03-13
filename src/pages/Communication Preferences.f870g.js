/**
 * Communication Preferences — Shamrock Bail Bonds Portal
 * Page ID: f870g
 *
 * This page uses an embedded HtmlComponent (#html1) for the form UI.
 * The HTML embed handles all visual rendering and user input.
 * This page code handles:
 *   1. Session authentication
 *   2. Loading existing preferences from 'Portal Users' CMS
 *   3. Receiving save requests via postMessage from the HTML embed
 *   4. Writing updated preferences to the CMS
 *   5. Sending success/error responses back to the HTML embed
 *
 * The HTML embed element ID should be: #html1
 * (Change the ID below if you named it differently in the Wix Editor)
 */

import wixData from 'wix-data';
import wixWindow from 'wix-window';
import { local } from 'wix-storage';
import { getSessionToken, getSessionData } from 'public/session-manager';
import { validateCustomSession } from 'backend/portal-auth';
import { syncCommPrefsToGas } from 'backend/comm-prefs-sync';

// ── Config ─────────────────────────────────────────────────────────────────────
// Change this if your HTML embed has a different element ID in the Wix Editor
const HTML_ELEMENT_ID = '#html1';

// ── State ──────────────────────────────────────────────────────────────────────
let sessionData = null;
let userRecord = null;

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(d) {
    if (!d) return '';
    try {
        return new Date(d).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (_) { return String(d); }
}

// ── Load preferences from CMS and push to HTML embed ───────────────────────────
async function loadAndPushPreferences() {
    if (!sessionData || !sessionData.personId) return;

    try {
        const results = await wixData.query('Portal Users')
            .eq('personId', sessionData.personId)
            .limit(1)
            .find({ suppressAuth: true });

        if (results.items.length === 0) return;

        userRecord = results.items[0];

        // Send existing data into the HTML embed to pre-fill the form
        const lastUpdated = userRecord.prefsUpdatedAt || userRecord.updatedAt;
        $w(HTML_ELEMENT_ID).postMessage({
            type: 'loadPreferences',
            data: {
                firstName:    userRecord.firstName || '',
                lastName:     userRecord.lastName || '',
                phone:        userRecord.phone || '',
                email:        userRecord.email || '',
                caseNumber:   userRecord.caseNumber || userRecord.bookingNumber || '',
                smsOptIn:     userRecord.smsOptIn !== false,
                whatsappOptIn: userRecord.whatsappOptIn !== false,
                telegramOptIn: userRecord.telegramOptIn !== false,
                emailOptIn:   userRecord.emailOptIn !== false,
                lastUpdated:  formatDate(lastUpdated)
            }
        });

    } catch (err) {
        console.error('[CommPrefs] loadAndPushPreferences error:', err);
    }
}

// ── Save preferences received from the HTML embed ──────────────────────────────
async function savePreferences(formData) {
    try {
        // If we already have a record, update it; otherwise create a new one
        const now = new Date();
        const isoNow = now.toISOString();

        if (userRecord) {
            // Update existing record
            const updated = Object.assign({}, userRecord, {
                firstName:      formData.firstName,
                lastName:       formData.lastName,
                phone:          formData.phone,
                email:          formData.email,
                caseNumber:     formData.caseNumber,
                smsOptIn:       formData.smsOptIn,
                whatsappOptIn:  formData.whatsappOptIn,
                telegramOptIn:  formData.telegramOptIn,
                emailOptIn:     formData.emailOptIn,
                prefsUpdatedAt: isoNow,
                updatedAt:      now
            });

            await wixData.update('Portal Users', updated, { suppressAuth: true });
            userRecord = updated;
        } else {
            // Create new record
            const newRecord = {
                personId:       sessionData?.personId || '',
                firstName:      formData.firstName,
                lastName:       formData.lastName,
                phone:          formData.phone,
                email:          formData.email,
                caseNumber:     formData.caseNumber,
                smsOptIn:       formData.smsOptIn,
                whatsappOptIn:  formData.whatsappOptIn,
                telegramOptIn:  formData.telegramOptIn,
                emailOptIn:     formData.emailOptIn,
                prefsUpdatedAt: isoNow,
                createdAt:      now,
                updatedAt:      now
            };

            userRecord = await wixData.insert('Portal Users', newRecord, { suppressAuth: true });
        }

        // Cache locally for fast-path checks
        if (sessionData?.personId) {
            local.setItem(
                'commPrefs_' + sessionData.personId,
                JSON.stringify({
                    smsOptIn:      formData.smsOptIn,
                    whatsappOptIn: formData.whatsappOptIn,
                    telegramOptIn: formData.telegramOptIn,
                    emailOptIn:    formData.emailOptIn,
                    savedAt:       isoNow
                })
            );
        }

        // Tell the HTML embed save succeeded
        $w(HTML_ELEMENT_ID).postMessage({
            type: 'saveSuccess',
            data: { lastUpdated: formatDate(isoNow) }
        });

        // ── Sync to GAS backend (fire-and-forget) ──────────────────────────
        // This writes prefs to the CommPrefs Google Sheet so TheCloser,
        // CourtReminders, etc. can check opt-in before sending messages.
        syncCommPrefsToGas({
            phone:          formData.phone,
            firstName:      formData.firstName,
            lastName:       formData.lastName,
            email:          formData.email,
            smsOptIn:       formData.smsOptIn,
            whatsappOptIn:  formData.whatsappOptIn,
            telegramOptIn:  formData.telegramOptIn,
            emailOptIn:     formData.emailOptIn
        }).catch(err => console.warn('[CommPrefs] GAS sync failed (non-fatal):', err));

    } catch (err) {
        console.error('[CommPrefs] savePreferences error:', err);
        $w(HTML_ELEMENT_ID).postMessage({
            type: 'saveError',
            message: 'Error saving preferences. Please try again.'
        });
    }
}

// ── Page Ready ─────────────────────────────────────────────────────────────────
$w.onReady(async function () {
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
