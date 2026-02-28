/**
 * TokenRefreshService.js
 * Shamrock Bail Bonds — Automated OAuth Token Refresh
 *
 * Keeps all social platform tokens fresh so posts never fail due to expired tokens.
 *
 * Token Expiry Cheat Sheet:
 *   Google (GBP/YouTube) — 1 hour   → refresh every 50 min
 *   TikTok               — 24 hours → refresh every 23 hours
 *   Facebook/Instagram    — 60 days  → refresh every 50 days
 *   Threads               — 60 days  → refresh every 50 days
 *   LinkedIn              — 60 days  → refresh every 50 days
 *   Twitter (OAuth 1.0a)  — Never    → no refresh needed
 *   Telegram (Bot Token)  — Never    → no refresh needed
 *
 * Trigger Strategy:
 *   ⏱  Every 50 minutes  → refreshGoogleTokens()   (GBP + YouTube)
 *   ⏱  Daily at 3 AM     → refreshLongLivedTokens() (TikTok, FB, Threads, LinkedIn)
 *
 * Date: 2026-02-27
 */

// =============================================================================
// 1. GOOGLE TOKENS (GBP + YouTube) — Hourly Refresh
// =============================================================================

/**
 * Refreshes GBP and YouTube access tokens using stored refresh tokens.
 * Called every 30 minutes by trigger. Safe to call even if tokens are fresh.
 */
function refreshGoogleTokens() {
    var props = PropertiesService.getScriptProperties();
    var results = { timestamp: new Date().toISOString(), refreshed: [], errors: [] };

    var clientId = props.getProperty('GOOGLE_OAUTH_CLIENT_ID');
    var clientSecret = props.getProperty('GOOGLE_OAUTH_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
        console.error('❌ Cannot refresh Google tokens: GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET missing');
        results.errors.push({ platform: 'google', error: 'Missing OAuth credentials' });
        return results;
    }

    // Refresh both GBP and YouTube using the same Google OAuth endpoint
    ['GBP', 'YOUTUBE'].forEach(function (platform) {
        var refreshToken = props.getProperty(platform + '_REFRESH_TOKEN');
        if (!refreshToken) {
            results.errors.push({ platform: platform.toLowerCase(), error: 'No refresh token stored' });
            return;
        }

        try {
            var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
                method: 'post',
                contentType: 'application/x-www-form-urlencoded',
                payload: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                },
                muteHttpExceptions: true
            });

            var body = JSON.parse(response.getContentText());
            if (body.access_token) {
                props.setProperty(platform + '_ACCESS_TOKEN', body.access_token);
                if (body.refresh_token) {
                    props.setProperty(platform + '_REFRESH_TOKEN', body.refresh_token);
                }
                results.refreshed.push(platform.toLowerCase());
                console.log('✅ ' + platform + ' token refreshed');
            } else {
                results.errors.push({ platform: platform.toLowerCase(), error: response.getContentText().substring(0, 200) });
                console.error('❌ ' + platform + ' refresh failed: ' + response.getContentText().substring(0, 200));
            }
        } catch (e) {
            results.errors.push({ platform: platform.toLowerCase(), error: e.message });
            console.error('❌ ' + platform + ' token refresh error: ' + e.message);
        }
    });

    // Log summary
    if (results.errors.length > 0) {
        console.warn('⚠️ Token refresh completed with errors:', JSON.stringify(results));
    } else {
        console.log('🎉 All Google tokens refreshed successfully');
    }

    return results;
}


// =============================================================================
// 2. LONG-LIVED TOKENS (TikTok, FB, Threads, LinkedIn) — Daily Refresh
// =============================================================================

/**
 * Refreshes long-lived tokens for platforms with 24h-60 day expiry.
 * Called daily at 3 AM. Each platform handles its own refresh logic.
 */
