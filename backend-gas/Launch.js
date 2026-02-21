/**
 * LAUNCH SCRIPT
 * Run this function to finalize the configuration of your Web App.
 */
function launchApp_v1() {
    // Read the live deployed URL from ScriptApp — never hardcode this.
    const WEB_APP_URL = ScriptApp.getService().getUrl();
    const ui = console;

    ui.log('🚀 INITIALIZING SHAMROCK BAIL BONDS APP...');
    ui.log('------------------------------------------------');

    // 1. Save Webhook URL
    ui.log('💾 Saving Webhook URL...');
    PropertiesService.getScriptProperties().setProperty('WEBHOOK_URL', WEB_APP_URL);

    // 2. Register with SignNow
    ui.log('🔗 Registering SignNow Webhook...');
    try {
        const hookResult = SN_registerCompletionWebhook(WEB_APP_URL);
        if (hookResult.success) {
            ui.log('✅ SignNow Webhook Registered Successfully!');
        } else {
            ui.error('❌ SignNow Webhook Registration Failed: ' + JSON.stringify(hookResult));
            ui.warn('(You may need to delete old webhooks first using SN_listRegisteredWebhooks)');
        }
    } catch (e) {
        ui.error('❌ Error calling SN_registerCompletionWebhook: ' + e.message);
    }

    // 3. Run Diagnostics
    ui.log('\n🏥 RUNNING FINAL DIAGNOSTICS...');
    try {
        runSystemDiagnostics();
    } catch (e) {
        ui.error('❌ Diagnostics crashed: ' + e.message);
    }

    ui.log('\n✨ LAUNCH SEQUENCE COMPLETE');
}

/**
 * CLEANUP UTILITY
 * Run this if you need to remove old/duplicate webhooks.
 */
function cleanupWebhooks() {
    const ui = console;
    ui.log('🧹 CLEANING UP OLD WEBHOOKS...');

    const list = SN_listRegisteredWebhooks();
    if (!list.success || !list.data || !list.data.data) {
        ui.error('❌ Could not list webhooks: ' + JSON.stringify(list));
        return;
    }

    const hooks = list.data.data;
    ui.log(`Found ${hooks.length} webhooks.`);

    hooks.forEach(function (hook) {
        ui.log(`🗑 Deleting webhook: ${hook.id} (${hook.event})`);
        const res = SN_deleteWebhook(hook.id);
        if (res.success) {
            ui.log('   ✅ Deleted.');
        } else {
            ui.warn('   ⚠️ Failed to delete: ' + JSON.stringify(res));
        }
    });

    ui.log('✨ Cleanup Complete.');
}
