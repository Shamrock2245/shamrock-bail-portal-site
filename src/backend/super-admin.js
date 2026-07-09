/**
 * Super Admin Identity — Shamrock Ecosystem
 *
 * Single source of truth for who always gets full admin privileges
 * when authenticated on the Wix portal (and documented for sister apps).
 *
 * Canonical super-admin email: admin@shamrockbailbonds.biz
 *
 * Sister apps (must stay aligned):
 *   - shamrock-bail-school/lib/auth.ts  (ADMIN_EMAILS + SUPER_ADMIN_EMAILS)
 *   - shamrock-leads/dashboard/auth/super_admin.py
 *   - shamrock-node-red docs/SUPER_ADMIN.md
 */

/** Always-admin emails (hardcoded — never depend solely on CMS/config). */
export const SUPER_ADMIN_EMAILS = Object.freeze([
    'admin@shamrockbailbonds.biz',
]);

/** Stable personId for the primary super admin (portal sessions / magic links). */
export const SUPER_ADMIN_PERSON_ID = 'staff_admin_primary';

/**
 * Normalize email for comparison.
 * @param {string} email
 * @returns {string}
 */
export function normalizeAdminEmail(email) {
    return email ? String(email).toLowerCase().trim() : '';
}

/**
 * @param {string} email
 * @returns {boolean}
 */
export function isSuperAdminEmail(email) {
    const normalized = normalizeAdminEmail(email);
    if (!normalized) return false;
    return SUPER_ADMIN_EMAILS.includes(normalized);
}

/**
 * Full staff/admin profile when email is a known super admin.
 * @param {string} email
 * @returns {{ role: 'admin', name: string, personId: string, email: string, isStaff: true, isSuperAdmin: true } | null}
 */
export function getSuperAdminProfile(email) {
    if (!isSuperAdminEmail(email)) return null;
    return {
        role: 'admin',
        name: 'Admin',
        personId: SUPER_ADMIN_PERSON_ID,
        email: normalizeAdminEmail(email),
        isStaff: true,
        isSuperAdmin: true,
    };
}

/**
 * Elevate a role to admin if the email is super-admin.
 * @param {string} role
 * @param {string} email
 * @returns {string}
 */
export function elevateRoleIfSuperAdmin(role, email) {
    if (isSuperAdminEmail(email)) return 'admin';
    return role || 'indemnitor';
}
