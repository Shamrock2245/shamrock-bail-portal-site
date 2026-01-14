
// =========================================================
// CONFIG & STATE
// =========================================================
const CONFIG = {
    templates: {
        'paperwork-header': '1Hn-Is9ByF7XQyqD3s7oIs7WJ8iQ_Y9K7', // Placeholder ID
        'faq-cosigners': '1Q-2wJgKxL5M9zN3OP1R4_SjT6Uv8VwXy', // Placeholder
        'faq-defendants': '1Z-3xKlMn5PqOrS8Tv2W9_XkU7Yz0AbCd', // Placeholder
        'indemnity-agreement': '1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu', // Real ID (Example)
        'defendant-application': '1jPh-L2mNn3oPqR4Ss5T6Uu7Vv8WwXyZ',
        'promissory-note': '1kQi-M3nOo4pQrS5Tt6Uu8WwXyZ0AbCd',
        'disclosure-form': '1lRj-N4oOp5qRsT6Uu9VvXyZ0AbCd1Ef',
        'surety-terms': '1mSk-O5pPq6rStU7Vv0WwXyZ1AbCd2Ef',
        'master-waiver': '1nTl-P6qQr7sTuV8Ww1XyZ2AbCd3Ef4G',
        'ssa-release': '1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu', // SSA Release
        'collateral-receipt': '1oUm-Q7rRs8tUvW9Xy2Z3AbCd4Ef5Gh6',
        'payment-plan': '1pVn-R8sSt9uVwX0Yz3A4BcD5Ef6Gh7I',
        'appearance-bond': '1qWo-S9tTu0vWxY1Z4B5CdE6F7Gh8Ij9'
    },
    templateOrder: [
        'paperwork-header', 'faq-cosigners', 'faq-defendants',
        'indemnity-agreement', 'defendant-application',
        'promissory-note', 'disclosure-form', 'surety-terms',
        'master-waiver', 'ssa-release', 'collateral-receipt', 'payment-plan'
    ],
    printOnlyDocs: ['appearance-bond'],
    signatureFields: {
        'indemnity-agreement': [
            { type: 'signature', role: 'Indemnitor', page_number: 0, x: 100, y: 150, width: 200, height: 50 },
            { type: 'signature', role: 'Defendant', page_number: 0, x: 350, y: 150, width: 200, height: 50 }
        ],
        'ssa-release': [
            { type: 'signature', role: 'Signer', page_number: 0, x: 100, y: 200, width: 200, height: 50 }
        ]
        // Add fields for other docs as needed
    }
};

const LS_KEY_FORM = 'shamrock_bail_form_v1';
const LS_KEY_PACKETS = 'shamrock_sent_packets';
const LS_KEY_RECEIPT = 'shamrock_receipt_number';

let chargeCount = 0;
let indemnitorCount = 0;
let sentPackets = JSON.parse(localStorage.getItem(LS_KEY_PACKETS) || '[]');
let currentReceiptNumber = parseInt(localStorage.getItem(LS_KEY_RECEIPT) || '201204');

/* =========================================================
   DOCUMENT SELECTION Logic (UPDATED)
   ========================================================= */
function getSelectedDocuments(includePrintOnly = false) {
    const selected = [];
    const formData = collectFormData(); // Need data for naming

    // Get checked templates
    const checkedTemplates = new Set();
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        if (cb.dataset.template) {
            checkedTemplates.add(cb.dataset.template);
        }
    });

    // Iterate through templates in specific order
    CONFIG.templateOrder.forEach(templateKey => {
        if (checkedTemplates.has(templateKey)) {
            const isPrintOnly = CONFIG.printOnlyDocs.includes(templateKey);
            if (!isPrintOnly || includePrintOnly) {

                // --- FIX: EXPLODE SSA RELEASE ---
                if (templateKey === 'ssa-release') {
                    // 1. Defendant Copy
                    selected.push({
                        key: 'ssa-release-defendant',
                        id: CONFIG.templates['ssa-release'],
                        name: `SSA - Defendant (${formData['defendant-last-name'] || ''})`,
                        role: 'Defendant',
                        emailKey: 'defendant-email' // For mapping
                    });

                    // 2. Indemnitors Copies
                    if (formData.indemnitors && formData.indemnitors.length > 0) {
                        formData.indemnitors.forEach((ind, i) => {
                            // Only add if we have some minimal info
                            if (ind.lastName) {
                                selected.push({
                                    key: `ssa-release-indemnitor-${i + 1}`,
                                    id: CONFIG.templates['ssa-release'], // Reuse template
                                    name: `SSA - Indemnitor ${i + 1} (${ind.lastName})`,
                                    role: 'Indemnitor',
                                    indemnitorIndex: i // Track index for field mapping
                                });
                            }
                        });
                    }
                } else {
                    // Standard Document Handling
                    const cb = document.querySelector(`input[data-template="${templateKey}"]`);
                    selected.push({
                        key: templateKey,
                        id: CONFIG.templates[templateKey],
                        name: cb?.closest('.doc-item')?.querySelector('.doc-name')?.textContent || templateKey
                    });
                }
            }
        }
    });

    return selected;
}

