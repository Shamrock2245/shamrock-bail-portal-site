/**
 * public/session-manager.js
 * Client-side session management for custom role-based authentication
 * NO Wix Members dependency - pure custom session system
 * 
 * UPDATED: 2026-01-31
 * - Added memory fallback for when storage is unavailable
 * - Added session storage as primary (persists across page navigations)
 * - Added local storage as backup (persists across browser sessions)
 * - Added debug logging for troubleshooting
 * 
 * STORAGE STRATEGY:
 * 1. Try session storage first (survives page refresh/navigation)
 * 2. Sync to local storage as backup (survives browser close)
 * 3. Memory fallback if both fail (survives within single page load)
 */

import { local, session } from 'wix-storage';

const SESSION_KEY = 'shamrock_portal_session';
const SESSION_DATA_KEY = 'shamrock_portal_session_data';
const ANALYTICS_KEY = 'shamrock_analytics_id';

// Memory fallback for when storage APIs fail
let memorySession = null;
let memorySessionData = null;

/**
 * Session Manager - Client-side utilities for custom authentication
 * Uses multiple storage layers for maximum persistence
 */
export const SessionManager = {
  /**
   * Store session token in browser storage (multiple layers)
   * @param {string} sessionToken - The session token to store
   * @param {Object} sessionData - Optional session data (role, name, etc.)
   */
  setSession(sessionToken, sessionData = null) {
    if (!sessionToken) {
      console.error('SessionManager: Cannot set empty session token');
      return false;
    }

    let success = false;

    // Layer 1: Session Storage (primary - survives page navigation)
    try {
      if (session) {
        session.setItem(SESSION_KEY, sessionToken);
        if (sessionData) {
          session.setItem(SESSION_DATA_KEY, JSON.stringify(sessionData));
        }
        console.log('SessionManager: Token stored in session storage ✓');
        success = true;
      }
    } catch (e) {
      console.warn('SessionManager: Session storage failed:', e.message);
    }

    // Layer 2: Local Storage (backup - survives browser close)
    try {
      if (local) {
        local.setItem(SESSION_KEY, sessionToken);
        if (sessionData) {
          local.setItem(SESSION_DATA_KEY, JSON.stringify(sessionData));
        }
        console.log('SessionManager: Token stored in local storage ✓');
        success = true;
      }
    } catch (e) {
      console.warn('SessionManager: Local storage failed:', e.message);
    }

    // Layer 3: Memory (last resort - survives within page load)
    memorySession = sessionToken;
    memorySessionData = sessionData;
    console.log('SessionManager: Token stored in memory ✓');

    // Verification
    const verify = this.getSession();
    if (verify !== sessionToken) {
      console.error('SessionManager: Verification failed! Token not retrievable.');
      return false;
    }

    console.log('SessionManager: Session stored successfully across all layers');
    return success || true; // Memory always works
  },

  /**
   * Get session token from browser storage (checks all layers)
   * @returns {string|null} The session token or null if not found
   */
  getSession() {
    let token = null;

    // Layer 1: Try session storage first
    try {
      if (session) {
        token = session.getItem(SESSION_KEY);
        if (token) {
          // console.log('SessionManager: Token retrieved from session storage');
          return token;
        }
      }
    } catch (e) {
      console.warn('SessionManager: Session storage read failed:', e.message);
    }

    // Layer 2: Try local storage
    try {
      if (local) {
        token = local.getItem(SESSION_KEY);
        if (token) {
          // console.log('SessionManager: Token retrieved from local storage');
          // Sync back to session storage for faster access
          try {
            if (session) session.setItem(SESSION_KEY, token);
          } catch (e) { }
          return token;
        }
      }
    } catch (e) {
      console.warn('SessionManager: Local storage read failed:', e.message);
    }

    // Layer 3: Memory fallback
    if (memorySession) {
      // console.log('SessionManager: Token retrieved from memory');
      return memorySession;
    }

    return null;
  },

  /**
   * Get session data (role, name, etc.)
   * @returns {Object|null} The session data or null
   */
  getSessionData() {
    let data = null;

    // Try session storage
    try {
      if (session) {
        const dataStr = session.getItem(SESSION_DATA_KEY);
        if (dataStr) {
          return JSON.parse(dataStr);
        }
      }
    } catch (e) { }

    // Try local storage
    try {
      if (local) {
        const dataStr = local.getItem(SESSION_DATA_KEY);
        if (dataStr) {
          return JSON.parse(dataStr);
        }
      }
    } catch (e) { }

    // Memory fallback
    return memorySessionData;
  },

  /**
   * Clear session token (logout) from all storage layers
   */
  clearSession() {
    // Clear session storage
    try {
      if (session) {
        session.removeItem(SESSION_KEY);
        session.removeItem(SESSION_DATA_KEY);
      }
    } catch (e) { }

    // Clear local storage
    try {
      if (local) {
        local.removeItem(SESSION_KEY);
        local.removeItem(SESSION_DATA_KEY);
      }
    } catch (e) { }

    // Clear memory
    memorySession = null;
    memorySessionData = null;

    console.log('SessionManager: Session cleared from all layers');
    return true;
  },

  /**
   * Check if session exists in any storage layer
   */
  hasSession() {
    return !!this.getSession();
  },

  /**
   * Debug: Log current session state across all layers
   */
  debugSessionState() {
    console.log('=== SESSION DEBUG STATE ===');
    
    try {
      console.log('Session Storage:', session ? session.getItem(SESSION_KEY) : 'N/A');
    } catch (e) {
      console.log('Session Storage: ERROR -', e.message);
    }

    try {
      console.log('Local Storage:', local ? local.getItem(SESSION_KEY) : 'N/A');
    } catch (e) {
      console.log('Local Storage: ERROR -', e.message);
    }

    console.log('Memory:', memorySession || 'N/A');
    console.log('===========================');
  }
};

/**
 * Export convenience functions for use in page code
 */
export function getSessionToken() {
  return SessionManager.getSession();
}

export function setSessionToken(token, data = null) {
  return SessionManager.setSession(token, data);
}

export function clearSessionToken() {
  return SessionManager.clearSession();
}

export function hasSessionToken() {
  return SessionManager.hasSession();
}

export function getSessionData() {
  return SessionManager.getSessionData();
}

export function debugSession() {
  return SessionManager.debugSessionState();
}

/**
 * GUARANTEE: Gets existing ANALYTICS session or creates new one immediately.
 * Truth Source for all downstream logging.
 * NOTE: This is distinct from the Auth Token (SESSION_KEY) to prevent
 * anonymous users from triggering invalid auth warnings.
 */
export function getOrSetSessionId() {
  try {
    // Try session storage first
    let id = null;
    
    try {
      if (session) id = session.getItem(ANALYTICS_KEY);
    } catch (e) { }

    if (!id) {
      try {
        if (local) id = local.getItem(ANALYTICS_KEY);
      } catch (e) { }
    }

    if (!id) {
      // Generate new UUID v4
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      // Store in both
      try { if (session) session.setItem(ANALYTICS_KEY, id); } catch (e) { }
      try { if (local) local.setItem(ANALYTICS_KEY, id); } catch (e) { }
      
      console.log("SessionManager: New Analytics ID generated:", id);
    }
    return id;
  } catch (e) {
    console.error("SessionManager: Error in getOrSetSessionId", e);
    return 'error-generating-id';
  }
}
