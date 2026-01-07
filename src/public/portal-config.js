/**
 * Portal Configuration Module
 * 
 * Central configuration for Shamrock Bail Bonds Portal
 * Contains constants, business rules, and configuration values
 * 
 * @module portal-config
 */

// ============================================================================
// API Configuration
// ============================================================================

/**
 * External API base URL
 * @constant {string}
 */
export const API_BASE_URL = 'https://api.shamrockbailbonds.biz/api/v1';

/**
 * API timeout in milliseconds
 * @constant {number}
 */
export const API_TIMEOUT = 30000;

// ============================================================================
// Business Information
// ============================================================================

/**
 * Company phone number
 * @constant {string}
 */
export const PHONE_NUMBER = '(239) 332-2245';

/**
 * Company office address
 * @constant {Object}
 */
export const OFFICE_ADDRESS = {
  street: '1528 Broadway',
  city: 'Fort Myers',
  state: 'FL',
  zip: '33901',
  full: '1528 Broadway, Fort Myers, FL 33901'
};

/**
 * Office GPS coordinates
 * @constant {Object}
 */
export const OFFICE_COORDINATES = {
  lat: 26.6406,
  lng: -81.8723
};

/**
 * Business hours (24/7 service)
 * @constant {string}
 */
export const BUSINESS_HOURS = '24/7 - Available Anytime';

// ============================================================================
// Service Area Configuration
// ============================================================================

/**
 * Primary service counties (no transfer fee)
 * @constant {Array<string>}
 */
export const PRIMARY_COUNTIES = ['Lee', 'Charlotte', 'Collier'];

/**
 * All 65 Florida counties served
 * @constant {Array<string>}
 */
export const ALL_FLORIDA_COUNTIES = [
  'Alachua', 'Baker', 'Bay', 'Bradford', 'Brevard', 'Broward', 'Calhoun',
  'Charlotte', 'Citrus', 'Clay', 'Collier', 'Columbia', 'DeSoto', 'Dixie',
  'Duval', 'Escambia', 'Flagler', 'Franklin', 'Gadsden', 'Gilchrist', 'Glades',
  'Gulf', 'Hamilton', 'Hardee', 'Hendry', 'Hernando', 'Highlands', 'Hillsborough',
  'Holmes', 'Indian River', 'Jackson', 'Jefferson', 'Lafayette', 'Lake', 'Lee',
  'Leon', 'Levy', 'Liberty', 'Madison', 'Manatee', 'Marion', 'Martin', 'Miami-Dade',
  'Monroe', 'Nassau', 'Okaloosa', 'Okeechobee', 'Orange', 'Osceola', 'Palm Beach',
  'Pasco', 'Pinellas', 'Polk', 'Putnam', 'St. Johns', 'St. Lucie', 'Santa Rosa',
  'Sarasota', 'Seminole', 'Sumter', 'Suwannee', 'Taylor', 'Union', 'Volusia',
  'Wakulla', 'Walton', 'Washington'
];

/**
 * Transfer fee for counties outside primary service area
 * @constant {number}
 */
export const TRANSFER_FEE_BASE = 100;

// ============================================================================
// Bond Fee Configuration (Florida State Mandated)
// ============================================================================

/**
 * State mandated bond fee percentage
 * @constant {number}
 */
export const BOND_FEE_PERCENTAGE = 0.10; // 10%

/**
 * Minimum bond fee per charge
 * @constant {number}
 */
export const BOND_FEE_MINIMUM = 100;

/**
 * Calculate bond fee based on Florida state requirements
 * 10% of face value OR $100 per charge, whichever is greater
 * 
 * @param {number} bondAmount - Total bond amount
 * @param {number} chargeCount - Number of charges
 * @returns {number} Calculated bond fee
 */
export function calculateBondFee(bondAmount, chargeCount = 1) {
  const percentageFee = bondAmount * BOND_FEE_PERCENTAGE;
  const minimumFee = BOND_FEE_MINIMUM * chargeCount;
  return Math.max(percentageFee, minimumFee);
}

// ============================================================================
// Collateral Configuration
// ============================================================================

/**
 * Bond amount threshold requiring collateral
 * @constant {number}
 */
export const COLLATERAL_THRESHOLD = 50000;

/**
 * Collateral types accepted
 * @constant {Array<Object>}
 */
export const COLLATERAL_TYPES = [
  { value: 'real_estate', label: 'Real Estate', requiresUpload: true },
  { value: 'vehicle', label: 'Vehicle', requiresUpload: true },
  { value: 'cash', label: 'Cash', requiresUpload: false },
  { value: 'signature', label: 'Signature Only', requiresUpload: false }
];

