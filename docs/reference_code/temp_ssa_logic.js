/**
 * UPDATED SSA RELEASE LOGIC - MULTIPLE COPIES
 * 
 * This code replaces the existing SSA Release handling in Dashboard.html
 * to generate one copy per signer (defendant + all indemnitors)
 */

// Add this to CONFIG object (around line 2451)
CONFIG.ssaReleaseTemplateId = '1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu';

/**
 * Generate SSA Release documents for each signer
 * @param {Object} formData - The form data containing defendant and indemnitors
 * @returns {Array} Array of SSA Release document objects
 */
async function generateSSAReleaseDocuments(formData) {
    const ssaDocs = [];
    const ssaTemplateId = CONFIG.templateIds['ssa-release'];

    // Get the base SSA Release template
    const baseTemplate = await fetchGoogleDriveFile(ssaTemplateId);

    // 1. Defendant's SSA Release
    const defendantDoc = {
        key: 'ssa-release-defendant',
        name: `SSA Release - ${formData['defendant-first-name']} ${formData['defendant-last-name']}`,
        bytes: baseTemplate,
        signerRole: 'Defendant',
        signerName: `${formData['defendant-first-name']} ${formData['defendant-last-name']}`
    };
    ssaDocs.push(defendantDoc);

    // 2. Each Indemnitor's SSA Release
    if (formData.indemnitors && formData.indemnitors.length > 0) {
        formData.indemnitors.forEach((indemnitor, index) => {
            const indemnitorDoc = {
                key: `ssa-release-indemnitor-${index + 1}`,
                name: `SSA Release - ${indemnitor.firstName} ${indemnitor.lastName}`,
                bytes: baseTemplate,
                signerRole: `Indemnitor ${index + 1}`,
                signerName: `${indemnitor.firstName} ${indemnitor.lastName}`
            };
            ssaDocs.push(indemnitorDoc);
        });
    }

    return ssaDocs;
}

/**
 * Update signature field mappings to include multiple SSA Release copies
 * REPLACE the existing 'ssa-release' entry in CONFIG.signatureFields (line 2528-2530)
 */
function getSSAReleaseSignatureFields(formData) {
    const fields = [];
    let pageOffset = 0;

    // Calculate page offset based on documents before SSA Release in templateOrder
    // This will be calculated dynamically when generating the packet

    // Defendant's copy
    fields.push({
        document: 'ssa-release-defendant',
        type: 'signature',
        role: 'Defendant',
        page_number: pageOffset,
        x: 140,
        y: 145,
        width: 330,
        height: 40,
        required: true
    });
    pageOffset += 1; // SSA Release is 1 page

    // Each Indemnitor's copy
    if (formData.indemnitors && formData.indemnitors.length > 0) {
        formData.indemnitors.forEach((indemnitor, index) => {
            fields.push({
                document: `ssa-release-indemnitor-${index + 1}`,
                type: 'signature',
                role: `Indemnitor ${index + 1}`,
                page_number: pageOffset,
                x: 140,
                y: 145,
                width: 330,
                height: 40,
                required: true
            });
            pageOffset += 1;
        });
    }

    return fields;
}

/**
 * Update getSelectedDocuments() function to handle multiple SSA Release copies
 * INSERT THIS LOGIC where 'ssa-release' is processed (around line 4287)
 */
function processSSAReleaseInDocumentList(formData) {
    // Check if SSA Release checkbox is checked
    const ssaCheckbox = document.getElementById('doc-ssa-release');
    if (!ssaCheckbox || !ssaCheckbox.checked) {
        return [];
    }

    // Generate multiple SSA Release documents
    const ssaDocs = [];

    // Defendant's copy
    ssaDocs.push({
        key: 'ssa-release-defendant',
        name: `SSA Release - ${formData['defendant-first-name']} ${formData['defendant-last-name']}`,
        templateId: CONFIG.templateIds['ssa-release'],
        signerRole: 'Defendant'
    });

    // Each Indemnitor's copy
    if (formData.indemnitors && formData.indemnitors.length > 0) {
        formData.indemnitors.forEach((indemnitor, index) => {
            ssaDocs.push({
                key: `ssa-release-indemnitor-${index + 1}`,
                name: `SSA Release - ${indemnitor.firstName} ${indemnitor.lastName}`,
                templateId: CONFIG.templateIds['ssa-release'],
                signerRole: `Indemnitor ${index + 1}`
            });
        });
    }

    return ssaDocs;
}

/**
 * Update the document metadata display to show multiple SSA Release copies
 * UPDATE the doc-meta text for SSA Release (line 2203)
 */
function updateSSAReleaseMetadata(formData) {
    const ssaItem = document.getElementById('doc-ssa-release');
    if (!ssaItem) return;

    const metaDiv = ssaItem.querySelector('.doc-meta');
    if (!metaDiv) return;

    const indemnitorCount = formData.indemnitors ? formData.indemnitors.length : 0;
    const totalCopies = 1 + indemnitorCount; // Defendant + Indemnitors

    metaDiv.textContent = `${totalCopies} copies - one per signer (Defendant + ${indemnitorCount} Indemnitor${indemnitorCount !== 1 ? 's' : ''})`;
}
