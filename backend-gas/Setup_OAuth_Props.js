/**
 * Run this function ONCE from the GAS editor to permanently store 
 * the OAuth credentials in the Script Properties.
 */
function setupGoogleOAuthProps() {
    var props = PropertiesService.getScriptProperties();
    props.setProperty('GOOGLE_OAUTH_CLIENT_ID', 'REDACTED');
    props.setProperty('GOOGLE_OAUTH_CLIENT_SECRET', 'REDACTED');
    console.log('Successfully set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET!');
}
