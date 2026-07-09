/**
 * Run this function ONCE from the GAS editor to store OAuth credentials
 * in Script Properties. Pass values as arguments — never hardcode secrets.
 *
 *   setupGoogleOAuthProps('YOUR_CLIENT_ID', 'YOUR_CLIENT_SECRET')
 */
function setupGoogleOAuthProps(clientId, clientSecret) {
  if (!clientId || !clientSecret) {
    throw new Error(
      'Pass GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET as arguments. Never hardcode them in this file.'
    );
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty('GOOGLE_OAUTH_CLIENT_ID', String(clientId).trim());
  props.setProperty('GOOGLE_OAUTH_CLIENT_SECRET', String(clientSecret).trim());
  console.log('Successfully set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET!');
}
