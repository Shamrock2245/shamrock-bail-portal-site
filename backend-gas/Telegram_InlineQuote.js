/**
 * ============================================================================
 * Telegram_InlineQuote.js
 * ============================================================================
 * Inline Bot for Instant Bail Quotes via @ShamrockBail_bot
 * 
 * USAGE:
 *   In any Telegram chat, type: @ShamrockBail_bot 5000 2
 *   → Shows a quote card: "Bond: $5,000 | 2 Charges | Premium: $500"
 * 
 * FLORIDA BAIL PREMIUM RULES:
 *   - $100 minimum premium per charge
 *   - 10% of bail face amount if bail ≥ $1,000
 *   - Whichever is GREATER applies
 *   - Transfer fee: $100 for bonds outside Lee/Charlotte County
 *   - Transfer fee MAY be waived on most bonds > $25,000, at Shamrock's discretion (never guaranteed)
 *   - Lee & Charlotte County: NEVER a transfer fee (home counties)
 * 
 * DEPENDS ON:
 *   - Telegram_API.js (TelegramBotAPI class)
 * ============================================================================
 */

// ============================================================================
// PREMIUM CALCULATION ENGINE
// ============================================================================

/**
 * Calculate bail bond premium per Florida regulations + Shamrock policy.
 * 
 * @param {number} bailAmount  - Total bail/bond face amount (penal sum)
 * @param {number} chargeCount - Number of charges on the bond
 * @param {string} county      - County name (for transfer fee logic)
 * @returns {object} { premium, transferFee, totalDue, breakdown }
 */
function calculatePremium(bailAmount, chargeCount, county) {
    bailAmount = parseFloat(bailAmount) || 0;
    chargeCount = parseInt(chargeCount) || 1;
    county = (county || '').trim().toLowerCase();

    // Rule 1: $100 minimum per charge
    var perChargePremium = chargeCount * 100;

    // Rule 2: 10% of face amount
    var percentPremium = bailAmount * 0.10;

    // The premium is the GREATER of the two
    var premium = Math.max(perChargePremium, percentPremium);

    // If all charges are under $1,000 each AND per-charge wins,
    // still use per-charge minimum
    // (This is inherently handled by Math.max above)

    // Transfer fee logic
    var transferFee = 0;
    var homeCounties = ['lee', 'charlotte'];
    var isHomeCounty = homeCounties.indexOf(county) !== -1;

    if (!isHomeCounty) {
        // Standard transfer fee applies. On most bonds over $25,000 it MAY be
        // waived at Shamrock's discretion, so the estimate still includes it.
        transferFee = 100;
    }
    // Lee & Charlotte: NEVER a transfer fee

    var totalDue = premium + transferFee;

    // Build human-readable breakdown
    var breakdown = [];
    if (percentPremium > perChargePremium) {
        breakdown.push('Premium: 10% of $' + _formatMoney(bailAmount) + ' = $' + _formatMoney(premium));
    } else {
        breakdown.push('Premium: ' + chargeCount + ' charge' + (chargeCount > 1 ? 's' : '') + ' × $100 = $' + _formatMoney(premium));
    }
    if (transferFee > 0) {
        breakdown.push('Transfer Fee: $' + _formatMoney(transferFee));
        if (bailAmount > 25000) {
            breakdown.push('(Transfer fee may be waived on most bonds over $25,000, at our discretion.)');
        }
    }
    breakdown.push('Total Due: $' + _formatMoney(totalDue));

    return {
        premium: premium,
        transferFee: transferFee,
        totalDue: totalDue,
        perChargePremium: perChargePremium,
        percentPremium: percentPremium,
        isHomeCounty: isHomeCounty,
        breakdown: breakdown
    };
}

// ============================================================================
// INLINE QUERY HANDLER
// ============================================================================

/**
 * Handle an inline_query from Telegram.
 * Expected query format: "<bail_amount> <charge_count> [county]"
 * Examples: "5000 2", "10000 3 collier", "25000 1 lee"
 * 
 * @param {object} inlineQuery - Telegram inline_query object { id, query, from }
 */
