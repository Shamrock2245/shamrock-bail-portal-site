function forceUpdateConfig() {
    const props = PropertiesService.getScriptProperties();

    // 1. Set the API Key to a known, secure value
    const NEW_API_KEY = 'shamrock-secure-2026';
    props.setProperty('GAS_API_KEY', NEW_API_KEY);

    // 2. Ensure other critical props are set (fallbacks)
    if (!props.getProperty('WIX_SITE_URL')) {
        props.setProperty('WIX_SITE_URL', 'https://www.shamrockbailbonds.biz');
    }

    console.log('✅ CONFIG UPDATED SUCCESSFULLY');
    console.log('GAS_API_KEY set to: ' + NEW_API_KEY);
    console.log('Current Properties:');
    const all = props.getProperties();
    for (let key in all) {
        // Obfuscate sensitive keys in logs if needed, but here we want to verify
        console.log(key + ': ' + (key.includes('TOKEN') ? '***' : all[key]));
    }
    return 'Success';
}