/* =========================================================
   FIELD MAPPING HELPER (UPDATED)
   ========================================================= */
function getIndemnitorField(formData, index, field) {
    if (!formData.indemnitors || !formData.indemnitors[index]) return null;
    const ind = formData.indemnitors[index];

    if (field === 'fullName' || field === 'full-name' || field === 'name') {
        return `${ind.firstName || ''} ${ind.middleName || ''} ${ind.lastName || ''}`.trim().replace(/\s+/g, ' ');
    }

    const fieldMap = {
        'firstName': ind.firstName, 'first-name': ind.firstName,
        'lastName': ind.lastName, 'last-name': ind.lastName,
        'middleName': ind.middleName, 'middle-name': ind.middleName,
        'dob': ind.dob,
        'ssn': ind.ssn,
        'dl': ind.dl,
        'dlState': ind.dlState, 'dl-state': ind.dlState,
        'address': ind.address, 'street-address': ind.address,
        'city': ind.city,
        'state': 'FL',
        'zip': ind.zip, 'zipcode': ind.zip,
        'phone': ind.phone,
        'email': ind.email,
        'employer': ind.employer,
        'employerPhone': ind.employerPhone, 'employer-phone': ind.employerPhone,
        'relationship': ind.relationship
    };

    return fieldMap[field] || null;
}

function mapFieldToData(fieldName, formData) {
    // 1. Basic Defendant Mappings
    const mappings = {
        'defendant-name': `${formData['defendant-first-name'] || ''} ${formData['defendant-middle-name'] || ''} ${formData['defendant-last-name'] || ''}`.trim(),
        'name': `${formData['defendant-first-name'] || ''} ${formData['defendant-last-name'] || ''}`.trim(),
        'first-name': formData['defendant-first-name'],
        'last-name': formData['defendant-last-name'],
        'middle-name': formData['defendant-middle-name'],
        'dob': formData['defendant-dob'],
        'ssn': formData['defendant-ssn'],
        'dl': formData['defendant-dl'],
        'address': formData['defendant-address'],
        'city': formData['defendant-city'],
        'state': formData['defendant-state'] || 'FL',
        'zip': formData['defendant-zip'],
        'phone': formData['defendant-phone'],
        'email': formData['defendant-email'],
        'bond-amount': calculateTotalBondAmount(formData),
        'premium-amount': calculatePremiumAmount(formData),
        'date': new Date().toLocaleDateString('en-US'),
        'case-number': formData.charges && formData.charges[0] ? formData.charges[0].caseNumber : ''
    };

    // 2. Primary Indemnitor (Legacy/Simple)
    const indemnitorMappings = {
        'indemnitor-name': getIndemnitorField(formData, 0, 'fullName'),
        'indemnitor-first-name': getIndemnitorField(formData, 0, 'firstName'),
        'indemnitor-last-name': getIndemnitorField(formData, 0, 'lastName'),
        'indemnitor-address': getIndemnitorField(formData, 0, 'address'),
        'indemnitor-city': getIndemnitorField(formData, 0, 'city'),
        'indemnitor-state': 'FL',
        'indemnitor-zip': getIndemnitorField(formData, 0, 'zip'),
        'indemnitor-phone': getIndemnitorField(formData, 0, 'phone'),
        'indemnitor-email': getIndemnitorField(formData, 0, 'email')
    };

    // Check basic mappings
    if (mappings[fieldName] !== undefined) return mappings[fieldName];
    if (indemnitorMappings[fieldName] !== undefined) return indemnitorMappings[fieldName];

    // 3. Numbered Indemnitors (indemnitor-1-first-name)
    if (fieldName.match(/^indemnitor-\d+-/)) {
        const match = fieldName.match(/^indemnitor-(\d+)-(.*)/);
        if (match) {
            const index = parseInt(match[1]) - 1;
            const field = match[2];
            return getIndemnitorField(formData, index, field);
        }
    }

    // 4. Charge Fields
    if (fieldName.includes('charge') && formData.charges && formData.charges.length > 0) {
        const chargeMatch = fieldName.match(/charge-?(\d+)?-?(.*)?/);
        if (chargeMatch) {
            const chargeIndex = parseInt(chargeMatch[1] || '1') - 1;
            const chargeField = chargeMatch[2] || 'desc';
            if (formData.charges[chargeIndex]) {
                const charge = formData.charges[chargeIndex];
                if (chargeField === 'desc' || chargeField === 'description') return charge.desc;
                if (chargeField === 'statute') return charge.statute;
                if (chargeField === 'bond') return charge.bondAmount;
            }
        }
    }

    return null;
}

