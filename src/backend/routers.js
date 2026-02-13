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

  try {
    if (!isLoggedIn()) {
      return redirect('/portal-landing');
    }

    const userRole = await getUserRole();
    console.log(`[Router] User ${request.user ? request.user.id : 'Anon'} Role: ${userRole || 'None'}, Path: ${path}`);

    switch (path[0]) {
      case 'defendant':
        if (userRole === ROLES.DEFENDANT) {
          return redirect('/portal-defendant');
        } else {
          return redirect('/portal-landing');
        }
      case 'indemnitor':
        if (userRole === ROLES.INDEMNITOR || userRole === ROLES.COINDEMNITOR) {
          return redirect('/portal-indemnitor');
        } else {
          return redirect('/portal-landing');
        }
      case 'staff':
        if (userRole === ROLES.STAFF || userRole === ROLES.ADMIN) {
          return redirect('/portal-staff');
        } else {
          return redirect('/portal-landing');
        }
      case 'landing':
        return redirect('/portal-landing');
      case undefined:
      case '':
        if (userRole === ROLES.DEFENDANT) return redirect('/portal-defendant');
        if (userRole === ROLES.STAFF || userRole === ROLES.ADMIN) return redirect('/portal-staff');
        if (userRole === ROLES.INDEMNITOR || userRole === ROLES.COINDEMNITOR) return redirect('/portal-indemnitor');
        return redirect('/portal-landing');
      default:
        return redirect('/portal-landing');
    }
  } catch (error) {
    console.error('[Router] Error in portal_Router:', error);
    return redirect('/portal-landing');
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
