/**
 * public/session-manager.js
 * Client-side session management for custom role-based authentication
 * NO Wix Members dependency - pure custom session system
 */

const SESSION_KEY = 'shamrock_portal_session';

/**
 * Session Manager - Client-side utilities for custom authentication
 */
export const SessionManager = {
  /**
   * Store session token in browser localStorage
   */
  setSession(sessionToken) {
    if (!sessionToken) {
      console.error('SessionManager: Cannot set empty session token');
      return false;
    }
    
    try {
      localStorage.setItem(SESSION_KEY, sessionToken);
      console.log('SessionManager: Session token stored');
      return true;
    } catch (e) {
      console.error('SessionManager: Error storing session:', e);
      return false;
    }
  },

  /**
   * Get session token from browser localStorage
   */
  getSession() {
    try {
      const token = localStorage.getItem(SESSION_KEY);
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
      localStorage.removeItem(SESSION_KEY);
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
