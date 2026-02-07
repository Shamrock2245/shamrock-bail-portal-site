/**
 * Config_Templates.js
 * 
 * UTILITY: Run this function AFTER uploading your new PDF forms to Google Drive.
 * It will scan your folder and generate the code snippet for `Code.js`.
 */

function generateTemplateConfig() {
    // 1. Get Folder ID from Script Properties
    const props = PropertiesService.getScriptProperties();
    const folderId = props.getProperty('GOOGLE_DRIVE_FOLDER_ID'); // "Templates" Folder

    if (!folderId) {
        console.error("❌ Error: GOOGLE_DRIVE_FOLDER_ID not set in Script Properties.");
        return;
    }

    // 2. Define Expected Keys (Matches Code.js)
    const EXPECTED_FILES = {
        'paperwork-header': ['Paperwork Header', 'header'],
        'faq-cosigners': ['FAQ Cosigner', 'FAQ - Cosigner'],
        'faq-defendants': ['FAQ Defendant', 'FAQ - Defendant'],
        'indemnity-agreement': ['Indemnity Agreement', 'Indemnity'],
        'defendant-application': ['Defendant Application', 'Application'],
        'promissory-note': ['Promissory Note', 'Promissory'],
        'disclosure-form': ['Disclosure Form', 'Disclosure'],
        'surety-terms': ['Surety Terms', 'Terms'],
        'master-waiver': ['Master Waiver', 'Waiver'],
        'ssa-release': ['SSA Release', 'SSA'],
        'collateral-receipt': ['Collateral Receipt', 'Collateral'],
        'payment-plan': ['Payment Plan', 'Payment'],
        'appearance-bond': ['Appearance Bond', 'Appearance']
    };

    try {
        const folder = DriveApp.getFolderById(folderId);
        const files = folder.getFiles();
        const foundTemplates = {};
        const missingTemplates = [];

        console.log(`📂 Scanning Folder: ${folder.getName()} (${folderId})`);

        // 3. Scan all files in folder
        const fileList = [];
        while (files.hasNext()) {
            const file = files.next();
            fileList.push({
                name: file.getName(),
                id: file.getId(),
                url: file.getUrl()
            });
        }

        // 4. Match Files to Keys
        Object.keys(EXPECTED_FILES).forEach(key => {
            const searchTerms = EXPECTED_FILES[key];
            // Find file where name includes any search term (case-insensitive)
            const match = fileList.find(f =>
                searchTerms.some(term => f.name.toLowerCase().includes(term.toLowerCase()))
            );

            if (match) {
                foundTemplates[key] = match.id;
                console.log(`✅ Found '${key}': ${match.name}`);
            } else {
                missingTemplates.push(key);
                console.warn(`❌ MISSING '${key}': Could not find file matching ${JSON.stringify(searchTerms)}`);
            }
        });

        // 5. Generate Output
        console.log("\n\n📋 --- COPY CODE BELOW THIS LINE --- 📋\n");
        console.log("const TEMPLATE_DRIVE_IDS = {");
        Object.keys(foundTemplates).forEach(key => {
            console.log(`  '${key}': '${foundTemplates[key]}',`);
        });
        console.log("};");
        console.log("\n📋 --- END COPY --- 📋\n");

        if (missingTemplates.length > 0) {
            console.warn(`⚠️ The following templates were not found: ${missingTemplates.join(', ')}`);
        }

    } catch (e) {
        console.error("Scanning Error: " + e.message);
    }
}
