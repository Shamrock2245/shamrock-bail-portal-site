
/**
 * ONE-OFF UTILITY: Convert PDF Templates to Google Docs
 * 
 * Usage:
 * 1. Deploy
 * 2. Run ?action=convert_templates
 * 3. Copy JSON output
 * 4. Update PDFService.gs with new IDs
 */

const PDF_TEMPLATES_TO_CONVERT = {
    'paperwork-header': '15sTaIIwhzHk96I8X3rxz7GtLMU-F5zo1',
    'faq-cosigners': '1bjmH2w-XS5Hhe828y_Jmv9DqaS_gSZM7',
    'faq-defendants': '16j9Z8eTii-J_p4o6A2LrzgzptGB8aOhR',
    'indemnity-agreement': '1Raa2gzHOlO5kSJOeDE25eBh2H8LcjN5L',
    'defendant-application': '1JxBubXg0up1NeFBaWgi6qGNA133tSCxG',
    'promissory-note': '104-ArZiCm3cgfQcT5rIO0x_OWiaw6Ddt',
    'disclosure-form': '1qIIDudp7r3J7-6MHlL2US34RcrU9KZKY',
    'surety-terms': '1VfmyUTpchfwJTlENlR72JxmoE_NCF-uf',
    'master-waiver': '181mgKQN-VxvQOyzDquFs8cFHUN0tjrMs',
    'ssa-release': '1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu',
    'collateral-receipt': '1IAYq4H2b0N0vPnJN7b2vZPaHg_RNKCmP',
    'payment-plan': '1v-qkaegm6MDymiaPK45JqfXXX2_KOj8A',
    'appearance-bond': '15SDM1oBysTw76bIL7Xt0Uhti8uRZKABs'
};

function convertPdfTemplatesToDocs() {
    const newMappings = {};
    const errors = {};

    console.log('🔄 Starting Batch Conversion...');

    for (const [key, pdfId] of Object.entries(PDF_TEMPLATES_TO_CONVERT)) {
        try {
            console.log(`Processing: ${key} (${pdfId})...`);

            // 1. Get PDF Blob
            const pdfFile = DriveApp.getFileById(pdfId);
            const blob = pdfFile.getBlob();

            // 2. Prepare Metadata for Conversion
            // Drive API v3 uses 'application/vnd.google-apps.document' to trigger conversion
            const resource = {
                name: `[TEMPLATE] ${key}`,
                mimeType: 'application/vnd.google-apps.document',
                parents: [pdfFile.getParents().next().getId()] // Keep in same folder
            };

            // 3. Call Advanced Drive API
            // Drive.Files.create(resource, blob)
            const newFile = Drive.Files.create(resource, blob);

            console.log(`✅ Converted: ${newFile.id}`);
            newMappings[key] = newFile.id;

        } catch (e) {
            console.error(`❌ Failed ${key}: ${e.message}`);
            errors[key] = e.message;
        }
    }

    return {
        success: Object.keys(errors).length === 0,
        new_templates: newMappings,
        errors: errors
    };
}
