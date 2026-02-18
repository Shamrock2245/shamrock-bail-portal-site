/**
 * Velo Routers Module
 * 
 * Handles custom routing for the /portal/ pages.
 * This allows for dynamic content and role-based access control.
 * 
 * NOTE: The actual pages use hyphenated URLs (portal-defendant, portal-indemnitor, portal-staff)
 * This router handles the /portal/ prefix and redirects to the correct hyphenated URLs.
 * 
 * @module routers
 */

import { redirect } from 'wix-router';
import { isLoggedIn, getUserRole, ROLES } from './portal-auth';
import { routeCountyPage } from './bail-bonds-router';

/**
 * Router for the /portal/ prefix.
 * Handles routing for the main portal landing page and role-specific portals.
 * 
 * IMPORTANT: Pages are configured as Main Pages with hyphenated URLs:
 * - /portal-landing
 * - /portal-defendant
 * - /portal-indemnitor
 * - /portal-staff
 * 
 * This router redirects /portal/* requests to the correct hyphenated URLs.
 * 
 * @param {WixRouterRequest} request
 * @returns {WixRouterResponse}
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
    // 1. Check Login Status
    // If not logged in, send to landing (passing query params in case it's a magic link token)
    if (!isLoggedIn()) {
      return redirectWithQuery('/portal-landing');
    }

    // 2. Check User Role
    const userRole = await getUserRole();
    console.log(`[Router] User ${request.user ? request.user.id : 'Anon'} Role: ${userRole || 'None'}, Path: ${path}`);

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
