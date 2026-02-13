/**
 * Velo Routers Module
 * 
 * Handles custom routing for the /portal/ pages.
 * This allows for dynamic content and role-based access control.
 * 
 * NOTE: The actual pages use hyphenated URLs (portal-defendant, portal-indemnitor, portal-staff)
 * This router handles the /portal/ prefix and redirects to the correct hyphenated pages.
 * 
 * @module routers
 */

import { ok, notFound, redirect } from 'wix-router';
import { isLoggedIn, getUserRole, ROLES } from './portal-auth';
import { bailbonds_Router } from './bail-bonds-router';

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

  try {
    // Check if user is logged in
    // Note: 'isLoggedIn' verifies if the Wix User is authenticated
    if (!isLoggedIn()) {
      // User is NOT logged in.
      // Redirect to the hyphenated portal-landing page
      return redirect('/portal-landing');
    }

    const userRole = await getUserRole();
    console.log(`[Router] User ${request.user ? request.user.id : 'Anon'} Role: ${userRole || 'None'}, Path: ${path}`);

    switch (path[0]) {
      case 'defendant':
        if (userRole === ROLES.DEFENDANT) {
          // Redirect to hyphenated URL
          return redirect('/portal-defendant');
        } else {
          // Wrong role? redirect to landing
          return redirect('/portal-landing');
        }
      case 'indemnitor':
        if (userRole === ROLES.INDEMNITOR || userRole === ROLES.COINDEMNITOR) {
          // Redirect to hyphenated URL
          return redirect('/portal-indemnitor');
        } else {
          return redirect('/portal-landing');
        }
      case 'staff':
        if (userRole === ROLES.STAFF || userRole === ROLES.ADMIN) {
          // Redirect to hyphenated URL
          return redirect('/portal-staff');
        } else {
          return redirect('/portal-landing');
        }
      case 'landing':
        // /portal/landing -> /portal-landing
        return redirect('/portal-landing');
      case undefined:
      case '':
        // Root /portal/ path
        // Behavior: If they have a role, redirect them to their dashboard
        // If they don't have a role, show the landing page
        if (userRole === ROLES.DEFENDANT) return redirect('/portal-defendant');
        if (userRole === ROLES.STAFF || userRole === ROLES.ADMIN) return redirect('/portal-staff');
        if (userRole === ROLES.INDEMNITOR || userRole === ROLES.COINDEMNITOR) return redirect('/portal-indemnitor');

        // No role? Redirect to landing page
        return redirect('/portal-landing');

      default:
        // Unknown path - redirect to landing
        return redirect('/portal-landing');
    }
  } catch (error) {
    console.error("[Router] Error in portal_Router:", error);
    // Fallback to landing instead of crashing
    return redirect('/portal-landing');
  }
}

/**
 * Hook for before router for /portal/ prefix.
 * 
 * @param {WixRouterRequest} request
 * @returns {WixRouterRequest}
 */
export function portal_beforeRouter(request) {
  return request;
}

/**
 * Hook for after router for /portal/ prefix.
 * 
 * @param {WixRouterRequest} request
 * @param {WixRouterResponse} response
 * @returns {WixRouterResponse}
 */
export function portal_afterRouter(request, response) {
  return response;
}

export { bailbonds_Router, bailbonds_Router as florida_bail_bonds_Router };
