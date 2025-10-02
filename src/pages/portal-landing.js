/**
 * Portal Landing Page
 * 
 * This page serves as the entry point for the Shamrock Bail Bonds Portal.
 * It allows users to select their role (Defendant, Indemnitor, Staff) and guides them
 * to the appropriate section of the portal.
 * 
 * @page portal-landing
 */

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { getUserRole, ROLES } from 'backend/portal-auth';

$w.onReady(function () {
  loadPageContent();
});

async function loadPageContent() {
  const user = wixUsers.currentUser;

  if (!user.loggedIn) {
    // If not logged in, prompt to log in or register
    $w("#roleSelectionContainer").hide();
    $w("#loginPrompt").show();
    $w("#loginButton").onClick(() => wixUsers.promptLogin());
    $w("#signupButton").onClick(() => wixUsers.promptSignup());
    return;
  }

  $w("#loginPrompt").hide();
  $w("#roleSelectionContainer").show();

  const role = await getUserRole();

  if (role === ROLES.DEFENDANT) {
    $w("#defendantButton").expand();
    $w("#indemnitorButton").collapse();
    $w("#staffButton").collapse();
    $w("#defendantButton").onClick(() => wixLocation.to("/portal/defendant"));
  } else if (role === ROLES.INDEMNITOR || role === ROLES.COINDEMNITOR) {
    $w("#indemnitorButton").expand();
    $w("#defendantButton").collapse();
    $w("#staffButton").collapse();
    $w("#indemnitorButton").onClick(() => wixLocation.to("/portal/indemnitor"));
  } else if (role === ROLES.STAFF || role === ROLES.ADMIN) {
    $w("#staffButton").expand();
    $w("#defendantButton").collapse();
    $w("#indemnitorButton").collapse();
    $w("#staffButton").onClick(() => wixLocation.to("/portal/staff"));
  } else {
    // User is logged in but has no specific portal role, show all options
    $w("#defendantButton").expand();
    $w("#indemnitorButton").expand();
    $w("#staffButton").expand();
    $w("#defendantButton").onClick(() => wixLocation.to("/portal/defendant"));
    $w("#indemnitorButton").onClick(() => wixLocation.to("/portal/indemnitor"));
    $w("#staffButton").onClick(() => wixLocation.to("/portal/staff"));
  }

  // Handle magic link token if present in URL
  const token = wixLocation.query.token;
  if (token) {
    // TODO: Implement magic link validation and user linking logic here
    // Example: await onMagicLinkLogin(token);
    // Then clear the token from the URL
    wixLocation.to(wixLocation.baseUrl + wixLocation.path);
  }
}

// UI Elements (placeholders - replace with actual Wix element IDs)
// $w("#loginPrompt") - Container for login/signup buttons
// $w("#loginButton") - Button to prompt login
// $w("#signupButton") - Button to prompt signup
// $w("#roleSelectionContainer") - Container for role selection buttons
// $w("#defendantButton") - Button for Defendant portal
// $w("#indemnitorButton") - Button for Indemnitor portal
// $w("#staffButton") - Button for Staff console