// ============================================================================
// Check-In Configuration
// ============================================================================

/**
 * Default check-in day of week (0 = Sunday, 3 = Wednesday)
 * @constant {number}
 */
export const DEFAULT_CHECKIN_DAY = 3; // Wednesday

/**
 * Check-in frequency in days
 * @constant {number}
 */
export const CHECKIN_FREQUENCY_DAYS = 7;

/**
 * GPS accuracy threshold in meters
 * @constant {number}
 */
export const GPS_ACCURACY_THRESHOLD = 100;

/**
 * Maximum selfie file size in bytes (5MB)
 * @constant {number}
 */
export const MAX_SELFIE_SIZE = 5 * 1024 * 1024;

// ============================================================================
// Document Configuration
// ============================================================================

/**
 * Valid document keys
 * @constant {Array<string>}
 */
export const DOCUMENT_KEYS = [
  'financial_indemnity_v1',
  'appearance_application_v1',
  'collateral_promissory_v1',
  'bond_info_sheet_v1',
  'waiver_authorization_v1',
  'ssa_3288_v1',
  'cc_authorization_v1'
];

/**
 * Document display names
 * @constant {Object}
 */
export const DOCUMENT_NAMES = {
  'financial_indemnity_v1': 'Financial Statement & Indemnity Agreement',
  'appearance_application_v1': 'Application for Appearance Bond',
  'collateral_promissory_v1': 'Collateral Receipt & Promissory Note',
  'bond_info_sheet_v1': 'Bail Bond Information Sheet',
  'waiver_authorization_v1': 'Waivers & Authorizations',
  'ssa_3288_v1': 'SSA-3288 Consent for Release',
  'cc_authorization_v1': 'Credit Card Authorization'
};

// ============================================================================
// User Roles
// ============================================================================

/**
 * Valid user roles
 * @constant {Object}
 */
export const ROLES = {
  DEFENDANT: 'defendant',
  INDEMNITOR: 'indemnitor',
  COINDEMNITOR: 'coindemnitor',
  STAFF: 'staff',
  ADMIN: 'admin'
};

/**
 * Role display names
 * @constant {Object}
 */
export const ROLE_NAMES = {
  [ROLES.DEFENDANT]: 'Defendant',
  [ROLES.INDEMNITOR]: 'Indemnitor',
  [ROLES.COINDEMNITOR]: 'Co-Indemnitor',
  [ROLES.STAFF]: 'Staff Member',
  [ROLES.ADMIN]: 'Administrator'
};

// ============================================================================
// Form Validation Patterns
// ============================================================================

/**
 * Regular expression patterns for validation
 * @constant {Object}
 */
export const VALIDATION_PATTERNS = {
  SSN: /^\d{3}-?\d{2}-?\d{4}$/,
  PHONE: /^\+?1?[ .-]?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}$/,
  ZIP: /^\d{5}(-\d{4})?$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/
};

/**
 * Input masks for form fields
 * @constant {Object}
 */
export const INPUT_MASKS = {
  SSN: '###-##-####',
  PHONE: '(###) ###-####',
  ZIP: '#####',
  ZIP_PLUS4: '#####-####',
  DATE: '####-##-##'
};

// ============================================================================
// Payment Configuration
// ============================================================================

/**
 * Accepted payment methods
 * @constant {Array<string>}
 */
export const PAYMENT_METHODS = ['visa', 'mastercard', 'amex', 'discover'];

/**
 * Payment method display names
 * @constant {Object}
 */
export const PAYMENT_METHOD_NAMES = {
  'visa': 'Visa',
  'mastercard': 'Mastercard',
  'amex': 'American Express',
  'discover': 'Discover'
};

// ============================================================================
// Session Configuration
// ============================================================================

/**
 * Session timeout in milliseconds (30 minutes)
 * @constant {number}
 */
export const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Magic link expiration in milliseconds (24 hours)
 * @constant {number}
 */
export const MAGIC_LINK_EXPIRATION = 24 * 60 * 60 * 1000;

// ============================================================================
// UI Configuration
// ============================================================================

/**
 * Brand colors
 * @constant {Object}
 */
export const BRAND_COLORS = {
  PRIMARY_GREEN: '#006400',
  DARK_GRAY: '#333333',
  OFF_WHITE: '#f7f7f7',
  GOLD: '#FFD700',
  BLACK: '#000000'
};

/**
 * Mobile breakpoint in pixels
 * @constant {number}
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Form autosave interval in milliseconds (30 seconds)
 * @constant {number}
 */
