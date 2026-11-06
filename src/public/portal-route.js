/**
 * Authenticated /portal-landing destinations.
 *
 * Live Wix paths that may receive a session are /portal-indemnitor and
 * /portal-defendant. Staff go to Super CRM with no session token on the URL.
 * /portal-staff and /portal-landing are not destinations: /portal-staff 301s
 * back to /portal-landing and would loop a magic link.
 *
 * No Wix imports, so node tests can load this module directly.
 */

export const PORTAL_OPEN_FAILED_MESSAGE = "We couldn't open your portal. Please call (239) 332-2245.";

const DASHBOARD_PATHS = {
    defendant: '/portal-defendant',
    indemnitor: '/portal-indemnitor',
    coindemnitor: '/portal-indemnitor'
};

const CLIENT_ROLES = ['defendant', 'indemnitor', 'coindemnitor'];
const STAFF_ROLES = ['staff', 'admin', 'superadmin'];

/**
 * New visitors are flagged on the magic-link record. A person id minted as
 * new_<token> is the same signal when an older record has no flag.
 * @param {object|null|undefined} linkData
 * @returns {boolean}
 */
export function magicLinkIsNewUser(linkData) {
    if (!linkData || typeof linkData !== 'object') return false;
    if (linkData.isNewUser === true) return true;
    const personId = linkData.personId == null ? '' : String(linkData.personId);
    return personId.startsWith('new_');
}

/**
 * Where an authenticated portal-landing session may go.
 * Student traffic is separated by the page before this runs.
 * @returns {{ action: 'redirect', target: string, path?: string, st?: string, role?: string }
 *   | { action: 'fail', message: string }}
 */
export function resolveAuthenticatedDestination(role, sessionToken, isNewUser) {
    const cleanRole = String(role || '').toLowerCase().trim();
    const st = sessionToken == null ? '' : String(sessionToken);

    if (STAFF_ROLES.includes(cleanRole)) {
        return { action: 'redirect', target: 'crm' };
    }

    const dashboardPath = DASHBOARD_PATHS[cleanRole];
    if (dashboardPath && !isNewUser) {
        if (!st) return { action: 'fail', message: PORTAL_OPEN_FAILED_MESSAGE };
        return { action: 'redirect', target: 'path', path: dashboardPath, st: st };
    }

    if (CLIENT_ROLES.includes(cleanRole)) {
        return { action: 'redirect', target: 'paperwork', role: cleanRole, st: st };
    }

    return { action: 'fail', message: PORTAL_OPEN_FAILED_MESSAGE };
}

/**
 * Build the URL for a destination decision. The CRM target is the CRM origin
 * alone: the session token is never appended.
 */
export function materializePortalDestination(decision, deps) {
    const options = deps || {};
    if (!decision || decision.action !== 'redirect') return '';

    if (decision.target === 'crm') {
        return String(options.crmUrl || '');
    }

    if (decision.target === 'path') {
        if (decision.path !== '/portal-indemnitor' && decision.path !== '/portal-defendant') return '';
        if (!decision.st) return '';
        return decision.path + '?st=' + encodeURIComponent(decision.st);
    }

    if (decision.target === 'paperwork') {
        if (typeof options.buildPaperworkLaunchpadUrl !== 'function') return '';
        return options.buildPaperworkLaunchpadUrl({
            role: decision.role,
            st: decision.st,
            county: options.county || '',
            source: 'wix-portal-landing'
        });
    }

    return '';
}

/**
 * Redirect only to the two live member dashboards, the paperwork app, or the
 * exact Super CRM origin. Anything else, including /portal-landing and
 * /portal-staff, is refused.
 */
export function isAllowedPortalRedirect(url, allow) {
    const raw = String(url || '').trim();
    if (!raw) return false;
    if (raw.startsWith('//') || /^javascript:/i.test(raw) || /^data:/i.test(raw)) return false;

    const crm = String((allow && allow.crmUrl) || '').trim().replace(/\/$/, '');
    const paperwork = String((allow && allow.paperworkUrl) || '').trim();
    if (!crm || !paperwork) return false;

    if (raw === crm || raw === crm + '/') return true;

    let paperworkOrigin = '';
    let paperworkPath = '/';
    let crmOrigin = '';
    try {
        const paperworkBase = new URL(paperwork);
        paperworkOrigin = paperworkBase.origin;
        paperworkPath = paperworkBase.pathname || '/';
        crmOrigin = new URL(crm).origin;
    } catch (e) {
        return false;
    }

    if (/^https?:\/\//i.test(raw)) {
        let parsed;
        try {
            parsed = new URL(raw);
        } catch (e) {
            return false;
        }
        if (parsed.origin === crmOrigin) return false;
        if (parsed.origin !== paperworkOrigin) return false;
        const basePath = paperworkPath.endsWith('/') ? paperworkPath : paperworkPath + '/';
        const path = parsed.pathname.endsWith('/') ? parsed.pathname : parsed.pathname + '/';
        if (path !== basePath && !path.startsWith(basePath)) return false;
        if (parsed.pathname === '/portal-landing' || parsed.pathname === '/portal-staff') return false;
        return true;
    }

    const pathOnly = raw.split('#')[0].split('?')[0];
    if (pathOnly !== '/portal-indemnitor' && pathOnly !== '/portal-defendant') return false;
    if (raw.includes('://') || raw.includes('\\')) return false;
    return true;
}
