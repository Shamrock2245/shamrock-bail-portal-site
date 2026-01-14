/**
 * public/session-manager.js
 * Client-side session management for custom role-based authentication
 * NO Wix Members dependency - pure custom session system
 * 
 * STANDARD: Uses wix-storage (standard Velo API)
 */

import { local } from 'wix-storage';

const SESSION_KEY = 'shamrock_portal_session';

/**
 * Session Manager - Client-side utilities for custom authentication
 * Uses Wix's storage API
 */
export const SessionManager = {
  /**
   * Store session token in browser storage
   */
  setSession(sessionToken) {
    if (!sessionToken) {
      console.error('SessionManager: Cannot set empty session token');
      return false;
    }

    try {
      if (!local) {
        console.error('SessionManager: wix-storage "local" is undefined');
        return false;
      }
      local.setItem(SESSION_KEY, sessionToken);
      console.log('SessionManager: Session token stored successfully');

      // Verification
      const verify = local.getItem(SESSION_KEY);
      if (verify !== sessionToken) {
        console.error('SessionManager: Immediate verification failed!');
        return false;
      }

      return true;
    } catch (e) {
      console.error('SessionManager: Error storing session:', e);
      return false;
    }
  },

  /**
   * Get session token from browser storage
   */
  getSession() {
    try {
      if (!local) {
        console.error('SessionManager: wix-storage "local" is undefined');
        return null;
      }
      const token = local.getItem(SESSION_KEY);
      // console.log('SessionManager: Retrieved token:', token ? 'YES' : 'NO');
      return token || null;
    } catch (e) {
      console.error('SessionManager: Error retrieving session:', e);
      return null;
    }
  },

  /**
   * Clear session token (logout)
   */
  clearSession() {
    try {
      if (!local) return false;
      local.removeItem(SESSION_KEY);
      console.log('SessionManager: Session cleared');
      return true;
    } catch (e) {
      console.error('SessionManager: Error clearing session:', e);
      return false;
    }
  },

  /**
   * Check if session exists in browser
   */
  hasSession() {
    return !!this.getSession();
  }
};

/**
 * Export for use in page code
 */
export function getSessionToken() {
  return SessionManager.getSession();
}

export function setSessionToken(token) {
  return SessionManager.setSession(token);
}

export function clearSessionToken() {
  return SessionManager.clearSession();
}

export function hasSessionToken() {
  return SessionManager.hasSession();
}

/**
 * GUARANTEE: Gets existing session or creates new one immediately.
 * Truth Source for all downstream logging.
 */
export function getOrSetSessionId() {
  let token = SessionManager.getSession();
  if (!token) {
    // Generate new UUID v4
    token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    SessionManager.setSession(token);
    console.log("SessionManager: New Session ID generated:", token);
  }
  return token;
}
