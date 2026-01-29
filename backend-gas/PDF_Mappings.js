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
        // Defendant
        'DefName': ['defendantFullName', 'defendant-full-name'], // Tries first, then second
        'DefDOB': 'defendantDOB',
        'DefSSN': 'defendantSSN',
        'DefAddress': 'defendantStreetAddress',
        'DefCity': 'defendantCity',
        'DefState': 'defendantState', // Defaults to FL if missing in logic
        'DefZip': 'defendantZip',
        'DefPhone': 'defendantPhone',

        // Indemnitor
        'IndName': 'indemnitorFullName',
        'IndPhone': 'indemnitorPhone',
        'IndEmail': 'indemnitorEmail',
        'IndAddress': 'indemnitorStreetAddress',
        'IndCity': 'indemnitorCity',
        'IndState': 'indemnitorState',
        'IndZip': 'indemnitorZip',

        // Employer
        'IndEmployer': 'indemnitorEmployerName',
        'IndEmpPhone': 'indemnitorEmployerPhone',
        // Complex fields handled by logic below, but defined here for reference

        // Financials
        'TotalBond': ['totalBond', 'payment-total-bond'],
        'Premium': ['totalPremium', 'payment-premium-due'],
        'BookingNum': ['bookingNumber', 'defendant-booking-number']
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