export const AUTOSAVE_INTERVAL = 30000;

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Standard error messages
 * @constant {Object}
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  PERMISSION_ERROR: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported file format.'
};

// ============================================================================
// Success Messages
// ============================================================================

/**
 * Standard success messages
 * @constant {Object}
 */
export const SUCCESS_MESSAGES = {
  FORM_SAVED: 'Your information has been saved successfully.',
  FORM_SUBMITTED: 'Your form has been submitted successfully.',
  PAYMENT_PROCESSED: 'Payment processed successfully.',
  CHECKIN_COMPLETED: 'Check-in completed successfully.',
  DOCUMENT_SIGNED: 'Document signed successfully.',
  EMAIL_SENT: 'Email sent successfully.',
  LINK_SENT: 'Link has been sent to the specified email address.'
};

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Feature flags for enabling/disabling functionality
 * @constant {Object}
 */
export const FEATURES = {
  ENABLE_AUTOSAVE: true,
  ENABLE_CHECKIN: true,
  ENABLE_PAYMENTS: true,
  ENABLE_SIGNATURES: true,
  ENABLE_PDF_EXPORT: true,
  ENABLE_EMAIL_NOTIFICATIONS: true,
  ENABLE_SMS_NOTIFICATIONS: false, // Future feature
  ENABLE_ANALYTICS: true
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format phone number for display
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number
 */
export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

/**
 * Format SSN for display (masked)
 * @param {string} ssn - Raw SSN
 * @returns {string} Masked SSN (XXX-XX-1234)
 */
export function formatSSNMasked(ssn) {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `XXX-XX-${cleaned.slice(-4)}`;
  }
  return 'XXX-XX-XXXX';
}

/**
 * Format currency for display
 * @param {number} amount - Amount in dollars
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Check if county is in primary service area
 * @param {string} county - County name
 * @returns {boolean} True if primary county
 */
export function isPrimaryCounty(county) {
  return PRIMARY_COUNTIES.includes(county);
}

/**
 * Get transfer fee for county
 * @param {string} county - County name
 * @returns {number} Transfer fee amount
 */
export function getTransferFee(county) {
  return isPrimaryCounty(county) ? 0 : TRANSFER_FEE_BASE;
}

/**
 * Check if collateral is required for bond amount
 * @param {number} bondAmount - Bond amount
 * @returns {boolean} True if collateral required
 */
export function isCollateralRequired(bondAmount) {
  return bondAmount >= COLLATERAL_THRESHOLD;
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  return VALIDATION_PATTERNS.EMAIL.test(email);
}

/**
 * Validate phone format
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
export function isValidPhone(phone) {
  return VALIDATION_PATTERNS.PHONE.test(phone);
}

/**
 * Validate SSN format
 * @param {string} ssn - Social Security Number
 * @returns {boolean} True if valid
 */
export function isValidSSN(ssn) {
  return VALIDATION_PATTERNS.SSN.test(ssn);
}

/**
 * Validate ZIP code format
 * @param {string} zip - ZIP code
 * @returns {boolean} True if valid
 */
export function isValidZip(zip) {
  return VALIDATION_PATTERNS.ZIP.test(zip);
}

// ============================================================================
// Export all configuration
// ============================================================================

export default {
  API_BASE_URL,
  API_TIMEOUT,
  PHONE_NUMBER,
  OFFICE_ADDRESS,
  OFFICE_COORDINATES,
  BUSINESS_HOURS,
  PRIMARY_COUNTIES,
  ALL_FLORIDA_COUNTIES,
  TRANSFER_FEE_BASE,
  BOND_FEE_PERCENTAGE,
  BOND_FEE_MINIMUM,
  COLLATERAL_THRESHOLD,
  COLLATERAL_TYPES,
  DEFAULT_CHECKIN_DAY,
  CHECKIN_FREQUENCY_DAYS,
  GPS_ACCURACY_THRESHOLD,
  MAX_SELFIE_SIZE,
  DOCUMENT_KEYS,
  DOCUMENT_NAMES,
  ROLES,
  ROLE_NAMES,
  VALIDATION_PATTERNS,
  INPUT_MASKS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_NAMES,
  SESSION_TIMEOUT,
  MAGIC_LINK_EXPIRATION,
  BRAND_COLORS,
  MOBILE_BREAKPOINT,
  AUTOSAVE_INTERVAL,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FEATURES,
  calculateBondFee,
  formatPhone,
  formatSSNMasked,
  formatCurrency,
  formatDate,
  isPrimaryCounty,
  getTransferFee,
  isCollateralRequired,
  isValidEmail,
  isValidPhone,
  isValidSSN,
  isValidZip
};