function handleInlineQuery(inlineQuery) {
    var queryId = inlineQuery.id;
    var queryText = (inlineQuery.query || '').trim();

    // Log the query for analytics
    if (typeof logBotEvent === 'function') {
        logBotEvent('inline_query', String(inlineQuery.from && inlineQuery.from.id || ''), {
            query: queryText
        });
    }

    // If empty query, show help
    if (!queryText) {
        var helpResults = [{
            type: 'article',
            id: 'help',
            title: '🍀 Shamrock Bail Bond Calculator',
            description: 'Type: [bail amount] [# of charges] [county]\nExample: 5000 2 lee',
            input_message_content: {
                message_text: '🍀 *Shamrock Bail Bond Calculator*\n\nType `@ShamrockBail_bot [bail amount] [charges] [county]`\n\nExample: `@ShamrockBail_bot 5000 2 lee`',
                parse_mode: 'Markdown'
            }
        }];

        var bot = new TelegramBotAPI();
        bot.answerInlineQuery(queryId, helpResults, { cache_time: 300 });
        return;
    }

    // Parse query: "<amount> <charges> [county]"
    var parts = queryText.split(/\s+/);
    var bailAmount = parseFloat(parts[0]) || 0;
    var chargeCount = parseInt(parts[1]) || 1;
    var county = parts.slice(2).join(' ') || '';

    if (bailAmount <= 0) {
        _answerWithError(queryId, 'Please enter a valid bail amount. Example: 5000 2');
        return;
    }

    // Calculate premium
    var result = calculatePremium(bailAmount, chargeCount, county);

    // Build the inline result card
    var countyLabel = county ? (' — ' + _titleCase(county) + ' County') : '';
    var title = '💰 Premium: $' + _formatMoney(result.totalDue) + countyLabel;
    var description = 'Bond: $' + _formatMoney(bailAmount) + ' | ' + chargeCount + ' charge' + (chargeCount > 1 ? 's' : '');
    if (result.transferFee > 0) {
        description += ' | +$' + _formatMoney(result.transferFee) + ' transfer';
    }

    var messageText = '🍀 *Shamrock Bail Bonds — Quote Estimate*\n\n'
        + '📋 *Bond Amount:* $' + _formatMoney(bailAmount) + '\n'
        + '⚖️ *Charges:* ' + chargeCount + '\n';

    if (county) {
        messageText += '📍 *County:* ' + _titleCase(county) + '\n';
    }

    messageText += '\n' + result.breakdown.join('\n') + '\n\n'
        + '_This is an estimate. Final premium may vary based on case details._\n'
        + '📞 Call (239) 332-2245 or message us to get started!\n'
        + '🍀 Available 24/7';

    var results = [{
        type: 'article',
        id: 'quote_' + Date.now(),
        title: title,
        description: description,
        input_message_content: {
            message_text: messageText,
            parse_mode: 'Markdown'
        },
        thumb_url: 'https://www.shamrockbailbonds.biz/shamrock-logo.png'
    }];

    var bot = new TelegramBotAPI();
    bot.answerInlineQuery(queryId, results, { cache_time: 10 });
}

// ============================================================================
// HELPERS
// ============================================================================

function _answerWithError(queryId, errorMsg) {
    var results = [{
        type: 'article',
        id: 'error_' + Date.now(),
        title: '⚠️ Invalid Input',
        description: errorMsg,
        input_message_content: {
            message_text: '⚠️ ' + errorMsg + '\n\nUsage: `@ShamrockBail_bot [bail amount] [charges] [county]`\nExample: `@ShamrockBail_bot 5000 2 lee`',
            parse_mode: 'Markdown'
        }
    }];
    var bot = new TelegramBotAPI();
    bot.answerInlineQuery(queryId, results, { cache_time: 5 });
}

function _formatMoney(amount) {
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function _titleCase(str) {
    return str.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}
