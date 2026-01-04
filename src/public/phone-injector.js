/**
 * Shamrock Bail Bonds - Phone Number Injector
 * Frontend module for dynamically updating phone numbers on pages
 * 
 * Features:
 * - Replaces all phone numbers based on user context
 * - Updates tel: links and display text
 * - Integrates with call tracking
 * - Single-click calling (no double-click required)
 */

import { getPhoneNumber } from 'backend/routing.jsw';
import { logCall } from 'backend/call-tracking';
import { autoDetectLocation } from 'public/geolocation-client';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

// EMERGENCY FALLBACKS: Hardcoded site-wide defaults if backend fails
const EMERGENCY_PRIMARY_DISPLAY = '(239) 332-2245';
const EMERGENCY_PRIMARY_NUMBER = '+12393322245';
const EMERGENCY_SPANISH_DISPLAY = '(239) 955-0305';
const EMERGENCY_SPANISH_NUMBER = '+12399550305';

/**
 * Initialize phone number injection on page load
 * @param {Object} options - { county, language, sessionId }
 * @returns {Promise<void>}
 */
export async function initializePhoneInjection(options = {}) {
  let phoneData;
  let county = options.county;
  let sessionId = options.sessionId || generateSessionId();

  try {
    // Auto-detect location if county not provided
    if (!county) {
      const location = await autoDetectLocation();
      if (location.success) {
        county = location.county;
      }
    }

    // Get optimal phone number
    const result = await getPhoneNumber({
      county,
      language: options.language || 'en',
      device: wixWindow.formFactor,
      page: wixLocation.url,
      sessionId
    });

    if (result && result.success) {
      phoneData = result;
    } else {
      console.warn('Phone routing service unsuccessful, using emergency fallbacks.');
      phoneData = {
        success: true,
        number: EMERGENCY_PRIMARY_NUMBER,
        display: EMERGENCY_PRIMARY_DISPLAY,
        source: 'emergency-fallback'
      };
    }
  } catch (error) {
    console.error('CRITICAL: Phone routing service failed entirely. Using emergency fallbacks.', error);
    phoneData = {
      success: true,
      number: EMERGENCY_PRIMARY_NUMBER,
      display: EMERGENCY_PRIMARY_DISPLAY,
      source: 'emergency-fallback-error'
    };
  }

  if (!phoneData.success) {
    console.error('Failed to get phone number even with fallback.');
    return;
  }

  // Update all phone elements on the page
  await updatePhoneElements(phoneData, county, sessionId);

  console.log('Phone injection initialized:', {
    county,
    phoneNumber: phoneData.display,
    source: phoneData.source
  });
}

/**
 * Update all phone elements on the page
 * @param {Object} phoneData - Phone number data
 * @param {string} county - County slug
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
async function updatePhoneElements(phoneData, county, sessionId) {
  const { number, display, trackingId } = phoneData;

  // List of common phone element IDs
  const phoneElementIds = [
    '#callNowBtn',
    '#primaryPhone',
    '#headerPhone',
    '#footerPhone',
    '#heroCallLink',
    '#stickyCallBtn',
    '#mobileCallBtn',
    '#emergencyPhone',
    '#contactPhone',
    '#spanishSpeakingPhone'
  ];

  for (const elementId of phoneElementIds) {
    try {
      if ($w(elementId).length > 0) {
        const element = $w(elementId);

        // Update display text
        if (element.text !== undefined) {
          element.text = display;
        }

        if (element.label !== undefined) {
          element.label = display;
        }

        // Update link (if it's a link element)
        if (element.link !== undefined) {
          element.link = `tel:${number}`;
        }

        // Set up click handler with call tracking
        element.onClick(() => {
          handlePhoneClick(number, display, county, sessionId, elementId);
        });
      }
    } catch (error) {
      // Element doesn't exist on this page, continue
    }
  }
}

/**
 * Handle phone number click with call tracking
 * @param {string} number - Phone number
 * @param {string} display - Display format
 * @param {string} county - County slug
 * @param {string} sessionId - Session ID
 * @param {string} source - Click source (element ID)
 * @returns {Promise<void>}
 */
