/**
 * Velo Routers Module
 * 
 * Handles custom routing for the /portal/ pages.
 * This allows for dynamic content and role-based access control.
 * 
 * @module routers
 */

import { ok, notFound, redirect } from 'wix-router';
import { isLoggedIn, getUserRole, ROLES } from './portal-auth';

/**
 * Router for the /portal/ prefix.
 * Handles routing for the main portal landing page and role-specific portals.
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
      // Instead of sending them to the default Wix Login ('/custom-login'),
      // we send them to our custom Portal Landing page where they can:
      // 1. Enter a Magic Link
      // 2. Click "Start Bond" (which triggers login)
      return ok('portal-landing');
    }

    const userRole = await getUserRole();
    console.log(`[Router] User ${request.user ? request.user.id : 'Anon'} Role: ${userRole || 'None'}, Path: ${path}`);

    switch (path[0]) {
      case 'defendant':
        if (userRole === ROLES.DEFENDANT) {
          return ok('portal-defendant');
        } else {
          // Wrong role? specific redirect or consistent landing
          return redirect('/portal');
        }
      case 'indemnitor':
        if (userRole === ROLES.INDEMNITOR || userRole === ROLES.COINDEMNITOR) {
          return ok('portal-indemnitor');
        } else {
          return redirect('/portal');
        }
      case 'staff':
        if (userRole === ROLES.STAFF || userRole === ROLES.ADMIN) {
          return ok('portal-staff');
        } else {
          return redirect('/portal');
        }
      case undefined:
      case '':
        // Root /portal/ path
        // Behavior: If they have a role, we SHOULD redirect them to their dashboard
        // If they don't have a role, show the landing page
        if (userRole === ROLES.DEFENDANT) return redirect('/portal/defendant');
        if (userRole === ROLES.STAFF || userRole === ROLES.ADMIN) return redirect('/portal/staff');
        if (userRole === ROLES.INDEMNITOR || userRole === ROLES.COINDEMNITOR) return redirect('/portal/indemnitor');

        // No role? Show landing page (Login/Claim Access)
        return ok('portal-landing');

      default:
        return notFound();
    }
  } catch (error) {
    console.error("[Router] Error in portal_Router:", error);
    // Fallback to landing instead of crashing
    return ok('portal-landing');
  }
}

/**
 * Hook for before router for /portal/ prefix.
 * 
 * @param {WixRouterRequest} request
 * @returns {WixRouterResponse|Promise<WixRouterResponse>}
 */
export function portal_beforeRouter(request) {
  return request;
}

/**
 * Hook for after router for /portal/ prefix.
 * 
 * @param {WixRouterRequest} request
 * @param {WixRouterResponse} response
 * @returns {WixRouterResponse|Promise<WixRouterResponse>}
 */
export function portal_afterRouter(request, response) {
  return response;
}
