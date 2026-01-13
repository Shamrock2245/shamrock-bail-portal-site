/**
 * Configuration for Booking Form Submission SPI
 * Updated: Force Sync
 * 
 * This configuration is used by Wix Forms to handle form submissions.
 * Currently set to allow submissions without requiring user login.
 */

// Export empty config to prevent BAD_USER_CODE errors
// The actual form submission handling is done in backend modules
export function getConfig() {
    return {};
}
