/**
 * AutoPostingEngine.js
 * 
 * "The Publisher"
 * 
 * Bridges SocialCalendar → SocialPublisher.
 * Reads upcoming Google Calendar events (scheduled posts) and fires them
 * to all 11 platforms at the right time — fully automated.
 *
 * Trigger: Every 5 minutes (installed via setupAutoPostingTrigger)
 *
 * Event Format (from SocialCalendar.js):
 *   Title: "Social Post [facebook, twitter, linkedin]"
 *   Description HTML:
 *     <b>Scheduled for:</b><br/>facebook, twitter<br/><br/>
 *     <b>Variants:</b><br/>
 *     <b>FACEBOOK:</b><br/>Post text here<br/><hr/>
 *     <b>TWITTER:</b><br/>Post text here<br/><hr/>
 */

// =============================================================================
// 1. MAIN ENGINE
// =============================================================================

/**
 * Triggered every 5 minutes. Checks for social posts scheduled in the next 
 * 7 minutes and publishes them.
 * 
 * Overlap window (7 min vs 5 min trigger) ensures we never miss a post.
 * Already-posted events are skipped via the [POSTED] prefix.
 */
function runAutoPostingEngine() {
    console.log('🚀 AutoPostingEngine: Starting scan...');

    var calendar = _getOrCreateSocialCalendar();
    if (!calendar) {
        console.error('AutoPostingEngine: Cannot access Social Calendar.');
        return;
    }

    var now = new Date();
    var windowEnd = new Date(now.getTime() + (7 * 60 * 1000)); // 7 minutes ahead

    var events = calendar.getEvents(now, windowEnd);
    if (events.length === 0) {
        console.log('AutoPostingEngine: No events in next 7 minutes.');
        return;
    }

    var publishedCount = 0;
    var failedCount = 0;

    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var title = event.getTitle();

        // Skip already-processed events
        if (title.indexOf('[POSTED]') > -1 || title.indexOf('[FAILED]') > -1 || title.indexOf('[PARTIAL]') > -1) {
            continue;
        }

        // Only process "Social Post [...]" events
        if (title.indexOf('Social Post [') === -1) {
            continue;
        }

        console.log('📤 AutoPostingEngine: Processing "' + title + '" scheduled for ' + event.getStartTime().toISOString());

        var result = publishCalendarEvent_(event);

        if (result.allSucceeded) {
            event.setTitle('[POSTED] ' + title);
            publishedCount++;
        } else if (result.someSucceeded) {
            event.setTitle('[PARTIAL] ' + title);
            publishedCount++;
            failedCount++;
        } else {
            event.setTitle('[FAILED] ' + title);
            failedCount++;
        }

        // Add result summary as event description append
        var existingDesc = event.getDescription() || '';
        event.setDescription(existingDesc + '<br/><br/><b>Auto-Post Results (' + new Date().toISOString() + '):</b><br/>' + result.summary);
    }

    // Slack notification summary
    if (publishedCount > 0 || failedCount > 0) {
        var slackMsg = '📡 *Auto-Posting Summary*\n' +
            '✅ Published: ' + publishedCount + '\n' +
            (failedCount > 0 ? '❌ Failed: ' + failedCount + '\n' : '') +
            'Time: ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

        try {
            if (typeof NotificationService !== 'undefined') {
                NotificationService.sendSlack('#social-posts', slackMsg);
            }
        } catch (e) {
            console.error('AutoPostingEngine: Slack notification failed: ' + e.message);
        }
    }

    console.log('✅ AutoPostingEngine: Done. Published: ' + publishedCount + ', Failed: ' + failedCount);
}

// =============================================================================
// 2. EVENT PARSER & PUBLISHER
// =============================================================================

/**
 * Parses a calendar event's description HTML and publishes to all platforms.
 * 
 * @param {CalendarApp.CalendarEvent} event
 * @returns {Object} { allSucceeded, someSucceeded, summary, results }
 */
function publishCalendarEvent_(event) {
    var description = event.getDescription() || '';
    var platforms = extractPlatformsFromTitle_(event.getTitle());
    var variants = extractVariantsFromDescription_(description);

    if (Object.keys(variants).length === 0) {
        return {
            allSucceeded: false,
            someSucceeded: false,
            summary: 'No content variants found in event description.',
            results: {}
        };
    }

    // Build the posts object that SocialPublisher.publishAll expects
    var posts = {};
    for (var j = 0; j < platforms.length; j++) {
        var platform = platforms[j].toLowerCase().trim();
        // Match platform to variant (case-insensitive)
        var content = variants[platform] || variants[platform.toUpperCase()] || null;
        if (content) {
            posts[platform] = content;
        } else {
            console.warn('AutoPostingEngine: No content variant found for platform "' + platform + '"');
        }
    }

    if (Object.keys(posts).length === 0) {
        return {
            allSucceeded: false,
            someSucceeded: false,
            summary: 'Platforms in title (' + platforms.join(', ') + ') had no matching content variants.',
            results: {}
        };
    }

    // Publish!
    console.log('AutoPostingEngine: Publishing to ' + Object.keys(posts).join(', ') + '...');
    var result = SocialPublisher.publishAll(posts);

    // Analyze results
    var succeeded = 0;
    var failed = 0;
    var summaryLines = [];
    var platformResults = result.results || {};

    for (var p in platformResults) {
        if (platformResults[p].success) {
            succeeded++;
            summaryLines.push('✅ ' + p);
        } else {
            failed++;
            summaryLines.push('❌ ' + p + ': ' + (platformResults[p].error || 'unknown error'));
        }
    }

    return {
        allSucceeded: failed === 0 && succeeded > 0,
        someSucceeded: succeeded > 0,
        summary: summaryLines.join('<br/>'),
        results: platformResults
    };
}

