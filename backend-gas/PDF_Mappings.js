/**
 * PDF_Mappings.gs
 * 
 * "The PDF Architect"
 * Centralized definition of how JSON data maps to PDF Template Tags (SignNow).
 * 
 * Usage:
 * var fields = PDF_mapDataToTags(formData, 'BOND_PACKAGE');
 */

const PDF_TAG_DEFINITIONS = {
    // Default Bond Package Map
    'BOND_PACKAGE': {
        // --- DEFENDANT ---
        'DefName': ['defendantFullName', 'defendant-full-name'],
        'DefFirstName': ['defendantFirstName', 'defendant-first-name'],
        'DefLastName': ['defendantLastName', 'defendant-last-name'],
        'DefMiddle': ['defendantMiddleName', 'defendant-middle-name'],
        'DefDOB': ['defendantDOB', 'defendant-dob'],
        'DefSSN': ['defendantSSN', 'defendant-ssn'],
        'DefAddress': ['defendantStreetAddress', 'defendant-street-address'],
        'DefCity': ['defendantCity', 'defendant-city'],
        'DefState': ['defendantState', 'defendant-state'],
        'DefZip': ['defendantZip', 'defendantZipCode', 'defendant-zipcode'],
        'DefPhone': ['defendantPhone', 'defendant-phone'],
        'DefEmail': ['defendantEmail', 'defendant-email'],
        'DefDL': ['defendantDL', 'defendant-dl-number'],
        'DefBookingNum': ['defendantBookingNumber', 'defendant-booking-number'],
        'DefFacility': ['jailFacility', 'defendant-jail-facility'],
        'DefCounty': ['county', 'defendant-county'],
        'DefCharges': ['charges', 'defendant-charges'],
        'DefArrestDate': ['arrestDate', 'defendant-arrest-date'],
        'DefCourtDate': ['nextCourtDate', 'defendant-court-date'],

        // --- INDEMNITOR (Primary) ---
        'IndName': ['indemnitorFullName', 'indemnitorName'],
        'IndFirstName': ['indemnitorFirstName', 'indemnitor-1-first'],
        'IndLastName': ['indemnitorLastName', 'indemnitor-1-last'],
        'IndMiddle': ['indemnitorMiddleName', 'indemnitor-1-middle'],
        'IndDOB': ['indemnitorDOB', 'indemnitor-1-dob'],
        'IndSSN': ['indemnitorSSN', 'indemnitor-1-ssn'],
        'IndDL': ['indemnitorDL', 'indemnitor-1-dl'],
        'IndPhone': ['indemnitorPhone', 'indemnitor-1-phone'],
        'IndEmail': ['indemnitorEmail', 'indemnitor-1-email'],
        'IndAddress': ['indemnitorStreetAddress', 'indemnitor-1-address'],
        'IndCity': ['indemnitorCity', 'indemnitor-1-city'],
        'IndState': ['indemnitorState', 'indemnitor-1-state'],
        'IndZip': ['indemnitorZipCode', 'indemnitor-1-zip'],
        'IndRelation': ['indemnitorRelation', 'indemnitor-1-relation'],

        // --- EMPLOYER (Indemnitor) ---
        'IndEmployer': ['indemnitorEmployerName', 'indemnitor-1-employer'],
        'IndEmpPhone': ['indemnitorEmployerPhone', 'indemnitor-1-employer-phone'],
        'IndEmpAddress': ['indemnitorEmployerAddress'], // Logic handles composite
        'IndSupervisor': ['indemnitorSupervisorName', 'indemnitor-1-supervisor'],

        // --- REFERENCE 1 ---
        'Ref1Name': ['reference1Name', 'indemnitor-1-ref1-name'],
        'Ref1Phone': ['reference1Phone', 'indemnitor-1-ref1-phone'],
        'Ref1Relation': ['reference1Relation', 'indemnitor-1-ref1-relation'],
        'Ref1Address': ['reference1Address', 'indemnitor-1-ref1-address'],

        // --- REFERENCE 2 ---
        'Ref2Name': ['reference2Name', 'indemnitor-1-ref2-name'],
        'Ref2Phone': ['reference2Phone', 'indemnitor-1-ref2-phone'],
        'Ref2Relation': ['reference2Relation', 'indemnitor-1-ref2-relation'],
        'Ref2Address': ['reference2Address', 'indemnitor-1-ref2-address'],

        // --- FINANCIAL / CASE ---
        'TotalBond': ['totalBond', 'payment-total-bond', 'bondAmount'],
        'Premium': ['totalPremium', 'payment-premium-due', 'premiumAmount'],
        'PremiumPaid': ['downPayment', 'payment-down-payment'],
        'BalanceDue': ['balanceDue', 'remainingBalance'],
        'CaseNum': ['caseNumber', 'case-number'],
        'PowerNum': ['powerNumber', 'power-number'],
        'Date': ['todaysDate', 'submissionDate'] // Logic to default present
    }
};

/**
 * Maps raw form data to SignNow field array using the definitions above.
 * @param {Object} data - The raw JSON from Wix
 * @param {String} templateType - Key in PDF_TAG_DEFINITIONS (default: BOND_PACKAGE)
 * @returns {Array} - [{name: 'Tag', value: 'Value'}, ...]
 */
function PDF_mapDataToTags(data, templateType) {
    const mapType = templateType || 'BOND_PACKAGE';
    const definition = PDF_TAG_DEFINITIONS[mapType];
    if (!definition) throw new Error("Unknown PDF Template Type: " + mapType);

    const fields = [];

    // 1. Process Static Maps
    Object.keys(definition).forEach(tagName => {
        const sourceKey = definition[tagName];
        let value = "";

        if (Array.isArray(sourceKey)) {
            // Try multiple keys
            for (const key of sourceKey) {
                if (data[key]) { value = data[key]; break; }
            }
        } else {
            value = data[sourceKey];
        }

        // Formatting/Normalization Logic (Simple)
        if (value) fields.push({ name: tagName, value: String(value) });
    });

    // 2. Process Composite/Complex Logic (The "Architect" tweaks)

    // A. Composite Employer Address
    if (data.indemnitorEmployerCity && data.indemnitorEmployerState) {
        const empAddr = `${data.indemnitorEmployerCity}, ${data.indemnitorEmployerState}`;
        fields.push({ name: 'IndEmpAddress', value: empAddr });
    }

    // B. Default State
    if (!data.defendantState && !fields.find(f => f.name === 'DefState')) {
        fields.push({ name: 'DefState', value: 'FL' });
    }

    // C. Full Name Construction if missing
    if (!data.defendantFullName && data['defendant-first-name']) {
        const builtName = `${data['defendant-first-name']} ${data['defendant-last-name']}`;
        // Update existing or push new
        const existing = fields.find(f => f.name === 'DefName');
        if (existing) existing.value = builtName;
        else fields.push({ name: 'DefName', value: builtName });
    }

    return fields;
}
