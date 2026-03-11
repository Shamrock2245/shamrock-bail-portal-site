/**
 * ============================================
 * CONFIG.js - CENTRALIZED CONFIGURATION
 * ============================================
 * Shamrock Bail Bonds - Complete Automation System
 */

var CONFIG = {
  
  // ===== GOOGLE SHEET SETTINGS =====
  SHEET_ID: '1jq1-N7sCbwSiYPLAdI2ZnxhLzym1QsOSuHPy-Gw07Qc',
  SHEET_NAME: 'shamrock-leads-leecounty', // Update if your sheet tab has a different name
  
  // ===== QUALIFIED ARRESTS SETTINGS =====
  QUALIFIED_ARRESTS: {
    ENABLED: true,                                              // Enable qualified arrests automation
    SHEET_ID: '1_8jmb3UsbDNWoEtD2_5O27JNvXKBExrQq2pG0W-mPJI',  // Separate workbook for qualified arrests
    TAB_NAME: 'Qualified_Arrests',                              // Tab name in qualified arrests workbook
    MIN_SCORE: 70,                                              // Minimum lead score to qualify (Hot leads only)
    AUTO_SYNC: true,                                            // Automatically sync qualified arrests
    FAMILY_SEARCH: {
      ENABLED: true,                                            // Enable automatic family/contact search
      SOURCES: ['google', 'whitepages', 'truepeoplesearch', 'facebook', 'instagram'],
      MAX_CONTACTS: 5,                                          // Max contacts to find per arrest
      SEARCH_DELAY_MS: 2000                                     // Delay between searches to avoid rate limits
    }
  },
  
  // ===== COLUMN MAPPINGS (Based on ideal structure) =====
  COLUMNS: {
    // Core identification fields
    TIMESTAMP: 1,              // Column A
    AGENT_NAME: 2,             // Column B
    CASE_NUMBER: 3,            // Column C - CRITICAL for matching
    
    // Defendant info
    DEFENDANT_FIRST: 4,        // Column D
    DEFENDANT_LAST: 5,         // Column E
    DEFENDANT_NAME: 6,         // Column F - CRITICAL for matching
    DEFENDANT_DOB: 7,          // Column G
    DEFENDANT_ADDRESS: 8,      // Column H
    DEFENDANT_CITY: 9,         // Column I
    DEFENDANT_STATE: 10,       // Column J
    DEFENDANT_ZIP: 11,         // Column K
    DEFENDANT_PHONE: 12,       // Column L - CRITICAL for reminders
    DEFENDANT_EMAIL: 13,       // Column M - CRITICAL for reminders
    
    // Indemnitor info
    INDEMNITOR_1_NAME: 14,     // Column N
    INDEMNITOR_1_PHONE: 15,    // Column O
    INDEMNITOR_1_EMAIL: 16,    // Column P - CRITICAL for reminders
    INDEMNITOR_2_NAME: 17,     // Column Q
    INDEMNITOR_2_PHONE: 18,    // Column R
    INDEMNITOR_2_EMAIL: 19,    // Column S
    
    // Charges
    CHARGE_1: 20,              // Column T
    CHARGE_2: 21,              // Column U
    CHARGE_3: 22,              // Column V
    
    // Financial info
    BOND_AMOUNT: 23,           // Column W
    PREMIUM_AMOUNT: 24,        // Column X
    PAYMENT_TYPE: 25,          // Column Y
    AMOUNT_PAID: 26,           // Column Z
    BALANCE_DUE: 27,           // Column AA
    PAYMENT_PLAN_TYPE: 28,     // Column AB
    NEXT_PAYMENT_DUE: 29,      // Column AC
    
    // Court date info (AUTO-FILLED by Module 1)
    COURT_DATE: 30,            // Column AD
    COURT_TIME: 31,            // Column AE
    COURT_LOCATION: 32,        // Column AF
    HEARING_TYPE: 33,          // Column AG
    CALENDAR_EVENT_ID: 34,     // Column AH
    REMINDER_7D: 35,           // Column AI
    REMINDER_3D: 36,           // Column AJ
    REMINDER_1D: 37,           // Column AK
    COURT_EMAIL_ID: 38,        // Column AL
    COURT_LAST_UPDATED: 39,    // Column AM
    
    // SignNow / Document tracking
    SIGNNOW_DOC_GROUP_ID: 40,  // Column AN
    SIGNNOW_INVITE_LINK: 41,   // Column AO
    DOCUMENT_STATUS: 42,       // Column AP
    NOTES: 43                  // Column AQ
  },
  
  // ===== EMAIL SEARCH SETTINGS =====
  // Adjust these based on actual clerk emails you receive
  EMAIL_SEARCH_QUERIES: [
    'from:clerk@leeclerk.org subject:(court OR hearing OR appearance)',
    'from:clerkofcourt@ca.cjis20.org',
    'subject:"Notice of Hearing"',
    'subject:"Court Date Notification"',
    'subject:"Notice of Court Appearance"'
  ],
  
  // ===== BUSINESS HOURS SETTINGS =====
  BUSINESS_HOURS: {
    START: 8,                  // 8 AM
    END: 18,                   // 6 PM
    TIMEZONE: 'America/New_York', // Florida EST
    WORK_DAYS: [1, 2, 3, 4, 5]   // Monday through Friday
  },
  
  // ===== REMINDER SCHEDULE =====
  REMINDER_DAYS: [7, 3, 1],    // Send at 7 days, 3 days, 1 day before court
  REMINDER_TIME: 9,            // Send reminders at 9 AM
  
  // ===== SLACK CHANNELS =====
  SLACK_CHANNELS: {
    COURT_DATES: '#court-dates',
    NEW_ARRESTS: '#new-arrests-lee-county',
    QUALIFIED_LEADS: '#qualified-leads',  // NEW: For hot leads
    ERRORS: '#court-dates'                // Can separate later if desired
  },
  
  // ===== COMPANY INFO =====
  COMPANY: {
    NAME: 'Shamrock Bail Bonds',
    PHONE: '(239) 332-2245',   
    EMAIL: 'admin@shamrockbailbonds.biz',
    ADDRESS: '1528 Broadway, Fort Myers, FL 33901',
    WEBSITE: 'https://shamrockbailbonds.biz',
    AGENT_NAME: 'Shamrock Team'
  },
  
  // ===== ARRESTS (Lee County) =====
  ARRESTS: {
    SHEET_ID: '1jq1-N7sCbwSiYPLAdI2ZnxhLzym1QsOSuHPy-Gw07Qc', // shamrock-leads-leecounty
    TAB_NAME: 'Lee_County_Arrests',                         // target tab (will auto-create)
    TIMEZONE: 'America/New_York',

    ENDPOINTS: {
      BASE: 'https://www.sheriffleefl.org',
      AJAX: '/wp-admin/admin-ajax.php',
      PUBLIC_API: '/public-api/bookings'  // prefer if present; falls back to AJAX
    },

    // scrape window & limits
    DAYS_BACK: 3,
    MAX_ENRICH: 120,
    DETAIL_DELAY_MS: 300,

    // basic alerting (Slack recommended)
    ALERTS: {
      ENABLED: true,
      SLACK_WEBHOOK_URL: '', // Will be loaded from script properties
      MAX_POST: 12,                      // max new arrests to post per run
      FAMILY_SEARCH_LINKS: true,         // include helper links in Slack
      KEY_CHARGES: ['DUI','DOMESTIC','BATTERY','THEFT','MURDER','ASSAULT'] // bold these in alerts
    }
  },
  
  // ===== LEAD SCORING SETTINGS =====
  LEAD_SCORING: {
    ENABLED: true,
    AUTO_SCORE: true,  // Automatically score new arrests
    
    // Scoring weights
    WEIGHTS: {
      BOND_AMOUNT_IDEAL: 30,      // $500-$50K range
      BOND_TYPE_GOOD: 25,          // Cash/Surety
      IN_CUSTODY: 20,              // Currently in jail
      COMPLETE_DATA: 15,           // All fields populated
      COURT_DATE_SOON: 10,         // Court date within 30 days
      
      // Penalties
      NO_BOND: -50,                // No bond/Hold
      ALREADY_RELEASED: -30,       // Already out
      DISQUALIFYING_CHARGE: -100   // Murder, capital, federal
    },
    
    // Thresholds
    THRESHOLDS: {
      HOT: 70,      // >= 70 points
      WARM: 40,     // 40-69 points
      COLD: 0       // 0-39 points
      // < 0 = Disqualified
    },
    
    // Disqualifying charges (case-insensitive substring match)
    DISQUALIFYING_CHARGES: [
      'MURDER',
      'CAPITAL',
      'FEDERAL',
      'IMMIGRATION',
      'DETAINER',
      'WARRANT'
    ]
  },
  
  // ===== FAMILY/CONTACT SEARCH SETTINGS =====
  FAMILY_SEARCH: {
    // Search sources and their URL patterns
    SOURCES: {
      GOOGLE: {
        enabled: true,
        url_template: 'https://www.google.com/search?q={name}+{city}+{state}+phone+contact',
        priority: 1
      },
      WHITEPAGES: {
        enabled: true,
        url_template: 'https://www.whitepages.com/name/{first}-{last}/{city}-{state}',
        priority: 2
      },
      TRUEPEOPLESEARCH: {
        enabled: true,
        url_template: 'https://www.truepeoplesearch.com/results?firstname={first}&lastname={last}&citystatezip={city}%2C+{state}',
        priority: 3
      },
      FACEBOOK: {
        enabled: true,
        url_template: 'https://www.facebook.com/search/people/?q={name}+{city}+{state}',
        priority: 4
      },
      INSTAGRAM: {
        enabled: true,
        url_template: 'https://www.instagram.com/explore/tags/{name}/',
        priority: 5
      },
      LINKEDIN: {
        enabled: false,  // Disabled by default (requires login)
        url_template: 'https://www.linkedin.com/search/results/people/?keywords={name}+{city}',
        priority: 6
      }
    },
    
    // Search strategies
    STRATEGIES: [
      'defendant_name_only',           // Search just defendant name
      'defendant_with_location',       // Defendant + city/state
      'defendant_relatives',           // "John Smith relatives Fort Myers FL"
      'address_reverse_lookup',        // Search by address to find neighbors/family
      'phone_reverse_lookup'           // If phone available, reverse lookup
    ],
    
    // Contact scoring (to rank potential contacts)
    CONTACT_SCORING: {
      SAME_LAST_NAME: 30,             // Same last name as defendant
      SAME_ADDRESS: 25,               // Same address
      CLOSE_AGE: 20,                  // Age 25-65 (likely parent/sibling/spouse)
      PHONE_FOUND: 15,                // Has phone number
      EMAIL_FOUND: 10,                // Has email
      SOCIAL_PROFILE: 10              // Has social media profile
    }
  }
};

