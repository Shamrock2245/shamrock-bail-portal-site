/**
 * LegacyPaperworkGuard.js
 *
 * Retires pre-BondCase SignNow packet routes without changing the public GAS
 * deployment. Active paperwork is DocuSeal-first in shamrock-leads and may
 * proceed only from a validated Match and BondCase with explicit surety, POA,
 * and staff approval. This guard intentionally creates no packet, signing link,
 * payment request, client contact, or record mutation.
 */

function blockLegacyDirectPaperwork_(source) {
  const result = {
    success: false,
    code: 'LEGACY_DIRECT_PAPERWORK_DISABLED',
    error: 'Direct paperwork is disabled. Use the Super CRM DocuSeal workflow after a validated match, bonded case, explicit surety, assigned POA, and staff approval.',
    requires_staff_review: true
  };

  try {
    if (typeof logSecurityEvent === 'function') {
      logSecurityEvent('LEGACY_DIRECT_PAPERWORK_BLOCKED', {
        source: String(source || 'unknown'),
        reason: 'Direct SignNow route retired in favor of the validated DocuSeal workflow'
      });
    }
  } catch (auditError) {
    // Preserve fail-closed behavior even if the audit sink is unavailable.
    console.warn('Legacy direct paperwork route blocked; audit sink unavailable.');
  }

  return result;
}
