function forceUpdateConfig() {
    const props = PropertiesService.getScriptProperties();

    // 1. Set the API Key (Safety Net)
    const NEW_API_KEY = 'shamrock-secure-2026';
    props.setProperty('GAS_API_KEY', NEW_API_KEY);

    // 2. Critical Configuration
    props.setProperty('WIX_SITE_URL', 'https://www.shamrockbailbonds.biz');

    // 3. TWILIO CONFIGURATION (Programmatic Override)
    // -----------------------------------------------------------
    // These values are taken directly from your authorized screenshots.
    // Run this function ONCE to save them to the Script Properties.
    // -----------------------------------------------------------

    // Account SID
    props.setProperty('TWILIO_ACCOUNT_SID', 'YOUR_TWILIO_SID_HERE');

    // Auth Token
    props.setProperty('TWILIO_AUTH_TOKEN', 'YOUR_AUTH_TOKEN_HERE');

    // Verify Service SID (The one you created)
    props.setProperty('TWILIO_VERIFY_SERVICE_SID', 'YOUR_VERIFY_SID_HERE');

    // Phone Number (Standard format)
    props.setProperty('TWILIO_PHONE_NUMBER', '+15555555555');

    // -----------------------------------------------------------

    console.log('✅ CONFIG UPDATED SUCCESSFULLY');
    console.log('GAS_API_KEY set to: ' + NEW_API_KEY);
    console.log('Current Properties:');

    const all = props.getProperties();
    for (let key in all) {
        // Log keys to confirm existence, mask values for security
        let val = all[key];
        if (key.includes('TOKEN') || key.includes('SID') || key.includes('KEY')) {
            val = val.substring(0, 5) + '...';
        }
        console.log(`${key}: ${val}`);
    }

    return 'Success - Properties Saved';
}
