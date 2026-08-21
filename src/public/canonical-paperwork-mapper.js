/**
 * Canonical Paperwork Schema & Surety Field Mapper
 * File: public/canonical-paperwork-mapper.js
 * 
 * Preserves 100% of existing DocuSeal / OSI PDF field names and mappings
 * from `PDF_Mappings.js` and `shamrock_field_mappings.json`.
 * 
 * Standardizes client intake data into a single canonical person/case/packet model.
 * Maps canonical data onto existing OSI, Accredited, Bankers, and Palmetto template sets.
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
 * @returns {Object} Canonical Person Model
 */
export function createCanonicalPerson(role = ROLES.DEFENDANT) {
  return {
    role,
    legalName: {
      first: '',
      middle: '',
      last: '',
      full: ''
    },
    dob: '',
    ssnLast4: '',
    ssnFull: '',
    dlNumber: '',
    dlState: 'FL',
    dlExpiration: '',
    gender: '',
    race: '',
    phones: [],
    emails: [],
    addresses: [
      {
        type: 'primary',
        street: '',
        unit: '',
        city: '',
        state: 'FL',
        zip: '',
        howLong: ''
      }
    ],
    employment: {
      employer: '',
      occupation: '',
      phone: '',
      monthlyIncome: '',
      howLong: ''
    },
    household: {
      maritalStatus: 'Single',
      residentialStatus: 'Rent',
      spouseName: '',
      dependentsCount: 0
    },
    references: [
      { name: '', relationship: 'Family/Friend', phone: '', address: '' },
      { name: '', relationship: 'Family/Friend', phone: '', address: '' }
    ],
    defendantExtras: {
      aliases: [],
      bookingPhotoUrl: '',
      inCustodyStatus: 'in_custody'
    },
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
 * @returns {Object} Canonical Case Model
 */
export function createCanonicalCase() {
  return {
    caseId: '',
    county: 'Lee',
    state: 'FL',
    jail: 'Lee County Core Facility (Ortiz Ave)',
    caseNumbers: [],
    charges: [], // Array of { statute, description, bondAmount }
    courtDates: [], // Array of { date, courtroom, time, zoomLink }
    totalBond: 0,
    premiumEstimate: 0,
    transferFee: 0,
    suretyCode: 'OSI',
    packet: {
      surety: 'OSI',
      templateSet: 'osi-florida-packet',
      signingSessionId: '',
      status: 'pending_review' // 'pending_review' | 'staff_gated' | 'issued' | 'completed'
    },
    defendant: createCanonicalPerson(ROLES.DEFENDANT),
    indemnitor: createCanonicalPerson(ROLES.INDEMNITOR),
    coIndemnitor: createCanonicalPerson(ROLES.COINDEMNITOR),
    metadata: {
      staffDeferred: true,
      intakeSource: 'wix-studio-portal',
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Hydrates a Canonical Person from raw OCR extracted payload
 * @param {Object} person - Canonical Person instance to mutate
 * @param {Object} ocrData - Extracted OCR values
 * @returns {Object} Mutated Person instance
 */
export function hydratePersonFromOcr(person, ocrData = {}) {
  if (!person || !ocrData) return person;

  if (ocrData.firstName) person.legalName.first = String(ocrData.firstName).trim();
  if (ocrData.lastName) person.legalName.last = String(ocrData.lastName).trim();
  if (ocrData.middleName) person.legalName.middle = String(ocrData.middleName).trim();
  
  person.legalName.full = [person.legalName.first, person.legalName.middle, person.legalName.last]
    .filter(Boolean).join(' ') || ocrData.fullName || person.legalName.full;

  if (ocrData.dob) person.dob = String(ocrData.dob).trim();
  if (ocrData.dlNumber) person.dlNumber = String(ocrData.dlNumber).trim().toUpperCase();
  if (ocrData.dlState) person.dlState = String(ocrData.dlState).trim().toUpperCase();
  if (ocrData.dlExpiration || ocrData.expiration) person.dlExpiration = String(ocrData.dlExpiration || ocrData.expiration).trim();
  if (ocrData.sex || ocrData.gender) person.gender = String(ocrData.sex || ocrData.gender).trim().toUpperCase();

  const primaryAddr = person.addresses[0] || { street: '', unit: '', city: '', state: 'FL', zip: '' };
  if (ocrData.street || ocrData.address) primaryAddr.street = String(ocrData.street || ocrData.address).trim();
  if (ocrData.city) primaryAddr.city = String(ocrData.city).trim();
  if (ocrData.state) primaryAddr.state = String(ocrData.state).trim().toUpperCase();
  if (ocrData.zip) primaryAddr.zip = String(ocrData.zip).trim();
  person.addresses[0] = primaryAddr;

  if (ocrData.phone && !person.phones.includes(ocrData.phone)) person.phones.push(ocrData.phone);
  if (ocrData.email && !person.emails.includes(ocrData.email)) person.emails.push(ocrData.email);

  person.idCard.ocrExtracted = true;
  return person;
}

/**
 * Maps Canonical Case into Exact Existing DocuSeal / OSI PDF Template Tag Keys
 * (Preserves exact field names from PDF_Mappings.js and shamrock_field_mappings.json)
 * 
 * @param {Object} canonicalCase - Canonical Case instance
 * @param {'OSI'|'Palmetto'|'Accredited'|'Bankers'} [surety='OSI']
 * @returns {Object} Exact template-ready field dictionary
 */
export function mapToSuretyPacket(canonicalCase, surety = 'OSI') {
  const masterData = exportToLegacyPacketMap(canonicalCase);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US');
  const dayStr = String(now.getDate());
  const monthStr = now.toLocaleString('default', { month: 'long' });
  const yearStr = String(now.getFullYear()).slice(-2);

  // Exact Field Mapping for OSI Templates (Complete & Authoritative)
  const osiFields = {
    // osi-defendant-application-shamrock-reducedsize.pdf
    "defendant-full-name": masterData.DefName,
    "defendant-aka-alias": canonicalCase.defendant?.defendantExtras?.aliases?.join(', ') || '',
    "defendant-phone-number": masterData.DefPhone,
    "defendant-email": masterData.DefEmail,
    "defendant-charges1": masterData.DefCharges,
    "county-name": masterData.DefCounty,
    "numeric-bond-amount": String(masterData.TotalBond),
    "numeric-premium-amount": String(masterData.Premium),
    "written-premium-amount": masterData.PremiumWritten || '',
    "power-number": masterData.PowerNum || '',
    "date-bond-written": dateStr,
    "day-DD": dayStr,
    "month-MMMM": monthStr,
    "year-YY": yearStr,
    "court-type": masterData.CourtName || 'Circuit / County',
    "bail-agent-full-name": "Shamrock Bail Bonds Staff",

    // osi-indemnity-agreement-shamrock.pdf
    "Defendant": masterData.DefName,
    "1 Name": masterData.IndName,
    "2 Name": masterData.Ind2Name || '',
    "Name": masterData.IndName,
    "Address": masterData.IndAddress,
    "Address_3": masterData.IndCity || '',
    "Address_4": masterData.IndState || 'FL',
    "Address_5": masterData.IndZip || '',
    "City  St  Zip": masterData.IndCityStateZip,
    "DOB": masterData.IndDOB,
    "SSN": masterData.IndSSN || '',
    "Drivers Lic": masterData.IndDL,
    "Employer": masterData.IndEmployer,
    "Relation": masterData.IndRelation || 'Family/Friend',
    "in the sum of": String(masterData.TotalBond),
    "day of": dayStr,
    "Day": dayStr,
    "20": yearStr,
    "PRINT": masterData.IndName,
    "Text1": masterData.IndPhone,
    "Text2": masterData.IndEmpPhone || '',
    "Text3": masterData.IndEmpAddress || '',
    "Text5": masterData.Ref1Name,
    "Text6": masterData.Ref1Phone,
    "Text7": masterData.Ref1Relation,
    "Text8": masterData.Ref1Address,
    "Text9": masterData.Ref2Name,
    "Text10": masterData.Ref2Phone,
    "Text11": masterData.Ref2Relation,

    // osi-collateral-premium-receipt.pdf
    "defendant-name": masterData.DefName,
    "defendant-charge": masterData.DefCharges,
    "charges": masterData.DefCharges,
    "indemnitor-name": masterData.IndName,
    "indemnitor-full-address": masterData.IndAddress,
    "indemnitor-phone": masterData.IndPhone,
    "case-number": masterData.CaseNum || masterData.CaseID,
    "bond-amount": String(masterData.TotalBond),
    "premium-amount": String(masterData.Premium),

    // osi-appearance-bond-shamrock.pdf / Appearance Bond blank.pdf
    "Arrest/case No": masterData.CaseNum || masterData.CaseID,
    "CaseNum": masterData.CaseNum || masterData.CaseID,
    "PowerNum": masterData.PowerNum || '',
    "DefLastName": masterData.DefLastName,
    "DefFirstName": masterData.DefFirstName,
    "DefCounty": masterData.DefCounty,
    "DefCourtType": masterData.CourtName || 'Circuit Court',
    "BondAmountCharge1": String(masterData.TotalBond),
    "CourtDate": masterData.DefCourtDate || '',
    "CourtTime": masterData.DefCourtTime || '09:00 AM',
    "DefCharge1": masterData.DefCharges,
    "DefAddress": masterData.DefAddress,
    "WrittenPremiumAmount": masterData.PremiumWritten || '',
    "NumericPremiumAmount": String(masterData.Premium),
    "IndNameandDefName": `${masterData.IndName} & ${masterData.DefName}`
  };

  if (surety.toUpperCase() === 'PALMETTO') {
    // Palmetto dialect maps onto the exact same canonical fields
    return {
      ...osiFields,
      "Palmetto_Applicant": masterData.DefName,
      "Palmetto_Guarantor": masterData.IndName,
      "Palmetto_Bond_Val": String(masterData.TotalBond)
    };
  }

  return osiFields;
}

/**
 * Exports Canonical Case into Master Data / Legacy Flat Map
 * 100% aligned with buildMasterDataObject in PDF_Mappings.js
 * 
 * @param {Object} canonicalCase - Canonical Case instance
 * @returns {Object} Flat automation key-value pairs matching PDF_Mappings.js
 */
export function exportToLegacyPacketMap(canonicalCase) {
  const def = canonicalCase.defendant || createCanonicalPerson(ROLES.DEFENDANT);
  const ind = canonicalCase.indemnitor || createCanonicalPerson(ROLES.INDEMNITOR);
  const coInd = canonicalCase.coIndemnitor || createCanonicalPerson(ROLES.COINDEMNITOR);

  const defAddr = def.addresses[0] || {};
  const indAddr = ind.addresses[0] || {};
  const coIndAddr = coInd.addresses[0] || {};

  const chargesFormatted = canonicalCase.charges.map(c => {
    if (typeof c === 'string') return c;
    return c.statute ? `${c.statute} - ${c.description}` : c.description;
  }).join('; ');

  const totalBondNum = Number(canonicalCase.totalBond) || 0;
  const premiumNum = Number(canonicalCase.premiumEstimate) || (totalBondNum * 0.10);

  return {
    // Master Case Keys
    CaseID: canonicalCase.caseId || '',
    CaseNum: canonicalCase.caseNumbers?.[0] || canonicalCase.caseId || '',
    County: canonicalCase.county || 'Lee',
    DefCounty: canonicalCase.county || 'Lee',
    JailFacility: canonicalCase.jail || '',
    TotalBond: totalBondNum,
    BondAmount: totalBondNum,
    Premium: premiumNum,
    PremiumWritten: writtenNumber(premiumNum),
    PowerNum: '',

    // Defendant Keys
    DefName: def.legalName.full || [def.legalName.first, def.legalName.last].filter(Boolean).join(' '),
    DefFirstName: def.legalName.first,
    DefMiddleName: def.legalName.middle,
    DefLastName: def.legalName.last,
    DefDOB: def.dob,
    DefDL: def.dlNumber,
    DefDLState: def.dlState || 'FL',
    DefPhone: def.phones[0] || '',
    DefEmail: def.emails[0] || '',
    DefAddress: [defAddr.street, defAddr.unit, defAddr.city, defAddr.state, defAddr.zip].filter(Boolean).join(', '),
    DefCity: defAddr.city || '',
    DefState: defAddr.state || 'FL',
    DefZip: defAddr.zip || '',
    DefEmployer: def.employment.employer || '',
    DefCharges: chargesFormatted,
    DefCourtDate: canonicalCase.courtDates?.[0]?.date || '',
    DefCourtTime: canonicalCase.courtDates?.[0]?.time || '09:00 AM',
    CourtName: canonicalCase.county ? `${canonicalCase.county} County Circuit Court` : 'Circuit Court',

    // Indemnitor (Cosigner) Keys
    IndName: ind.legalName.full || [ind.legalName.first, ind.legalName.last].filter(Boolean).join(' '),
    IndFirstName: ind.legalName.first,
    IndLastName: ind.legalName.last,
    IndDOB: ind.dob,
    IndDL: ind.dlNumber,
    IndDLState: ind.dlState || 'FL',
    IndPhone: ind.phones[0] || '',
    IndEmail: ind.emails[0] || '',
    IndAddress: [indAddr.street, indAddr.unit, indAddr.city, indAddr.state, indAddr.zip].filter(Boolean).join(', '),
    IndCity: indAddr.city || '',
    IndState: indAddr.state || 'FL',
    IndZip: indAddr.zip || '',
    IndCityStateZip: [indAddr.city, indAddr.state, indAddr.zip].filter(Boolean).join(', '),
    IndEmployer: ind.employment.employer || '',
    IndEmpPhone: ind.employment.phone || '',
    IndEmpAddress: '',
    IndRelation: ind.household?.maritalStatus || 'Family/Friend',

    // Co-Indemnitor
    Ind2Name: coInd.legalName.full || '',
    Ind2DL: coInd.dlNumber || '',
    Ind2Address: [coIndAddr.street, coIndAddr.unit, coIndAddr.city, coIndAddr.state, coIndAddr.zip].filter(Boolean).join(', '),
    Ind2Relation: 'Co-Signer',

    // References
    Ref1Name: ind.references?.[0]?.name || '',
    Ref1Phone: ind.references?.[0]?.phone || '',
    Ref1Relation: ind.references?.[0]?.relationship || 'Family/Friend',
    Ref1Address: ind.references?.[0]?.address || '',
    Ref2Name: ind.references?.[1]?.name || '',
    Ref2Phone: ind.references?.[1]?.phone || '',
    Ref2Relation: ind.references?.[1]?.relationship || 'Family/Friend',
    Ref2Address: ind.references?.[1]?.address || ''
  };
}

function writtenNumber(num) {
  if (!num) return 'Zero Dollars';
  return `$${Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default {
  ROLES,
  createCanonicalPerson,
  createCanonicalCase,
  hydratePersonFromOcr,
  mapToSuretyPacket,
  exportToLegacyPacketMap
};
