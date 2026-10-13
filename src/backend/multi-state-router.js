/**
 * Multi-State Bail Bonds Router Module
 * 
 * Handles dynamic routing for out-of-state jurisdictions:
 * - /bail-bonds/{state-code}           (e.g., /bail-bonds/ga, /bail-bonds/tx)
 * - /bail-bonds/{state-code}/{county}  (e.g., /bail-bonds/ga/fulton, /bail-bonds/tx/harris)
 * 
 * Preserves Florida-first SEO routes (/florida-bail-bonds/{slug}) without regression.
 * Integrates with EXPANSION_STATES definitions.
 * 
 * @module multi-state-router
 */

import { ok, redirect } from 'wix-router';
import { EXPANSION_STATES } from 'public/portal-config';
import { isStateLive } from 'backend/service-areas';
import { floridaCountyCanonicalPath } from 'backend/seo-redirects';

const MULTI_STATE_PAGE = 'Florida Counties'; // Uses the dynamic location template

/**
 * Route handler for multi-state paths
 * @param {Object} request - Wix Router Request
 * @returns {Promise<Object>} Wix Router Response
 */
export async function routeMultiStatePage(request) {
  const pathSegments = request.path || [];
  
  // If single segment (e.g. /bail-bonds/lee or /bail-bonds/ga)
  if (pathSegments.length === 1) {
    const raw = (pathSegments[0] || '').toLowerCase().trim();
    const stateMatch = Object.keys(EXPANSION_STATES).find(k => k.toLowerCase() === raw || EXPANSION_STATES[k].slug === raw);
    
    if (stateMatch) {
      const stateInfo = EXPANSION_STATES[stateMatch];
      const live = await isStateLive(stateInfo.code);
      if (!live) {
        // Do not publish empty or non-live state pages
        return redirect('/#counties');
      }

      return ok(MULTI_STATE_PAGE, {
        title: `${stateInfo.name} Bail Bonds | 24/7 Jail Release | Shamrock`,
        description: `Licensed 24/7 bail bond services in ${stateInfo.name}. Phone consultations, payment plans, and jail release help. Call (239) 332-2245.`,
        state: stateInfo.code,
        stateName: stateInfo.name,
        slug: stateInfo.slug,
        isStateDirectory: true
      });
    }

    // Florida county aliases 301 to the canonical county URL. State codes
    // above are unchanged. Unknown single segments still render below.
    const countyTarget = floridaCountyCanonicalPath(raw);
    if (countyTarget) {
      return redirect(countyTarget, '301');
    }

    // Default to Florida county slug fallback if it's a FL county name
    const cleanCountySlug = raw.replace(/-county$/i, '');
    return ok(MULTI_STATE_PAGE, {
      title: `${cleanCountySlug.toUpperCase()} Bail Bonds | Florida Jail Release | Shamrock`,
      description: `24/7 bail bonds for ${cleanCountySlug} County. Licensed Florida agents, jail release help. Call (239) 332-2245.`,
      slug: cleanCountySlug,
      state: 'FL',
      stateName: 'Florida'
    });
  }

  // If two segments (e.g. /bail-bonds/ga/fulton or /bail-bonds/tx/harris)
  if (pathSegments.length >= 2) {
    const stateCode = (pathSegments[0] || '').toUpperCase();
    const countySlug = (pathSegments[1] || '').toLowerCase().trim().replace(/-county$/i, '');
    const stateInfo = EXPANSION_STATES[stateCode] || { name: stateCode, code: stateCode };

    const live = await isStateLive(stateInfo.code);
    if (!live) {
      // Do not publish empty or non-live state pages
      return redirect('/#counties');
    }

    const countyDisplay = countySlug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return ok(MULTI_STATE_PAGE, {
      title: `${countyDisplay} County Bail Bonds, ${stateInfo.code} | 24/7 Jail Release | Shamrock`,
      description: `24/7 bail bonds in ${countyDisplay} County, ${stateInfo.name}. Licensed agents, online paperwork. Call (239) 332-2245.`,
      countyName: `${countyDisplay} County`,
      slug: countySlug,
      state: stateInfo.code,
      stateName: stateInfo.name,
      isStateDirectory: false
    });
  }

  return redirect('/#counties');
}

export default {
  routeMultiStatePage
};