// =============================================================================
// 3. PARSERS
// =============================================================================

/**
 * Extract platforms from event title.
 * Title format: "Social Post [facebook, twitter, linkedin]"
 * 
 * @param {string} title
 * @returns {string[]}
 */
function extractPlatformsFromTitle_(title) {
    var match = title.match(/\[(.*?)\]/);
    if (match && match[1]) {
        return match[1].split(',').map(function (s) { return s.trim().toLowerCase(); });
    }
    return [];
}

/**
 * Extract content variants from event description HTML.
 * Description format:
 *   <b>FACEBOOK:</b><br/>Post text here<br/><hr/>
 *   <b>TWITTER:</b><br/>Post text here<br/><hr/>
 * 
 * @param {string} html - The event description HTML
 * @returns {Object} { facebook: "text", twitter: "text", ... }
 */
function extractVariantsFromDescription_(html) {
    var variants = {};

    // Remove the "Scheduled for:" section — everything before "Variants:"
    var variantsSplit = html.split('<b>Variants:</b>');
    var variantsHtml = variantsSplit.length > 1 ? variantsSplit[1] : html;

    // Also remove any "Auto-Post Results" section from previous runs
    var resultsIdx = variantsHtml.indexOf('<b>Auto-Post Results');
    if (resultsIdx > -1) {
        variantsHtml = variantsHtml.substring(0, resultsIdx);
    }

    // Split by <hr/> or <hr> to separate platform blocks
    var blocks = variantsHtml.split(/<hr\s*\/?>/gi);

    for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i].trim();
        if (!block) continue;

        // Match <b>PLATFORM:</b><br/>content
        var platformMatch = block.match(/<b>([A-Z_]+):<\/b>/i);
        if (platformMatch) {
            var platformName = platformMatch[1].toLowerCase();
            // Extract content after the platform label
            var contentStart = block.indexOf('</b>');
            if (contentStart > -1) {
                var content = block.substring(contentStart + 4);
                // Clean HTML tags
                content = content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim();
                if (content) {
                    variants[platformName] = content;
                }
            }
        }
    }

    return variants;
}

// =============================================================================
// 4. RETRY FAILED POSTS
// =============================================================================

/**
 * Scans for events with [FAILED] or [PARTIAL] prefix and retries them.
 * Run once daily at 6 AM ET.
 */
function retryFailedPosts() {
    console.log('🔄 AutoPostingEngine: Retry scan starting...');

    var calendar = _getOrCreateSocialCalendar();
    if (!calendar) return;

    // Look back 7 days for failed events
    var sevenDaysAgo = new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000));
    var now = new Date();

    var events = calendar.getEvents(sevenDaysAgo, now);
    var retried = 0;

    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var title = event.getTitle();

        if (title.indexOf('[FAILED]') === -1 && title.indexOf('[PARTIAL]') === -1) {
            continue;
        }

        // Strip prefix for reprocessing
        var cleanTitle = title.replace(/\[(FAILED|PARTIAL)\]\s*/g, '');
        event.setTitle(cleanTitle);

        console.log('🔄 Retrying: ' + cleanTitle);
        var result = publishCalendarEvent_(event);

        if (result.allSucceeded) {
            event.setTitle('[POSTED] ' + cleanTitle);
        } else if (result.someSucceeded) {
            event.setTitle('[PARTIAL-RETRY] ' + cleanTitle);
        } else {
            event.setTitle('[FAILED-RETRY] ' + cleanTitle);
        }

        retried++;
        Utilities.sleep(1000); // Rate limit between retries
    }

    console.log('🔄 AutoPostingEngine: Retry complete. Retried: ' + retried);
}

// =============================================================================
// 5. TRIGGER INSTALLERS
// =============================================================================

/**
 * Install the auto-posting trigger (every 5 minutes) and daily retry (6 AM ET).
 * Safe to call multiple times — cleans up old triggers first.
 */
function setupAutoPostingTrigger() {
    // Remove existing auto-posting triggers
    var allTriggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < allTriggers.length; i++) {
        var fn = allTriggers[i].getHandlerFunction();
        if (fn === 'runAutoPostingEngine' || fn === 'retryFailedPosts') {
            ScriptApp.deleteTrigger(allTriggers[i]);
            console.log('🗑️ Removed old trigger: ' + fn);
        }
    }

    // Install 5-minute posting engine
    ScriptApp.newTrigger('runAutoPostingEngine')
        .timeBased()
        .everyMinutes(5)
        .create();
    console.log('✅ Installed: runAutoPostingEngine (every 5 minutes)');

    // Install daily retry at 6 AM ET (UTC-5 = 11 AM UTC)
    ScriptApp.newTrigger('retryFailedPosts')
        .timeBased()
        .atHour(11)
        .everyDays(1)
        .inTimezone('America/New_York')
        .create();
    console.log('✅ Installed: retryFailedPosts (daily 6 AM ET)');

    return '✅ Auto-Posting Triggers Installed.';
}