function refreshLongLivedTokens() {
    var props = PropertiesService.getScriptProperties();
    var results = { timestamp: new Date().toISOString(), refreshed: [], skipped: [], errors: [] };

    // ── TikTok (24-hour expiry) ──────────────────────────────────────
    try {
        var tikTokRefresh = props.getProperty('TIKTOK_REFRESH_TOKEN');
        var tikTokClientKey = props.getProperty('TIKTOK_CLIENT_KEY');
        var tikTokClientSecret = props.getProperty('TIKTOK_CLIENT_SECRET');

        if (tikTokRefresh && tikTokClientKey && tikTokClientSecret) {
            var ttResponse = UrlFetchApp.fetch('https://open.tiktokapis.com/v2/oauth/token/', {
                method: 'post',
                contentType: 'application/x-www-form-urlencoded',
                payload: {
                    client_key: tikTokClientKey,
                    client_secret: tikTokClientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: tikTokRefresh
                },
                muteHttpExceptions: true
            });
            var ttBody = JSON.parse(ttResponse.getContentText());
            if (ttBody.access_token) {
                props.setProperty('TIKTOK_ACCESS_TOKEN', ttBody.access_token);
                if (ttBody.refresh_token) {
                    props.setProperty('TIKTOK_REFRESH_TOKEN', ttBody.refresh_token);
                }
                results.refreshed.push('tiktok');
                console.log('✅ TikTok token refreshed');
            } else {
                results.errors.push({ platform: 'tiktok', error: 'No access_token in response', detail: ttResponse.getContentText().substring(0, 200) });
                console.error('❌ TikTok refresh failed: ' + ttResponse.getContentText().substring(0, 200));
            }
        } else {
            results.skipped.push({ platform: 'tiktok', reason: 'Missing TIKTOK_REFRESH_TOKEN or client credentials' });
        }
    } catch (e) {
        results.errors.push({ platform: 'tiktok', error: e.message });
        console.error('❌ TikTok token refresh error: ' + e.message);
    }

    // ── Facebook / Instagram (60-day Page Access Token) ───────────────
    try {
        var fbPageToken = props.getProperty('FB_PAGE_ACCESS_TOKEN');
        var fbAppId = props.getProperty('FB_APP_ID');
        var fbAppSecret = props.getProperty('FB_APP_SECRET');

        if (fbPageToken && fbAppId && fbAppSecret) {
            // Exchange current long-lived token for a new long-lived token
            var fbUrl = 'https://graph.facebook.com/v21.0/oauth/access_token'
                + '?grant_type=fb_exchange_token'
                + '&client_id=' + fbAppId
                + '&client_secret=' + fbAppSecret
                + '&fb_exchange_token=' + fbPageToken;
            var fbResponse = UrlFetchApp.fetch(fbUrl, { muteHttpExceptions: true });
            var fbBody = JSON.parse(fbResponse.getContentText());
            if (fbBody.access_token) {
                props.setProperty('FB_PAGE_ACCESS_TOKEN', fbBody.access_token);
                results.refreshed.push('facebook');
                results.refreshed.push('instagram'); // IG uses the same FB Page Token
                console.log('✅ Facebook/Instagram token refreshed (valid ~60 days)');
            } else {
                results.errors.push({ platform: 'facebook', error: 'No access_token in response', detail: fbResponse.getContentText().substring(0, 200) });
            }
        } else {
            results.skipped.push({ platform: 'facebook', reason: 'Missing FB_PAGE_ACCESS_TOKEN or app credentials' });
        }
    } catch (e) {
        results.errors.push({ platform: 'facebook', error: e.message });
        console.error('❌ Facebook token refresh error: ' + e.message);
    }

    // ── Threads (60-day long-lived token) ─────────────────────────────
    try {
        var threadsToken = props.getProperty('THREADS_ACCESS_TOKEN');

        if (threadsToken) {
            // Threads uses the same Graph API long-lived token refresh
            var thUrl = 'https://graph.threads.net/refresh_access_token'
                + '?grant_type=th_exchange_token'
                + '&access_token=' + threadsToken;
            var thResponse = UrlFetchApp.fetch(thUrl, { muteHttpExceptions: true });
            var thBody = JSON.parse(thResponse.getContentText());
            if (thBody.access_token) {
                props.setProperty('THREADS_ACCESS_TOKEN', thBody.access_token);
                results.refreshed.push('threads');
                console.log('✅ Threads token refreshed (valid ~60 days)');
            } else {
                results.errors.push({ platform: 'threads', error: 'Refresh failed', detail: thResponse.getContentText().substring(0, 200) });
            }
        } else {
            results.skipped.push({ platform: 'threads', reason: 'No THREADS_ACCESS_TOKEN stored' });
        }
    } catch (e) {
        results.errors.push({ platform: 'threads', error: e.message });
        console.error('❌ Threads token refresh error: ' + e.message);
    }

    // ── LinkedIn (60-day access token, 1-year refresh token) ──────────
    try {
        var liRefresh = props.getProperty('LINKEDIN_REFRESH_TOKEN');
        var liClientId = props.getProperty('LINKEDIN_CLIENT_ID');
        var liClientSecret = props.getProperty('LINKEDIN_CLIENT_SECRET');

        if (liRefresh && liClientId && liClientSecret) {
            var liResponse = UrlFetchApp.fetch('https://www.linkedin.com/oauth/v2/accessToken', {
                method: 'post',
                contentType: 'application/x-www-form-urlencoded',
                payload: {
                    grant_type: 'refresh_token',
                    refresh_token: liRefresh,
                    client_id: liClientId,
                    client_secret: liClientSecret
                },
                muteHttpExceptions: true
            });
            var liBody = JSON.parse(liResponse.getContentText());
            if (liBody.access_token) {
                props.setProperty('LINKEDIN_ACCESS_TOKEN', liBody.access_token);
                if (liBody.refresh_token) {
                    props.setProperty('LINKEDIN_REFRESH_TOKEN', liBody.refresh_token);
                }
                results.refreshed.push('linkedin');
                console.log('✅ LinkedIn token refreshed');
            } else {
                results.errors.push({ platform: 'linkedin', error: 'Refresh failed', detail: liResponse.getContentText().substring(0, 200) });
            }
        } else {
            results.skipped.push({ platform: 'linkedin', reason: 'Missing LINKEDIN_REFRESH_TOKEN or client credentials' });
        }
    } catch (e) {
        results.errors.push({ platform: 'linkedin', error: e.message });
        console.error('❌ LinkedIn token refresh error: ' + e.message);
    }

    // ── Summary ──────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════');
    console.log('🔄 LONG-LIVED TOKEN REFRESH SUMMARY');
    console.log('  Refreshed: ' + (results.refreshed.length > 0 ? results.refreshed.join(', ') : 'none'));
    console.log('  Skipped:   ' + (results.skipped.length > 0 ? results.skipped.map(function (s) { return s.platform; }).join(', ') : 'none'));
    console.log('  Errors:    ' + (results.errors.length > 0 ? results.errors.map(function (e) { return e.platform; }).join(', ') : 'none'));
    console.log('═══════════════════════════════════════════');

    return results;
}



