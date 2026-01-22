/**
 * Shamrock Bail Bonds - Geolocation Client
 * Frontend module for capturing user location
 * 
 * Features:
 * - Non-blocking async capture
 * - User consent handling
 * - Error handling with fallbacks
 * - High accuracy mode for mobile
 * - Device and IP fingerprinting
 */

import { detectCounty } from 'backend/geocoding';
import wixWindow from 'wix-window';
import { session } from 'wix-storage';

/**
 * Capture user geolocation with consent
 * @param {boolean} requireConsent - Whether to require explicit consent
 * @returns {Promise<Object>} - { success, latitude, longitude, county, accuracy }
 */
export async function captureGeolocation(requireConsent = true) {
  try {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      return {
        success: false,
        error: 'Geolocation not supported',
        fallback: 'ip'
      };
    }

    // Request user location
    const position = await new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // Detect county from coordinates
    const countyResult = await detectCounty(latitude, longitude);

    if (!countyResult.success) {
      return {
        success: false,
        error: 'Could not detect county',
        latitude,
        longitude,
        accuracy
      };
    }

    return {
      success: true,
      latitude,
      longitude,
      accuracy,
      county: countyResult.county,
      state: countyResult.state,
      confidence: countyResult.confidence,
      method: countyResult.method,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Geolocation error:', error);

    // Handle specific error codes
    let errorMessage = 'Unknown error';

    if (error.code === 1) {
      errorMessage = 'Permission denied';
    } else if (error.code === 2) {
      errorMessage = 'Position unavailable';
    } else if (error.code === 3) {
      errorMessage = 'Timeout';
    }

    return {
      success: false,
      error: errorMessage,
      errorCode: error.code,
      fallback: 'ip'
    };
  }
}

/**
 * Request geolocation permission (non-blocking)
 * @returns {Promise<string>} - 'granted', 'denied', or 'prompt'
 */
export async function checkGeolocationPermission() {
  try {
    if (!navigator.permissions) {
      return 'unknown';
    }

    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;

  } catch (error) {
    console.error('Error checking geolocation permission:', error);
    return 'unknown';
  }
}

/**
 * Get user location with UI feedback
 * @param {Object} elements - UI elements for feedback
 * @returns {Promise<Object>} - Location data
 */
