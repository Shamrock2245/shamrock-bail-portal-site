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
    // Simplified router: deterministic path forwarding without auth checks
    // Auth is handled by the target pages themselves
    
    switch (path[0]) {
      case 'defendant':
        return redirectWithQuery('/portal-defendant');
      
      case 'indemnitor':
        return redirectWithQuery('/portal-indemnitor');
      
      case 'staff':
        return redirectWithQuery('/portal-staff');
      
      case 'landing':
        // /portal/landing?token=... -> /portal-landing?token=...
        return redirectWithQuery('/portal-landing');
      
      case undefined:
      case '':
        // Root /portal/ path -> landing
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

/**
 * Router aliases for county pages.
 *
 * Wix maps route prefixes to exported function names where hyphens become underscores.
 * Defining concrete functions here (instead of only re-export aliases) ensures the Wix
 * router runtime can resolve these handlers for all legacy and current URL prefixes.
 */
export async function bailbonds_Router(request) {
  return routeCountyPage(request);
}

export async function bail_bonds_Router(request) {
  return routeCountyPage(request);
}

export async function florida_bail_bonds_Router(request) {
  return routeCountyPage(request);
}
