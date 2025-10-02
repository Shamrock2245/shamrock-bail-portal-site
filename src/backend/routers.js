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

  // Check if user is logged in
  if (!isLoggedIn()) {
    // Redirect to custom login page if not logged in
    return redirect('/Custom Login'); // Assuming '/Custom Login' is the existing login page
  }

  const userRole = await getUserRole();

  switch (path[0]) {
    case 'defendant':
      if (userRole === ROLES.DEFENDANT) {
        return ok('portal-defendant'); // Render the 'portal-defendant' page
      } else {
        return redirect('/portal'); // Redirect to portal landing if wrong role
      }
    case 'indemnitor':
      if (userRole === ROLES.INDEMNITOR || userRole === ROLES.COINDEMNITOR) {
        return ok('portal-indemnitor'); // Render the 'portal-indemnitor' page
      } else {
        return redirect('/portal'); // Redirect to portal landing if wrong role
      }
    case 'staff':
      if (userRole === ROLES.STAFF || userRole === ROLES.ADMIN) {
        return ok('portal-staff'); // Render the 'portal-staff' page
      } else {
        return redirect('/portal'); // Redirect to portal landing if wrong role
      }
    case undefined:
      // Root /portal/ path, show role selection or redirect based on role
      return ok('portal-landing'); // Render the 'portal-landing' page
    default:
      return notFound(); // Handle unknown paths under /portal/
  }
}

/**
 * Hook for before router for /portal/ prefix.
 * Can be used for additional checks before the router logic.
 * 
 * @param {WixRouterRequest} request
 * @returns {WixRouterResponse|Promise<WixRouterResponse>}
 */
export function portal_beforeRouter(request) {
  // Example: Log request details
  console.log(`Incoming request to /portal/: ${request.url}`);
  return request; // Continue with the request
}

/**
 * Hook for after router for /portal/ prefix.
 * Can be used to modify response or log after routing.
 * 
 * @param {WixRouterRequest} request
 * @param {WixRouterResponse} response
 * @returns {WixRouterResponse|Promise<WixRouterResponse>}
 */
export function portal_afterRouter(request, response) {
  // Example: Add a custom header
  // response.headers['X-Custom-Header'] = 'Portal-Route-Handled';
  return response; // Continue with the response
}