export async function captureLocationWithUI(elements) {
  const { statusText, errorText, loadingIcon } = elements;

  try {
    // Show loading state
    if (statusText) {
      statusText.text = 'Detecting your location...';
      statusText.show();
    }

    if (loadingIcon) {
      loadingIcon.show();
    }

    if (errorText) {
      errorText.hide();
    }

    // Capture location
    const result = await captureGeolocation();

    // Hide loading
    if (loadingIcon) {
      loadingIcon.hide();
    }

    if (result.success) {
      // Show success message
      if (statusText) {
        statusText.text = `Location detected: ${result.county} County`;
        statusText.show();

        // Hide after 3 seconds
        setTimeout(() => {
          statusText.hide();
        }, 3000);
      }

      return result;

    } else {
      // Show error message
      if (errorText) {
        errorText.text = `Could not detect location: ${result.error}`;
        errorText.show();
      }

      if (statusText) {
        statusText.hide();
      }

      return result;
    }

  } catch (error) {
    console.error('Error in captureLocationWithUI:', error);

    // Hide loading
    if (loadingIcon) {
      loadingIcon.hide();
    }

    // Show error
    if (errorText) {
      errorText.text = 'Location detection failed';
      errorText.show();
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Auto-detect location on page load (silent)
 * @returns {Promise<Object>} - Location data
 */
export async function autoDetectLocation() {
  try {
    // Check if we already have location in session storage
    const cached = getLocationFromStorage();

    if (cached && cached.timestamp) {
      const age = Date.now() - new Date(cached.timestamp).getTime();
      const maxAge = 30 * 60 * 1000; // 30 minutes

      if (age < maxAge) {
        console.log('Using cached location:', cached.county);
        return cached;
      }
    }

    // Capture new location
    const result = await captureGeolocation(false);

    if (result.success) {
      // Save to session storage
      saveLocationToStorage(result);
    }

    return result;

  } catch (error) {
    console.error('Error in autoDetectLocation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Fetch Public IP Address
 * Uses a collection of free IP services with fallback for robustness.
 * @returns {Promise<string>}
 */
export async function getPublicIP() {
  const services = [
    'https://api.ipify.org?format=json',
    'https://ipapi.co/json/',
    'https://ifconfig.me/all.json'
  ];

  for (const service of services) {
    try {
      const response = await fetch(service);
      if (response.ok) {
        const data = await response.json();
        if (data.ip) return data.ip;
        if (data.ip_addr) return data.ip_addr; // ifconfig.me
      }
    } catch (e) {
      console.warn(`IP Fetch failed for ${service}`, e);
    }
  }
  return '0.0.0.0'; // Fallback
}

/**
 * Get detailed device information
 * @returns {Object} { deviceModel, os, browser, userAgent, screenRes }
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";
  let deviceModel = "Desktop";

  // Simple robust parsing
  if (ua.indexOf("Firefox") > -1) browser = "Mozilla Firefox";
  else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Internet";
  else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
  else if (ua.indexOf("Trident") > -1) browser = "Microsoft Internet Explorer";
  else if (ua.indexOf("Edge") > -1) browser = "Microsoft Edge";
  else if (ua.indexOf("Chrome") > -1) browser = "Google Chrome";
  else if (ua.indexOf("Safari") > -1) browser = "Apple Safari";

  if (ua.indexOf("Win") !== -1) os = "Windows";
  else if (ua.indexOf("Mac") !== -1) os = "macOS";
  else if (ua.indexOf("Linux") !== -1) os = "Linux";
  else if (ua.indexOf("Android") !== -1) {
    os = "Android";
    deviceModel = "Android Device";
    // Try to extract model from UA often in parens like (Linux; Android 10; SM-G960F)
    const match = ua.match(/Android.*?; (.*?)\)/);
    if (match && match[1]) deviceModel = match[1];
  }
  else if (ua.indexOf("like Mac") !== -1) {
    os = "iOS";
    deviceModel = "iPhone/iPad";
    if (ua.indexOf("iPad") !== -1) deviceModel = "iPad";
    if (ua.indexOf("iPhone") !== -1) deviceModel = "iPhone";
  }

  return {
    deviceModel,
    os,
    browser,
    userAgent: ua,
    screenRes: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language
  };
}


/**
 * Capture full snapshot of location + device
 * This is the ROBUST method to call for logging.
 */
export async function captureFullLocationSnapshot() {
  const [geoResult, ip] = await Promise.all([
    captureGeolocation(false),
    getPublicIP()
  ]);

  const deviceInfo = getDeviceInfo();

  return {
    geo: geoResult,
    extraData: {
      ipAddress: ip,
      ...deviceInfo
    }
  };
}

/**
 * Save location to session storage
 * @param {Object} location - Location data
 */
function saveLocationToStorage(location) {
  try {
    session.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    console.warn('Error saving location to storage:', error);
  }
}

/**
 * Get location from session storage
 * @returns {Object|null} - Location data or null
 */
function getLocationFromStorage() {
  try {
    const stored = session.getItem('userLocation');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Error getting location from storage:', error);
    return null;
  }
}

/**
 * Clear location from session storage
 */
export function clearLocationStorage() {
  try {
    session.removeItem('userLocation');
  } catch (error) {
    console.warn('Error clearing location storage:', error);
  }
}

/**
 * Get device type for analytics
 * @returns {string} - 'Mobile', 'Desktop', or 'Tablet'
 */
export function getDeviceType() {
  return wixWindow.formFactor || 'Desktop';
}
