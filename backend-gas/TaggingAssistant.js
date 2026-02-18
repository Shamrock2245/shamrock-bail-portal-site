/**
 * TaggingAssistant.js
 * 
 * Helper script to assist in the "Magic Tags" migration.
 * 
 * Functions:
 * 1. scanAndRegisterTemplates(): Scans the specific Drive folder, maps files to keys, and saves IDs to ScriptProperties.
 * 2. auditTemplate(templateKey): Checks a specific template for missing tags or leftover underscores.
 */

const TEMPLATE_FOLDER_ID = '1ZyTCodt67UAxEbFdGqE3VNua-9TlblR3'; // From Quick Start Guide

// Map of Dashboard Keys to Partial Filenames (Case Insensitive)
const DOC_FILENAME_MATCHER = {
    'defendant-application': 'defendant application',
    'indemnity-agreement': 'indemnity agreement',
    'collateral-receipt': 'collateral premium receipt', // match generic part
    'appearance-bond': 'appearance bond',
    'disclosure-form': 'disclosure',
    'promissory-note': 'promissory note',
    'surety-terms': 'surety terms',
    'payment-plan': 'premium finance', // often called this
    'paperwork-header': 'paperwork header',
    'master-waiver': 'master waiver',
    'ssa-release': 'ssa release',
    'faq-defendants': 'faq defendants',
    'faq-cosigners': 'faq cosigners'
};

/**
 * Scans the Drive Folder and registers found Templates to ScriptProperties.
 * Run this ONCE to link the code to the docs.
 */
function scanAndRegisterTemplates() {
    const folder = DriveApp.getFolderById(TEMPLATE_FOLDER_ID);
    const files = folder.getFilesByType(MimeType.GOOGLE_DOCS);

    const registered = {};
    const missing = [];

    // Create a reverse lookup for matching
    // We iterate files and try to match them to keys
    const foundFiles = [];
    while (files.hasNext()) {
        const file = files.next();
        foundFiles.push({
            name: file.getName(),
            id: file.getId(),
            url: file.getUrl()
        });
    }

    console.log(`📂 Found ${foundFiles.length} Google Docs in folder.`);

    // Match logic
    for (const [key, pattern] of Object.entries(DOC_FILENAME_MATCHER)) {
        const match = foundFiles.find(f => f.name.toLowerCase().includes(pattern.toLowerCase()));

        if (match) {
            registered[key] = match.id;
            console.log(`✅ Linked '${key}' -> '${match.name}' (${match.id})`);
        } else {
            console.warn(`❌ Could not find file matching pattern: '${pattern}' for key: '${key}'`);
            missing.push(key);
        }
    }

    // Save to ScriptProperties
    const props = PropertiesService.getScriptProperties();
    props.setProperty('DOC_TEMPLATE_IDS', JSON.stringify(registered));

    /*
    const saved = props.getProperty('DOC_TEMPLATE_IDS');
    console.log('💾 Saved Configuration:', saved);
    */

    return {
        registered: Object.keys(registered).length,
        missing: missing,
        details: registered
    };
}

/**
 * Audit a template for correct tags and leftover underscores.
 * @param {string} templateKey - The key (e.g., 'defendant-application')
 */
function auditTemplate(templateKey) {
    const props = PropertiesService.getScriptProperties();
    const templates = JSON.parse(props.getProperty('DOC_TEMPLATE_IDS') || '{}');
    const docId = templates[templateKey];

    if (!docId) {
        console.error(`Template '${templateKey}' not registered. Run scanAndRegisterTemplates() first.`);
        return;
    }

    console.log(`🔍 Auditing '${templateKey}' (${docId})...`);
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    const text = body.getText();

    // 1. Check for valid tags {{...}}
    const tagRegex = /{{([^{}]+)}}/g;
    const foundTags = [];
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
        foundTags.push(match[1]);
    }
    console.log(`Found ${foundTags.length} Magic Tags:`, foundTags);

    // 2. Check for leftover underscores (potential missed fields)
    const underscoreRegex = /_{3,}/g; // 3 or more underscores
    const underscores = text.match(underscoreRegex) || [];

    if (underscores.length > 0) {
        console.warn(`⚠️ Found ${underscores.length} blank lines (underscores) that might need tagging!`);
    } else {
        console.log(`✅ No blank lines found. Looks clean!`);
    }

    // 3. Check against Master List (Optional - requires PDF_Mappings loaded)
    // ...
}

/**
 * Audits ALL registered templates.
 */
function auditAllTemplates() {
    const props = PropertiesService.getScriptProperties();
    const templates = JSON.parse(props.getProperty('DOC_TEMPLATE_IDS') || '{}');

    for (const key of Object.keys(templates)) {
        auditTemplate(key);
    }
}
