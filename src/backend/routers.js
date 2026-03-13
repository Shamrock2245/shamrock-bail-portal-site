/**
 * Velo Routers Module
 * 
 * Handles custom routing for the /portal/ pages.
 * This allows for dynamic content and role-based access control.
 * 
 * NOTE: The actual pages use hyphenated URLs (portal-defendant, portal-indemnitor, portal-staff)
 * This router handles the /portal/ prefix and redirects to the correct hyphenated URLs.
 * 
 * AUDIT FIX C-02: Replaced broken isLoggedIn/getUserRole imports with
 * validateCustomSession (the actual auth pattern used by all portal pages).
 * 
 * @module routers
 */

import { redirect } from 'wix-router';
import { validateCustomSession } from 'backend/portal-auth';
import { routeCountyPage } from 'backend/bail-bonds-router';

const ROLES = {
  DEFENDANT: 'defendant',
  INDEMNITOR: 'indemnitor',
  COINDEMNITOR: 'coindemnitor',
  STAFF: 'staff',
  ADMIN: 'admin'
};

/**
 * Router for the /portal/ prefix.
 * Uses session token from query params (?st=...) for authentication,
 * matching the pattern used across all portal pages.
 * 
 * @param {Object} request - Wix Router Request
 * @returns {Object} - Wix Router Response (redirect)
 */
export async function portal_Router(request) {
  const path = request.path;
  const query = request.query || {};

  // Helper to build redirect URL with preserved query params
  function redirectWithQuery(targetPath) {
    const queryString = Object.keys(query)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
      .join('&');
    const fullUrl = queryString ? `${targetPath}?${queryString}` : targetPath;
    return redirect(fullUrl);
  }

  try {
    // 1. Check for session token (matches portal page auth pattern)
    const token = query.st || '';
    let userRole = null;

    if (token) {
      const session = await validateCustomSession(token);
      if (session && session.valid) {
        userRole = session.role;
        console.log(`[Router] Validated session — Role: ${userRole}, Path: ${path}`);
      } else {
        console.log(`[Router] Invalid/expired session token, redirecting to landing`);
      }
    }

    // 2. If no valid session, send to landing page
    if (!userRole) {
      return redirectWithQuery('/portal-landing');
    }

    // 3. Route based on path and validated role
    switch (path[0]) {
      case 'defendant':
        if (userRole === ROLES.DEFENDANT) {
          return redirectWithQuery('/portal-defendant');
        } else {
          return redirectWithQuery('/portal-landing');
        }

      case 'indemnitor':
        if (userRole === ROLES.INDEMNITOR || userRole === ROLES.COINDEMNITOR) {
          return redirectWithQuery('/portal-indemnitor');
        } else {
          return redirectWithQuery('/portal-landing');
        }

      case 'staff':
        if (userRole === ROLES.STAFF || userRole === ROLES.ADMIN) {
          return redirectWithQuery('/portal-staff');
        } else {
          return redirectWithQuery('/portal-landing');
        }

      case 'landing':
        return redirectWithQuery('/portal-landing');

      case undefined:
      case '':
        // Intelligent root redirect based on role
        if (userRole === ROLES.DEFENDANT) return redirectWithQuery('/portal-defendant');
        if (userRole === ROLES.STAFF || userRole === ROLES.ADMIN) return redirectWithQuery('/portal-staff');
        if (userRole === ROLES.INDEMNITOR || userRole === ROLES.COINDEMNITOR) return redirectWithQuery('/portal-indemnitor');
        return redirectWithQuery('/portal-landing');

      default:
        // Unknown path - redirect to landing
        return redirectWithQuery('/portal-landing');
    }
  } catch (error) {
    console.error("[Router] Error in portal_Router:", error);
    // Fallback to landing (preserve query even in error case)
    return redirectWithQuery('/portal-landing');
  }
}

export function portal_beforeRouter(request) {
  return request;
}

export function portal_afterRouter(request, response) {
  return response;
}

// County router aliases for both URL prefixes.
export async function bailbonds_Router(request) {
  return routeCountyPage(request);
}

export async function bail_bonds_Router(request) {
  return routeCountyPage(request);
}

export async function florida_bail_bonds_Router(request) {
  return routeCountyPage(request);
}
