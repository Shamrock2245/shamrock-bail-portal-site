/**
 * IdempotencyGuard.js
 * Shamrock Bail Bonds — Idempotency Protection
 *
 * Prevents duplicate processing of external events using CacheService.
 * Guards: SignNow webhooks, Twilio SMS, ElevenLabs post-call,
 *         ElevenLabs mid-call tools, Drive file uploads, Telegram messages.
 *
 * TTL: 6 hours (21600 seconds) — covers retry windows for all providers.
 * Store: GAS CacheService (ScriptCache) — 100KB limit, auto-evicts.
 *
 * Usage:
 *   if (IdempotencyGuard.isDuplicate('signnow', payload.document_id)) {
 *     return { skipped: true, reason: 'duplicate' };
 *   }
 *
 * Date: 2026-03-04
 */

// =============================================================================
// IDEMPOTENCY GUARD
// =============================================================================

var IdempotencyGuard = {

    /**
     * Check if an event has already been processed.
     * If NOT a duplicate, marks it as processed (claim-on-check).
     *
     * @param {string} namespace - Category (e.g. 'signnow', 'twilio', 'telegram')
     * @param {string} eventId   - Unique event identifier
     * @param {number} [ttlSeconds=21600] - Time-to-live in seconds (default 6h)
     * @returns {boolean} true if already processed (SKIP), false if new (PROCESS)
     */
    isDuplicate: function (namespace, eventId, ttlSeconds) {
        if (!eventId) return false; // No event ID = can't dedup, allow through

        var key = 'IDEMP_' + namespace + '_' + String(eventId).substring(0, 200);
        var cache = CacheService.getScriptCache();

        try {
            if (cache.get(key)) {
                Logger.log('⚡ Idempotency: DUPLICATE detected [' + namespace + '] id=' + eventId);
                return true;
            }
            // Claim the key immediately
            cache.put(key, '1', ttlSeconds || 21600);
            return false;
        } catch (e) {
            // CacheService failures should never block processing
            Logger.log('⚠️ IdempotencyGuard cache error (non-fatal): ' + e.message);
            return false;
        }
    },

    /**
     * Generate a composite idempotency key from multiple fields.
     * Useful for tool calls where there's no single unique ID.
     *
     * @param {...string} parts - Fields to combine
     * @returns {string} A deterministic key
     */
    compositeKey: function () {
        var parts = Array.prototype.slice.call(arguments);
        return parts.map(function (p) { return String(p || '').trim(); }).join('|');
    }
};