// =============================================================================
// 4. TRIGGER INSTALLERS
// =============================================================================

/**
 * Installs an every-50-minute trigger for Google token refresh.
 * Safe to run multiple times (deduplicates).
 */
function installGoogleTokenRefreshTrigger() {
    // Remove existing triggers for this function
    ScriptApp.getProjectTriggers().forEach(function (t) {
        if (t.getHandlerFunction() === 'refreshGoogleTokens') {
            ScriptApp.deleteTrigger(t);
        }
    });

    ScriptApp.newTrigger('refreshGoogleTokens')
        .timeBased()
        .everyMinutes(30)  // Every 30 min (well within 1-hour expiry)
        .create();

    console.log('⏱ Installed trigger: refreshGoogleTokens every 30 minutes');
}

/**
 * Installs a daily 3 AM trigger for long-lived token refresh.
 * Safe to run multiple times (deduplicates).
 */
function installLongLivedTokenRefreshTrigger() {
    // Remove existing triggers for this function
    ScriptApp.getProjectTriggers().forEach(function (t) {
        if (t.getHandlerFunction() === 'refreshLongLivedTokens') {
            ScriptApp.deleteTrigger(t);
        }
    });

    ScriptApp.newTrigger('refreshLongLivedTokens')
        .timeBased()
        .atHour(3)
        .everyDays(1)
        .create();

    console.log('⏱ Installed trigger: refreshLongLivedTokens daily at 3 AM');
}

/**
 * MASTER: Install all token refresh triggers at once.
 * Run this once after deployment.
 */
function installAllTokenRefreshTriggers() {
    console.log('═══════════════════════════════════════════');
    console.log('🔧 INSTALLING ALL TOKEN REFRESH TRIGGERS');
    console.log('═══════════════════════════════════════════');

    installGoogleTokenRefreshTrigger();
    installLongLivedTokenRefreshTrigger();

    console.log('');
    console.log('✅ All token refresh triggers installed:');
    console.log('   • Google (GBP/YouTube): every 30 minutes');
    console.log('   • TikTok/FB/Threads/LinkedIn: daily at 3 AM');
    console.log('');
    console.log('No-refresh platforms (tokens never expire):');
    console.log('   • Twitter/X: OAuth 1.0a keys');
    console.log('   • Telegram: Bot token');
}