// =========================================================
// FILLING LOGIC (Using mapFieldToData)
// =========================================================
function normalizeFieldName(fieldName) {
    return fieldName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/[_\s]/g, '-').replace(/^-/, '');
}

async function fillPDFsWithData(pdfDocs, formData) {
    const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } = PDFLib;
    const filledPdfs = [];

    for (const doc of pdfDocs) {
        try {
            console.log(`Filling ${doc.key}...`);
            const pdfDoc = await PDFDocument.load(doc.bytes);
            const form = pdfDoc.getForm();
            const fields = form.getFields();

            for (const field of fields) {
                const fieldName = field.getName();
                const normName = normalizeFieldName(fieldName);

                let value = "";

                // SPECIAL HANDLING FOR EXPLODED DOCUMENTS
                if (doc.key.startsWith('ssa-release-indemnitor-')) {
                    // If this PDF is strictly for a specific indemnitor, 
                    // we must map general fields like 'name', 'address' to THAT indemnitor
                    if (typeof doc.indemnitorIndex === 'number') {
                        // Try to get field from the specific indemnitor
                        value = getIndemnitorField(formData, doc.indemnitorIndex, normName);
                        // Fallback to standard mapping if not found (e.g. date)
                        if (!value) value = mapFieldToData(normName, formData);
                    }
                } else if (doc.key === 'ssa-release-defendant') {
                    // Force defendant context
                    // e.g. 'name' maps to defendant name
                    value = mapFieldToData('defendant-' + normName, formData) || mapFieldToData(normName, formData);
                } else {
                    // STANDARD BEHAVIOR
                    value = formData[normName]
                        || formData[`defendant-${normName}`]
                        || mapFieldToData(normName, formData);
                }

                if (value) {
                    try {
                        if (field instanceof PDFTextField) field.setText(String(value));
                        else if (field instanceof PDFCheckBox) if (value === true || value === 'true') field.check();
                    } catch (e) { console.warn('Field set error', e); }
                }
            }
            filledPdfs.push({ key: doc.key, name: doc.name, bytes: await pdfDoc.save() });
        } catch (err) {
            console.error(`Error filling ${doc.key}`, err);
            filledPdfs.push(doc);
        }
    }
    return filledPdfs;
}

// ... (Include other helper functions like calculateTotalBondAmount, etc.) ...

function calculateTotalBondAmount(formData) {
    if (!formData.charges) return '0.00';
    return formData.charges.reduce((sum, c) => sum + parseFloat(c.bondAmount || 0), 0).toFixed(2);
}
function calculatePremiumAmount(formData) {
    // 10% or $100 min
    return '0.00'; // formatting logic
}
function collectFormData() {
    // Basic stub - logic exists in your file
    const data = {};
    document.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.id) data[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    // Mock charges/indemnitors scraping
    data.charges = [];
    data.indemnitors = [];
    // ...
    return data;
}

console.log('Dashboard Logic (Updated) Loaded');
