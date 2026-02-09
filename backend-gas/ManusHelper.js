/**
 * @OnlyCurrentDoc
 */

/**
 * HELPER: Find File IDs for Manus Templates
 * Run this function manually in the GAS Editor to get the IDs for your Dashboard Config.
 */
function findManusTemplateIds() {
    const fileNames = [
        'osi-defendant-application-shamrock-reducedsize.pdf',
        'osi-indemnity-agreement-shamrock.pdf',
        'osi-collateral-premium-receipt.pdf',
        'osi-appearance-bond-shamrock.pdf',
        'osi-disclosure-form-shamrock.pdf',
        'osi-promissory-note-side2-shamrock.pdf',
        'osi-surety-terms-and-conditions-shamrock.pdf',
        'shamrock-premium-finance-notice.pdf',
        'shamrock-paperwork-header.pdf',
        'shamrock-master-waiver.pdf'
    ];

    const results = {};

    console.log("🔍 Searching for Manus Templates...");

    fileNames.forEach(name => {
        const files = DriveApp.getFilesByName(name);
        if (files.hasNext()) {
            const file = files.next();
            results[name] = file.getId();
            console.log(`✅ Found: ${name} -> ${file.getId()}`);
        } else {
            console.log(`❌ NOT FOUND: ${name}`);
            results[name] = "MISSING - Did you upload it securely?";
        }
    });

    console.log("\n📋 COPY THIS JSON FOR DASHBOARD CONFIG:");
    console.log(JSON.stringify(results, null, 2));
    return results;
}
