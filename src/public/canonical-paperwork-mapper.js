/**
 * Canonical Paperwork Schema & Surety Field Mapper
 * 
 * Standardizes client intake data into a single canonical person/case object model.
 * Maps canonical data onto any surety company packet (OSI, Accredited, Bankers, etc.)
 * so the frontend UI is never coupled to a specific surety's 14-page PDF layout.
 * 
 * Doctrine: "The Website is the Clipboard. The Backend is the Brain."
 * 
 * @module canonical-paperwork-mapper
 */

/**
 * Standard Role Constants
 */
export const ROLES = {
  DEFENDANT: 'defendant',
  INDEMNITOR: 'indemnitor',
  COINDEMNITOR: 'coindemnitor'
};

/**
 * Creates an empty Canonical Person Object
 * @param {string} role - 'defendant' | 'indemnitor' | 'coindemnitor'
 * @returns {Object}
 */
export function createCanonicalPerson(role = ROLES.DEFENDANT) {
  return {
    role,
    firstName: '',
    middleName: '',
    lastName: '',
    fullName: '',
    dob: '',
    ssnLast4: '',
    ssnFull: '',
    dlNumber: '',
    dlState: 'FL',
    dlExpiration: '',
    phone: '',
    email: '',
    gender: '',
    race: '',
    address: {
      street: '',
      unit: '',
      city: '',
      state: 'FL',
      zip: '',
      howLong: ''
    },
    employment: {
      employer: '',
      position: '',
      phone: '',
      monthlyIncome: '',
      howLong: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    references: [
      { name: '', relationship: '', phone: '', address: '' },
      { name: '', relationship: '', phone: '', address: '' }
    ],
    idCard: {
      frontUrl: '',
      backUrl: '',
      selfieUrl: '',
      ocrExtracted: false
    }
  };
}

/**
 * Creates an empty Canonical Case Object
 * @returns {Object}
 */
export function createCanonicalCase() {
  return {
    caseId: '',
    bookingNumber: '',
    county: 'Lee',
    state: 'FL',
    jailFacility: '',
    charges: [],
    totalBondAmount: 0,
    calculatedPremium: 0,
    transferFee: 0,
    courtDate: '',
    courtLocation: '',
    division: '',
    suretyCarrier: 'Accredited', // Default template target (OSI, Accredited, Bankers)
    defendant: createCanonicalPerson(ROLES.DEFENDANT),
    indemnitors: [],
    metadata: {
      staffDeferred: true,
      intakeSource: 'wix-studio-portal',
      submittedAt: new Date().toISOString()
    }
  };
}

/**
 * Hydrate Canonical Person from raw OCR extracted payload
 * @param {Object} person - Canonical person object to mutate/hydrate
 * @param {Object} ocrData - Extracted OCR values (e.g. from Google Vision / FL DL)
 * @returns {Object} Hydrated person object
 */
export function hydratePersonFromOcr(person, ocrData = {}) {
  if (!person || !ocrData) return person;

  if (ocrData.firstName) person.firstName = String(ocrData.firstName).trim();
  if (ocrData.lastName) person.lastName = String(ocrData.lastName).trim();
  if (ocrData.middleName) person.middleName = String(ocrData.middleName).trim();
  person.fullName = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');

  if (ocrData.dob) person.dob = String(ocrData.dob).trim();
  if (ocrData.dlNumber) person.dlNumber = String(ocrData.dlNumber).trim().toUpperCase();
  if (ocrData.dlState) person.dlState = String(ocrData.dlState).trim().toUpperCase();
  if (ocrData.dlExpiration) person.dlExpiration = String(ocrData.dlExpiration).trim();
  if (ocrData.gender) person.gender = String(ocrData.gender).trim().toUpperCase();

  if (ocrData.street || ocrData.address) {
    person.address.street = String(ocrData.street || ocrData.address).trim();
  }
  if (ocrData.city) person.address.city = String(ocrData.city).trim();
  if (ocrData.state) person.address.state = String(ocrData.state).trim().toUpperCase();
  if (ocrData.zip) person.address.zip = String(ocrData.zip).trim();

  person.idCard.ocrExtracted = true;
  return person;
}

/**
 * Map Canonical Case and Person state to historical Def* / Ind* automation schema
 * for lossless compatibility with Super CRM, GAS, and SignNow/DocuSeal template bridges.
 * 
 * @param {Object} canonicalCase - Complete canonical case
 * @returns {Object} Legacy-compatible flat payload
 */
export function exportToLegacyPacketMap(canonicalCase) {
  const def = canonicalCase.defendant || {};
  const ind = (canonicalCase.indemnitors && canonicalCase.indemnitors[0]) || {};

  return {
    // Defendant standard mappings
    DefFirstName: def.firstName || '',
    DefLastName: def.lastName || '',
    DefFullName: def.fullName || `${def.firstName || ''} ${def.lastName || ''}`.trim(),
    DefDOB: def.dob || '',
    DefSSN: def.ssnFull || def.ssnLast4 || '',
    DefDL: def.dlNumber || '',
    DefDLState: def.dlState || 'FL',
    DefPhone: def.phone || '',
    DefEmail: def.email || '',
    DefAddress: def.address?.street || '',
    DefCity: def.address?.city || '',
    DefState: def.address?.state || 'FL',
    DefZip: def.address?.zip || '',
    DefEmployer: def.employment?.employer || '',
    DefEmployerPhone: def.employment?.phone || '',

    // Indemnitor standard mappings
    IndFirstName: ind.firstName || '',
    IndLastName: ind.lastName || '',
    IndFullName: ind.fullName || `${ind.firstName || ''} ${ind.lastName || ''}`.trim(),
    IndDOB: ind.dob || '',
    IndSSN: ind.ssnFull || ind.ssnLast4 || '',
    IndDL: ind.dlNumber || '',
    IndDLState: ind.dlState || 'FL',
    IndPhone: ind.phone || '',
    IndEmail: ind.email || '',
    IndAddress: ind.address?.street || '',
    IndCity: ind.address?.city || '',
    IndState: ind.address?.state || 'FL',
    IndZip: ind.address?.zip || '',
    IndEmployer: ind.employment?.employer || '',
    IndEmployerPhone: ind.employment?.phone || '',

    // Case Details
    CaseNumber: canonicalCase.caseId || '',
    BookingNumber: canonicalCase.bookingNumber || '',
    County: canonicalCase.county || 'Lee',
    State: canonicalCase.state || 'FL',
    BondAmount: canonicalCase.totalBondAmount || 0,
    PremiumAmount: canonicalCase.calculatedPremium || 0,
    CourtDate: canonicalCase.courtDate || '',
    CourtLocation: canonicalCase.courtLocation || '',
    SuretyCarrier: canonicalCase.suretyCarrier || 'Accredited',
    StaffDeferred: true
  };
}

export default {
  ROLES,
  createCanonicalPerson,
  createCanonicalCase,
  hydratePersonFromOcr,
  exportToLegacyPacketMap
};