async function handlePhoneClick(number, display, county, sessionId, source) {
  try {
    // Log the call
    const callLog = await logCall({
      county,
      phoneNumber: number,
      source: source.replace('#', ''),
      page: wixLocation.url,
      device: wixWindow.formFactor,
      sessionId,
      userAgent: navigator.userAgent
    });

    console.log('Call tracked:', callLog.trackingId);

    // Initiate the call (single click)
    wixLocation.to(`tel:${number}`);

  } catch (error) {
    console.error('Error handling phone click:', error);

    // Still initiate the call even if tracking fails
    wixLocation.to(`tel:${number}`);
  }
}

/**
 * Update Spanish phone number specifically
 * @param {string} elementId - Element ID for Spanish phone
 * @param {string} county - County slug
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function updateSpanishPhone(elementId = '#spanishSpeakingPhone', county = null, sessionId = null) {
  try {
    const element = $w(elementId);
    if (element.length === 0) {
      return; // Element not found
    }

    let phoneData;
    try {
      // Get Spanish phone number
      const result = await getPhoneNumber({
        county,
        language: 'es',
        device: wixWindow.formFactor,
        page: wixLocation.url,
        sessionId: sessionId || generateSessionId()
      });

      if (result && result.success) {
        phoneData = result;
      } else {
        console.warn('Spanish phone routing service unsuccessful, using emergency fallbacks.');
        phoneData = {
          success: true,
          number: EMERGENCY_SPANISH_NUMBER,
          display: EMERGENCY_SPANISH_DISPLAY,
          source: 'emergency-spanish-fallback'
        };
      }
    } catch (error) {
      console.error('CRITICAL: Spanish phone routing service failed entirely. Using emergency fallbacks.', error);
      phoneData = {
        success: true,
        number: EMERGENCY_SPANISH_NUMBER,
        display: EMERGENCY_SPANISH_DISPLAY,
        source: 'emergency-spanish-fallback-error'
      };
    }

    if (!phoneData.success) {
      console.error('Failed to get Spanish phone number even with fallback.');
      return;
    }

    // Update the element
    // Update display text
    if (element.text !== undefined) {
      element.text = phoneData.display;
    }
    if (element.label !== undefined) {
      element.label = phoneData.display;
    }

    // CRITICAL FIX: Change from double-click to single-click
    element.onClick(() => {
      handlePhoneClick(
        phoneData.number,
        phoneData.display,
        county,
        sessionId || generateSessionId(),
        'spanish-phone'
      );
    });

    console.log('Spanish phone updated:', phoneData.display);

  } catch (error) {
    console.error('Error updating Spanish phone:', error);
  }
}

/**
 * Update phone number for specific county
 * @param {string} county - County slug
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function updatePhoneForCounty(county, sessionId = null) {
  try {
    await initializePhoneInjection({
      county,
      sessionId: sessionId || generateSessionId()
    });
  } catch (error) {
    console.error('Error updating phone for county:', error);
  }
}

/**
 * Get current phone number for display
 * @param {string} county - County slug
 * @param {string} language - Language preference
 * @returns {Promise<Object>} - Phone number data
 */
export async function getCurrentPhoneNumber(county = null, language = 'en') {
  try {
    const phoneData = await getPhoneNumber({
      county,
      language,
      device: wixWindow.formFactor,
      page: wixLocation.url
    });

    return phoneData;

  } catch (error) {
    console.error('Error getting current phone number:', error);
    return {
      success: false,
      number: '+12393322245',
      display: '(239) 332-2245'
    };
  }
}

/**
 * Generate session ID
 * @returns {string} - UUID v4
 */
function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Track phone number impression (for analytics)
 * @param {string} phoneNumber - Phone number displayed
 * @param {string} county - County slug
 * @param {string} source - Display source
 * @returns {Promise<void>}
 */
export async function trackPhoneImpression(phoneNumber, county, source) {
  try {
    // TODO: Implement impression tracking
    // This can be used to calculate call-to-impression ratio
    console.log('Phone impression:', {
      phoneNumber,
      county,
      source
    });

  } catch (error) {
    console.error('Error tracking phone impression:', error);
  }
}
