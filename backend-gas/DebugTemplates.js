/**
 * Debugging Tool for Template Access
 * Run this function in the GAS Editor to verify file permissions and existence.
 */
function testTemplateAccess() {
    const TEMPLATE_DRIVE_IDS = {
        'paperwork-header': '15sTaIIwhzHk96I8X3rxz7GtLMU-F5zo1',
        'faq-cosigners': '1bjmH2w-XS5Hhe828y_Jmv9DqaS_gSZM7',
        'faq-defendants': '16j9Z8eTii-J_p4o6A2LrzgzptGB8aOhR',
        'indemnity-agreement': '1p4bYIiZ__JnJHhlmVwLyPJZpsmSdGq12',
        'defendant-application': '1cokWm8qCDpiGxYD6suZEjm9i8MoABeVe',
        'promissory-note': '104-ArZiCm3cgfQcT5rIO0x_OWiaw6Ddt',
        'disclosure-form': '1qIIDudp7r3J7-6MHlL2US34RcrU9KZKY',
        'surety-terms': '1VfmyUTpchfwJTlENlR72JxmoE_NCF-uf',
        'master-waiver': '181mgKQN-VxvQOyzDquFs8cFHUN0tjrMs',
        'ssa-release': '1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu',
        'collateral-receipt': '1IAYq4H2b0N0vPnJN7b2vZPaHg_RNKCmP',
        'payment-plan': '1v-qkaegm6MDymiaPK45JqfXXX2_KOj8A',
        'appearance-bond': '15SDM1oBysTw76bIL7Xt0Uhti8uRZKABs'
    };

    console.log("🔍 Starting Template Access Check...");

    const results = {};
    let errors = 0;

    for (const [key, id] of Object.entries(TEMPLATE_DRIVE_IDS)) {
        try {
            const file = DriveApp.getFileById(id);
            const name = file.getName();
            const mime = file.getMimeType();
            const size = file.getSize();
            console.log(`✅ [${key}] Found: "${name}" (${mime}, ${size} bytes)`);
            results[key] = { status: 'OK', name: name };
        } catch (e) {
            console.error(`❌ [${key}] FAILED: ${e.message}`);
            results[key] = { status: 'ERROR', error: e.message };
            errors++;
        }
    }

    console.log("---------------------------------------------------");
    console.log(`Summary: ${Object.keys(results).length} Checked, ${errors} Errors.`);
    return results;
}
