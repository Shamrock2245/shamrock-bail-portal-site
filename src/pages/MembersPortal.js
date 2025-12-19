/**
 * Shamrock Bail Bonds - Members Portal Landing
 * Secure gateway for client paperwork and portal access
 */

import wixUsers from 'wix-users';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

$w.onReady(function () {
  // Check if user is already logged in
  checkLoginStatus();
  
  // Set up portal type selection
  setupPortalTypeSelection();
  
  // Set up login/signup buttons
  setupAuthButtons();
});

/**
 * Check current login status
 */
async function checkLoginStatus() {
  if (wixUsers.currentUser.loggedIn) {
    // User is logged in, check their role and redirect
    const user = wixUsers.currentUser;
    const roles = await user.getRoles();
    
    redirectToPortal(roles);
  } else {
    // Show login/signup options
    showLoginOptions();
  }
}

/**
 * Show login options
 */
function showLoginOptions() {
  $w('#loginSection').show();
  $w('#portalTypeSection').show();
}

/**
 * Set up portal type selection
 */
function setupPortalTypeSelection() {
  // Defendant portal button
  $w('#defendantPortalButton').onClick(() => {
    selectPortalType('defendant');
  });
  
  // Indemnitor portal button
  $w('#indemnitorPortalButton').onClick(() => {
    selectPortalType('indemnitor');
  });
  
  // Staff console button (requires password)
  $w('#staffConsoleButton').onClick(() => {
    selectPortalType('staff');
  });
}

/**
 * Select portal type and proceed to login
 * @param {string} portalType - Type of portal (defendant, indemnitor, staff)
 */
function selectPortalType(portalType) {
  // Store portal type in session storage
  wixWindow.sessionStorage.setItem('portalType', portalType);
  
  // Proceed to login/signup
  if (wixUsers.currentUser.loggedIn) {
    redirectToPortal([portalType]);
  } else {
    // Show appropriate login form
    showLoginForm(portalType);
  }
}

/**
 * Show login form for specific portal type
 * @param {string} portalType - Portal type
 */
function showLoginForm(portalType) {
  // Set portal type indicator
  $w('#portalTypeIndicator').text = `Logging in to ${capitalizeFirst(portalType)} Portal`;
  
  // Show login form
  $w('#loginFormSection').show();
  $w('#portalTypeSection').hide();
}

/**
 * Set up authentication buttons
 */
function setupAuthButtons() {
  // Login button
  $w('#loginButton').onClick(async () => {
    await handleLogin();
  });
  
  // Sign up button
  $w('#signupButton').onClick(() => {
    wixUsers.promptLogin({
      mode: 'signup'
    }).then(() => {
      checkLoginStatus();
    }).catch((error) => {
      console.error('Signup error:', error);
      showError('Failed to sign up. Please try again.');
    });
  });
  
  // Back button
  if ($w('#backButton')) {
    $w('#backButton').onClick(() => {
      $w('#loginFormSection').hide();
      $w('#portalTypeSection').show();
    });
  }
}

/**
 * Handle login process
 */
async function handleLogin() {
  try {
    const email = $w('#emailInput').value;
    const password = $w('#passwordInput').value;
    
    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }
    
    // Show loading
    showLoading();
    
    // Attempt login
    await wixUsers.login(email, password);
    
    // Login successful, redirect to appropriate portal
    const user = wixUsers.currentUser;
    const roles = await user.getRoles();
    
    redirectToPortal(roles);
    
  } catch (error) {
    console.error('Login error:', error);
    showError('Login failed. Please check your credentials and try again.');
    hideLoading();
  }
}

/**
 * Redirect to appropriate portal based on user roles
 * @param {Array} roles - User roles
 */
function redirectToPortal(roles) {
  const portalType = wixWindow.sessionStorage.getItem('portalType') || 'defendant';
  
  if (roles.includes('Admin') || roles.includes('Staff')) {
    // Redirect to staff console
    wixLocation.to('/members/staff');
  } else if (portalType === 'indemnitor') {
    // Redirect to indemnitor portal
    wixLocation.to('/members/indemnitor');
  } else {
    // Default to defendant portal
    wixLocation.to('/members/defendant');
  }
}

/**
 * Capitalize first letter of string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Show loading state
 */
function showLoading() {
  if ($w('#loadingSpinner')) {
    $w('#loadingSpinner').show();
  }
  $w('#loginButton').disable();
}

/**
 * Hide loading state
 */
function hideLoading() {
  if ($w('#loadingSpinner')) {
    $w('#loadingSpinner').hide();
  }
  $w('#loginButton').enable();
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  if ($w('#errorMessage')) {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
    
    // Hide error after 5 seconds
    setTimeout(() => {
      $w('#errorMessage').hide();
    }, 5000);
  }
}
