/**
 * registerWebhook.js
 * Shamrock Bail Bonds — Telegram Webhook Registration
 *
 * Registers, checks, and manages the Telegram Bot webhook.
 * The webhook points to the Wix HTTP function endpoint:
 *   POST https://www.shamrockbailbonds.biz/_functions/telegram-webhook
 *
 * Run these functions in the GAS editor:
 *   registerTelegramWebhook()  — register the webhook
 *   checkWebhookStatus()       — verify it's active
 *   removeWebhook()            — remove the webhook (for debugging)
 *
 * Date: 2026-02-25
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Get the webhook URL from config or use the default Wix endpoint.
 */
function _getWebhookUrl() {
    const props = PropertiesService.getScriptProperties();
    // Allow override via script property
    const custom = props.getProperty('TELEGRAM_WEBHOOK_URL');
    if (custom) return custom;
    // Default: Wix HTTP function endpoint
    const wixUrl = props.getProperty('WIX_SITE_URL') || 'https://www.shamrockbailbonds.biz';
    return wixUrl + '/_functions/telegram-webhook';
}

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register the Telegram Bot webhook.
 * Run this ONCE to make the bot listen for messages.
 */
function registerTelegramWebhook() {
    const bot = new TelegramBotAPI();
    const webhookUrl = _getWebhookUrl();

    Logger.log('🔗 Registering webhook: ' + webhookUrl);

    try {
        const result = bot.setWebhook(webhookUrl);
        Logger.log('✅ Webhook registered successfully');
        Logger.log('   URL: ' + webhookUrl);
        Logger.log('   Result: ' + JSON.stringify(result));

        // Verify it took
        Utilities.sleep(1000);
        const info = bot.getWebhookInfo();
        Logger.log('');
        Logger.log('📋 Webhook Info (verification):');
        Logger.log('   URL: ' + (info.url || 'NOT SET'));
        Logger.log('   Pending updates: ' + (info.pending_update_count || 0));
        Logger.log('   Last error: ' + (info.last_error_message || 'None'));
        Logger.log('   Last error date: ' + (info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : 'None'));

        return {
            success: true,
            webhookUrl: webhookUrl,
            info: info
        };
    } catch (e) {
        Logger.log('❌ Webhook registration failed: ' + e.message);
        return { success: false, error: e.message };
    }
}

// =============================================================================
// STATUS CHECK
// =============================================================================

/**
 * Check the current webhook status.
 * Returns the registered URL, pending updates, and any errors.
 */
function checkWebhookStatus() {
    const bot = new TelegramBotAPI();

    Logger.log('📋 Checking Telegram Webhook Status...');
    Logger.log('');

    try {
        const info = bot.getWebhookInfo();

        Logger.log('   URL: ' + (info.url || '❌ NOT SET'));
        Logger.log('   Has custom certificate: ' + (info.has_custom_certificate || false));
        Logger.log('   Pending updates: ' + (info.pending_update_count || 0));
        Logger.log('   Max connections: ' + (info.max_connections || 'default'));
        Logger.log('   Allowed updates: ' + JSON.stringify(info.allowed_updates || []));
        Logger.log('   Last error date: ' + (info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : 'None'));
        Logger.log('   Last error message: ' + (info.last_error_message || 'None'));
        Logger.log('   Last sync error date: ' + (info.last_synchronization_error_date ? new Date(info.last_synchronization_error_date * 1000).toISOString() : 'None'));

        if (!info.url) {
            Logger.log('');
            Logger.log('⚠️ Webhook is NOT registered. Run registerTelegramWebhook() to set it up.');
        } else if (info.last_error_message) {
            Logger.log('');
            Logger.log('⚠️ Webhook has errors. The endpoint may not be responding correctly.');
        } else {
            Logger.log('');
            Logger.log('✅ Webhook is active and healthy.');
        }

        // Also check bot identity
        const me = bot.getMe();
        Logger.log('');
        Logger.log('🤖 Bot Info:');
        Logger.log('   Username: @' + (me.username || 'unknown'));
        Logger.log('   Name: ' + (me.first_name || 'unknown'));
        Logger.log('   Can join groups: ' + (me.can_join_groups || false));
        Logger.log('   Supports inline: ' + (me.supports_inline_queries || false));

        return {
            webhook: info,
            bot: me,
            isActive: !!info.url,
            hasErrors: !!info.last_error_message
        };
    } catch (e) {
        Logger.log('❌ Failed to check webhook status: ' + e.message);
        return { error: e.message };
    }
}

// =============================================================================
// REMOVE WEBHOOK (for debugging)
// =============================================================================

/**
 * Remove the webhook (for debugging or switching to polling mode).
 */
function removeWebhook() {
    const bot = new TelegramBotAPI();

    Logger.log('🗑️ Removing Telegram webhook...');

    try {
        const result = bot.deleteWebhook();
        Logger.log('✅ Webhook removed successfully');
        Logger.log('   Result: ' + JSON.stringify(result));
        return { success: true };
    } catch (e) {
        Logger.log('❌ Webhook removal failed: ' + e.message);
        return { success: false, error: e.message };
    }
}

// =============================================================================
// BOTFATHER SETUP COMMANDS (Reference)
// =============================================================================

/**
 * Set the bot's command menu via API.
 * This replaces manual BotFather configuration.
 */
function setupBotCommands() {
    const bot = new TelegramBotAPI();

    Logger.log('📋 Setting bot commands...');

    const commands = [
        { command: 'start', description: '🍀 Welcome — Start here' },
        { command: 'bail', description: '🔓 Post bail — Start intake process' },
        { command: 'status', description: '📊 Check case or jail status' },
        { command: 'pay', description: '💳 Make a payment or check in' },
        { command: 'help', description: '❓ Get help and contact info' },
        { command: 'cancel', description: '🔄 Cancel current action' }
    ];

    try {
        const result = bot._request('setMyCommands', { commands: commands });
        Logger.log('✅ Bot commands set:');
        commands.forEach(function (cmd) {
            Logger.log('   /' + cmd.command + ' — ' + cmd.description);
        });
        return { success: true, commands: commands };
    } catch (e) {
        Logger.log('❌ Failed to set bot commands: ' + e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Configure the bot menu button to open the Mini App.
 * This makes the Mini App accessible from every chat.
 */
function setupBotMenuButton() {
    const bot = new TelegramBotAPI();
    const miniAppUrl = 'https://shamrock-telegram.netlify.app/';

    Logger.log('📱 Setting Mini App menu button...');

    try {
        const result = bot._request('setChatMenuButton', {
            menu_button: {
                type: 'web_app',
                text: '🍀 Open Portal',
                web_app: { url: miniAppUrl }
            }
        });
        Logger.log('✅ Menu button set → ' + miniAppUrl);
        return { success: true, url: miniAppUrl };
    } catch (e) {
        Logger.log('❌ Failed to set menu button: ' + e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Full bot setup — registers webhook, sets commands, and configures menu button.
 * Run this ONCE to fully activate the bot.
 */
function fullBotSetup() {
    Logger.log('═══════════════════════════════════════════');
    Logger.log('🍀 FULL BOT SETUP — Starting');
    Logger.log('═══════════════════════════════════════════');
    Logger.log('');

    const results = {};

    results.webhook = registerTelegramWebhook();
    Logger.log('');

    results.commands = setupBotCommands();
    Logger.log('');

    results.menuButton = setupBotMenuButton();
    Logger.log('');

    Logger.log('═══════════════════════════════════════════');
    Logger.log('🍀 FULL BOT SETUP — Complete');
    Logger.log('═══════════════════════════════════════════');

    return results;
}