/**
 * Helper function to get Script Properties
 */
function getScriptProperty(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

/**
 * Helper function to set Script Properties
 */
function setScriptProperty(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

/**
 * Load dynamic configuration from Script Properties
 */
function loadDynamicConfig() {
  // Load Slack webhook
  var slackWebhook = getScriptProperty('SLACK_WEBHOOK_URL');
  if (slackWebhook) {
    CONFIG.ARRESTS.ALERTS.SLACK_WEBHOOK_URL = slackWebhook;
  }
  
  // Load SignNow credentials
  var signNowToken = getScriptProperty('SIGNNOW_ACCESS_TOKEN');
  var signNowTemplate = getScriptProperty('SIGNNOW_TEMPLATE_ID');
  
  if (signNowToken && typeof SIGNNOW_CONFIG !== 'undefined') {
    SIGNNOW_CONFIG.ACCESS_TOKEN = signNowToken;
  }
  if (signNowTemplate && typeof SIGNNOW_CONFIG !== 'undefined') {
    SIGNNOW_CONFIG.TEMPLATE_ID = signNowTemplate;
  }
}

// Auto-load dynamic config on script initialization
loadDynamicConfig();

/**
 * Get configuration value by path (e.g., 'ARRESTS.DAYS_BACK')
 */
function getConfig(path) {
  var parts = path.split('.');
  var value = CONFIG;
  
  for (var i = 0; i < parts.length; i++) {
    if (value && typeof value === 'object' && parts[i] in value) {
      value = value[parts[i]];
    } else {
      return null;
    }
  }
  
  return value;
}

/**
 * Validate configuration
 */
function validateConfig() {
  var issues = [];
  
  // Check required fields
  if (!CONFIG.SHEET_ID) issues.push('SHEET_ID is missing');
  if (!CONFIG.COMPANY.NAME) issues.push('COMPANY.NAME is missing');
  if (!CONFIG.COMPANY.PHONE) issues.push('COMPANY.PHONE is missing');
  if (!CONFIG.COMPANY.EMAIL) issues.push('COMPANY.EMAIL is missing');
  
  // Check arrests config
  if (!CONFIG.ARRESTS.SHEET_ID) issues.push('ARRESTS.SHEET_ID is missing');
  if (!CONFIG.ARRESTS.TAB_NAME) issues.push('ARRESTS.TAB_NAME is missing');
  
  // Check qualified arrests config
  if (CONFIG.QUALIFIED_ARRESTS.ENABLED) {
    if (!CONFIG.QUALIFIED_ARRESTS.SHEET_ID) issues.push('QUALIFIED_ARRESTS.SHEET_ID is missing');
    if (!CONFIG.QUALIFIED_ARRESTS.TAB_NAME) issues.push('QUALIFIED_ARRESTS.TAB_NAME is missing');
  }
  
  if (issues.length > 0) {
    Logger.log('⚠️ Configuration issues found:');
    issues.forEach(function(issue) {
      Logger.log('  - ' + issue);
    });
    return false;
  }
  
  Logger.log('✅ Configuration validated successfully');
  return true;
}

/**
 * Display configuration summary
 */
function showConfigSummary() {
  var summary = [];
  summary.push('🍀 SHAMROCK BAIL BONDS - CONFIGURATION SUMMARY');
  summary.push('═══════════════════════════════════════════════');
  summary.push('');
  summary.push('📊 Main Sheet: ' + CONFIG.SHEET_ID);
  summary.push('📋 Sheet Name: ' + CONFIG.SHEET_NAME);
  summary.push('');
  summary.push('🚔 Arrests Sheet: ' + CONFIG.ARRESTS.TAB_NAME);
  summary.push('📅 Days Back: ' + CONFIG.ARRESTS.DAYS_BACK);
  summary.push('🔬 Max Enrich: ' + CONFIG.ARRESTS.MAX_ENRICH);
  summary.push('');
  summary.push('🎯 Qualified Arrests: ' + (CONFIG.QUALIFIED_ARRESTS.ENABLED ? 'ENABLED' : 'DISABLED'));
  if (CONFIG.QUALIFIED_ARRESTS.ENABLED) {
    summary.push('   Sheet ID: ' + CONFIG.QUALIFIED_ARRESTS.SHEET_ID);
    summary.push('   Min Score: ' + CONFIG.QUALIFIED_ARRESTS.MIN_SCORE);
    summary.push('   Family Search: ' + (CONFIG.QUALIFIED_ARRESTS.FAMILY_SEARCH.ENABLED ? 'ENABLED' : 'DISABLED'));
  }
  summary.push('');
  summary.push('📊 Lead Scoring: ' + (CONFIG.LEAD_SCORING.ENABLED ? 'ENABLED' : 'DISABLED'));
  summary.push('   Hot Threshold: ' + CONFIG.LEAD_SCORING.THRESHOLDS.HOT);
  summary.push('   Warm Threshold: ' + CONFIG.LEAD_SCORING.THRESHOLDS.WARM);
  summary.push('');
  summary.push('🏢 Company: ' + CONFIG.COMPANY.NAME);
  summary.push('📞 Phone: ' + CONFIG.COMPANY.PHONE);
  summary.push('📧 Email: ' + CONFIG.COMPANY.EMAIL);
  summary.push('📍 Address: ' + CONFIG.COMPANY.ADDRESS);
  summary.push('');
  summary.push('💬 Slack Channels:');
  summary.push('   Court Dates: ' + CONFIG.SLACK_CHANNELS.COURT_DATES);
  summary.push('   New Arrests: ' + CONFIG.SLACK_CHANNELS.NEW_ARRESTS);
  summary.push('   Qualified Leads: ' + CONFIG.SLACK_CHANNELS.QUALIFIED_LEADS);
  summary.push('');
  summary.push('═══════════════════════════════════════════════');
  
  Logger.log(summary.join('\n'));
  
  if (typeof SpreadsheetApp !== 'undefined') {
    SpreadsheetApp.getUi().alert(summary.join('\n'));
  }
}

