/**
 * @OnlyCurrentDoc
 */

/**
 * HELPER: Find File IDs and Generate Configuration Code
 * Run this function manually in the GAS Editor.
 * Copy the output and replace the `const TEMPLATE_DRIVE_IDS` block in Code.js.
 */
function findManusTemplateIds() {
    // Map of Filename -> Code.js Key
    const fileMap = {
        'osi-defendant-application-shamrock-reducedsize.pdf': 'defendant-application',
        'osi-indemnity-agreement-shamrock.pdf': 'indemnity-agreement',
        'osi-collateral-premium-receipt.pdf': 'collateral-receipt',
        'osi-appearance-bond-shamrock.pdf': 'appearance-bond',
        'osi-disclosure-form-shamrock.pdf': 'disclosure-form',
        'osi-promissory-note-side2-shamrock.pdf': 'promissory-note',
        'osi-surety-terms-and-conditions-shamrock.pdf': 'surety-terms',
        'shamrock-premium-finance-notice.pdf': 'payment-plan',
        'shamrock-paperwork-header.pdf': 'paperwork-header',
        'shamrock-master-waiver.pdf': 'master-waiver'
    };

    const results = {};

    console.log("🔍 Searching for Manus Templates...");

    Object.entries(fileMap).forEach(([fileName, configKey]) => {
        const files = DriveApp.getFilesByName(fileName);
        if (files.hasNext()) {
            const file = files.next();
            results[configKey] = file.getId();
            console.log(`✅ Found: ${configKey} (${fileName}) -> ${file.getId()}`);
        } else {
            console.log(`❌ NOT FOUND: ${fileName}`);
            results[configKey] = "MISSING_FILE_ID";
        }
    });

    console.log("\n📋 COPY THE CODE BELOW AND PASTE IT INTO Code.js (Replace existing TEMPLATE_DRIVE_IDS):");
    console.log("=====================================================================================");
    console.log("const TEMPLATE_DRIVE_IDS = {");
    Object.keys(results).forEach(key => {
        console.log(`  '${key}': '${results[key]}',`);
    });
    console.log("};");
    console.log("=====================================================================================");

    return results;
}
